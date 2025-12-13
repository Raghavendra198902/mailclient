#!/usr/bin/env python3
"""
Test script for LLM Integration

This script demonstrates how to use the LLM API endpoints.
"""

import asyncio
import httpx
from typing import Optional

# API Configuration
BASE_URL = "http://localhost:8003/api/v1"

# You'll need to get a token first by authenticating
# For testing, you can use any of these methods:
# 1. OAuth flow for Gmail
# 2. Connect with credentials for other providers

async def test_llm_providers(token: str):
    """Test listing available LLM providers"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/llm/providers",
            headers={"Authorization": f"Bearer {token}"}
        )
        print("=== Available LLM Providers ===")
        print(response.json())
        print()


async def test_generate_text(token: str, prompt: str, provider: Optional[str] = None):
    """Test generic text generation"""
    async with httpx.AsyncClient() as client:
        data = {
            "prompt": prompt,
            "max_tokens": 500
        }
        if provider:
            data["provider"] = provider
            
        response = await client.post(
            f"{BASE_URL}/llm/generate",
            headers={"Authorization": f"Bearer {token}"},
            json=data
        )
        print("=== Text Generation ===")
        print(f"Prompt: {prompt}")
        result = response.json()
        print(f"Provider used: {result.get('provider_used')}")
        print(f"Generated text: {result.get('text')}")
        print()


async def test_draft_email(token: str):
    """Test email drafting"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/llm/draft-email",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "context": "We met at the tech conference last week where we discussed AI/ML integrations",
                "purpose": "Follow up about potential collaboration on email automation project",
                "tone": "professional",
                "length": "medium"
            }
        )
        print("=== Email Draft ===")
        result = response.json()
        print(f"Subject: {result.get('subject')}")
        print(f"Body:\n{result.get('body')}")
        print(f"Provider used: {result.get('provider_used')}")
        print()


async def test_analyze_conversation(token: str, message_ids: list):
    """Test conversation analysis"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/llm/analyze-conversation",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "message_ids": message_ids
            }
        )
        print("=== Conversation Analysis ===")
        result = response.json()
        print(f"Summary: {result.get('summary')}")
        print(f"Key Topics: {result.get('key_topics')}")
        print(f"Action Items: {result.get('action_items')}")
        print(f"Sentiment Trend: {result.get('sentiment_trend')}")
        print()


async def test_extract_entities(token: str, message_id: int):
    """Test entity extraction"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/llm/extract-entities/{message_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"=== Entity Extraction (Message {message_id}) ===")
        result = response.json()
        print(f"People: {result.get('entities', {}).get('people')}")
        print(f"Organizations: {result.get('entities', {}).get('organizations')}")
        print(f"Dates: {result.get('entities', {}).get('dates')}")
        print(f"Locations: {result.get('entities', {}).get('locations')}")
        print(f"Emails: {result.get('entities', {}).get('emails')}")
        print(f"Phones: {result.get('entities', {}).get('phones')}")
        print()


async def test_rewrite_email(token: str, message_id: int, tone: str = "professional", style: str = "concise"):
    """Test email rewriting"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/llm/rewrite-email/{message_id}",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "tone": tone,
                "style": style
            }
        )
        print(f"=== Email Rewrite (Message {message_id}) ===")
        result = response.json()
        print(f"Tone: {tone}, Style: {style}")
        print(f"Original: {result.get('original_subject')}")
        print(f"Rewritten: {result.get('rewritten_body')[:200]}...")
        print()


async def main():
    """
    Main test function
    
    IMPORTANT: You need to get an authentication token first!
    
    Steps to get a token:
    1. Start the backend: docker-compose up -d backend
    2. Authenticate via OAuth or credentials
    3. Copy the token from the response
    4. Replace the TOKEN variable below
    """
    
    # Replace with your actual token
    TOKEN = "YOUR_TOKEN_HERE"
    
    if TOKEN == "YOUR_TOKEN_HERE":
        print("=" * 60)
        print("SETUP REQUIRED")
        print("=" * 60)
        print("\nTo use this test script:")
        print("\n1. Get an authentication token:")
        print("   - Gmail: Visit http://localhost:8003/api/v1/auth/gmail")
        print("   - Or authenticate via other providers")
        print("\n2. Copy the token from the auth response")
        print("\n3. Edit this script and replace TOKEN with your token")
        print("\n4. Run the script again")
        print("=" * 60)
        return
    
    try:
        # Test 1: List available providers
        await test_llm_providers(TOKEN)
        
        # Test 2: Generate text
        await test_generate_text(
            TOKEN, 
            "Write a professional out-of-office message for vacation"
        )
        
        # Test 3: Draft email
        await test_draft_email(TOKEN)
        
        # Test 4-6: These require actual message IDs from your database
        # Uncomment and update message IDs as needed
        
        # await test_analyze_conversation(TOKEN, [1, 2, 3])
        # await test_extract_entities(TOKEN, message_id=1)
        # await test_rewrite_email(TOKEN, message_id=1, tone="casual", style="detailed")
        
    except httpx.HTTPStatusError as e:
        print(f"HTTP Error: {e.response.status_code}")
        print(f"Response: {e.response.text}")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    print("=" * 60)
    print("LLM Integration Test Suite")
    print("=" * 60)
    print()
    asyncio.run(main())
