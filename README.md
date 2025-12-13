# Universal Email AI/ML Manager v2.0

Advanced email management system supporting Gmail, Outlook, Yahoo, and IMAP/SMTP with AI/ML automation and animated UI.

## Features

- **Multi-Provider Support**: Gmail, Outlook, Yahoo, IMAP/SMTP, Exchange
- **🆕 Multi-LLM Integration**: OpenAI, Anthropic Claude, Google Gemini, Local (Ollama)
- **Multi-layer AI Processing**: Summarization, smart replies, tone/intent detection
- **🆕 Advanced Email Drafting**: AI-powered email composition with context awareness
- **🆕 Conversation Analysis**: Thread insights, action items, sentiment tracking
- **🆕 Entity Extraction**: Automatic detection of people, dates, locations, contacts
- **🆕 Email Rewriting**: Change tone and style with AI
- **Phishing & Anomaly Detection**: ML-based security scanning
- **Semantic Search**: Vector embeddings with FAISS
- **Contact Intelligence**: Automated ranking and relationship graphs
- **Topic Modeling**: Thread clustering and organization
- **Animated UI**: Real-time updates with Framer Motion
- **Inbox Health Analytics**: Visual dashboard with metrics

## Architecture

```
├── backend/              # FastAPI backend
│   ├── api/             # API endpoints
│   ├── services/        # AI/ML services
│   ├── models/          # Database models
│   └── core/            # Core utilities
├── frontend/            # React + TypeScript frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── animations/  # Framer Motion animations
│   │   └── services/    # API clients
├── ml_pipeline/         # ML processing workers
├── migrations/          # Database migrations
└── docker-compose.yml   # Container orchestration
```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+
- Docker & Docker Compose

### Setup

1. **Clone and setup environment**:
```bash
cd gmail-ai-manager
cp .env.example .env
# Edit .env with your Gmail API credentials
```

2. **Start services**:
```bash
docker-compose up -d
```

3. **Initialize database**:
```bash
cd backend
python -m alembic upgrade head
```

4. **Install dependencies**:
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

5. **Configure LLM Providers** (Optional but recommended):
```bash
# Add to your .env file:
OPENAI_API_KEY=sk-proj-...          # For OpenAI GPT models
ANTHROPIC_API_KEY=sk-ant-...        # For Claude models
GOOGLE_API_KEY=AIza...              # For Gemini models
OLLAMA_BASE_URL=http://localhost:11434/v1  # For local models
```

6. **Run development servers**:
```bash
# Backend (terminal 1)
cd backend
uvicorn app.main:app --reload --port 8000

# Frontend (terminal 2)
cd frontend
npm run dev
```

7. **Access application**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🆕 LLM Integration

See [LLM_INTEGRATION.md](LLM_INTEGRATION.md) for detailed documentation.

### Quick Setup

**Option 1: Cloud LLM (OpenAI)**
```bash
export OPENAI_API_KEY=sk-proj-...
docker-compose restart backend
```

**Option 2: Free Local LLM (Ollama)**
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3.2

# No API key needed - works locally!
```

### Available Features
- **Email Drafting**: Generate complete emails from context
- **Smart Replies**: 3 contextual suggestions with different tones
- **Conversation Analysis**: Thread insights and action items
- **Entity Extraction**: Auto-detect names, dates, locations
- **Email Rewriting**: Change tone (professional/casual/friendly)
- **Generic Text Generation**: Any text generation task

### API Endpoints
- `POST /api/v1/llm/generate` - Generate text
- `POST /api/v1/llm/draft-email` - Draft emails
- `POST /api/v1/llm/analyze-conversation` - Analyze threads
- `POST /api/v1/llm/extract-entities/{id}` - Extract entities
- `GET /api/v1/llm/providers` - List available providers
- `POST /api/v1/llm/rewrite-email/{id}` - Rewrite emails

## Gmail API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add credentials to `.env` file

## ML Pipeline

The AI/ML pipeline processes emails through multiple stages:

1. **Preprocessing** → Clean and normalize text
2. **Embedding** → Generate vector representations
3. **Classification** → Priority, tone, intent detection
4. **Summarization** → Multi-level summaries
5. **Smart Reply** → Context-aware response generation
6. **Security** → Phishing and anomaly detection
7. **Clustering** → Topic modeling and thread grouping
8. **Graph Analysis** → Relationship intelligence

## API Endpoints

### Core
- `POST /api/v1/auth/gmail` - Gmail OAuth
- `GET /api/v1/messages` - List messages
- `GET /api/v1/messages/{id}` - Get message details

### AI Services
- `POST /api/v1/ai/summarize` - Generate summary
- `POST /api/v1/ai/smart-reply` - Get reply suggestions
- `POST /api/v1/ai/tone` - Detect tone
- `POST /api/v1/ai/intent` - Extract intent
- `GET /api/v1/ai/topic-cluster` - Get topic clusters
- `GET /api/v1/ai/relationship-graph` - Get contact graph
- `GET /api/v1/ai/inbox-health` - Get inbox metrics

### WebSocket
- `ws://localhost:8000/ws` - Real-time updates

## Environment Variables

```env
# Gmail API
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REDIRECT_URI=http://localhost:8000/auth/callback

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/gmail_ai
VECTOR_DB_PATH=./data/faiss_index

# ML Models
OPENAI_API_KEY=your_openai_key
HUGGINGFACE_TOKEN=your_hf_token

# Redis
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=your_secret_key_here
```

## Development

### Backend Testing
```bash
cd backend
pytest tests/ -v
```

### Frontend Testing
```bash
cd frontend
npm test
```

### Type Checking
```bash
# Backend
cd backend
mypy app/

# Frontend
cd frontend
npm run type-check
```

## Deployment

### Production Build
```bash
# Backend
docker build -t gmail-ai-backend -f backend/Dockerfile .

# Frontend
cd frontend
npm run build
```

### Docker Compose
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Monitoring

- Prometheus metrics: http://localhost:9090
- Grafana dashboards: http://localhost:3001
- Logs: `docker-compose logs -f`

## Security

- OAuth2 authentication
- PII masking in logs
- Email body redaction options
- Vector DB metadata isolation
- HTTPS enforced in production

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
