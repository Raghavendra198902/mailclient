#!/usr/bin/env python3
"""Generate a test access token for existing account"""
import sys
from datetime import timedelta
from jose import jwt
from datetime import datetime

# These should match your backend settings
SECRET_KEY = "your-secret-key-change-in-production-minimum-32-characters-long"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10080  # 7 days

def create_access_token(account_id: int):
    """Create JWT access token"""
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(account_id),
        "account_id": account_id,
        "exp": expire
    }
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

if __name__ == "__main__":
    account_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    token = create_access_token(account_id)
    print(f"\n✅ Generated token for account ID {account_id}:")
    print(f"\n{token}\n")
    print("📋 Copy this token and paste it in your browser console:")
    print(f"localStorage.setItem('access_token', '{token}')\n")
