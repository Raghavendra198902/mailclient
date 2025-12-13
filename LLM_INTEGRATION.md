# LLM Integration Documentation

## Overview

The Gmail AI Manager now features comprehensive LLM (Large Language Model) integration supporting multiple AI providers. This enables advanced email intelligence features including smart composition, summarization, analysis, and automated responses.

## Supported Providers

### 1. OpenAI
- **Models**: GPT-4o, GPT-4o-mini, GPT-4-turbo, GPT-3.5-turbo
- **Default**: gpt-4o-mini
- **Best for**: High-quality responses, complex reasoning
- **Cost**: Paid tier (pay-per-token)
- **Setup**: Requires OpenAI API key

### 2. Anthropic Claude
- **Models**: Claude-3.5-Sonnet, Claude-3.5-Haiku, Claude-3-Opus
- **Default**: claude-3-5-sonnet-20241022
- **Best for**: Long context, nuanced understanding, safety
- **Cost**: Paid tier (pay-per-token)
- **Setup**: Requires Anthropic API key

### 3. Google Gemini
- **Models**: Gemini-1.5-Pro, Gemini-1.5-Flash, Gemini-1.0-Pro
- **Default**: gemini-1.5-flash
- **Best for**: Fast responses, multimodal capabilities
- **Cost**: Free tier available, then pay-per-use
- **Setup**: Requires Google AI API key

### 4. Local Models (Ollama)
- **Models**: Llama3.2, Llama3.1, Mistral, Phi3, Gemma2
- **Default**: llama3.2
- **Best for**: Privacy, no API costs, offline usage
- **Cost**: Free (runs on your hardware)
- **Setup**: Requires Ollama installed locally

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini

# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Google Configuration
GOOGLE_API_KEY=AIza...
GOOGLE_MODEL=gemini-1.5-flash

# Local Model Configuration (Ollama)
OLLAMA_BASE_URL=http://localhost:11434/v1
LOCAL_MODEL=llama3.2
```

### Quick Start

**Option 1: OpenAI (Recommended for beginners)**
```env
OPENAI_API_KEY=your_key_here
```

**Option 2: Free Local Models**
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3.2

# No API key needed, Ollama runs locally
```

## Features & Capabilities

### 1. Email Summarization
Generate concise summaries of email content.

**API Endpoint**: Internal method in ML processor
**Styles**:
- `short`: Single sentence summary
- `long`: 2-3 sentence detailed summary
- `actionable`: Focus on action items and deadlines

**Example**:
```python
summary = await llm_service.generate_email_summary(
    subject="Q4 Budget Review Meeting",
    body="We need to discuss...",
    style="short"
)
# Result: "Meeting scheduled to review Q4 budget allocations."
```

### 2. Smart Reply Generation
Generate contextual reply suggestions with different tones.

**API Endpoint**: Internal method in ML processor
**Parameters**:
- `count`: Number of suggestions (default: 3)
- Automatic tone variation: professional, casual, brief

**Example**:
```python
replies = await llm_service.generate_smart_replies(
    subject="Project Update Request",
    body="Can you send the latest status?",
    sender="manager@company.com",
    count=3
)
# Result: 3 different reply suggestions
```

### 3. Email Drafting
Generate complete emails from context and purpose.

**API Endpoint**: `POST /api/v1/llm/draft-email`

**Request**:
```json
{
  "context": "We met at the tech conference last week",
  "purpose": "Follow up about potential collaboration",
  "tone": "professional",
  "length": "medium"
}
```

**Response**:
```json
{
  "subject": "Following Up - Tech Conference Discussion",
  "body": "Dear [Name],\n\nIt was great meeting you...",
  "provider_used": "openai"
}
```

### 4. Entity Extraction
Extract named entities from email content.

**API Endpoint**: `POST /api/v1/llm/extract-entities/{message_id}`

**Entities Extracted**:
- People (names)
- Organizations
- Dates and times
- Locations
- Email addresses
- Phone numbers

**Response**:
```json
{
  "message_id": 123,
  "entities": {
    "people": ["John Smith", "Sarah Johnson"],
    "organizations": ["Acme Corp", "Tech Solutions Inc"],
    "dates": ["2024-01-15", "next Tuesday"],
    "locations": ["San Francisco", "Building A, Room 301"],
    "emails": ["john@acme.com"],
    "phones": ["+1-555-0123"]
  }
}
```

### 5. Intent Classification
Classify the primary intent of an email.

**Categories**:
- Request (asking for something)
- Meeting (scheduling/discussing meetings)
- Information (sharing information)
- Feedback (providing feedback)
- Urgent (time-sensitive matters)
- Social (informal/personal)
- Marketing (promotional content)
- Newsletter (informational updates)

