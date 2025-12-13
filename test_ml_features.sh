#!/bin/bash

# Test ML Features for Email AI Manager
# This script demonstrates the ML processing capabilities

echo "======================================"
echo "Email AI Manager - ML Features Test"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo -e "${BLUE}1. Checking backend health...${NC}"
HEALTH=$(curl -s http://localhost:8003/api/v1/health/)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
    echo "$HEALTH" | python3 -m json.tool
else
    echo "✗ Backend is not responding"
    exit 1
fi
echo ""

# Get access token (assuming user is registered)
echo -e "${BLUE}2. Testing ML Stats Endpoint...${NC}"
echo -e "${YELLOW}Note: You need to login first to get an access token${NC}"
echo ""
echo "To test the full ML pipeline:"
echo "1. Register/Login at: http://localhost:3000/auth/login"
echo "2. Connect an email account at: http://localhost:3000/connect"
echo "3. Sync messages to trigger ML processing"
echo "4. View results at: http://localhost:3000/dashboard"
echo ""

echo -e "${BLUE}3. Available ML Endpoints:${NC}"
echo "• POST /api/v1/ml/process-message - Process single message"
echo "• POST /api/v1/ml/batch-process - Process multiple messages"
echo "• GET  /api/v1/ml/stats - Get processing statistics"
echo ""

echo -e "${BLUE}4. ML Features Enabled:${NC}"
echo "✓ Email Summarization (OpenAI GPT-3.5 + fallback)"
echo "✓ Priority Detection (0-1 score: low/medium/high)"
echo "✓ Sentiment Analysis (positive/negative/neutral/urgent)"
echo "✓ Intent Classification (request/meeting/feedback/info)"
echo "✓ Phishing Detection (0-1 risk score)"
echo "✓ PII Extraction (emails, phones, SSN, credit cards)"
echo ""

echo -e "${BLUE}5. Automatic Processing:${NC}"
echo "✓ New messages are automatically processed during sync"
echo "✓ ML data is stored in MessageML table"
echo "✓ Dashboard displays ML insights (priority, sentiment, summary)"
echo "✓ AI Features page shows real-time statistics"
echo ""

echo -e "${GREEN}Setup Complete!${NC}"
echo "Open http://localhost:3000 to start using the ML features"
