# 🔧 Token Key Mismatch - FIXED!

## The Problem
Messages weren't loading because of a **token key mismatch**:
- Dev-login page was setting: `localStorage.setItem('access_token', ...)`
- Dashboard page was looking for: `localStorage.getItem('auth_token', ...)`
- Result: Dashboard couldn't find the token → redirected to `/connect`

## The Fix Applied
Updated all files to use consistent **`access_token`** key:

✅ `/frontend/app/dev-login/page.tsx` - Sets `access_token`  
✅ `/frontend/app/auth/success/page.tsx` - Sets `access_token`  
✅ `/frontend/app/dashboard/page.tsx` - Gets `access_token`  
✅ Backend endpoint `/api/v1/auth/dev/token/1` - Returns `access_token`

---

## 🎯 How to Test Now

### Option 1: Use Dev Login (Easiest)
1. **Open**: http://localhost:3000/dev-login
2. **Wait** 2 seconds for auto-login
3. **See** your 88 emails loading automatically!

### Option 2: Manual Browser Test
1. **Open**: http://localhost:3000
2. **Press F12** to open DevTools
3. **Go to Console tab**
4. **Run**: 
   ```javascript
   fetch('http://localhost:8003/api/v1/auth/dev/token/1')
     .then(r => r.json())
     .then(data => {
       localStorage.setItem('access_token', data.access_token);
       window.location.href = '/dashboard';
     });
   ```
5. **See** emails load!

### Option 3: HTML Test Page
1. **Open**: file:///home/rrd/gmail-ai-manager/test-token.html
2. **Click** "Get Dev Token"
3. **Click** "Fetch Messages"
4. **See** 88 messages!

### Option 4: Command Line Verification
```bash
# Get token
curl -s http://localhost:8003/api/v1/auth/dev/token/1 | jq -r .access_token

# Test messages with token
TOKEN=$(curl -s http://localhost:8003/api/v1/auth/dev/token/1 | jq -r .access_token)
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8003/api/v1/messages/?folder=inbox&limit=5" | jq .
```

---

## ✅ Verification Checklist

Run these commands to verify everything works:

```bash
# 1. Backend health
curl http://localhost:8003/health

# 2. Dev token endpoint
curl http://localhost:8003/api/v1/auth/dev/token/1 | jq .

# 3. Messages with token
TOKEN=$(curl -s http://localhost:8003/api/v1/auth/dev/token/1 | jq -r .access_token)
curl -H "Authorization: Bearer $TOKEN" "http://localhost:8003/api/v1/messages/?folder=inbox&limit=3" | jq '.messages[].subject'

# 4. Frontend running
curl -s http://localhost:3000 | grep "Gmail AI Manager"
```

Expected output:
```
✅ Backend: {"status":"healthy"}
✅ Token: eyJhbGc...
✅ Messages: "Drawn to a New Vibe?", "Another Subject", ...
✅ Frontend: <title>Gmail AI Manager</title>
```

---

## 🎉 What Should Work Now

1. **Dev Login** → Auto-redirects to dashboard with emails ✅
2. **Dashboard** → Displays all 88 emails from database ✅
3. **Logout** → Clears access_token and redirects home ✅
4. **OAuth Callback** → Stores access_token correctly ✅

---

## 📝 Files Changed

```diff
# frontend/app/dev-login/page.tsx
- localStorage.setItem('auth_token', ...)    # ❌ Wrong key
+ localStorage.setItem('access_token', ...)  # ✅ Correct

# frontend/app/auth/success/page.tsx  
- localStorage.setItem('auth_token', ...)    # ❌ Wrong key
+ localStorage.setItem('access_token', ...)  # ✅ Correct

# frontend/app/dashboard/page.tsx
- localStorage.getItem('auth_token')         # ❌ Wrong key
+ localStorage.getItem('access_token')       # ✅ Correct
- localStorage.removeItem('auth_token')      # ❌ Wrong key  
+ localStorage.removeItem('access_token')    # ✅ Correct
```

---

## 🚀 Quick Start Command

```bash
# Open dev login in browser (works if you have xdg-open or open command)
xdg-open http://localhost:3000/dev-login 2>/dev/null || open http://localhost:3000/dev-login 2>/dev/null || echo "Open in browser: http://localhost:3000/dev-login"
```

---

## ⚡ Performance Check

Your backend has **88 emails** loaded and ready:
```bash
docker exec -it gmail-ai-postgres psql -U gmail_user -d gmail_ai -c "SELECT COUNT(*) FROM messages;"
```

Should show: **88**

---

## 🎯 Bottom Line

**The issue was a simple typo in token key names!**

Now everything uses `access_token` consistently.

**Just visit http://localhost:3000/dev-login and your emails will load! 🎉**
