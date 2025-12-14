"""Authentication endpoints for all email providers"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import create_access_token, encrypt_password, decrypt_password
from app.core.config import settings
from app.services.universal_email_service import get_email_service
from app.models.models import Account, User
from sqlalchemy import select

router = APIRouter()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    is_active: bool
    created_at: datetime


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    from jose import JWTError, jwt
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    return user


@router.post("/register", response_model=TokenResponse)
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user"""
    # Check if user exists
    result = await db.execute(select(User).where(User.email == request.email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(request.password)
    new_user = User(
        email=request.email,
        full_name=request.full_name,
        hashed_password=hashed_password
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Create access token
    access_token = create_access_token(data={"sub": new_user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "is_active": new_user.is_active,
            "created_at": new_user.created_at
        }
    }


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Login user"""
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "created_at": user.created_at
        }
    }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user


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
        
        # Create or update account record with OAuth tokens
        result = await db.execute(
            select(Account).where(Account.email == email)
        )
        account = result.scalar_one_or_none()
        
        if not account:
            account = Account(
                email=email,
                provider='gmail',
                access_token=credentials.token,
                refresh_token=credentials.refresh_token,
                token_expires_at=credentials.expiry,
                is_active=True
            )
            db.add(account)
        else:
            account.provider = 'gmail'
            account.access_token = credentials.token
            account.refresh_token = credentials.refresh_token
            account.token_expires_at = credentials.expiry
            account.is_active = True
        
        await db.commit()
        await db.refresh(account)
        
        # Create access token with account ID
        access_token = create_access_token(data={
            "sub": str(account.id),
            "email": email,
            "provider": "gmail"
        })
        
        return RedirectResponse(
            url=f"http://localhost:3000/auth/success?token={access_token}"
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Authentication failed: {str(e)}"
        )


@router.get("/dev/token/{account_id}")
async def dev_generate_token(
    account_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Development endpoint: Generate test token for existing account.
    REMOVE IN PRODUCTION!
    """
    result = await db.execute(
        select(Account).where(Account.id == account_id)
    )
    account = result.scalar_one_or_none()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account {account_id} not found"
        )
    
    access_token = create_access_token(data={
        "sub": str(account.id),
        "account_id": account.id,
        "email": account.email,
        "provider": account.provider
    })
    
    return {
        "access_token": access_token,
        "account_id": account.id,
        "email": account.email,
        "frontend_command": f"localStorage.setItem('access_token', '{access_token}')"
    }


@router.get("/status")
async def auth_status(
    db: AsyncSession = Depends(get_db)
):
    """
    Check authentication status for all accounts.
    Returns accounts that need re-authentication.
    """
    try:
        from datetime import datetime, timedelta
        
        result = await db.execute(
            select(Account).where(Account.is_active == True)
        )
        accounts = result.scalars().all()
        
        account_statuses = []
        for account in accounts:
            needs_reauth = False
            reason = None
            
            # Check token expiry
            if account.token_expires_at:
                # Warn if token expires within 7 days
                if account.token_expires_at < datetime.utcnow() + timedelta(days=7):
                    needs_reauth = True
                    reason = "Token expiring soon"
                    
                if account.token_expires_at < datetime.utcnow():
                    needs_reauth = True
                    reason = "Token expired"
            
            # Check if refresh token is missing
            if account.provider in ['gmail', 'outlook'] and not account.refresh_token:
                needs_reauth = True
                reason = "No refresh token"
            
            account_statuses.append({
                "id": account.id,
                "email": account.email,
                "provider": account.provider,
                "needs_reauth": needs_reauth,
                "reason": reason,
                "expires_at": account.token_expires_at.isoformat() if account.token_expires_at else None
            })
        
        return {
            "accounts": account_statuses,
            "any_needs_reauth": any(a["needs_reauth"] for a in account_statuses)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check auth status: {str(e)}"
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

