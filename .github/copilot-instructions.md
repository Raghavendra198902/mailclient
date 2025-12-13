# Gmail AI/ML Manager - Development Instructions

## Project Overview
Gmail AI/ML Manager with advanced automation and UI animations.

## Tech Stack
- Backend: FastAPI (Python) with async support
- Frontend: React with TypeScript and Framer Motion
- Database: PostgreSQL with ML extensions
- Vector Store: FAISS
- ML Pipeline: Multi-service AI architecture

## Checklist

- [x] Verify copilot-instructions.md created
- [x] Clarify Project Requirements
- [x] Scaffold the Project (already complete)
- [x] Customize the Project (already complete)
- [x] Install Required Extensions
- [x] Compile the Project (Docker images built)
- [x] Create and Run Task
- [x] Launch the Project
- [ ] Ensure Documentation is Complete

## Current Status

### Running Services
- **Backend**: http://localhost:8003 (Docker container)
- **Frontend**: http://localhost:3000 (Next.js dev server)
- **PostgreSQL**: localhost:5436
- **Redis**: localhost:6382

### Quick Commands
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f backend

# Frontend development
cd frontend && npm run dev

# Backend development (in container)
docker-compose restart backend
```
