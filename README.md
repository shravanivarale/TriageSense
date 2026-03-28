# TriageSense ⚡

> **AI-powered support ticket intelligence platform.** 5 parallel AI agents analyze every ticket in under 3 seconds.

![Built for](https://img.shields.io/badge/Built%20for-Product%20Space%20AI%20Hackathon-00FFB3?style=for-the-badge)
![Stack](https://img.shields.io/badge/Stack-React%20%2B%20FastAPI%20%2B%20Qwen3--32B-64D2FF?style=for-the-badge)

## The Problem

Support teams receive 400+ tickets daily. **"Our checkout is down, we're losing $50k/hour"** gets buried under **"can you add dark mode?"**

Manual triage causes:
- 🔴 Delayed resolution of critical issues
- 😓 Agent decision fatigue and burnout
- 📉 No visibility into customer sentiment trends
- 🌩️ No proactive detection of coordinated issue spikes

## The Solution

TriageSense runs **5 AI agents in parallel** on every ticket:

| Agent | What it does | Output |
|-------|-------------|--------|
| 🎯 **Urgency** | Scores 0-100, extracts verbatim signals | `"$50k/hour" → CRITICAL (97)` |
| 😤 **Sentiment** | Detects emotion + churn risk | `frustrated, 87% escalation risk` |
| 🔍 **Cluster** | Groups similar tickets | `"Login failure — OAuth"` |
| ✍️ **Response** | Drafts reply matched to urgency | `action-first for CRITICAL` |
| 📊 **Composite** | Weighted priority score | `urgency×0.40 + sentiment×0.25 + risk×0.20 + tier×0.15` |

### 🌩️ Cluster Storm Detection
When 10+ tickets share a cluster within 30 minutes, the system flags it as a **Cluster Storm** — alerting your team to a coordinated issue *before* it becomes a crisis.

## Tech Stack

**Frontend:** React 18 · Vite · TypeScript · Tailwind CSS v4 · Recharts · Zustand · WebSocket

**Backend:** Python FastAPI · PostgreSQL · Redis · asyncio.gather · WebSockets

**AI:** Featherless.ai API · Qwen/Qwen3-32B · 4 parallel LLM calls per ticket

**Deployment:** Vercel (frontend) · Railway (backend + DB + Redis)

**Orchestration:** n8n workflow automation

## Quick Start

```bash
# Start local dependencies
docker-compose up -d

# Backend
cd backend
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Fill in your Featherless API key
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

## Demo

1. Click a **demo preset** (e.g., "🚨 CRITICAL — Production Down")
2. Hit **"Analyze with AI Agents"**
3. Watch the ticket appear in the Priority Queue with full AI analysis in ~3 seconds
4. Click the ticket to see urgency signals, sentiment analysis, and AI-drafted response

## Project Structure

```
triagesense/
├── backend/          # FastAPI + AI agents + PostgreSQL
├── frontend/         # React + Vite + Tailwind + Recharts
├── n8n/              # n8n workflow JSON
├── scripts/          # Seed + test scripts
├── docs/             # Full documentation
└── docker-compose.yml
```

## License

MIT

---

*Built with ❤️ and AI agents for the Product Space AI Hackathon*
