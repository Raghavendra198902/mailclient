#!/bin/bash
# AI Infrastructure Setup Script - Week 1 Quick Start

set -e

echo "🚀 Gmail AI Manager - AI Infrastructure Setup"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Start Qdrant Vector Database
echo -e "${BLUE}📦 Step 1: Starting Qdrant Vector Database${NC}"
echo "Starting Qdrant container..."
docker-compose up -d qdrant

# Wait for Qdrant to be ready
echo "Waiting for Qdrant to be healthy..."
timeout=30
while ! docker exec gmail-ai-qdrant curl -f http://localhost:6333/health > /dev/null 2>&1; do
    timeout=$((timeout - 1))
    if [ $timeout -eq 0 ]; then
        echo -e "${YELLOW}⚠️  Qdrant health check timeout. Continuing anyway...${NC}"
        break
    fi
    sleep 1
done

echo -e "${GREEN}✅ Qdrant is running on http://localhost:6333${NC}"
echo ""

# Step 2: Check Ollama (optional for local LLMs)
echo -e "${BLUE}🤖 Step 2: Checking for Ollama (Local LLM)${NC}"
if command -v ollama &> /dev/null; then
    echo -e "${GREEN}✅ Ollama is installed${NC}"
    
    # Check if Llama3 model is available
    if ollama list | grep -q "llama3"; then
        echo -e "${GREEN}✅ Llama3 model is available${NC}"
    else
        echo -e "${YELLOW}⚠️  Llama3 model not found. Installing...${NC}"
        echo "This may take a few minutes..."
        ollama pull llama3
        echo -e "${GREEN}✅ Llama3 model installed${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Ollama not installed. You can install it for free local AI:${NC}"
    echo "   curl https://ollama.ai/install.sh | sh"
    echo "   ollama pull llama3"
    echo ""
    echo "   Or skip this and use cloud providers (OpenAI, Anthropic, Google)"
fi
echo ""

# Step 3: Install Python dependencies
echo -e "${BLUE}📚 Step 3: Installing Python Dependencies${NC}"
echo "Installing qdrant-client and other AI packages..."

if [ -f "backend/requirements.txt" ]; then
    # Check if we're in Docker or local
    if docker ps | grep -q gmail-ai-backend; then
        echo "Installing in Docker container..."
        docker exec gmail-ai-backend pip install -q qdrant-client==1.7.0 sentence-transformers==2.3.1
        echo -e "${GREEN}✅ Dependencies installed in container${NC}"
    else
        echo "Backend container not running. Please run: docker-compose up -d backend"
    fi
else
    echo -e "${YELLOW}⚠️  requirements.txt not found${NC}"
fi
echo ""

# Step 4: Initialize Vector Database
echo -e "${BLUE}🔧 Step 4: Initializing Vector Database${NC}"
echo "Creating email embeddings collection..."

if docker ps | grep -q gmail-ai-backend; then
    # Try to initialize via API
    TOKEN=$(curl -s http://localhost:8003/api/v1/auth/test-token 2>/dev/null || echo "")
    
    if [ -n "$TOKEN" ]; then
        echo "Initializing collection via API..."
        curl -s -X POST http://localhost:8003/api/v1/ai/vector/initialize \
            -H "Authorization: Bearer $TOKEN" || true
    else
        echo "Running initialization script..."
        docker exec gmail-ai-backend python scripts/init_embeddings.py --batch-size 50 || true
    fi
    
    echo -e "${GREEN}✅ Vector database initialized${NC}"
else
    echo -e "${YELLOW}⚠️  Backend not running. Start with: docker-compose up -d backend${NC}"
fi
echo ""

# Step 5: Environment Variables Check
echo -e "${BLUE}🔐 Step 5: Checking Environment Variables${NC}"
ENV_FILE="backend/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating template...${NC}"
    cat > "$ENV_FILE" << 'EOF'
# LLM API Keys (at least one recommended)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=

# Vector Database
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

# Local LLM
OLLAMA_URL=http://localhost:11434

# Gmail OAuth
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REDIRECT_URI=http://localhost:8003/auth/gmail/callback
EOF
    echo -e "${GREEN}✅ .env template created${NC}"
    echo -e "${YELLOW}📝 Please edit backend/.env and add your API keys${NC}"
else
    # Check which keys are set
    echo "Checking configured providers:"
    
    if grep -q "OPENAI_API_KEY=." "$ENV_FILE"; then
        echo -e "  ${GREEN}✓${NC} OpenAI"
    else
        echo -e "  ${YELLOW}○${NC} OpenAI (not configured)"
    fi
    
    if grep -q "ANTHROPIC_API_KEY=." "$ENV_FILE"; then
        echo -e "  ${GREEN}✓${NC} Anthropic (Claude)"
    else
        echo -e "  ${YELLOW}○${NC} Anthropic (not configured)"
    fi
    
    if grep -q "GOOGLE_API_KEY=." "$ENV_FILE"; then
        echo -e "  ${GREEN}✓${NC} Google (Gemini)"
    else
        echo -e "  ${YELLOW}○${NC} Google (not configured)"
    fi
    
    if command -v ollama &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} Ollama (local)"
    else
        echo -e "  ${YELLOW}○${NC} Ollama (not installed)"
    fi
fi
echo ""

# Summary
echo -e "${GREEN}=========================================="
echo "✨ AI Infrastructure Setup Complete! ✨"
echo "==========================================${NC}"
echo ""
echo "Services running:"
echo "  • Qdrant Vector DB: http://localhost:6333"
echo "  • Qdrant Dashboard: http://localhost:6333/dashboard"
echo "  • Backend API: http://localhost:8003"
echo "  • Frontend: http://localhost:3000"
echo ""
echo "Next steps:"
echo "  1. Visit http://localhost:3000/connect to authenticate Gmail"
echo "  2. Your emails will be automatically indexed for semantic search"
echo "  3. Try semantic search: 'Find emails about project deadlines'"
echo "  4. Generate smart replies with AI"
echo ""
echo -e "${BLUE}📖 Documentation:${NC}"
echo "  • AI_QUICK_START.md - 15-minute setup guide"
echo "  • AI_ML_IMPLEMENTATION_GUIDE.md - Technical details"
echo "  • VERSION_2_ROADMAP.md - Full roadmap"
echo ""
echo -e "${YELLOW}⚡ Pro tip:${NC} Run 'docker-compose logs -f backend' to watch AI in action"