### 6. Tone Detection
Analyze the emotional tone and sentiment of an email.

**Tones**:
- Positive
- Negative
- Neutral
- Professional
- Casual
- Urgent

**Returns**: Primary tone + sentiment score (0-1)

### 7. Conversation Analysis
Analyze entire email threads for insights.

**API Endpoint**: `POST /api/v1/llm/analyze-conversation`

**Request**:
```json
{
  "message_ids": [101, 102, 103, 104]
}
```

**Response**:
```json
{
  "summary": "Discussion about Q4 project timeline...",
  "key_topics": ["project deadline", "budget allocation", "team resources"],
  "action_items": [
    "Submit budget proposal by Friday",
    "Schedule team meeting next week"
  ],
  "sentiment_trend": "initially concerned, becoming positive",
  "participants": ["alice@company.com", "bob@company.com"]
}
```

### 8. Email Rewriting
Rewrite emails in different tones or styles.

**API Endpoint**: `POST /api/v1/llm/rewrite-email/{message_id}`

**Request**:
```json
{
  "tone": "professional",
  "style": "concise"
}
```

**Options**:
- **Tone**: professional, casual, friendly, formal
- **Style**: concise, detailed, persuasive

### 9. Generic Text Generation
General-purpose text generation with provider selection.

**API Endpoint**: `POST /api/v1/llm/generate`

**Request**:
```json
{
  "prompt": "Write a meeting agenda for Q1 planning",
  "provider": "openai",
  "max_tokens": 500
}
```

**Response**:
```json
{
  "text": "Q1 Planning Meeting Agenda\n\n1. Review Q4 results...",
  "provider_used": "openai"
}
```

## API Reference

### List Available Providers
```http
GET /api/v1/llm/providers
Authorization: Bearer {token}
```

**Response**:
```json
{
  "providers": [
    {
      "name": "openai",
      "models": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
      "available": true
    },
    {
      "name": "anthropic",
      "models": ["claude-3-5-sonnet-20241022"],
      "available": true
    },
    {
      "name": "google",
      "models": ["gemini-1.5-flash", "gemini-1.5-pro"],
      "available": false
    },
    {
      "name": "local",
      "models": ["llama3.2"],
      "available": true
    }
  ],
  "default_provider": "openai"
}
```

### Full API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/llm/generate` | Generic text generation |
| POST | `/api/v1/llm/draft-email` | Generate email drafts |
| POST | `/api/v1/llm/analyze-conversation` | Analyze email threads |
| POST | `/api/v1/llm/extract-entities/{id}` | Extract entities from message |
| GET | `/api/v1/llm/providers` | List available providers |
| POST | `/api/v1/llm/rewrite-email/{id}` | Rewrite email in different style |

## Usage Examples

### Python Client

```python
import httpx

async def draft_followup_email():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8003/api/v1/llm/draft-email",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "context": "Client interested in our SaaS product",
                "purpose": "Schedule demo call",
                "tone": "professional",
                "length": "short"
            }
        )
        draft = response.json()
        print(f"Subject: {draft['subject']}")
        print(f"Body: {draft['body']}")
```

### cURL

```bash
# List available providers
curl -X GET "http://localhost:8003/api/v1/llm/providers" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Generate email draft
curl -X POST "http://localhost:8003/api/v1/llm/draft-email" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "context": "Follow up after conference",
    "purpose": "Discuss collaboration opportunities",
    "tone": "professional",
    "length": "medium"
  }'

# Analyze conversation
curl -X POST "http://localhost:8003/api/v1/llm/analyze-conversation" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message_ids": [1, 2, 3, 4]
  }'
```

### JavaScript/TypeScript

```typescript
// Generate smart reply suggestions
async function getSmartReplies(messageId: number) {
  const response = await fetch(
    `http://localhost:8003/api/v1/messages/${messageId}/smart-replies`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  const { replies } = await response.json();
  return replies;
}

