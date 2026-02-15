import redis
import os
import json

CACHE_TTL = int(os.getenv("CACHE_TTL_SECONDS", "21600"))  # 6 hours default

_redis_client = None

def get_redis_client():
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "redis"),
            port=int(os.getenv("REDIS_PORT", "6379")),
            db=0,
            decode_responses=True
        )
    return _redis_client

def get_cache(key: str) -> str | None:
    """Get value from cache"""
    client = get_redis_client()
    try:
        return client.get(key)
    except Exception:
        return None

def set_cache(key: str, value: str, ttl: int = CACHE_TTL):
    """Set value in cache with TTL"""
    client = get_redis_client()
    try:
        client.setex(key, ttl, value)
    except Exception:
        pass
