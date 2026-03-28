# TriageSense — Manual Setup Guide

## Things That CANNOT Be Automated (Do These By Hand)

### 1. Featherless.ai API Key
1. Go to https://featherless.ai
2. Create account / log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy it — you will set it as `FEATHERLESS_API_KEY` in your backend env vars
6. Verify you have access to `Qwen/Qwen3-32B` model

### 2. Railway Account + Project Setup
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select the `triagesense` repo, set root directory to `/backend`
5. Add these plugins to your Railway project:
   - Click "+" → "Database" → "PostgreSQL" → Deploy
   - Click "+" → "Database" → "Redis" → Deploy
6. Copy the connection strings from each plugin's "Connect" tab
7. Set environment variables in Railway backend service:
   ```
   FEATHERLESS_API_KEY=<your key>
   DATABASE_URL=<from PostgreSQL plugin>
   REDIS_URL=<from Redis plugin>
   FRONTEND_URL=https://triagesense.vercel.app
   ```
8. Railway will auto-detect the Dockerfile and deploy

### 3. Vercel Deployment
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "New Project" → import `triagesense` repo
4. Set Root Directory to `frontend`
5. Framework: Vite (auto-detected)
6. Add environment variables:
   ```
   VITE_API_URL=https://your-backend.up.railway.app
   VITE_WS_URL=wss://your-backend.up.railway.app/ws
   ```
7. Deploy

### 4. n8n Cloud Setup (Optional)
1. Go to https://n8n.io and start free trial
2. Import `n8n/triagesense-workflow.json` via the Import menu
3. Add credential: HTTP Header Auth
   - Name: Featherless API
   - Header: Authorization
   - Value: Bearer YOUR_API_KEY
4. Activate the workflow

### 5. Seed Demo Data
After deployment, run locally pointing at the live backend:
```bash
cd scripts
pip install httpx
BACKEND_URL=https://your-backend.up.railway.app python seed_demo_tickets.py
```

### 6. Database Initialization
The database tables are auto-created on first startup via `init_db()` in lifespan.

## Local Development Setup
```bash
# Clone repo
git clone https://github.com/yourusername/triagesense
cd triagesense

# Start local dependencies
docker-compose up -d  # starts postgres + redis

# Backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
copy .env.example .env  # Then fill in your values
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
copy .env.example .env.local  # Point to localhost:8000
npm run dev
```
Open http://localhost:5173

## Common Issues

| Issue | Fix |
|-------|-----|
| `asyncpg` connection error | Check DATABASE_URL uses `postgresql://` not `postgresql+asyncpg://` — the code handles the conversion |
| CORS error in browser | Verify FRONTEND_URL is set correctly in Railway env |
| WebSocket not connecting | Ensure VITE_WS_URL uses `wss://` (not `ws://`) for deployed backend |
| Featherless 429 error | You're hitting rate limits — add `await asyncio.sleep(1)` between bulk submissions |
| Railway deployment fails | Check Dockerfile is in `/backend` directory and requirements.txt is complete |
