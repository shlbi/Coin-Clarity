"""
Context-Aware Adversarial Risk Scoring Engine
═══════════════════════════════════════════════

Asks: "Given this contract + market structure + history, what is the
       realistic probability of loss due to malicious behavior?"

NOT: "Does it have mint?"

Four independent scores:
  MRR  — Malicious Rug Risk        (0-100)  Can they steal/block/trap?
  SCR  — Structural Centralization  (0-100)  Power concentration
  MFR  — Market Fragility Risk     (0-100)  Liquidity/volatility/manipulability
  UF   — Uncertainty Factor        (0.0-1.0) Missing or immature data

Final output:
  RiskScore   = Weighted(MRR, MFR) adjusted by stability
  Centralization = SCR  (reported separately, NEVER mixed into rug risk)
  Confidence  = 1 - UF
"""
from __future__ import annotations
from typing import Dict, List, Optional, Tuple
from app.models import Signal

# ── Type alias for the return value ──────────────────────────────────────────
ScoringResult = Tuple[int, str, int, int, int, float, float, List[Signal]]
#                score tier  mrr  scr  mfr  uf    conf  signals


def calculate_risk_score(
    contract_analysis: Dict,
    liquidity_analysis: Dict,
    holder_analysis: Dict,
    token_age_days: Optional[float] = None,
) -> ScoringResult:
    """Run the full 7-step scoring pipeline."""

    mrr = 0
    scr = 0
    mfr = 0
    uf  = 0.0
    signals: List[Signal] = []

    # Use token age from liquidity analyzer if not provided
    if token_age_days is None:
        token_age_days = liquidity_analysis.get("tokenAgeDays")

    # ─────────────────────────────────────────────────────────────────────────
    # STEP 1 + 2 — Capability Graph × Authority Context
    # ─────────────────────────────────────────────────────────────────────────
    _mrr, _scr, _sigs = _score_capabilities(contract_analysis)
    mrr += _mrr
    scr += _scr
    signals.extend(_sigs)

    # Proxy → centralization only
    if contract_analysis.get("isProxy"):
        scr += 5
        signals.append(Signal(
            title="Upgradeable Proxy Contract",
            severity="medium",
            description="Contract is upgradeable via proxy pattern. This is a centralization indicator, not direct rug risk.",
            evidenceLinks=[],
        ))

    # ─────────────────────────────────────────────────────────────────────────
    # STEP 3 — Liquidity Attack Surface
    # ─────────────────────────────────────────────────────────────────────────
    _mrr, _mfr, _sigs = _score_liquidity(liquidity_analysis)
    mrr += _mrr
    mfr += _mfr
    signals.extend(_sigs)

    # ─────────────────────────────────────────────────────────────────────────
    # STEP 4 — Holder Concentration → MFR (not MRR)
    # ─────────────────────────────────────────────────────────────────────────
    _mfr, _uf, _sigs = _score_holders(holder_analysis)
    mfr += _mfr
    uf  += _uf
    signals.extend(_sigs)

    # ─────────────────────────────────────────────────────────────────────────
    # STEP 5 — Historical Stability Modifier (reduces MRR over time)
    # ─────────────────────────────────────────────────────────────────────────
    stability_mod = 0
    if token_age_days is not None:
        if token_age_days < 1:
            stability_mod = 0       # Brand new — no help
        elif token_age_days < 7:
            stability_mod = -5
        elif token_age_days < 30:
            stability_mod = -15
        elif token_age_days < 365:
            stability_mod = -25
        else:
            stability_mod = -30     # 1 year+ — scammers don't wait this long

        if stability_mod < 0:
            signals.append(Signal(
                title="Historical Stability",
                severity="info",
                description=f"Token has been active for ~{token_age_days:.0f} days. Time reduces rug probability.",
                evidenceLinks=[],
            ))
    else:
        uf += 0.05  # Age unknown

    mrr = max(0, mrr + stability_mod)

    # ─────────────────────────────────────────────────────────────────────────
    # STEP 6 — Market Legitimacy Dampener (multiplicative, not additive)
    # ─────────────────────────────────────────────────────────────────────────
    total_liq = liquidity_analysis.get("totalLiquidityUsd") or liquidity_analysis.get("liquidityUsd") or 0
    pair_count = liquidity_analysis.get("pairCount", 0)

    legitimacy_met = False
    if total_liq > 50_000_000:
        legitimacy_met = True
    elif total_liq > 10_000_000 and pair_count >= 3:
        legitimacy_met = True

    if legitimacy_met:
        mrr = int(mrr * 0.6)
        signals.append(Signal(
            title="Market Legitimacy Indicators",
            severity="info",
            description=f"Token has strong market presence (${total_liq:,.0f} total liquidity across {pair_count} pools). MRR dampened.",
            evidenceLinks=[],
        ))

    # ─────────────────────────────────────────────────────────────────────────
    # STEP 7 — Uncertainty Factor
    # ─────────────────────────────────────────────────────────────────────────
    if not contract_analysis.get("verified"):
        uf += 0.25
        signals.append(Signal(
            title="Unverified Source Code",
            severity="medium",
            description="Contract source code is not verified. Analysis based on bytecode heuristics only.",
            evidenceLinks=[],
        ))

    vol_24h = liquidity_analysis.get("volume24hUsd")
    if vol_24h is None or (vol_24h is not None and vol_24h < 1_000):
        uf += 0.15

    if token_age_days is not None and token_age_days < 1:
        uf += 0.10  # Brand new token

    uf = min(uf, 1.0)

    # ─────────────────────────────────────────────────────────────────────────
    # FINAL CALCULATION
    # ─────────────────────────────────────────────────────────────────────────
    # Clamp sub-scores
    mrr = _clamp(mrr)
    scr = _clamp(scr)
    mfr = _clamp(mfr)

    # BaseRisk = MRR + (MFR × 0.6)
    base_risk = mrr + int(mfr * 0.6)
    risk_score = _clamp(base_risk)

    confidence = round(1.0 - uf, 2)

    # Tier
    if risk_score >= 80:
        tier = "extreme"
    elif risk_score >= 60:
        tier = "high"
    elif risk_score >= 35:
        tier = "medium"
    else:
        tier = "low"

    # Positive signal
    if risk_score < 35 and mrr < 15:
        signals.append(Signal(
            title="Low Rug Risk Profile",
            severity="info",
            description="Token shows low probability of malicious behavior based on available data.",
            evidenceLinks=[],
        ))

    return risk_score, tier, mrr, scr, mfr, uf, confidence, signals


