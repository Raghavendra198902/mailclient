"""Authentication endpoints for all email providers"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, encrypt_password, decrypt_password
from app.core.config import settings
from app.services.universal_email_service import get_email_service
from app.models.models import Account
from sqlalchemy import select

router = APIRouter()


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ConnectRequest(BaseModel):
    provider: str  # gmail, outlook, yahoo, imap
    username: str = None
    password: str = None
    imap_server: str = None
    smtp_server: str = None


@router.get("/gmail")
async def gmail_auth():
    """Initiate Gmail OAuth flow"""
    gmail_provider = get_email_service().get_provider('gmail')
    auth_url = gmail_provider.get_auth_url()
    return {"auth_url": auth_url}


@router.get("/gmail/callback")
async def gmail_callback(
    code: str,
    db: AsyncSession = Depends(get_db)
):
    """Handle Gmail OAuth callback"""
    try:
        gmail_provider = get_email_service().get_provider('gmail')
        credentials = gmail_provider.exchange_code(code)
        
        # Get user info
        await gmail_provider.authenticate({
            'token': credentials.token,
            'refresh_token': credentials.refresh_token,
        })
        
        # Get email from service
        service = gmail_provider.service
        profile = service.users().getProfile(userId='me').execute()
        email = profile.get("emailAddress")
        
        # Create access token
        access_token = create_access_token(data={
            "sub": email,
            "provider": "gmail"
        })
        
        return RedirectResponse(
            url=f"http://localhost:3000/auth/success?token={access_token}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Authentication failed: {str(e)}"
        )


@router.get("/outlook")
async def outlook_auth():
    """Initiate Outlook OAuth flow"""
    outlook_provider = get_email_service().get_provider('outlook')
    auth_url = outlook_provider.get_auth_url()
    return {"auth_url": auth_url}


@router.get("/outlook/callback")
async def outlook_callback(
    code: str,
    db: AsyncSession = Depends(get_db)
):
    """Handle Outlook OAuth callback"""
    try:
        outlook_provider = get_email_service().get_provider('outlook')
        credentials = await outlook_provider.exchange_code(code)
        
        # Authenticate with token
        await outlook_provider.authenticate({
            'access_token': credentials['access_token']
        })
        
        # Get user email from Microsoft Graph
        import httpx
        headers = {'Authorization': f'Bearer {credentials["access_token"]}'}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://graph.microsoft.com/v1.0/me",
                headers=headers
            )
            response.raise_for_status()
            user_info = response.json()
            email = user_info.get('mail') or user_info.get('userPrincipalName')
        
        # Create access token
        access_token = create_access_token(data={
            "sub": email,
            "provider": "outlook"
        })
        
        return RedirectResponse(
            url=f"http://localhost:3000/auth/success?token={access_token}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Authentication failed: {str(e)}"
        )


@router.post("/connect/imap", response_model=TokenResponse)
async def connect_imap(
    request: ConnectRequest,
    db: AsyncSession = Depends(get_db)
):
    """Connect via IMAP/SMTP (Yahoo, custom servers)"""
    try:
        # For Gmail/Outlook with IMAP credentials, use IMAP provider
        provider_name = request.provider
        if provider_name in ['gmail', 'outlook'] and request.imap_server:
            provider_name = 'imap'
        
        provider = get_email_service().get_provider(provider_name)
        
        if not provider:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown provider: {request.provider}"
            )
        
        success = await provider.authenticate({
            'username': request.username,
            'password': request.password,
            'imap_server': request.imap_server or settings.IMAP_SERVER,
            'smtp_server': request.smtp_server or settings.SMTP_SERVER,
        })
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed"
            )
        
        # Create or update account record
        result = await db.execute(
            select(Account).where(Account.email == request.username)
        )
        account = result.scalar_one_or_none()
        
        if not account:
            account = Account(
                email=request.username,
                provider=request.provider,
                imap_username=request.username,
                imap_password=encrypt_password(request.password),
                imap_server=request.imap_server,
                smtp_server=request.smtp_server,
                smtp_password=encrypt_password(request.password),  # Same password for SMTP
                is_active=True
            )
            db.add(account)
        else:
            account.provider = request.provider
            account.imap_username = request.username
            account.imap_password = encrypt_password(request.password)
            account.imap_server = request.imap_server
            account.smtp_server = request.smtp_server
            account.smtp_password = encrypt_password(request.password)
            account.is_active = True
        
        await db.commit()
        await db.refresh(account)
        
        # Create access token with account ID
        access_token = create_access_token(data={
            "sub": str(account.id),
            "email": request.username,
            "provider": request.provider
        })
        
        return {"access_token": access_token, "token_type": "bearer"}
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Connection failed: {str(e)}"
        )

@router.post("/token", response_model=TokenResponse)
async def login(
    email: str,
    provider: str = "gmail",
    db: AsyncSession = Depends(get_db)
):
    """Login endpoint (simplified)"""
    access_token = create_access_token(data={
        "sub": email,
        "provider": provider
    })
    return {"access_token": access_token, "token_type": "bearer"}

