"""Application configuration"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Gmail AI/ML Manager"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    PORT: int = 8000
    
    # Database
    DATABASE_URL: str = "postgresql://gmail_user:gmail_pass@localhost:5432/gmail_ai"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Security
    SECRET_KEY: str = "change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Gmail API
    GMAIL_CLIENT_ID: str = ""
    GMAIL_CLIENT_SECRET: str = ""
    GMAIL_REDIRECT_URI: str = "http://localhost:8000/auth/gmail/callback"
    
    # Outlook/Microsoft API
    OUTLOOK_CLIENT_ID: str = ""
    OUTLOOK_CLIENT_SECRET: str = ""
    OUTLOOK_REDIRECT_URI: str = "http://localhost:8000/auth/outlook/callback"
    
    # IMAP/SMTP Settings
    IMAP_SERVER: str = "imap.gmail.com"
    IMAP_PORT: int = 993
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    
    # ML Models
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-3-5-sonnet-20241022"
    GOOGLE_API_KEY: str = ""
    GOOGLE_MODEL: str = "gemini-1.5-flash"
    OLLAMA_BASE_URL: str = "http://localhost:11434/v1"
    LOCAL_MODEL: str = "llama3.2"
    HUGGINGFACE_TOKEN: str = ""
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    SUMMARIZATION_MODEL: str = "facebook/bart-large-cnn"
    
    # Vector DB
    VECTOR_DB_PATH: str = "./data/faiss_index"
    
    # ML Pipeline
    ML_BATCH_SIZE: int = 32
    ML_MAX_WORKERS: int = 4
    
    # Feature Flags
    ENABLE_PHISHING_DETECTION: bool = True
    ENABLE_ANOMALY_DETECTION: bool = True
    ENABLE_RELATIONSHIP_GRAPH: bool = True
    ENABLE_TOPIC_MODELING: bool = True
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://192.168.0.102:3000",  # Network access
        "*",  # Allow all origins in development
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