// Extract entities from email
async function extractEntities(messageId: number) {
  const response = await fetch(
    `http://localhost:8003/api/v1/llm/extract-entities/${messageId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return await response.json();
}
```

## Best Practices

### Provider Selection

1. **OpenAI GPT-4o-mini**: Best balance of quality and cost for production
2. **Anthropic Claude**: Best for long emails, nuanced understanding
3. **Google Gemini Flash**: Best for speed, good for simple tasks
4. **Local Ollama**: Best for privacy-sensitive data, development/testing

### Cost Optimization

1. **Use caching**: Cache responses for identical prompts
2. **Choose right model**: Don't use GPT-4o when GPT-3.5-turbo suffices
3. **Limit max_tokens**: Set appropriate token limits
4. **Batch operations**: Process multiple emails together when possible
5. **Consider local models**: Use Ollama for development and non-critical tasks

### Performance Tips

1. **Async operations**: All LLM calls are async, use `await` properly
2. **Timeout handling**: LLM calls can be slow, set appropriate timeouts
3. **Fallback strategy**: System automatically falls back to simpler methods
4. **Monitor usage**: Track API calls and costs per provider

### Security

1. **API key management**: Store keys in environment variables, never in code
2. **Rate limiting**: Implement per-user rate limits for LLM endpoints
3. **Input validation**: Validate all user inputs before sending to LLM
4. **Content filtering**: Be aware of provider content policies
5. **Local models for PII**: Use Ollama for emails with sensitive data

## Troubleshooting

### Provider Not Available

**Symptom**: `GET /api/v1/llm/providers` shows provider as unavailable

**Solutions**:
1. Check API key is set in environment variables
2. Verify API key is valid (not expired, has credits)
3. For Ollama: Ensure service is running (`ollama serve`)
4. Check network connectivity to provider API

### Slow Responses

**Causes**:
- Large prompts (long emails)
- Complex models (GPT-4o vs GPT-3.5-turbo)
- Provider API latency
- Network issues

**Solutions**:
1. Use faster models (e.g., gpt-4o-mini, gemini-flash)
2. Reduce max_tokens parameter
3. Implement caching for repeated requests
4. Consider local models for instant responses

### Rate Limit Errors

**OpenAI**: 429 Too Many Requests
**Anthropic**: 429 Rate limit exceeded
**Google**: 429 Quota exceeded

**Solutions**:
1. Implement exponential backoff retry logic
2. Add rate limiting at application level
3. Use multiple API keys with load balancing
4. Upgrade to higher tier plan
5. Cache responses to reduce API calls

### Local Model Issues

**Ollama not connecting**:
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama service
ollama serve

# Pull required model
ollama pull llama3.2
```

## Performance Benchmarks

### Response Times (approximate)

| Provider | Model | Avg Time | Quality |
|----------|-------|----------|---------|
| OpenAI | gpt-4o-mini | 1-2s | Excellent |
| OpenAI | gpt-4o | 2-4s | Outstanding |
| Anthropic | claude-3-5-sonnet | 2-3s | Excellent |
| Google | gemini-1.5-flash | 1-2s | Very Good |
| Local | llama3.2 | 5-10s | Good |

*Times vary based on prompt complexity and hardware*

### Cost Comparison (per 1M tokens)

| Provider | Model | Input | Output |
|----------|-------|-------|--------|
| OpenAI | gpt-4o-mini | $0.15 | $0.60 |
| OpenAI | gpt-4o | $2.50 | $10.00 |
| Anthropic | claude-3-5-sonnet | $3.00 | $15.00 |
| Google | gemini-1.5-flash | $0.075 | $0.30 |
| Local | llama3.2 | FREE | FREE |

## Migration Guide

### From Direct OpenAI Integration

**Before**:
```python
from openai import AsyncOpenAI
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
response = await client.chat.completions.create(...)
```

**After**:
```python
from app.services.llm_service import llm_service
summary = await llm_service.generate_email_summary(subject, body, style="short")
```

### Adding New Provider

1. Add provider credentials to `config.py`:
```python
NEW_PROVIDER_API_KEY: str = ""
NEW_PROVIDER_MODEL: str = "model-name"
```

2. Add provider to `LLMProvider` enum in `llm_service.py`

3. Implement `_new_provider_completion()` method

4. Add initialization logic in `__init__()`

5. Update provider list in API endpoints

## Support & Resources

### Provider Documentation
- [OpenAI API](https://platform.openai.com/docs)
- [Anthropic Claude](https://docs.anthropic.com)
- [Google Gemini](https://ai.google.dev/docs)
- [Ollama](https://ollama.com/docs)

### Getting API Keys
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/
- Google AI: https://makersuite.google.com/app/apikey
- Ollama: No API key needed (local)

### Cost Calculators
- OpenAI: https://openai.com/pricing
- Anthropic: https://www.anthropic.com/pricing
- Google: https://ai.google.dev/pricing

## Changelog

### v2.0.0 (2024-01)
- ✨ Initial LLM integration
- ✅ Multi-provider support (OpenAI, Anthropic, Google, Local)
- ✅ 8 AI capabilities (summary, replies, draft, analysis, entities, intent, tone, rewriting)
- ✅ 7 REST API endpoints
- ✅ Automatic provider selection and fallback
- ✅ Backwards compatibility with existing ML features

## License

This LLM integration is part of Gmail AI Manager.
Provider usage subject to their respective terms of service.
