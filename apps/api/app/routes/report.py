from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
import json
from app.database import get_session
from app.models import AnalysisReportDB

router = APIRouter()

def serialize_report(result: AnalysisReportDB) -> dict:
    """Serialize database report to API response format"""
    # Handle missing columns gracefully (for existing reports before migration)
    return {
        "chain": result.chain,
        "address": result.address,
        "riskScore": result.risk_score,
        "riskTier": result.risk_tier,
        "mrr": getattr(result, 'mrr', None),
        "scr": getattr(result, 'scr', None),
        "mfr": getattr(result, 'mfr', None),
        "uf": getattr(result, 'uf', None),
        "confidence": getattr(result, 'confidence', None),
        "signals": json.loads(result.signals),
        "contractAnalysis": json.loads(result.contract_analysis),
        "liquidityAnalysis": json.loads(result.liquidity_analysis),
        "holderAnalysis": json.loads(result.holder_analysis),
        "tokenName": getattr(result, 'token_name', None),
        "tokenSymbol": getattr(result, 'token_symbol', None),
        "priceUsd": getattr(result, 'price_usd', None),
        "priceChange24h": getattr(result, 'price_change_24h', None),
        "createdAt": result.created_at.isoformat(),
        "updatedAt": result.updated_at.isoformat()
    }

@router.get("/{chain}/{address}")
async def get_report(
    chain: str,
    address: str,
    session: Session = Depends(get_session)
):
    """Get the latest analysis report for a token"""
    address = address.lower()
    
    statement = select(AnalysisReportDB).where(
        AnalysisReportDB.chain == chain,
        AnalysisReportDB.address == address
    ).order_by(AnalysisReportDB.updated_at.desc())
    
    result = session.exec(statement).first()
    
    if not result:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )
    
    return serialize_report(result)
