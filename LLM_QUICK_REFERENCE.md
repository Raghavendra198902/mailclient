# LLM Integration Quick Reference

## 🚀 Quick Start

### Option 1: OpenAI (Best Quality)
```bash
# Add to .env
OPENAI_API_KEY=sk-proj-...

# Restart
docker-compose restart backend

# Test
curl http://localhost:8003/api/v1/llm/providers -H "Authorization: Bearer TOKEN"
```

### Option 2: Local Ollama (Free)
```bash
# Install
curl -fsSL https://ollama.com/install.sh | sh

# Pull model
ollama pull llama3.2

# No restart needed - auto-detected
```

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/llm/generate` | POST | Generate any text |
| `/api/v1/llm/draft-email` | POST | Draft complete emails |
| `/api/v1/llm/analyze-conversation` | POST | Analyze threads |
| `/api/v1/llm/extract-entities/{id}` | POST | Extract entities |
| `/api/v1/llm/providers` | GET | List providers |
| `/api/v1/llm/rewrite-email/{id}` | POST | Rewrite emails |

## 💡 Features

### Email Drafting
```json
POST /api/v1/llm/draft-email
{
  "context": "Met at conference",
  "purpose": "Schedule follow-up call",
  "tone": "professional",
  "length": "medium"
}
```

### Smart Replies
Existing endpoint enhanced with LLM:
```
POST /api/v1/messages/{id}/smart-replies
```

### Entity Extraction
```json
POST /api/v1/llm/extract-entities/123
Response: {
  "people": ["John Smith"],
  "organizations": ["Acme Corp"],
  "dates": ["2024-01-15"],
  "locations": ["San Francisco"],
  "emails": ["john@acme.com"],
  "phones": ["+1-555-0123"]
}
```

### Conversation Analysis
```json
POST /api/v1/llm/analyze-conversation
{
  "message_ids": [1, 2, 3, 4]
}
Response: {
  "summary": "Discussion about Q4 project",
  "key_topics": ["deadline", "budget"],
  "action_items": ["Submit proposal by Friday"],
  "sentiment_trend": "positive"
}
```

### Email Rewriting
```json
POST /api/v1/llm/rewrite-email/123
{
  "tone": "professional",    // or casual, friendly, formal
  "style": "concise"         // or detailed, persuasive
}
```

## 🔧 Providers

| Provider | Best For | Cost | Setup |
|----------|----------|------|-------|
| **OpenAI** | Quality | $$ | Get key: platform.openai.com |
| **Claude** | Long context | $$$ | Get key: console.anthropic.com |
| **Gemini** | Speed | $ | Get key: makersuite.google.com |
| **Ollama** | Privacy/Free | FREE | Install: ollama.com |

## ⚡ Quick Commands

```bash
# Check backend status
docker-compose ps backend

# View logs
docker-compose logs -f backend

# Restart backend
docker-compose restart backend

# Test LLM endpoints
python test_llm_integration.py

# API documentation
open http://localhost:8003/docs
```

## 🔑 Environment Variables

```bash
# .env file
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini              # or gpt-4o, gpt-4-turbo

ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

GOOGLE_API_KEY=AIza...
GOOGLE_MODEL=gemini-1.5-flash         # or gemini-1.5-pro

OLLAMA_BASE_URL=http://localhost:11434/v1
LOCAL_MODEL=llama3.2                  # or llama3.1, mistral
```

## 📊 Model Comparison

| Model | Speed | Quality | Cost/1M tokens | Use Case |
|-------|-------|---------|----------------|----------|
| gpt-4o-mini | ⚡⚡ | ⭐⭐⭐⭐ | $0.15-0.60 | Production |
| gpt-4o | ⚡ | ⭐⭐⭐⭐⭐ | $2.50-10.00 | Complex tasks |
| claude-3.5-sonnet | ⚡⚡ | ⭐⭐⭐⭐⭐ | $3.00-15.00 | Long emails |
| gemini-1.5-flash | ⚡⚡⚡ | ⭐⭐⭐⭐ | $0.075-0.30 | High volume |
| llama3.2 | ⚡ | ⭐⭐⭐ | FREE | Private data |

## 📖 Documentation

- **Full Guide**: [LLM_INTEGRATION.md](LLM_INTEGRATION.md)
- **API Docs**: http://localhost:8003/docs
- **Test Script**: [test_llm_integration.py](test_llm_integration.py)
- **Status**: [LLM_IMPLEMENTATION_COMPLETE.md](LLM_IMPLEMENTATION_COMPLETE.md)

## 🐛 Troubleshooting

### Provider not available
```bash
# Check configuration
docker-compose exec backend env | grep API_KEY

# Verify API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Ollama connection failed
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve

# Pull model if needed
ollama pull llama3.2
```

### Authentication error
```bash
# Get token first via OAuth
curl http://localhost:8003/api/v1/auth/gmail

# Use token in requests
curl -H "Authorization: Bearer YOUR_TOKEN" ...
```

## 💰 Cost Optimization

1. **Use gpt-4o-mini** instead of gpt-4o for most tasks (15x cheaper)
2. **Set max_tokens** limits appropriately
3. **Cache responses** for identical prompts
4. **Use local models** for development and testing
5. **Batch operations** when possible

## 🔒 Security Tips

1. ✅ Store API keys in `.env`, never in code
2. ✅ Use environment-specific keys (dev/prod)
3. ⏳ Implement rate limiting (TODO)
4. ✅ All endpoints require authentication
5. ⏳ Add input validation and sanitization

## 📝 Example Usage

### Python
```python
import httpx

async def get_smart_reply(message_id: int, token: str):
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"http://localhost:8003/api/v1/messages/{message_id}/smart-replies",
            headers={"Authorization": f"Bearer {token}"}
        )
        return r.json()
```

### JavaScript
```javascript
const draftEmail = async (context, purpose) => {
  const response = await fetch(
    'http://localhost:8003/api/v1/llm/draft-email',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ context, purpose, tone: 'professional', length: 'medium' })
    }
  );
  return await response.json();
};
```

### cURL
```bash
# Draft email
curl -X POST http://localhost:8003/api/v1/llm/draft-email \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "context": "Client meeting yesterday",
    "purpose": "Send meeting notes",
    "tone": "professional",
    "length": "medium"
  }'

# List providers
curl http://localhost:8003/api/v1/llm/providers \
  -H "Authorization: Bearer TOKEN"
```

---

**Need help?** See [LLM_INTEGRATION.md](LLM_INTEGRATION.md) for detailed documentation.
