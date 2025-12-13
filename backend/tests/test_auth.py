"""
Tests for authentication endpoints
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


class TestAuthEndpoints:
    """Test authentication endpoints."""
    
    @pytest.mark.asyncio
    async def test_health_check(self, client: AsyncClient):
        """Test health check endpoint."""
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "database" in data
        assert "redis" in data
    
    @pytest.mark.asyncio
    async def test_google_oauth_redirect(self, client: AsyncClient):
        """Test Google OAuth redirect endpoint."""
        response = await client.get("/api/v1/auth/google/authorize")
        assert response.status_code == 200
        data = response.json()
        assert "auth_url" in data
        assert "google" in data["auth_url"].lower()
    
    @pytest.mark.asyncio
    async def test_logout(self, client: AsyncClient):
        """Test logout endpoint."""
        response = await client.post("/api/v1/auth/logout")
        # Should work even without auth (no-op)
        assert response.status_code in [200, 401]


class TestAuthFlow:
    """Test authentication flow."""
    
    @pytest.mark.asyncio
    async def test_protected_endpoint_without_token(self, client: AsyncClient):
        """Test accessing protected endpoint without authentication."""
        response = await client.get("/api/v1/messages/")
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_invalid_token(self, client: AsyncClient):
        """Test accessing protected endpoint with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = await client.get("/api/v1/messages/", headers=headers)
        assert response.status_code == 401
