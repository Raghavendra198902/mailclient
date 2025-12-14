# Quick Start - Fix OAuth Issue

## Current Problem
❌ Backend is generating OAuth URLs with empty `client_id`  
❌ `.env` file has placeholder values: `your_client_id_here`  
❌ Backend container needs to be restarted to load `.env` file

## Solution (5-10 minutes)

### Step 1: Get Google OAuth Credentials

1. **Visit Google Cloud Console**:
   ```
   https://console.cloud.google.com/
   ```

2. **Create/Select Project**:
   - Click on project dropdown (top left)
   - Create new project or select existing one

3. **Enable Gmail API**:
   - Go to: **APIs & Services → Library**
   - Search: "Gmail API"
   - Click: **ENABLE**

4. **Create OAuth Credentials**:
   - Go to: **APIs & Services → Credentials**
   - Click: **+ CREATE CREDENTIALS → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: `Gmail AI Manager` (or anything)
   
5. **Add Redirect URI**:
   - Under "Authorized redirect URIs", click **+ ADD URI**
   - Enter: `http://localhost:8003/api/v1/auth/gmail/callback`
   - Click: **CREATE**

6. **Copy Credentials**:
   - You'll see a popup with:
     - **Client ID**: looks like `123456789-abc...apps.googleusercontent.com`
     - **Client Secret**: looks like `GOCSPX-abc...`
   - Copy both values

### Step 2: Update .env File

**Option A - Interactive Script** (Recommended):
```bash
cd /home/rrd/gmail-ai-manager
./update_oauth.sh
# Paste Client ID when prompted
# Paste Client Secret when prompted
```

**Option B - Manual Edit**:
```bash
nano /home/rrd/gmail-ai-manager/.env
```
Update lines 9-10:
```env
GMAIL_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID_HERE
GMAIL_CLIENT_SECRET=YOUR_ACTUAL_CLIENT_SECRET_HERE
```
Save: `Ctrl+X`, `Y`, `Enter`

### Step 3: Restart Backend

```bash
cd /home/rrd/gmail-ai-manager
docker-compose restart backend
```

Wait 10 seconds, then verify:
```bash
docker exec gmail-ai-backend printenv | grep GMAIL_CLIENT_ID
```
Should show your real Client ID (not placeholder)

### Step 4: Test OAuth

1. Open browser: http://localhost:3000/connect
2. Click **Gmail** card
3. Should redirect to **Google login page** (not error page)
4. Login and authorize
5. You'll be redirected back to dashboard

## Troubleshooting

### Issue: "redirect_uri_mismatch"
**Solution**: The redirect URI in Google Console must exactly match:
```
http://localhost:8003/api/v1/auth/gmail/callback
```
Note: Port is **8003** (not 8000)

### Issue: "access_denied" or "This app hasn't been verified"
**Solution**: Add test user in Google Console:
- Go to: **OAuth consent screen**
- Scroll to: **Test users**
- Click: **+ ADD USERS**
- Add: deshpande.raghavendra@gmail.com

### Issue: Backend still shows placeholder
**Solution**: Make sure to restart backend AFTER updating .env:
```bash
docker-compose down
docker-compose up -d
```

## Verify Success

Backend should now generate OAuth URL with real client_id:
```bash
curl -s http://localhost:8003/api/v1/auth/gmail | jq -r '.auth_url' | grep -o "client_id=[^&]*"
```
Should show: `client_id=YOUR_REAL_CLIENT_ID` (not empty)

## Next Steps

After OAuth works:
- Connect Gmail account
- Emails will sync automatically
- Smart Reply will work (if LLM API key configured)

---

**Need Help?**
- Full guide: `OAUTH_SETUP_GUIDE.md`
- Quick reference: `OAUTH_QUICK_FIX.md`
