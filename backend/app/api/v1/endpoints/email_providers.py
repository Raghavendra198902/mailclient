from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import User, EmailProvider
from pydantic import BaseModel, EmailStr

router = APIRouter()


class EmailProviderCreate(BaseModel):
    provider: str
    email: EmailStr
    password: str
    appPassword: str = ""


class EmailProviderResponse(BaseModel):
    id: int
    provider: str
    email: str
    password: str
    status: str
    lastSync: str = None

    class Config:
        from_attributes = True


@router.get("/email-providers", response_model=List[EmailProviderResponse])
async def get_email_providers(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all email providers for the current user"""
    user_id_raw = current_user.get("account_id") or current_user.get("user_id")
    user_id = int(user_id_raw) if user_id_raw and str(user_id_raw).isdigit() else user_id_raw
    result = await db.execute(
        select(EmailProvider).filter(EmailProvider.user_id == user_id)
    )
    providers = result.scalars().all()
    
    return [
        EmailProviderResponse(
            id=p.id,
            provider=p.provider,
            email=p.email,
            password=p.app_password or p.password,  # Show app password if available
            status=p.status,
            lastSync=p.last_sync.isoformat() if p.last_sync else None
        )
        for p in providers
    ]


@router.post("/email-providers", response_model=EmailProviderResponse, status_code=status.HTTP_201_CREATED)
async def create_email_provider(
    provider_data: EmailProviderCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a new email provider for the current user"""
    user_id_raw = current_user.get("account_id") or current_user.get("user_id")
    user_id = int(user_id_raw) if user_id_raw and str(user_id_raw).isdigit() else user_id_raw
    
    # Check if provider already exists for this user
    result = await db.execute(
        select(EmailProvider).filter(
            EmailProvider.user_id == user_id,
            EmailProvider.email == provider_data.email
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email provider is already connected"
        )
    
    # Create new provider
    new_provider = EmailProvider(
        user_id=user_id,
        provider=provider_data.provider,
        email=provider_data.email,
        password=provider_data.password,
        app_password=provider_data.appPassword if provider_data.appPassword else None,
        status="active",
        created_at=datetime.utcnow()
    )
    
    db.add(new_provider)
    await db.commit()
    await db.refresh(new_provider)
    
    return EmailProviderResponse(
        id=new_provider.id,
        provider=new_provider.provider,
        email=new_provider.email,
        password=new_provider.app_password or new_provider.password,
        status=new_provider.status,
        lastSync=new_provider.last_sync.isoformat() if new_provider.last_sync else None
    )


@router.delete("/email-providers/{provider_id}")
async def delete_email_provider(
    provider_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete an email provider"""
    user_id_raw = current_user.get("account_id") or current_user.get("user_id")
    user_id = int(user_id_raw) if user_id_raw and str(user_id_raw).isdigit() else user_id_raw
    
    result = await db.execute(
        select(EmailProvider).filter(
            EmailProvider.id == provider_id,
            EmailProvider.user_id == user_id
        )
    )
    provider = result.scalar_one_or_none()
    
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email provider not found"
        )
    
    await db.delete(provider)
    await db.commit()
    
    return {"message": "Email provider removed successfully"}


@router.post("/email-providers/{provider_id}/sync")
async def sync_email_provider(
    provider_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Trigger email sync for a specific provider"""
    user_id_raw = current_user.get("account_id") or current_user.get("user_id")
    user_id = int(user_id_raw) if user_id_raw and str(user_id_raw).isdigit() else user_id_raw
    
    result = await db.execute(
        select(EmailProvider).filter(
            EmailProvider.id == provider_id,
            EmailProvider.user_id == user_id
        )
    )
    provider = result.scalar_one_or_none()
    
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email provider not found"
        )
    
    # Update last sync time
    provider.last_sync = datetime.utcnow()
    provider.status = "active"
    await db.commit()
    
    # TODO: Trigger actual email sync job here
    # This would call your email sync service with the provider credentials
    
    return {"message": "Email sync started successfully"}


@router.put("/email-providers/{provider_id}")
async def update_email_provider(
    provider_id: int,
    provider_data: EmailProviderCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an email provider's credentials"""
    user_id_raw = current_user.get("account_id") or current_user.get("user_id")
    user_id = int(user_id_raw) if user_id_raw and str(user_id_raw).isdigit() else user_id_raw
    
    result = await db.execute(
        select(EmailProvider).filter(
            EmailProvider.id == provider_id,
            EmailProvider.user_id == user_id
        )
    )
    provider = result.scalar_one_or_none()
    
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email provider not found"
        )
    
    provider.provider = provider_data.provider
    provider.email = provider_data.email
    provider.password = provider_data.password
    provider.app_password = provider_data.appPassword if provider_data.appPassword else None
    provider.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(provider)
    
    return EmailProviderResponse(
        id=provider.id,
        provider=provider.provider,
        email=provider.email,
        password=provider.app_password or provider.password,
        status=provider.status,
        lastSync=provider.last_sync.isoformat() if provider.last_sync else None
    )
