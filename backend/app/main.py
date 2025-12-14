"""
Gmail AI/ML Manager - FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from contextlib import asynccontextmanager
import logging
import asyncio

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1 import api_router
from app.services.websocket_manager import websocket_manager
from app.services.email_sync_worker import get_sync_worker, stop_sync_worker

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global task for sync worker
sync_task = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global sync_task
    
    # Startup
    logger.info("Starting Gmail AI/ML Manager...")
    
    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    logger.info("✅ Database initialized")
    
    # Create demo user if not exists
    from app.core.database import AsyncSessionLocal
    from app.models.models import User
    from sqlalchemy import select
    from passlib.context import CryptContext
    
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "demo@mailmanager.com"))
        demo_user = result.scalar_one_or_none()
        if not demo_user:
            demo_user = User(
                email="demo@mailmanager.com",
                full_name="Demo User",
                hashed_password=pwd_context.hash("demo123"),
                is_active=True
            )
            db.add(demo_user)
            await db.commit()
            logger.info("✅ Demo user created (demo@mailmanager.com / demo123)")
        else:
            logger.info("✅ Demo user exists")
    
    # Start email sync worker in background
    worker = get_sync_worker(sync_interval=300)  # Sync every 5 minutes
    sync_task = asyncio.create_task(worker.run())
    logger.info("✅ Email sync worker started")
    
    logger.info(f"✅ Application ready on port {settings.PORT}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Gmail AI/ML Manager...")
    stop_sync_worker()
    if sync_task:
        sync_task.cancel()
        try:
            await sync_task
        except asyncio.CancelledError:
            pass
    await engine.dispose()
    logger.info("✅ Shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="Universal Email AI/ML Manager API",
    description="Advanced email management for Gmail, Outlook, Yahoo, IMAP/SMTP with AI/ML automation",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Universal Email AI/ML Manager API v2.0",
        "providers": ["Gmail", "Outlook", "Yahoo", "IMAP/SMTP"],
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "2.0.0"
    }


@app.post("/api/v1/auth/demo-login")
async def demo_login():
    """Quick demo login endpoint for development"""
    from app.core.security import create_access_token
    from datetime import timedelta
    
    # Create a long-lived token for demo (24 hours)
    access_token = create_access_token(
        data={"sub": "demo@mailmanager.com"},
        expires_delta=timedelta(hours=24)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": 1,
            "email": "demo@mailmanager.com",
            "full_name": "Demo User",
            "is_active": True
        }
    }


@app.get("/favicon.ico")
async def favicon():
    """Return empty favicon to prevent 404 errors"""
    return Response(content="", media_type="image/x-icon")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await websocket_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back for now (can add message routing)
            await websocket.send_json({"message": "received", "data": data})
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG
    )
