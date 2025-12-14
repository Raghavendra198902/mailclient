# Google OAuth Setup Guide

## Error: "Missing required parameter: client_id"

This error occurs because the Gmail OAuth credentials are not configured. Follow these steps to fix it.

---

## Quick Setup (5 minutes)

### 1. Get Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create/Select Project**
   - Click on project dropdown (top bar)
   - Create new project or select existing one
   - Name: "Gmail AI Manager" (or any name)

3. **Enable Gmail API**
   ```
   Navigation: APIs & Services → Library
   Search: "Gmail API"
   Click: Enable
   ```

4. **Configure OAuth Consent Screen** (First time only)
   ```
   Navigation: APIs & Services → OAuth consent screen
   User Type: External (for testing)
   App name: Gmail AI Manager
   User support email: your@email.com
   Developer contact: your@email.com
   Scopes: Add Gmail scopes if prompted
   Test users: Add your Gmail address
   ```

5. **Create OAuth 2.0 Credentials**
   ```
   Navigation: APIs & Services → Credentials
   Click: + CREATE CREDENTIALS → OAuth 2.0 Client ID
   Application type: Web application
   Name: Gmail AI Manager
   
   Authorized redirect URIs (add all):
   - http://localhost:8003/api/v1/auth/gmail/callback
   - http://localhost:8000/api/v1/auth/gmail/callback
   - http://127.0.0.1:8003/api/v1/auth/gmail/callback
   
   Click: CREATE
   ```

6. **Copy Credentials**
   - Copy the **Client ID** (looks like: `123456789-abc...googleusercontent.com`)
   - Copy the **Client Secret** (looks like: `GOCSPX-...`)

---

### 2. Update Environment Variables

#### Option A: Interactive Script
```bash
cd /home/rrd/gmail-ai-manager
./update_oauth.sh
```
Then paste your Client ID and Client Secret when prompted.

#### Option B: Manual Edit
```bash
cd /home/rrd/gmail-ai-manager
nano .env
```

Update these lines:
```env
GMAIL_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID_HERE
GMAIL_CLIENT_SECRET=YOUR_ACTUAL_CLIENT_SECRET_HERE
GMAIL_REDIRECT_URI=http://localhost:8003/api/v1/auth/gmail/callback
```

Save and exit (Ctrl+X, Y, Enter)

---

### 3. Restart Backend

```bash
cd /home/rrd/gmail-ai-manager
docker-compose restart backend

# Wait 5 seconds then check
sleep 5
docker-compose logs backend --tail 20
```

Look for: `INFO:     Application startup complete.`

---

### 4. Test OAuth Flow

1. Open browser: http://localhost:3000
2. Click **"Connect Gmail"** or **"Sign in with Google"**
3. Should redirect to Google OAuth consent screen
4. Authorize the app
5. Should redirect back with success

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
**Fix**: Add the exact redirect URI shown in error to Google Cloud Console authorized URIs

### Error: "access_denied"
**Fix**: Make sure you're logged in with an email added to "Test users" in OAuth consent screen

### Error: "invalid_client"
**Fix**: Check that Client ID and Secret match exactly (no extra spaces)

### Backend not picking up .env changes
**Fix**: Restart backend AND rebuild if needed:
```bash
docker-compose down
docker-compose up -d
```

---

## Environment Variables Reference

Required in `.env`:
```env
# Gmail OAuth - GET FROM GOOGLE CLOUD CONSOLE
GMAIL_CLIENT_ID=123456789-abc...googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-...
GMAIL_REDIRECT_URI=http://localhost:8003/api/v1/auth/gmail/callback

# Database (already configured)
DATABASE_URL=postgresql://gmail_user:gmail_pass@postgres:5432/gmail_ai
REDIS_URL=redis://redis:6379

# Security (change in production)
SECRET_KEY=your-secret-key-change-in-production
```

---

## Verification Commands

```bash
# Check if credentials are set
grep GMAIL_CLIENT_ID .env

# Check backend logs for OAuth errors
docker-compose logs backend | grep -i oauth

# Test health endpoint
curl http://localhost:8003/health

# Check auth endpoints are available
curl http://localhost:8003/api/v1/auth/gmail/url
```

---

## Important Notes

1. **Test Users**: During development, only emails added as "Test users" in OAuth consent screen can authenticate
2. **Port**: Backend runs on port 8003 (mapped from 8000 inside container)
3. **HTTPS**: For production, use HTTPS and update redirect URIs accordingly
4. **Scopes**: App requests Gmail read/write/send permissions

---

## Next Steps After OAuth Setup

1. ✅ Configure Google OAuth (this guide)
2. Add LLM API keys for Smart Reply:
   ```env
   ANTHROPIC_API_KEY=sk-ant-...
   # OR
   OPENAI_API_KEY=sk-...
   ```
3. Optionally rebuild backend with ML dependencies:
   ```bash
   docker-compose build backend --no-cache
   docker-compose up -d
   ```

---

## Quick Commands

```bash
# Update OAuth credentials interactively
./update_oauth.sh

# Restart backend
docker-compose restart backend

# Check backend status
docker-compose ps backend

# View backend logs
docker-compose logs -f backend

# Test frontend
curl http://localhost:3000
```

---

**Status**: Setup required before authentication will work  
**Estimated Time**: 5-10 minutes  
**Documentation**: https://developers.google.com/gmail/api/quickstart/python
