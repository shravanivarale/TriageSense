# TriageSense — Deployment Guide

## Architecture Overview
```
User Browser
    │
    ├── HTTPS → Vercel (React frontend)
    │               │
    │               └── WSS / HTTPS → Railway (FastAPI backend)
    │                                       │
    │                                       ├── PostgreSQL (Railway addon)
    │                                       ├── Redis (Railway addon)
    │                                       └── HTTPS → Featherless.ai API
    │
    └── (optional) → n8n Cloud webhooks → Railway backend
```

## Step-by-Step Production Deployment

### Step 1: Push code to GitHub
```bash
git init
git add .
git commit -m "feat: initial TriageSense build"
git remote add origin https://github.com/yourusername/triagesense.git
git push -u origin main
```

### Step 2: Deploy Backend to Railway
1. railway.app → New Project → Deploy from GitHub → select repo
2. Root directory: `/backend`
3. Railway detects Dockerfile → auto deploys
4. Add PostgreSQL + Redis plugins
5. Set all env vars (see MANUAL_SETUP.md)
6. Wait for health check: `GET https://your-app.up.railway.app/health` → `{"status":"ok"}`
7. Note your Railway URL: `https://your-app.up.railway.app`

### Step 3: Deploy Frontend to Vercel
1. vercel.com → New Project → import GitHub repo
2. Root directory: `frontend`
3. Set env vars:
   - `VITE_API_URL` = `https://your-app.up.railway.app`
   - `VITE_WS_URL` = `wss://your-app.up.railway.app/ws`
4. Deploy
5. Note your Vercel URL: `https://triagesense.vercel.app`

### Step 4: Update CORS on Backend
In Railway env vars, set:
```
FRONTEND_URL=https://triagesense.vercel.app
```
Redeploy backend (Railway auto-redeploys on env var change).

### Step 5: Seed Demo Data
```bash
pip install httpx
BACKEND_URL=https://your-app.up.railway.app python scripts/seed_demo_tickets.py
```

### Step 6: End-to-End Test
1. Open https://triagesense.vercel.app
2. Verify stats bar shows tickets
3. Submit a ticket via the form
4. Watch it appear in the queue with AI analysis within 5 seconds
5. Click ticket → verify drawer shows AI analysis, urgency signals, draft response

## Environment Variables Reference
| Variable | Service | Description |
|----------|---------|-------------|
| `FEATHERLESS_API_KEY` | Backend | Your Featherless.ai API key |
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `REDIS_URL` | Backend | Redis connection string |
| `FRONTEND_URL` | Backend | Vercel URL (for CORS) |
| `VITE_API_URL` | Frontend | Backend HTTP URL |
| `VITE_WS_URL` | Frontend | Backend WebSocket URL (wss://) |

## Monitoring
- Railway → your service → Logs (real-time log stream)
- Vercel → Deployments → Functions (serverless logs)
- Test backend health: `curl https://your-app.up.railway.app/health`
