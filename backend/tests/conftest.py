"""
Configuration for pytest tests
"""
import pytest
import asyncio
from typing import Generator, AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from httpx import AsyncClient

from app.main import app
from app.core.database import Base, get_db
from app.core.config import settings


# Test database URL (use in-memory SQLite for tests)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def test_db() -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async_session_maker = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session_maker() as session:
        yield session
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest.fixture(scope="function")
async def client(test_db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client with database session override."""
    async def override_get_db():
        yield test_db
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest.fixture
def mock_openai_response():
    """Mock OpenAI API response for testing."""
    return {
        "choices": [{
            "message": {
                "content": "This is a test summary of the email content."
            }
        }]
    }


@pytest.fixture
def sample_email_data():
    """Sample email data for testing."""
    return {
        "provider_message_id": "test123",
        "thread_id": "thread123",
        "subject": "Test Email Subject",
        "from_email": "sender@example.com",
        "to_email": "recipient@example.com",
        "body_text": "This is a test email body with some content for testing purposes.",
        "body_html": "<p>This is a test email body with some content for testing purposes.</p>",
        "received_date": "2025-12-13T00:00:00",
        "is_read": False,
        "labels": ["INBOX", "UNREAD"]
    }


@pytest.fixture
def sample_account_data():
    """Sample account data for testing."""
    return {
        "email": "test@example.com",
        "provider": "gmail",
        "is_active": True,
        "access_token": "test_access_token",
        "refresh_token": "test_refresh_token"
    }
