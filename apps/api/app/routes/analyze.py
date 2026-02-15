from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from pydantic import BaseModel, Field
import redis
from rq import Queue
import json
from datetime import datetime, timedelta
import os

from app.database import get_session
from app.models import AnalysisReportDB
from app.services.cache import get_cache, set_cache, CACHE_TTL

router = APIRouter()

redis_conn = redis.Redis(
    host=os.getenv("REDIS_HOST", "redis"),
    port=int(os.getenv("REDIS_PORT", "6379")),
    db=0,
    decode_responses=False
)
queue = Queue("analysis", connection=redis_conn)

class AnalyzeRequest(BaseModel):
    chain: str = Field(..., pattern="^(ethereum|base)$")
    address: str = Field(..., pattern="^0x[a-fA-F0-9]{40}$")

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

@router.post("", response_model=dict)
async def analyze_token(
    request: AnalyzeRequest,
    session: Session = Depends(get_session)
):
    """Analyze a token or return cached result or job ID"""
    chain = request.chain
    address = request.address.lower()
    cache_key = f"report:{chain}:{address}"
    
    # Check cache first
    cached = get_cache(cache_key)
    if cached:
        report_data = json.loads(cached)
        return {
            "status": "completed",
            "report": report_data
        }
    
    # Check database for recent report
    statement = select(AnalysisReportDB).where(
        AnalysisReportDB.chain == chain,
        AnalysisReportDB.address == address
    ).order_by(AnalysisReportDB.updated_at.desc())
    
    result = session.exec(statement).first()
    
    if result:
        # Check if report is still fresh (within TTL)
        age = datetime.utcnow() - result.updated_at.replace(tzinfo=None)
        if age < timedelta(seconds=CACHE_TTL):
            # Return cached report
            report_data = serialize_report(result)
            set_cache(cache_key, json.dumps(report_data))
            return {
                "status": "completed",
                "report": report_data
            }
    
    # Enqueue analysis job
    try:
        job = queue.enqueue(
            "app.worker.analyze_token",
            chain,
            address,
            job_timeout="10m"
        )
        return {
            "status": "processing",
            "jobId": job.id
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to enqueue analysis job: {str(e)}"
        )
