from fastapi import APIRouter
import redis
import os
from sqlmodel import Session, text
from app.database import engine

router = APIRouter()

@router.get("")
async def health_check():
    """Health check endpoint"""
    checks = {
        "status": "healthy",
        "database": "unknown",
        "redis": "unknown"
    }
    
    # Check database
    try:
        with Session(engine) as session:
            session.exec(text("SELECT 1"))
        checks["database"] = "connected"
    except Exception as e:
        checks["database"] = f"error: {str(e)}"
        checks["status"] = "unhealthy"
    
    # Check Redis
    try:
        redis_conn = redis.Redis(
            host=os.getenv("REDIS_HOST", "redis"),
            port=int(os.getenv("REDIS_PORT", "6379")),
            db=0
        )
        redis_conn.ping()
        checks["redis"] = "connected"
    except Exception as e:
        checks["redis"] = f"error: {str(e)}"
        checks["status"] = "unhealthy"
    
    return checks