# ═════════════════════════════════════════════════════════════════════════════
# Sub-scoring functions
# ═════════════════════════════════════════════════════════════════════════════

def _score_capabilities(contract: Dict) -> Tuple[int, int, List[Signal]]:
    """
    STEP 1+2: For each capability, score based on controller type.
    Never score capability alone.
    """
    mrr = 0
    scr = 0
    sigs: List[Signal] = []

    caps = contract.get("capabilities", [])
    controller_type = contract.get("controller", {}).get("type", "unknown")

    # Group capabilities by type for cleaner signals
    critical_caps = []  # will be added to MRR
    centralization_caps = []  # will be added to SCR only
    safe_caps = []  # renounced — no risk

    for cap in caps:
        name = cap.get("capability", "").lower()
        ct = cap.get("controllerType", controller_type)

        if name in ("renounceownership",):
            continue  # Skip — this is a positive indicator

        if ct == "renounced":
            safe_caps.append(name)
            continue

        if ct in ("multisig", "dao_timelock"):
            # Centralization only
            if name in ("mint", "blacklist"):
                scr += 5
                centralization_caps.append(name)
            elif name in ("pause", "unpause", "setfee", "settrading"):
                scr += 3
                centralization_caps.append(name)
            continue

        if ct == "known_entity":
            # Known custodian — centralization only, zero rug risk
            if name in ("mint", "blacklist"):
                scr += 8
            elif name in ("pause", "unpause", "setfee", "settrading"):
                scr += 4
            centralization_caps.append(name)
            continue

        # Single EOA or Unknown/Obfuscated — real rug risk
        risk_bump = 30 if ct == "unknown" else 25

        if name == "mint":
            mrr += risk_bump
            critical_caps.append("mint")
        elif name == "blacklist":
            mrr += 20 if ct == "single_eoa" else 25
            critical_caps.append("blacklist")
        elif name in ("pause", "unpause"):
            mrr += 15 if ct == "single_eoa" else 20
            critical_caps.append("pause/unpause")
        elif name == "setfee":
            mrr += 20 if ct == "single_eoa" else 25
            critical_caps.append("fee manipulation")
        elif name == "settrading":
            mrr += 20 if ct == "single_eoa" else 25
            critical_caps.append("trading control")
        elif name == "transferownership":
            # Not dangerous on its own — it's a transfer mechanism
            scr += 3

    # Generate signals
    if critical_caps:
        unique = list(dict.fromkeys(critical_caps))  # dedupe preserving order
        ct_label = controller_type.replace("_", " ").title()
        sigs.append(Signal(
            title=f"Dangerous Capabilities Controlled by {ct_label}",
            severity="critical",
            description=f"Contract has [{', '.join(unique)}] controlled by {ct_label}. High probability of malicious use.",
            evidenceLinks=[],
        ))

    if centralization_caps:
        unique = list(dict.fromkeys(centralization_caps))
        sigs.append(Signal(
            title="Centralized Control (Not Rug Risk)",
            severity="medium",
            description=f"Capabilities [{', '.join(unique)}] exist but are controlled by multisig/timelock/custodian. Centralization risk, not immediate rug risk.",
            evidenceLinks=[],
        ))

    if safe_caps:
        unique = list(dict.fromkeys(safe_caps))
        sigs.append(Signal(
            title="Renounced Capabilities",
            severity="info",
            description=f"Capabilities [{', '.join(unique)}] exist but ownership is renounced. No risk.",
            evidenceLinks=[],
        ))

    if contract.get("ownershipRenounced"):
        sigs.append(Signal(
            title="Ownership Renounced",
            severity="info",
            description="Contract ownership has been renounced. Admin functions cannot be called.",
            evidenceLinks=[],
        ))

    return mrr, scr, sigs


