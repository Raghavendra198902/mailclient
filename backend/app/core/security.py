"""Security utilities - Authentication and authorization"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from cryptography.fernet import Fernet
import base64
import hashlib

from app.core.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer security
security = HTTPBearer()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user from token"""
    token = credentials.credentials
    payload = verify_token(token)
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    # Convert user_id to account_id (for consistency with the database)
    # The sub field contains the account ID as a string
    try:
        account_id = int(user_id) if user_id and user_id.isdigit() else None
    except (ValueError, AttributeError):
        account_id = None
    
    return {
        "user_id": user_id,
        "account_id": account_id,
        **payload
    }


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash password"""
    return pwd_context.hash(password)


def get_encryption_key() -> bytes:
    """Generate encryption key from SECRET_KEY"""
    # Use SECRET_KEY to derive a Fernet-compatible key
    key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return base64.urlsafe_b64encode(key)


def encrypt_password(password: str) -> str:
    """Encrypt password for storage"""
    if not password:
        return None
    fernet = Fernet(get_encryption_key())
    encrypted = fernet.encrypt(password.encode())
    return encrypted.decode()


def decrypt_password(encrypted_password: str) -> str:
    """Decrypt password from storage"""
    if not encrypted_password:
        return None
    fernet = Fernet(get_encryption_key())
    decrypted = fernet.decrypt(encrypted_password.encode())
    return decrypted.decode()

