"""
Contract Analyzer — Capability Graph + Authority Context Classification

STEP 1: Detect what the contract CAN do (capabilities)
STEP 2: For each capability, classify WHO controls it (authority context)

Never assign risk from capability alone. Always pair with controller.
"""
import httpx
import json
import os
from web3 import Web3
from typing import List, Dict, Optional


# ── Capability selectors (4-byte function signatures) ────────────────────────
# We only care about DANGEROUS capabilities, not read functions.
DANGEROUS_SELECTORS = {
    # Minting / supply manipulation
    "40c10f19": "mint",          # mint(address,uint256)
    "a0712d68": "mint",          # mint(uint256)
    "4e6ec247": "mint",          # mint(address,uint256) variant
    # Blacklisting / blocking
    "44337ea1": "blacklist",     # blacklist(address)
    "fe575a87": "blacklist",     # addToBlacklist(address)
    "0ecb93c0": "blacklist",     # addBlacklist(address)
    # Pause / freeze trading
    "8456cb59": "pause",         # pause()
    "3f4ba83a": "unpause",       # unpause()
    # Fee / tax manipulation
    "c0246668": "setFee",        # setFee(address,bool)
    "a9059cbb": None,            # transfer — skip (standard)
    # Trading control
    "8a8c523c": "setTrading",    # setTradingEnabled / openTrading
    "c9567bf9": "setTrading",    # openTrading()
    # Ownership
    "f2fde38b": "transferOwnership",  # transferOwnership(address)
    "715018a6": "renounceOwnership",  # renounceOwnership()
}

# ABI-level risky function names (checked when ABI is available)
ABI_RISKY_NAMES = {
    "mint":                 "mint",
    "blacklist":            "blacklist",
    "addtoblacklist":       "blacklist",
    "removeblacklist":      "blacklist",
    "settax":               "setFee",
    "setfee":               "setFee",
    "setfees":              "setFee",
    "setselltax":           "setFee",
    "setbuytax":            "setFee",
    "pause":                "pause",
    "unpause":              "unpause",
    "enabletrading":        "setTrading",
    "opentrading":          "setTrading",
    "settradingenabled":    "setTrading",
    "transferownership":    "transferOwnership",
    "renounceownership":    "renounceOwnership",
}

# ── Known corporate/custodian contracts ──────────────────────────────────────
# These are NOT scams even though they have mint — they're institutional custodians.
KNOWN_CUSTODIAN_CONTRACTS = {
    # WBTC
    "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    # USDC
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    # USDT
    "0xdac17f958d2ee523a2206206994597c13d831ec7",
    # DAI
    "0x6b175474e89094c44da98b954eedeac495271d0f",
    # BUSD
    "0x4fabb145d64652a948d72533023f6e7a623c7c53",
    # WETH
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    # stETH
    "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
}


def get_rpc_url(chain: str) -> str:
    if chain == "ethereum":
        return os.getenv("ETH_RPC_URL", "https://eth.llamarpc.com")
    elif chain == "base":
        return os.getenv("BASE_RPC_URL", "https://base.llamarpc.com")
    raise ValueError(f"Unsupported chain: {chain}")


def get_explorer_api_key(chain: str) -> Optional[str]:
    if chain == "ethereum":
        return os.getenv("ETHERSCAN_API_KEY")
    elif chain == "base":
        return os.getenv("BASESCAN_API_KEY")
    return None


# ── Controller type detection ────────────────────────────────────────────────

