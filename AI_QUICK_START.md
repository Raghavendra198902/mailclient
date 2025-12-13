# 🤖 Quick Start: AI/ML Features

## Getting Started with AI-Powered Email Management

This guide helps you quickly set up and start using the AI/ML features in Gmail AI Manager v2.0.

## 🚀 Quick Setup (15 minutes)

### 1. Install Vector Database (Qdrant)

```bash
# Using Docker (Recommended)
docker run -p 6333:6333 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant:latest

# Verify it's running
curl http://localhost:6333/
```

### 2. Install Ollama (Local LLM - Optional)

```bash
# Linux
curl https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama3
ollama pull mistral

# Verify
ollama list
```

### 3. Set Up API Keys

Create `.env` file:

```bash
# OpenAI (Required for best performance)
OPENAI_API_KEY=sk-...

# Anthropic (Optional)
ANTHROPIC_API_KEY=sk-ant-...

# Google (Optional)
GOOGLE_API_KEY=AIza...

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=  # Leave empty for local

# Model Selection
DEFAULT_LLM=gpt-3.5-turbo  # or claude-3-haiku, llama3
PREMIUM_LLM=gpt-4-turbo    # or claude-3-opus
```

### 4. Install Python Dependencies

```bash
cd backend

# Add to requirements.txt
pip install qdrant-client==1.7.0
pip install sentence-transformers==2.2.2
pip install langchain==0.1.0
pip install openai==1.10.0
pip install anthropic==0.18.0
pip install spacy==3.7.2

# Download spaCy model
python -m spacy download en_core_web_sm
```

### 5. Initialize Vector Database

```python
# backend/scripts/init_embeddings.py
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

client = QdrantClient("localhost", port=6333)

# Create collection for emails
client.recreate_collection(
    collection_name="emails",
    vectors_config=VectorParams(
        size=384,  # all-MiniLM-L6-v2 dimension
        distance=Distance.COSINE
    )
)

print("✅ Vector database initialized!")
```

Run it:
```bash
python backend/scripts/init_embeddings.py
```

## 🎯 Using AI Features

### 1. Semantic Search

**Natural Language Queries:**
```javascript
// Frontend: src/app/dashboard/page.tsx
const searchResults = await fetch('/api/v1/ai/search', {
  method: 'POST',
  body: JSON.stringify({
    query: "emails about project deadlines from last week",
    limit: 10
  })
});
```

**Backend Endpoint:**
```python
# backend/app/api/v1/endpoints/ai.py
@router.post("/search")
async def semantic_search(
    query: str,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    search_service = SemanticSearchService()
    results = await search_service.search_emails(query, limit)
    return {"results": results}
```

### 2. Smart Reply

**Generate Reply Suggestions:**
```javascript
// Frontend component
const { replies } = await fetch('/api/v1/ai/smart-reply', {
  method: 'POST',
  body: JSON.stringify({
    email_id: emailId,
    tone: 'professional', // or 'friendly', 'casual'
    include_thread: true
  })
});

// Display suggestions
{replies.map(reply => (
  <div className="reply-option">
    <p>{reply.text}</p>
    <span className="tone">{reply.tone}</span>
    <button onClick={() => acceptReply(reply)}>Use this</button>
  </div>
))}
```

### 3. Email Summarization

**Get Summary:**
```javascript
const summary = await fetch(`/api/v1/ai/summarize/${emailId}`);

// Display
<div className="email-summary">
  <h4>TL;DR:</h4>
  <p>{summary.tldr}</p>
  
  <h4>Key Points:</h4>
  <ul>
    {summary.key_points.map(point => <li>{point}</li>)}
  </ul>
  
  {summary.action_items.length > 0 && (
    <>
      <h4>Action Items:</h4>
      <ul>
        {summary.action_items.map(item => <li>{item}</li>)}
      </ul>
    </>
  )}
</div>
```

### 4. Conversational AI Assistant

**Chat Interface:**
```javascript
// Frontend: Chat component
const [messages, setMessages] = useState([]);

const sendMessage = async (userMessage) => {
  const response = await fetch('/api/v1/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message: userMessage })
  });
  
  const aiReply = await response.json();
  setMessages([...messages, 
    { role: 'user', content: userMessage },
    { role: 'assistant', content: aiReply.message }
  ]);
};

// Usage examples:
// "Show me urgent emails from this week"
// "Draft a reply to John about the meeting"
// "Summarize my inbox"
// "What emails need my attention?"
```

## 📊 Monitoring AI Performance

### Check Model Health

