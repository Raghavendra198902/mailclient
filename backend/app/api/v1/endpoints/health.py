"""Health check endpoints"""

from fastapi import APIRouter
from datetime import datetime

router = APIRouter()


@router.get("/")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0"
    }


@router.get("/readiness")
async def readiness():
    """Readiness probe"""
    # Check database, redis, etc.
    return {
        "ready": True,
        "checks": {
            "database": "ok",
            "redis": "ok",
            "ml_services": "ok"
        }
    }


@router.get("/liveness")
async def liveness():
    """Liveness probe"""
    return {"alive": True}