def classify_controller(owner_address: Optional[str], w3: Web3,
                        token_address: str) -> Dict:
    """
    Classify WHO controls the contract.
    Returns: { type, owner, confidence }
    
    Types:
      renounced       — owner is 0x0 or renounced
      multisig        — owner is a contract with DELEGATECALL (Gnosis Safe pattern)
      dao_timelock    — owner is a non-proxy contract (likely timelock / governor)
      known_entity    — the TOKEN ITSELF is a known custodian (WBTC, USDC, etc.)
      single_eoa      — owner is an externally-owned account
      unknown         — couldn't determine owner
    """
    # If the token itself is a known custodian, short-circuit
    if token_address.lower() in KNOWN_CUSTODIAN_CONTRACTS:
        return {
            "type": "known_entity",
            "owner": owner_address,
            "confidence": 0.95
        }

    if not owner_address:
        return {"type": "unknown", "owner": None, "confidence": 0.0}

    owner_address = Web3.to_checksum_address(owner_address)

    # Zero address = renounced
    ZERO = "0x0000000000000000000000000000000000000000"
    DEAD = "0x000000000000000000000000000000000000dEaD"
    if owner_address in (ZERO, DEAD):
        return {"type": "renounced", "owner": owner_address, "confidence": 1.0}

    # Check if owner is a contract
    try:
        code = w3.eth.get_code(owner_address).hex()
        is_contract = code and code != "0x" and len(code) > 4

        if is_contract:
            code_lower = code.lower()
            # Gnosis Safe proxy pattern: short code with DELEGATECALL
            if len(code) < 200 and "f4" in code_lower:
                return {"type": "multisig", "owner": owner_address,
                        "confidence": 0.75}
            # Longer contract — likely timelock / governor / custom
            if "f4" in code_lower:
                return {"type": "multisig", "owner": owner_address,
                        "confidence": 0.65}
            return {"type": "dao_timelock", "owner": owner_address,
                    "confidence": 0.60}
        else:
            return {"type": "single_eoa", "owner": owner_address,
                    "confidence": 0.95}
    except Exception:
        return {"type": "unknown", "owner": owner_address, "confidence": 0.0}


def get_owner_address(address: str, w3: Web3,
                      abi: Optional[List] = None) -> Optional[str]:
    """Try to read owner() from the contract."""
    address = Web3.to_checksum_address(address)

    # Method 1: use ABI if available
    if abi:
        try:
            for item in abi:
                if (item.get("type") == "function"
                        and item.get("name", "").lower() in ("owner", "getowner")
                        and len(item.get("inputs", [])) == 0):
                    contract = w3.eth.contract(address=address, abi=abi)
                    result = contract.functions.owner().call()
                    if result:
                        return result
        except Exception:
            pass

    # Method 2: raw call to owner() selector 0x8da5cb5b
    try:
        raw = w3.eth.call({"to": address, "data": "0x8da5cb5b"})
        if raw and len(raw) >= 32:
            owner_hex = "0x" + raw.hex()[-40:]
            if owner_hex != "0x" + "0" * 40:
                return Web3.to_checksum_address(owner_hex)
    except Exception:
        pass

    return None


# ── Main analyzer ────────────────────────────────────────────────────────────

def analyze_contract(chain: str, address: str) -> Dict:
    """
    Full contract analysis:
    1. Fetch bytecode
    2. Build capability graph (what CAN this contract do?)
    3. Detect proxy status
    4. Check verification
    5. Detect owner + classify controller
    6. Return everything — scoring engine decides weights
    """
    rpc_url = get_rpc_url(chain)
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    address_cs = Web3.to_checksum_address(address)

    # ── Bytecode ──
    try:
        bytecode = w3.eth.get_code(address_cs).hex()
    except Exception as e:
        raise Exception(f"Failed to fetch bytecode: {e}")

    if not bytecode or bytecode == "0x":
        raise Exception("Address is not a contract (no bytecode)")

    bytecode_lower = bytecode.lower()

    # ── Proxy detection ──
    # EIP-1967 implementation slot
    is_proxy = False
    try:
        impl_slot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
        impl_raw = w3.eth.get_storage_at(address_cs, impl_slot)
        impl_addr = "0x" + impl_raw.hex()[-40:]
        if impl_addr != "0x" + "0" * 40:
            is_proxy = True
    except Exception:
        pass
    # Fallback: DELEGATECALL opcode in short bytecode
    if not is_proxy and len(bytecode) < 600 and "f4" in bytecode_lower:
        is_proxy = True

    # ── Verification + ABI ──
    verified = False
    abi = None
    api_key = get_explorer_api_key(chain)
    if api_key:
        verified = _check_verified(chain, address_cs, api_key)
        if verified:
            abi = _get_abi(chain, address_cs, api_key)

    # ── Capability graph ──
    capabilities = _build_capability_graph(bytecode_lower, abi)

    # ── Ownership renounced? ──
    ownership_renounced = False
    # Check if renounceOwnership selector found AND owner is zero
    owner_address = get_owner_address(address_cs, w3, abi)

    ZERO = "0x0000000000000000000000000000000000000000"
    DEAD = "0x000000000000000000000000000000000000dEaD"
    if owner_address and owner_address in (ZERO, DEAD):
        ownership_renounced = True

    # If no owner found but renounceOwnership selector is in bytecode, assume renounced
    if not owner_address and "715018a6" in bytecode_lower:
        ownership_renounced = True

    # ── Controller classification ──
    controller = classify_controller(owner_address, w3, address)

    # Override to renounced if we detected it
    if ownership_renounced:
        controller = {"type": "renounced", "owner": owner_address,
                      "confidence": 0.9}

    # ── Attach controller to each capability ──
    for cap in capabilities:
        cap["controllerType"] = controller["type"]
        cap["controllerAddress"] = controller.get("owner")
        cap["controllerConfidence"] = controller["confidence"]

    # ── Legacy privilegeFlags for backward compat ──
    privilege_flags = [
        {"name": c["capability"], "selector": c.get("selector", ""),
         "riskLevel": c.get("riskLevel", "medium")}
        for c in capabilities
    ]

    return {
        "isProxy": is_proxy,
        "verified": verified,
        "ownershipRenounced": ownership_renounced,
        "privilegeFlags": privilege_flags,
        "capabilities": capabilities,
        "controller": controller,
        "ownerAddress": owner_address,
    }


