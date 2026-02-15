"""
Liquidity Analyzer — Market Fragility + Attack Surface

Extracts from DexScreener:
  - Primary pair liquidity, FDV, volume
  - Total liquidity across ALL pairs (multi-pool check)
  - Pair count (more pairs = harder to rug)
  - Token age (pairCreatedAt from DexScreener)
  - Price data for display
"""
import httpx
from datetime import datetime, timezone
from typing import Dict, Optional


def analyze_liquidity(chain: str, address: str) -> Dict:
    """Analyze liquidity using DexScreener API."""

    chain_map = {"ethereum": "ethereum", "base": "base"}
    chain_id = chain_map.get(chain)
    if not chain_id:
        raise ValueError(f"Unsupported chain for liquidity analysis: {chain}")

    empty = {
        "liquidityUsd": None,
        "totalLiquidityUsd": None,
        "fdvUsd": None,
        "marketCapUsd": None,
        "volume24hUsd": None,
        "pairUrl": None,
        "pairCount": 0,
        "tokenAgeDays": None,
        "priceUsd": None,
        "priceChange24h": None,
        "tokenName": None,
        "tokenSymbol": None,
        "lowLiquidity": True,
        "suspiciousRatio": True,
    }

    try:
        url = f"https://api.dexscreener.com/latest/dex/tokens/{address}"
        with httpx.Client(timeout=15.0) as client:
            response = client.get(url)
            response.raise_for_status()
            data = response.json()

        pairs = data.get("pairs") or []
        if not pairs:
            return empty

        # ── Primary pair (highest liquidity) ──
        primary = max(
            pairs,
            key=lambda p: float(p.get("liquidity", {}).get("usd", 0) or 0),
        )

        liq_usd = _float(primary.get("liquidity", {}).get("usd"))
        fdv_usd = _float(primary.get("fdv"))
        mcap_usd = _float(primary.get("marketCap"))
        vol_24h = _float(primary.get("volume", {}).get("h24"))
        pair_url = primary.get("url")
        price_usd = _float(primary.get("priceUsd"))
        price_chg = _float(primary.get("priceChange", {}).get("h24"))

        base = primary.get("baseToken", {})
        token_name = base.get("name")
        token_symbol = base.get("symbol")

        # ── Aggregate across ALL pairs ──
        total_liq = 0.0
        pair_count = 0
        for p in pairs:
            pliq = _float(p.get("liquidity", {}).get("usd"))
            if pliq and pliq > 0:
                total_liq += pliq
                pair_count += 1

        # ── Token age from earliest pair creation ──
        token_age_days = None
        try:
            created_timestamps = []
            for p in pairs:
                ts = p.get("pairCreatedAt")
                if ts:
                    created_timestamps.append(int(ts))
            if created_timestamps:
                earliest_ms = min(created_timestamps)
                earliest_dt = datetime.fromtimestamp(earliest_ms / 1000,
                                                     tz=timezone.utc)
                age = datetime.now(timezone.utc) - earliest_dt
                token_age_days = max(0, age.total_seconds() / 86400)
        except Exception:
            pass

        # ── Flags ──
        low_liquidity = liq_usd is not None and liq_usd < 25_000
        if liq_usd is None:
            low_liquidity = True

        suspicious_ratio = False
        if liq_usd and fdv_usd and fdv_usd > 0:
            suspicious_ratio = (liq_usd / fdv_usd) < 0.01  # < 1%

        return {
            "liquidityUsd": liq_usd,
            "totalLiquidityUsd": total_liq if total_liq > 0 else liq_usd,
            "fdvUsd": fdv_usd,
            "marketCapUsd": mcap_usd,
            "volume24hUsd": vol_24h,
            "pairUrl": pair_url,
            "pairCount": pair_count,
            "tokenAgeDays": token_age_days,
            "priceUsd": price_usd,
            "priceChange24h": price_chg,
            "tokenName": token_name,
            "tokenSymbol": token_symbol,
            "lowLiquidity": low_liquidity,
            "suspiciousRatio": suspicious_ratio,
        }

    except httpx.HTTPError:
        return empty
    except Exception:
        return empty


def _float(val) -> Optional[float]:
    """Safely convert to float."""
    if val is None:
        return None
    try:
        f = float(val)
        return f if f == f else None  # NaN check
    except (ValueError, TypeError):
        return None
