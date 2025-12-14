# OAuth Setup - Quick Action Required

## 🔴 Error: "Missing required parameter: client_id"

**Cause**: Google OAuth credentials not configured  
**Time to Fix**: 5-10 minutes  
**Impact**: Cannot authenticate with Gmail until fixed

---

## ✅ What I Fixed

1. **Updated `docker-compose.yml`**: Added `env_file: - .env` to backend service so it reads OAuth credentials
2. **Created `OAUTH_SETUP_GUIDE.md`**: Complete step-by-step setup instructions
3. **Created `update_oauth.sh`**: Interactive script to update credentials easily

---

## 🚀 Quick Setup Steps

### Step 1: Get Google OAuth Credentials (5 min)

1. Go to https://console.cloud.google.com/
2. Create or select project
3. Enable Gmail API (APIs & Services → Library → Gmail API → Enable)
4. Create OAuth credentials:
   - Go to: **APIs & Services → Credentials**
   - Click: **+ CREATE CREDENTIALS → OAuth 2.0 Client ID**
   - Type: **Web application**
   - Authorized redirect URIs (add these):
     ```
     http://localhost:8003/api/v1/auth/gmail/callback
     http://localhost:8000/api/v1/auth/gmail/callback
     http://127.0.0.1:8003/api/v1/auth/gmail/callback
     ```
   - Click **CREATE**
5. Copy the **Client ID** and **Client Secret**

### Step 2: Update Your `.env` File

**Option A: Interactive (Recommended)**
```bash
cd /home/rrd/gmail-ai-manager
./update_oauth.sh
# Paste your credentials when prompted
```

**Option B: Manual Edit**
```bash
cd /home/rrd/gmail-ai-manager
nano .env
```

Find these lines and replace with your actual values:
```env
GMAIL_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID_HERE
GMAIL_CLIENT_SECRET=YOUR_ACTUAL_CLIENT_SECRET_HERE
```

Example of what they look like:
```env
GMAIL_CLIENT_ID=123456789-abc12def3gh4ijklmno5pqrs.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWx
```

Save and exit (Ctrl+X, Y, Enter if using nano)

### Step 3: Restart Backend

```bash
cd /home/rrd/gmail-ai-manager
docker-compose restart backend

# Wait for startup
sleep 5

# Check if started successfully
docker-compose logs backend --tail 20
```

Look for: `INFO:     Application startup complete.`

### Step 4: Test Authentication

1. Open browser: http://localhost:3000
2. Click **"Connect Gmail"** or **"Sign in with Google"**
3. Should redirect to Google login
4. Authorize the app
5. Should redirect back to dashboard

---

## 📋 Verification Checklist

Before testing, verify:

```bash
cd /home/rrd/gmail-ai-manager

# 1. Check credentials are set in .env
grep GMAIL_CLIENT_ID .env
# Should show: GMAIL_CLIENT_ID=123456789-abc...googleusercontent.com

# 2. Check backend is running
docker-compose ps backend
# Should show: Up

# 3. Check health endpoint
curl http://localhost:8003/health
# Should return: {"status":"healthy","version":"2.0.0"}

# 4. Check auth endpoint works
curl http://localhost:8003/api/v1/auth/gmail
# Should return: {"auth_url":"https://accounts.google.com/o/oauth2/auth?..."}
```

If auth_url contains `&client_id=` parameter, OAuth is configured correctly!

---

## 🐛 Common Issues

### Issue 1: "redirect_uri_mismatch"
**Solution**: The redirect URI in Google Cloud Console must exactly match:
```
http://localhost:8003/api/v1/auth/gmail/callback
```

### Issue 2: Backend not loading .env changes
**Solution**: Restart backend with down/up:
```bash
docker-compose down
docker-compose up -d
```

### Issue 3: "access_denied" from Google
**Solution**: During development, add your email to "Test users" in OAuth consent screen

### Issue 4: Still shows placeholder values
**Solution**: Make sure there are no trailing spaces:
```bash
# Check for issues
cat .env | grep GMAIL_CLIENT_ID
# Should not have spaces or quotes around the value
```

---

## 📁 Files Modified

1. **`docker-compose.yml`**: Added `env_file: - .env` to backend service
2. **`OAUTH_SETUP_GUIDE.md`**: Complete setup documentation (new)
3. **`update_oauth.sh`**: Interactive update script (new)
4. **`OAUTH_QUICK_FIX.md`**: This file (new)

---

## 🎯 What Happens After Setup

Once OAuth is configured:

1. ✅ "Sign in with Google" button will work
2. ✅ Can connect Gmail accounts
3. ✅ Can sync emails from Gmail
4. ✅ Can send emails through Gmail
5. ⚠️ Smart Reply requires LLM API key (separate setup)
6. ⚠️ Semantic Search requires container rebuild for ML dependencies

---

## 📞 Need Help?

See detailed guide: **`OAUTH_SETUP_GUIDE.md`**

Quick test command:
```bash
# Should return auth URL with client_id parameter
curl -s http://localhost:8003/api/v1/auth/gmail | jq .
```

---

## 🔄 Current Status

- ✅ Backend running: http://localhost:8003
- ✅ Frontend running: http://localhost:3000
- ✅ Database working
- ✅ docker-compose.yml updated to read .env
- ❌ **OAuth credentials needed** ← YOU ARE HERE
- ⏳ LLM API keys (for Smart Reply)
- ⏳ ML dependencies (for Semantic Search)

---

## ⏱️ Estimated Time

- Get Google OAuth credentials: **5 minutes**
- Update .env file: **1 minute**
- Restart backend: **30 seconds**
- Test authentication: **1 minute**

**Total**: ~7-8 minutes

---

## 🎉 After This Fix

You'll be able to:
- Sign in with Google account
- Connect multiple Gmail accounts
- Sync emails automatically
- View emails in dashboard
- Open Smart Reply modal (needs LLM key to generate)
- Send emails through Gmail API

---

**Next**: After OAuth works, optionally add API keys for AI features:
- Anthropic API key for Claude (Smart Reply)
- OpenAI API key for GPT (alternative)
- Or use local Ollama (free, slower)

See: `LLM_INTEGRATION.md` for LLM setup