def _score_liquidity(liq: Dict) -> Tuple[int, int, List[Signal]]:
    """STEP 3: Liquidity attack surface → MRR + MFR."""
    mrr = 0
    mfr = 0
    sigs: List[Signal] = []

    liq_usd = liq.get("liquidityUsd")
    total_liq = liq.get("totalLiquidityUsd") or liq_usd
    fdv = liq.get("fdvUsd")
    pair_count = liq.get("pairCount", 0)
    pair_url = liq.get("pairUrl")
    ev = [pair_url] if pair_url else []

    # ── Liquidity level ──
    if liq_usd is None or liq_usd < 25_000:
        mrr += 30
        mfr += 40
        liq_str = f"${liq_usd:,.0f}" if liq_usd else "unknown"
        sigs.append(Signal(
            title="Critical: Very Low Liquidity",
            severity="critical",
            description=f"Liquidity is {liq_str}. Highly susceptible to rug pull and price manipulation.",
            evidenceLinks=ev,
        ))
    elif liq_usd < 100_000:
        mrr += 10
        mfr += 25
        sigs.append(Signal(
            title="Low Liquidity",
            severity="high",
            description=f"Liquidity is ${liq_usd:,.0f}. Elevated manipulation risk.",
            evidenceLinks=ev,
        ))
    elif liq_usd < 500_000:
        mfr += 15
        sigs.append(Signal(
            title="Moderate Liquidity",
            severity="medium",
            description=f"Liquidity is ${liq_usd:,.0f}. Adequate but not deep.",
            evidenceLinks=ev,
        ))

    # ── Liquidity / FDV ratio ──
    if liq_usd and fdv and fdv > 0:
        ratio = liq_usd / fdv
        if ratio < 0.005:  # < 0.5%
            mfr += 25
            sigs.append(Signal(
                title="Extreme Liquidity/FDV Imbalance",
                severity="critical",
                description=f"Liquidity/FDV ratio is {ratio:.2%}. Extremely thin for the valuation.",
                evidenceLinks=ev,
            ))
        elif ratio < 0.02:  # < 2%
            mfr += 15
            sigs.append(Signal(
                title="Low Liquidity/FDV Ratio",
                severity="high",
                description=f"Liquidity/FDV ratio is {ratio:.2%}. Thin relative to valuation.",
                evidenceLinks=ev,
            ))

    # ── Large liquidity reduces rug probability ──
    if total_liq and total_liq > 10_000_000 and pair_count >= 2:
        mrr = int(mrr * 0.8)  # 20% reduction
        sigs.append(Signal(
            title="Deep Multi-Pool Liquidity",
            severity="info",
            description=f"${total_liq:,.0f} across {pair_count} pools. Significantly harder to rug.",
            evidenceLinks=[],
        ))

    return mrr, mfr, sigs


def _score_holders(holders: Dict) -> Tuple[int, float, List[Signal]]:
    """STEP 4: Holder concentration → MFR (NOT MRR) + uncertainty."""
    mfr = 0
    uf = 0.0
    sigs: List[Signal] = []

    if holders.get("holdersUnavailable"):
        uf += 0.15
        sigs.append(Signal(
            title="Holder Data Unavailable",
            severity="info",
            description="Holder distribution data unavailable. This increases uncertainty, not risk.",
            evidenceLinks=[],
        ))
        return mfr, uf, sigs

    top1 = holders.get("top1Concentration")
    top10 = holders.get("top10Concentration")

    if top1 and top1 > 50:
        mfr += 30
        sigs.append(Signal(
            title="Extreme Holder Concentration",
            severity="critical",
            description=f"Top holder controls {top1:.1f}% of supply. Extreme market fragility.",
            evidenceLinks=[],
        ))
    elif top1 and top1 > 30:
        mfr += 20
        sigs.append(Signal(
            title="High Holder Concentration",
            severity="high",
            description=f"Top holder controls {top1:.1f}% of supply.",
            evidenceLinks=[],
        ))
    elif top1 and top1 > 15:
        mfr += 10
        sigs.append(Signal(
            title="Moderate Holder Concentration",
            severity="medium",
            description=f"Top holder controls {top1:.1f}% of supply.",
            evidenceLinks=[],
        ))

    if top10 and top10 > 80:
        mfr += 15
        sigs.append(Signal(
            title="Top 10 Concentration",
            severity="high",
            description=f"Top 10 holders control {top10:.1f}% of supply.",
            evidenceLinks=[],
        ))
    elif top10 and top10 > 60:
        mfr += 8

    return mfr, uf, sigs


def _clamp(v: int, lo: int = 0, hi: int = 100) -> int:
    return max(lo, min(hi, v))