```bash
# Check LLM availability
curl http://localhost:8003/api/v1/ai/health

# Response:
{
  "llm_status": "healthy",
  "models_available": ["gpt-3.5-turbo", "llama3"],
  "vector_db_status": "connected",
  "embeddings_count": 1543
}
```

### View Metrics Dashboard

```bash
# Prometheus metrics
curl http://localhost:8003/metrics | grep llm

# Key metrics:
# llm_requests_total{model="gpt-3.5-turbo"} 245
# llm_latency_seconds{model="gpt-3.5-turbo"} 2.3
# smart_reply_accepted 147
```

## 🎨 UI Components

### Smart Reply Modal

```tsx
// src/components/SmartReplyModal.tsx
import { useState } from 'react';

export function SmartReplyModal({ emailId, onClose }) {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchReplies();
  }, [emailId]);
  
  const fetchReplies = async () => {
    const res = await fetch(`/api/v1/ai/smart-reply`, {
      method: 'POST',
      body: JSON.stringify({ email_id: emailId })
    });
    const data = await res.json();
    setReplies(data.replies);
    setLoading(false);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <h2 className="text-xl font-bold mb-4">Smart Reply Suggestions</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : (
          <div className="space-y-4">
            {replies.map((reply, idx) => (
              <div key={idx} className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm text-gray-500 font-medium">
                    {reply.tone.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400">
                    {reply.length} words
                  </span>
                </div>
                <p className="text-gray-800">{reply.text}</p>
                <button 
                  onClick={() => useReply(reply)}
                  className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Use This Reply
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

## 🧪 Testing AI Features

### Test Smart Reply

```bash
# Test endpoint
curl -X POST http://localhost:8003/api/v1/ai/smart-reply \
  -H "Content-Type: application/json" \
  -d '{
    "email_id": 1,
    "tone": "professional"
  }'
```

### Test Semantic Search

```bash
curl -X POST http://localhost:8003/api/v1/ai/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "find emails about deadlines",
    "limit": 5
  }'
```

### Test Email Summarization

```bash
curl http://localhost:8003/api/v1/ai/summarize/1
```

## 🐛 Troubleshooting

### Issue: Vector database not connecting

```bash
# Check if Qdrant is running
docker ps | grep qdrant

# Check logs
docker logs <qdrant_container_id>

# Restart
docker restart <qdrant_container_id>
```

### Issue: LLM rate limits

```python
# Implement caching in backend/app/services/ai/llm_service.py
from functools import lru_cache

@lru_cache(maxsize=1000)
def cached_llm_call(prompt: str, model: str):
    # Your LLM call here
    pass
```

### Issue: Slow embedding generation

```python
# Use batch processing
async def batch_generate_embeddings(emails: List[Email]):
    # Process in batches of 32
    batch_size = 32
    for i in range(0, len(emails), batch_size):
        batch = emails[i:i+batch_size]
        embeddings = encoder.encode([e.body for e in batch])
        # Store embeddings
```

## 📈 Performance Optimization

### 1. Cache LLM Responses

```python
# Redis cache for frequent queries
from redis import Redis

cache = Redis(host='localhost', port=6379, decode_responses=True)

async def get_reply_cached(email_id: int, tone: str):
    cache_key = f"reply:{email_id}:{tone}"
    cached = cache.get(cache_key)
    
    if cached:
        return json.loads(cached)
    
    reply = await generate_reply(email_id, tone)
    cache.setex(cache_key, 3600, json.dumps(reply))  # Cache for 1 hour
    
    return reply
```

### 2. Async Processing

```python
# Use background tasks for heavy operations
from fastapi import BackgroundTasks

@router.post("/smart-reply")
async def smart_reply(
    email_id: int,
    background_tasks: BackgroundTasks
):
    # Quick response
    background_tasks.add_task(generate_and_cache_replies, email_id)
    
    return {"status": "processing"}
```

## 🎯 Next Steps

1. ✅ Set up vector database
2. ✅ Configure LLM API keys
3. ✅ Test basic features
4. 🔄 Index existing emails
5. 🔄 Train custom models
6. 🔄 Deploy to production

## 📚 Additional Resources

- [OpenAI API Docs](https://platform.openai.com/docs)
- [LangChain Documentation](https://python.langchain.com/)
- [Qdrant Guide](https://qdrant.tech/documentation/)
- [Sentence Transformers](https://www.sbert.net/)

---

**Quick Links:**
- 📖 Full Implementation: [AI_ML_IMPLEMENTATION_GUIDE.md](./AI_ML_IMPLEMENTATION_GUIDE.md)
- 🗺️ Roadmap: [VERSION_2_ROADMAP.md](./VERSION_2_ROADMAP.md)
- 💬 Questions? Open an issue on GitHub

**Last Updated**: December 13, 2025
