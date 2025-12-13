#!/usr/bin/env python3
"""
Quick test script for Ollama integration
"""
import asyncio
import httpx
import sys

BACKEND_URL = "http://localhost:8003"

async def test_ollama():
    """Test Ollama local LLM integration"""
    
    print("=" * 60)
    print("Testing Ollama Integration")
    print("=" * 60)
    print()
    
    # Test 1: Check Ollama directly
    print("1. Testing Ollama API directly...")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get("http://localhost:11434/api/tags")
            if response.status_code == 200:
                data = response.json()
                models = data.get('models', [])
                print(f"   ✅ Ollama is running with {len(models)} model(s)")
                for model in models:
                    print(f"      - {model['name']}")
            else:
                print(f"   ❌ Ollama API returned status {response.status_code}")
                return False
    except Exception as e:
        print(f"   ❌ Failed to connect to Ollama: {e}")
        return False
    
    print()
    
    # Test 2: Test Ollama generation directly
    print("2. Testing Ollama text generation...")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "llama3.2",
                    "prompt": "Say 'Hello from Ollama!' in exactly one sentence.",
                    "stream": False
                }
            )
            if response.status_code == 200:
                data = response.json()
                result = data.get('response', '').strip()
                print(f"   ✅ Ollama response: {result}")
            else:
                print(f"   ❌ Generation failed with status {response.status_code}")
                return False
    except Exception as e:
        print(f"   ❌ Generation error: {e}")
        return False
    
    print()
    
    # Test 3: Check backend health
    print("3. Testing backend health...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BACKEND_URL}/health")
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Backend is healthy (v{data.get('version')})")
            else:
                print(f"   ❌ Backend health check failed")
                return False
    except Exception as e:
        print(f"   ❌ Backend connection error: {e}")
        return False
    
    print()
    print("=" * 60)
    print("✅ ALL TESTS PASSED!")
    print("=" * 60)
    print()
    print("Ollama is ready to use with your Gmail AI Manager!")
    print()
    print("Next steps:")
    print("1. Get an authentication token from your app")
    print("2. Test LLM endpoints via Swagger UI: http://localhost:8003/docs")
    print("3. Try the full test script: python test_llm_integration.py")
    print()
    
    return True

if __name__ == "__main__":
    result = asyncio.run(test_ollama())
    sys.exit(0 if result else 1)
