"""
Tests for message endpoints
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.models.models import Account, Message


class TestMessageEndpoints:
    """Test message endpoints."""
    
    @pytest.fixture
    async def test_account(self, test_db: AsyncSession, sample_account_data):
        """Create a test account."""
        account = Account(**sample_account_data)
        test_db.add(account)
        await test_db.commit()
        await test_db.refresh(account)
        return account
    
    @pytest.fixture
    async def test_message(self, test_db: AsyncSession, test_account: Account, sample_email_data):
        """Create a test message."""
        message = Message(
            account_id=test_account.id,
            received_date=datetime.fromisoformat(sample_email_data["received_date"]),
            **{k: v for k, v in sample_email_data.items() if k != "received_date"}
        )
        test_db.add(message)
        await test_db.commit()
        await test_db.refresh(message)
        return message
    
    @pytest.mark.asyncio
    async def test_list_messages_unauthorized(self, client: AsyncClient):
        """Test listing messages without authentication."""
        response = await client.get("/api/v1/messages/")
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_get_message_by_id_unauthorized(self, client: AsyncClient):
        """Test getting message by ID without authentication."""
        response = await client.get("/api/v1/messages/1")
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_sync_messages_unauthorized(self, client: AsyncClient):
        """Test syncing messages without authentication."""
        response = await client.post("/api/v1/messages/sync")
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_mark_as_read_unauthorized(self, client: AsyncClient):
        """Test marking message as read without authentication."""
        response = await client.patch("/api/v1/messages/1/read")
        assert response.status_code == 401


class TestMessageModels:
    """Test message data models."""
    
    @pytest.mark.asyncio
    async def test_create_account(self, test_db: AsyncSession, sample_account_data):
        """Test creating an account in the database."""
        account = Account(**sample_account_data)
        test_db.add(account)
        await test_db.commit()
        await test_db.refresh(account)
        
        assert account.id is not None
        assert account.email == sample_account_data["email"]
        assert account.provider == sample_account_data["provider"]
        assert account.is_active is True
    
    @pytest.mark.asyncio
    async def test_create_message(self, test_db: AsyncSession, sample_account_data, sample_email_data):
        """Test creating a message in the database."""
        # First create account
        account = Account(**sample_account_data)
        test_db.add(account)
        await test_db.commit()
        await test_db.refresh(account)
        
        # Then create message
        message = Message(
            account_id=account.id,
            received_date=datetime.fromisoformat(sample_email_data["received_date"]),
            **{k: v for k, v in sample_email_data.items() if k != "received_date"}
        )
        test_db.add(message)
        await test_db.commit()
        await test_db.refresh(message)
        
        assert message.id is not None
        assert message.account_id == account.id
        assert message.subject == sample_email_data["subject"]
        assert message.from_email == sample_email_data["from_email"]
        assert message.labels == sample_email_data["labels"]
    
    @pytest.mark.asyncio
    async def test_message_account_relationship(self, test_db: AsyncSession, sample_account_data, sample_email_data):
        """Test the relationship between messages and accounts."""
        # Create account
        account = Account(**sample_account_data)
        test_db.add(account)
        await test_db.commit()
        await test_db.refresh(account)
        
        # Create multiple messages
        for i in range(3):
            message = Message(
                account_id=account.id,
                provider_message_id=f"test{i}",
                thread_id=f"thread{i}",
                subject=f"Test Email {i}",
                from_email=sample_email_data["from_email"],
                to_email=sample_email_data["to_email"],
                body_text=sample_email_data["body_text"],
                body_html=sample_email_data["body_html"],
                received_date=datetime.fromisoformat(sample_email_data["received_date"]),
                is_read=False,
                labels=["INBOX"]
            )
            test_db.add(message)
        
        await test_db.commit()
        
        # Query and verify
        from sqlalchemy import select
        result = await test_db.execute(
            select(Message).where(Message.account_id == account.id)
        )
        messages = result.scalars().all()
        
        assert len(messages) == 3
        assert all(msg.account_id == account.id for msg in messages)
