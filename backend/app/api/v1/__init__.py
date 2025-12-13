"""API v1 router"""

from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    messages,
    ai,
    ml,
    health
)

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(messages.router, prefix="/messages", tags=["Messages"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI Services"])
api_router.include_router(ml.router, prefix="/ml", tags=["ML Processing"])
api_router.include_router(health.router, prefix="/health", tags=["Health"])
