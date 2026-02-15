"""
Worker module for async token analysis
This is imported by the RQ worker process
"""
import json
from datetime import datetime
from sqlmodel import Session, select
from app.database import engine
from app.models import AnalysisReportDB
from app.services.analyzers.contract import analyze_contract
from app.services.analyzers.liquidity import analyze_liquidity
from app.services.analyzers.holder import analyze_holders
from app.services.scoring import calculate_risk_score
from app.services.cache import set_cache


def analyze_token(chain: str, address: str):
    """Main analysis function called by RQ worker"""

    try:
        # Run all analyzers
        contract_analysis = analyze_contract(chain, address)
        liquidity_analysis = analyze_liquidity(chain, address)
        holder_analysis = analyze_holders(chain, address)

        # Token age comes from DexScreener (pairCreatedAt) — no extra call
        token_age_days = liquidity_analysis.get("tokenAgeDays")

        # Calculate score with new 7-step model
        (risk_score, risk_tier, mrr, scr, mfr, uf,
         confidence, signals) = calculate_risk_score(
            contract_analysis,
            liquidity_analysis,
            holder_analysis,
            token_age_days,
        )

        # Serialize signals
        signals_dict = [
            {
                "title": s.title,
                "severity": s.severity,
                "description": s.description,
                "evidenceLinks": s.evidenceLinks,
            }
            for s in signals
        ]

        now = datetime.utcnow()
        report_data = {
            "chain": chain,
            "address": address.lower(),
            "riskScore": risk_score,
            "riskTier": risk_tier,
            "mrr": mrr,
            "scr": scr,
            "mfr": mfr,
            "uf": uf,
            "confidence": confidence,
            "signals": signals_dict,
            "contractAnalysis": contract_analysis,
            "liquidityAnalysis": liquidity_analysis,
            "holderAnalysis": holder_analysis,
            "tokenName": liquidity_analysis.get("tokenName"),
            "tokenSymbol": liquidity_analysis.get("tokenSymbol"),
            "priceUsd": liquidity_analysis.get("priceUsd"),
            "priceChange24h": liquidity_analysis.get("priceChange24h"),
            "createdAt": now.isoformat(),
            "updatedAt": now.isoformat(),
        }

        # Persist to DB
        with Session(engine) as session:
            statement = select(AnalysisReportDB).where(
                AnalysisReportDB.chain == chain,
                AnalysisReportDB.address == address.lower(),
            )
            existing = session.exec(statement).first()

            if existing:
                existing.risk_score = risk_score
                existing.risk_tier = risk_tier
                existing.mrr = mrr
                existing.scr = scr
                existing.mfr = mfr
                existing.uf = uf
                existing.confidence = confidence
                existing.signals = json.dumps(signals_dict)
                existing.contract_analysis = json.dumps(contract_analysis)
                existing.liquidity_analysis = json.dumps(liquidity_analysis)
                existing.holder_analysis = json.dumps(holder_analysis)
                existing.token_name = liquidity_analysis.get("tokenName")
                existing.token_symbol = liquidity_analysis.get("tokenSymbol")
                existing.price_usd = liquidity_analysis.get("priceUsd")
                existing.price_change_24h = liquidity_analysis.get("priceChange24h")
                existing.updated_at = now
                session.add(existing)
            else:
                new_report = AnalysisReportDB(
                    chain=chain,
                    address=address.lower(),
                    risk_score=risk_score,
                    risk_tier=risk_tier,
                    mrr=mrr,
                    scr=scr,
                    mfr=mfr,
                    uf=uf,
                    confidence=confidence,
                    signals=json.dumps(signals_dict),
                    contract_analysis=json.dumps(contract_analysis),
                    liquidity_analysis=json.dumps(liquidity_analysis),
                    holder_analysis=json.dumps(holder_analysis),
                    token_name=liquidity_analysis.get("tokenName"),
                    token_symbol=liquidity_analysis.get("tokenSymbol"),
                    price_usd=liquidity_analysis.get("priceUsd"),
                    price_change_24h=liquidity_analysis.get("priceChange24h"),
                    created_at=now,
                    updated_at=now,
                )
                session.add(new_report)

            session.commit()

        # Update cache
        cache_key = f"report:{chain}:{address.lower()}"
        set_cache(cache_key, json.dumps(report_data))

        return report_data

    except Exception as e:
        print(f"Error analyzing token {chain}:{address}: {str(e)}")
        raise