# ── Helpers ──────────────────────────────────────────────────────────────────

def _build_capability_graph(bytecode_lower: str,
                             abi: Optional[List]) -> List[Dict]:
    """Detect dangerous capabilities from bytecode selectors + ABI."""
    seen = set()  # deduplicate by canonical capability name
    caps = []

    # Pass 1 — bytecode selectors
    for selector, cap_name in DANGEROUS_SELECTORS.items():
        if cap_name is None:
            continue
        if selector in bytecode_lower and cap_name not in seen:
            seen.add(cap_name)
            caps.append({
                "capability": cap_name,
                "selector": "0x" + selector,
                "source": "bytecode",
                "riskLevel": _risk_level_for(cap_name),
            })

    # Pass 2 — ABI (more accurate names)
    if abi:
        for item in abi:
            if item.get("type") != "function":
                continue
            fname = item.get("name", "").lower()
            for pattern, cap_name in ABI_RISKY_NAMES.items():
                if pattern in fname and cap_name not in seen:
                    seen.add(cap_name)
                    # Compute selector
                    try:
                        sig = f"{item['name']}({','.join(i['type'] for i in item.get('inputs', []))})"
                        sel = Web3.keccak(text=sig)[:4].hex()
                    except Exception:
                        sel = ""
                    caps.append({
                        "capability": cap_name,
                        "selector": "0x" + sel if sel else "",
                        "source": "abi",
                        "riskLevel": _risk_level_for(cap_name),
                    })
                    break

    return caps


def _risk_level_for(cap_name: str) -> str:
    return {
        "mint": "critical",
        "blacklist": "critical",
        "pause": "high",
        "unpause": "high",
        "setFee": "high",
        "setTrading": "high",
        "transferOwnership": "medium",
        "renounceOwnership": "info",
    }.get(cap_name, "medium")


def _check_verified(chain: str, address: str, api_key: str) -> bool:
    try:
        url = ("https://api.etherscan.io/api" if chain == "ethereum"
               else "https://api.basescan.org/api")
        params = {"module": "contract", "action": "getsourcecode",
                  "address": address, "apikey": api_key}
        with httpx.Client(timeout=10.0) as client:
            data = client.get(url, params=params).json()
            if data.get("status") == "1" and data.get("result"):
                src = data["result"][0].get("SourceCode", "")
                return bool(src and src.strip())
    except Exception:
        pass
    return False


def _get_abi(chain: str, address: str, api_key: str) -> Optional[List]:
    try:
        url = ("https://api.etherscan.io/api" if chain == "ethereum"
               else "https://api.basescan.org/api")
        params = {"module": "contract", "action": "getabi",
                  "address": address, "apikey": api_key}
        with httpx.Client(timeout=10.0) as client:
            data = client.get(url, params=params).json()
            if data.get("status") == "1" and data.get("result"):
                abi_str = data["result"]
                if abi_str and abi_str != "Contract source code not verified":
                    return json.loads(abi_str)
    except Exception:
        pass
    return None
