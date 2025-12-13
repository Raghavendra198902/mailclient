"""
Tests for AI endpoints
"""
import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock


class TestAIEndpoints:
    """Test AI-related endpoints."""
    
    @pytest.mark.asyncio
    async def test_smart_reply_unauthorized(self, client: AsyncClient):
        """Test smart reply endpoint without authentication."""
        response = await client.post("/api/v1/ai/smart-reply", json={"message_id": 1})
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_summarize_unauthorized(self, client: AsyncClient):
        """Test summarize endpoint without authentication."""
        response = await client.post("/api/v1/ai/summarize", json={"message_id": 1})
        assert response.status_code == 401


class TestMLEndpoints:
    """Test ML processing endpoints."""
    
    @pytest.mark.asyncio
    async def test_get_ml_insights_unauthorized(self, client: AsyncClient):
        """Test ML insights endpoint without authentication."""
        response = await client.get("/api/v1/ml/insights/1")
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_reprocess_message_unauthorized(self, client: AsyncClient):
        """Test reprocess message endpoint without authentication."""
        response = await client.post("/api/v1/ml/reprocess/1")
        assert response.status_code == 401
