# TriageSense — Full Build Prompt for Antigravity AI
# Version: 1.0 | Hackathon: Product Space AI Hackathon
# DO NOT SKIP ANY SECTION. READ EVERY WORD BEFORE WRITING A SINGLE LINE OF CODE.

---

## MISSION BRIEF

You are building **TriageSense** — an AI-powered support ticket intelligence platform — for a 48-hour hackathon judged on:
- Problem understanding (15%)
- Prototype quality & UX (20%)
- AI Integration (25%)
- LinkedIn content + engagement (25%)
- Innovation & creativity (15%)

**You must win.** Every decision — architecture, UI color, animation timing, copy, file structure — must be made with winning in mind. Generic is disqualified. Build something that makes judges lean forward in their seats.

**Primary goal**: A live, deployed, real-time demo that solves the actual problem visibly and impressively in under 60 seconds of screen time.

---

## PROBLEM STATEMENT (internalize this deeply)

Support teams receive hundreds of tickets daily. Urgent issues ("production is down, we're losing $50k/hour") get buried under low-priority noise ("can you add dark mode?"). Manual triage causes:
- Delayed resolution of critical issues
- Agent decision fatigue and burnout
- No visibility into customer sentiment trends
- No proactive detection of coordinated issue spikes

**TriageSense solves this** by running 5 AI agents on every ticket in parallel, producing a composite intelligence profile in under 3 seconds, and surfacing it on a live real-time dashboard.

---

## TECH STACK (NON-NEGOTIABLE)

### Backend
- **Python 3.11+** with **FastAPI**
- **PostgreSQL** (via SQLAlchemy async + asyncpg)
- **Redis** (for real-time pub/sub and queue state)
- **WebSockets** (FastAPI native — `fastapi.WebSocket`)
- **httpx** (async HTTP client for Featherless.ai API calls)
- **asyncio.gather** for parallel agent execution

### AI / Orchestration
- **n8n** (self-hosted via Docker OR n8n Cloud) for workflow orchestration
- **Featherless.ai API** (OpenAI-compatible endpoint) using model: `Qwen/Qwen3-32B`
  - Base URL: `https://api.featherless.ai/v1`
  - Use OpenAI SDK pointed at this base URL
- All 5 agents run as PARALLEL async calls — never sequential

### Frontend
- **React 18** with **Vite** (TypeScript)
- **Tailwind CSS** with custom design tokens (no default Tailwind palette — override everything)
- **Framer Motion** for animations
- **Recharts** for analytics charts
- **React Query (TanStack Query)** for data fetching
- **Zustand** for global state
- Native **WebSocket** API for real-time updates

### Deployment
- Frontend: **Vercel** (connect GitHub repo, auto-deploy)
- Backend: **Railway.app** (Python service + PostgreSQL addon + Redis addon)
- n8n: **n8n Cloud** free trial OR Docker on Railway

---

## FILE STRUCTURE — CREATE ALL OF THESE

```
triagesense/
├── backend/
│   ├── main.py                    # FastAPI app, routes, WebSocket
│   ├── agents.py                  # All 5 AI agents (async parallel)
│   ├── models.py                  # SQLAlchemy models
│   ├── database.py                # DB connection, session
│   ├── redis_client.py            # Redis pub/sub setup
│   ├── scorer.py                  # Composite priority score engine
│   ├── schemas.py                 # Pydantic request/response schemas
│   ├── requirements.txt           # All Python deps with pinned versions
│   ├── Dockerfile                 # For Railway deployment
│   └── .env.example               # All env vars with descriptions
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css              # Global styles, design tokens
│   │   ├── components/
│   │   │   ├── Dashboard.tsx      # Main live queue view
│   │   │   ├── TicketCard.tsx     # Individual ticket card
│   │   │   ├── TicketModal.tsx    # Deep-dive drawer
│   │   │   ├── SentimentHeatmap.tsx  # Real-time sentiment timeline
│   │   │   ├── ClusterStormBanner.tsx # Cluster storm alert
│   │   │   ├── StatsBar.tsx       # Top stats strip
│   │   │   ├── AnalyticsPage.tsx  # Charts and trends
│   │   │   ├── SubmitTicket.tsx   # Input form + CSV upload
│   │   │   ├── ConfidencePanel.tsx  # AI signal transparency panel
│   │   │   └── LoadingSkeleton.tsx
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts    # WS connection + reconnect logic
│   │   │   ├── useTickets.ts      # React Query ticket fetching
│   │   │   └── useClusterStorm.ts # Cluster storm detection
│   │   ├── store/
│   │   │   └── ticketStore.ts     # Zustand global store
│   │   ├── types/
│   │   │   └── index.ts           # All TypeScript interfaces
│   │   └── lib/
│   │       ├── api.ts             # Axios instance + all API calls
│   │       └── utils.ts           # formatters, score colors, etc.
│   ├── public/
│   │   └── demo-tickets.json      # Sample tickets for demo
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── n8n/
│   └── triagesense-workflow.json  # Exportable n8n workflow
│
├── docs/
│   ├── PROJECT_DOCUMENTATION.md   # Full project docs (auto-generated)
│   ├── PROGRESS.md                # Build progress tracker (update every session)
│   ├── MANUAL_SETUP.md            # Everything that must be done by hand
│   └── DEPLOYMENT_GUIDE.md        # Step-by-step deploy instructions
│
├── scripts/
│   ├── seed_demo_tickets.py       # Seeds DB with demo tickets for live demo
│   └── test_agents.py             # Quick smoke test for all 5 agents
│
├── docker-compose.yml             # Local dev: postgres + redis + backend
└── README.md                      # GitHub README (also the LinkedIn asset)
```

---

## BACKEND — BUILD THIS EXACTLY

### `backend/database.py`
```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
import os

DATABASE_URL = os.environ["DATABASE_URL"].replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(DATABASE_URL, echo=False, pool_size=10, max_overflow=20)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

### `backend/models.py`
```python
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, JSON, Enum as SQLEnum
from sqlalchemy.sql import func
from database import Base
import uuid

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    raw_text = Column(Text, nullable=False)
    subject = Column(String(500))
    customer_name = Column(String(200))
    customer_email = Column(String(200))
    customer_tier = Column(String(50), default="free")  # free | pro | enterprise
    
    # AI outputs
    urgency_score = Column(Integer)       # 0-100
    urgency_label = Column(String(20))    # CRITICAL | HIGH | MEDIUM | LOW
    urgency_signals = Column(JSON)        # list of verbatim phrases
    urgency_confidence = Column(Float)    # 0.0-1.0
    
    sentiment_score = Column(Integer)     # -100 to 100
    primary_emotion = Column(String(50))  # frustrated | angry | calm | etc.
    escalation_risk = Column(Integer)     # 0-100
    sentiment_signals = Column(JSON)
    sentiment_confidence = Column(Float)
    
    category = Column(String(100))
    subcategory = Column(String(200))
    cluster_id = Column(String(100))
    cluster_label = Column(String(200))
    similar_signals = Column(JSON)
    
    draft_subject = Column(String(500))
    draft_body = Column(Text)
    response_tone = Column(String(50))
    suggested_next_action = Column(String(50))
    
    composite_score = Column(Integer)     # final 0-100 priority
    is_escalated = Column(Integer, default=0)
    assigned_agent = Column(String(200))
    
    status = Column(String(50), default="pending")  # pending | processing | resolved | escalated
    processing_time_ms = Column(Integer)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

### `backend/schemas.py`
```python
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime

class TicketSubmit(BaseModel):
    raw_text: str
    subject: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_tier: str = "free"  # free | pro | enterprise

class TicketResponse(BaseModel):
    id: str
    raw_text: str
    subject: Optional[str]
    customer_name: Optional[str]
    customer_tier: str
    urgency_score: Optional[int]
    urgency_label: Optional[str]
    urgency_signals: Optional[List[str]]
    urgency_confidence: Optional[float]
    sentiment_score: Optional[int]
    primary_emotion: Optional[str]
    escalation_risk: Optional[int]
    sentiment_signals: Optional[List[str]]
    category: Optional[str]
    cluster_label: Optional[str]
    draft_subject: Optional[str]
    draft_body: Optional[str]
    response_tone: Optional[str]
    suggested_next_action: Optional[str]
    composite_score: Optional[int]
    is_escalated: int
    status: str
    processing_time_ms: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

class BulkSubmit(BaseModel):
    tickets: List[TicketSubmit]

class WebSocketMessage(BaseModel):
    type: str  # "ticket_processed" | "cluster_storm" | "escalation" | "stats_update"
    payload: Any
```

### `backend/agents.py`
```python
import asyncio
import httpx
import json
import os
import time
from typing import Any

FEATHERLESS_API_KEY = os.environ["FEATHERLESS_API_KEY"]
FEATHERLESS_BASE_URL = "https://api.featherless.ai/v1"
MODEL = "Qwen/Qwen3-32B"

async def call_featherless(system_prompt: str, user_content: str, max_tokens: int = 800) -> dict:
    """Single async call to Featherless.ai — returns parsed JSON dict."""
    headers = {
        "Authorization": f"Bearer {FEATHERLESS_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": MODEL,
        "max_tokens": max_tokens,
        "temperature": 0.1,  # Low temp for consistent structured output
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ]
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{FEATHERLESS_BASE_URL}/chat/completions",
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"].strip()
        # Strip markdown code blocks if present
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        return json.loads(content.strip())

# ─────────────────────────────────────────────
# AGENT 1: URGENCY SCORER
# ─────────────────────────────────────────────
URGENCY_SYSTEM = """You are a world-class support triage expert. Analyze the ticket and output ONLY valid JSON — no markdown, no explanation, no preamble.

Scoring rules:
- 90-100 = CRITICAL: production down, data loss, security breach, revenue impact, customer threatening legal/chargeback
- 70-89 = HIGH: major feature broken, multiple users affected, repeated billing issue, SLA at risk
- 40-69 = MEDIUM: single user issue, feature not working but workaround exists, delayed response okay
- 0-39 = LOW: question, feature request, cosmetic issue, general feedback

Output this exact JSON:
{
  "urgency_score": <integer 0-100>,
  "urgency_label": "<CRITICAL|HIGH|MEDIUM|LOW>",
  "urgency_signals": ["<verbatim phrase from ticket that signals urgency>"],
  "confidence": <float 0.0-1.0>,
  "reasoning": "<one sentence>"
}"""

async def run_urgency_agent(ticket_text: str) -> dict:
    try:
        return await call_featherless(URGENCY_SYSTEM, f"TICKET:\n{ticket_text}")
    except Exception as e:
        return {"urgency_score": 50, "urgency_label": "MEDIUM", "urgency_signals": [], "confidence": 0.0, "reasoning": f"Agent error: {str(e)}"}

# ─────────────────────────────────────────────
# AGENT 2: SENTIMENT ANALYZER
# ─────────────────────────────────────────────
SENTIMENT_SYSTEM = """You are an expert at detecting customer emotional state from support tickets. Output ONLY valid JSON.

Sentiment score: -100 (furious/threatening) to +100 (happy/grateful). 0 = neutral.
Escalation risk = probability customer churns or escalates to management if not addressed soon.

Primary emotions: frustrated | angry | panicked | confused | disappointed | neutral | hopeful | grateful

Output this exact JSON:
{
  "sentiment_score": <integer -100 to 100>,
  "primary_emotion": "<emotion>",
  "escalation_risk": <integer 0-100>,
  "verbatim_signals": ["<exact quote from ticket showing emotion>"],
  "confidence": <float 0.0-1.0>,
  "churn_indicators": ["<phrases suggesting customer may leave>"]
}"""

async def run_sentiment_agent(ticket_text: str) -> dict:
    try:
        return await call_featherless(SENTIMENT_SYSTEM, f"TICKET:\n{ticket_text}")
    except Exception as e:
        return {"sentiment_score": 0, "primary_emotion": "neutral", "escalation_risk": 50, "verbatim_signals": [], "confidence": 0.0, "churn_indicators": []}

# ─────────────────────────────────────────────
# AGENT 3: CATEGORY + CLUSTER TAGGER
# ─────────────────────────────────────────────
CLUSTER_SYSTEM = """You are a support ticket classification expert. Analyze and classify the ticket. Output ONLY valid JSON.

Categories: billing | authentication | performance | data_loss | integration | ui_bug | feature_request | security | account | other

The cluster_label should be a short, human-readable description of the issue pattern (e.g. "Login failure — OAuth", "Stripe double charge", "Dashboard load timeout").

Output this exact JSON:
{
  "category": "<category>",
  "subcategory": "<more specific label>",
  "cluster_label": "<human-readable issue cluster name>",
  "cluster_keywords": ["<key term>", "<key term>"],
  "confidence": <float 0.0-1.0>,
  "is_recurring_pattern": <true|false>
}"""

async def run_cluster_agent(ticket_text: str) -> dict:
    try:
        return await call_featherless(CLUSTER_SYSTEM, f"TICKET:\n{ticket_text}")
    except Exception as e:
        return {"category": "other", "subcategory": "unknown", "cluster_label": "Uncategorized", "cluster_keywords": [], "confidence": 0.0, "is_recurring_pattern": False}

# ─────────────────────────────────────────────
# AGENT 4: RESPONSE DRAFTER
# ─────────────────────────────────────────────
RESPONSE_SYSTEM = """You are a senior support engineer known for empathetic, precise, and effective responses. Draft a response to this support ticket. Output ONLY valid JSON.

Rules:
- Match urgency: CRITICAL tickets get immediate, action-first replies. LOW tickets can be warm and informational.
- Use customer name if provided in the ticket.
- Never make promises you can't keep. Use "we are investigating" not "this will be fixed in 1 hour."
- Keep body under 150 words. Professional but human.
- suggested_next_action: "escalate_to_engineering" | "issue_refund" | "reset_account" | "investigate" | "follow_up_in_24h" | "close_resolved"

Output this exact JSON:
{
  "draft_subject": "Re: <subject line>",
  "draft_body": "<full email body>",
  "response_tone": "<empathetic|urgent|informative|apologetic|appreciative>",
  "suggested_next_action": "<action>",
  "confidence": <float 0.0-1.0>
}"""

async def run_response_agent(ticket_text: str) -> dict:
    try:
        return await call_featherless(RESPONSE_SYSTEM, f"TICKET:\n{ticket_text}", max_tokens=600)
    except Exception as e:
        return {"draft_subject": "Re: Your support request", "draft_body": "Thank you for contacting us. We are reviewing your request and will respond shortly.", "response_tone": "empathetic", "suggested_next_action": "investigate", "confidence": 0.0}

# ─────────────────────────────────────────────
# MASTER: RUN ALL 5 AGENTS IN PARALLEL
# ─────────────────────────────────────────────
async def analyze_ticket_parallel(ticket_text: str, customer_tier: str = "free") -> dict:
    """Run all 4 agents simultaneously. Return merged result dict."""
    start = time.time()
    
    urgency_task = run_urgency_agent(ticket_text)
    sentiment_task = run_sentiment_agent(ticket_text)
    cluster_task = run_cluster_agent(ticket_text)
    response_task = run_response_agent(ticket_text)
    
    urgency, sentiment, cluster, response = await asyncio.gather(
        urgency_task, sentiment_task, cluster_task, response_task,
        return_exceptions=True
    )
    
    # Handle any agent that returned an exception
    def safe(result, fallback):
        return fallback if isinstance(result, Exception) else result
    
    urgency = safe(urgency, {"urgency_score": 50, "urgency_label": "MEDIUM", "urgency_signals": [], "confidence": 0.0, "reasoning": "Agent failed"})
    sentiment = safe(sentiment, {"sentiment_score": 0, "primary_emotion": "neutral", "escalation_risk": 50, "verbatim_signals": [], "confidence": 0.0, "churn_indicators": []})
    cluster = safe(cluster, {"category": "other", "subcategory": "unknown", "cluster_label": "Uncategorized", "cluster_keywords": [], "confidence": 0.0, "is_recurring_pattern": False})
    response = safe(response, {"draft_subject": "Re: Your support request", "draft_body": "We are reviewing your request.", "response_tone": "empathetic", "suggested_next_action": "investigate", "confidence": 0.0})
    
    elapsed_ms = int((time.time() - start) * 1000)
    
    # Agent 5: Composite Score (pure Python — instant)
    tier_multiplier = {"enterprise": 1.25, "pro": 1.1, "free": 1.0}.get(customer_tier, 1.0)
    urgency_score = urgency.get("urgency_score", 50)
    sentiment_impact = abs(sentiment.get("sentiment_score", 0))  # Extreme sentiment = higher priority
    escalation_risk = sentiment.get("escalation_risk", 50)
    
    composite = (
        urgency_score * 0.40 +
        sentiment_impact * 0.25 +
        escalation_risk * 0.20 +
        (urgency_score * (tier_multiplier - 1.0) * 0.15)
    )
    composite = min(100, max(0, round(composite)))
    
    # Auto-escalate if CRITICAL or composite > 85
    should_escalate = urgency.get("urgency_label") == "CRITICAL" or composite > 85
    
    return {
        # Urgency
        "urgency_score": urgency_score,
        "urgency_label": urgency.get("urgency_label", "MEDIUM"),
        "urgency_signals": urgency.get("urgency_signals", []),
        "urgency_confidence": urgency.get("confidence", 0.0),
        # Sentiment
        "sentiment_score": sentiment.get("sentiment_score", 0),
        "primary_emotion": sentiment.get("primary_emotion", "neutral"),
        "escalation_risk": escalation_risk,
        "sentiment_signals": sentiment.get("verbatim_signals", []),
        "sentiment_confidence": sentiment.get("confidence", 0.0),
        "churn_indicators": sentiment.get("churn_indicators", []),
        # Cluster
        "category": cluster.get("category", "other"),
        "subcategory": cluster.get("subcategory", ""),
        "cluster_label": cluster.get("cluster_label", "Uncategorized"),
        "cluster_keywords": cluster.get("cluster_keywords", []),
        "is_recurring_pattern": cluster.get("is_recurring_pattern", False),
        # Response
        "draft_subject": response.get("draft_subject", ""),
        "draft_body": response.get("draft_body", ""),
        "response_tone": response.get("response_tone", "empathetic"),
        "suggested_next_action": response.get("suggested_next_action", "investigate"),
        # Composite
        "composite_score": composite,
        "is_escalated": int(should_escalate),
        "processing_time_ms": elapsed_ms,
    }
```

### `backend/main.py`
```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from contextlib import asynccontextmanager
import asyncio
import json
import time
from datetime import datetime, timedelta

from database import get_db, init_db
from models import Ticket
from schemas import TicketSubmit, TicketResponse, BulkSubmit
from agents import analyze_ticket_parallel
from redis_client import get_redis, publish_event
import uuid

# ─── WebSocket connection manager ───
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead.append(connection)
        for d in dead:
            self.active_connections.remove(d)

manager = ConnectionManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="TriageSense API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── WebSocket endpoint ───
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep alive ping
            await asyncio.sleep(30)
            await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# ─── Submit single ticket ───
@app.post("/tickets", response_model=TicketResponse)
async def submit_ticket(
    ticket_in: TicketSubmit,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    # Create ticket record with pending status
    ticket = Ticket(
        id=str(uuid.uuid4()),
        raw_text=ticket_in.raw_text,
        subject=ticket_in.subject,
        customer_name=ticket_in.customer_name,
        customer_email=ticket_in.customer_email,
        customer_tier=ticket_in.customer_tier,
        status="processing"
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)

    # Broadcast "processing started" immediately
    await manager.broadcast({
        "type": "ticket_processing",
        "payload": {"id": ticket.id, "status": "processing", "created_at": ticket.created_at.isoformat()}
    })

    # Run AI analysis in background
    background_tasks.add_task(process_ticket_background, ticket.id, ticket_in.raw_text, ticket_in.customer_tier)
    
    return ticket

async def process_ticket_background(ticket_id: str, raw_text: str, customer_tier: str):
    """Run all agents, update DB, broadcast result."""
    from database import AsyncSessionLocal
    
    async with AsyncSessionLocal() as db:
        result = await analyze_ticket_parallel(raw_text, customer_tier)
        
        # Update ticket with AI results
        ticket = await db.get(Ticket, ticket_id)
        if not ticket:
            return
        
        for key, value in result.items():
            if hasattr(ticket, key):
                setattr(ticket, key, value)
        ticket.status = "escalated" if result.get("is_escalated") else "pending"
        
        await db.commit()
        await db.refresh(ticket)
        
        # Convert to dict for broadcast
        ticket_dict = {
            "id": ticket.id,
            "raw_text": ticket.raw_text,
            "subject": ticket.subject,
            "customer_name": ticket.customer_name,
            "customer_tier": ticket.customer_tier,
            "urgency_score": ticket.urgency_score,
            "urgency_label": ticket.urgency_label,
            "urgency_signals": ticket.urgency_signals,
            "urgency_confidence": ticket.urgency_confidence,
            "sentiment_score": ticket.sentiment_score,
            "primary_emotion": ticket.primary_emotion,
            "escalation_risk": ticket.escalation_risk,
            "sentiment_signals": ticket.sentiment_signals,
            "category": ticket.category,
            "cluster_label": ticket.cluster_label,
            "draft_subject": ticket.draft_subject,
            "draft_body": ticket.draft_body,
            "response_tone": ticket.response_tone,
            "suggested_next_action": ticket.suggested_next_action,
            "composite_score": ticket.composite_score,
            "is_escalated": ticket.is_escalated,
            "status": ticket.status,
            "processing_time_ms": ticket.processing_time_ms,
            "created_at": ticket.created_at.isoformat(),
        }
        
        # Broadcast processed ticket to all connected dashboards
        await manager.broadcast({
            "type": "ticket_processed",
            "payload": ticket_dict
        })
        
        # Check for cluster storm (10+ tickets with same cluster_label in 30 min)
        thirty_min_ago = datetime.utcnow() - timedelta(minutes=30)
        result_count = await db.execute(
            select(func.count(Ticket.id)).where(
                Ticket.cluster_label == ticket.cluster_label,
                Ticket.created_at >= thirty_min_ago
            )
        )
        cluster_count = result_count.scalar()
        
        if cluster_count >= 10:
            await manager.broadcast({
                "type": "cluster_storm",
                "payload": {
                    "cluster_label": ticket.cluster_label,
                    "count": cluster_count,
                    "category": ticket.category
                }
            })

# ─── Bulk submit ───
@app.post("/tickets/bulk")
async def bulk_submit(
    bulk: BulkSubmit,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    ticket_ids = []
    for t in bulk.tickets[:20]:  # Cap at 20 for demo
        ticket = Ticket(
            id=str(uuid.uuid4()),
            raw_text=t.raw_text,
            subject=t.subject,
            customer_name=t.customer_name,
            customer_email=t.customer_email,
            customer_tier=t.customer_tier,
            status="processing"
        )
        db.add(ticket)
        await db.commit()
        await db.refresh(ticket)
        background_tasks.add_task(process_ticket_background, ticket.id, t.raw_text, t.customer_tier)
        ticket_ids.append(ticket.id)
        await asyncio.sleep(0.3)  # Stagger slightly to avoid rate limits
    return {"submitted": len(ticket_ids), "ticket_ids": ticket_ids}

# ─── Get all tickets (paginated + sorted by composite score) ───
@app.get("/tickets")
async def get_tickets(
    limit: int = 50,
    offset: int = 0,
    status: str = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Ticket).order_by(desc(Ticket.composite_score), desc(Ticket.created_at))
    if status:
        query = query.where(Ticket.status == status)
    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    tickets = result.scalars().all()
    return tickets

# ─── Stats endpoint ───
@app.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    total = await db.execute(select(func.count(Ticket.id)))
    critical = await db.execute(select(func.count(Ticket.id)).where(Ticket.urgency_label == "CRITICAL"))
    escalated = await db.execute(select(func.count(Ticket.id)).where(Ticket.is_escalated == 1))
    avg_score = await db.execute(select(func.avg(Ticket.composite_score)))
    avg_sentiment = await db.execute(select(func.avg(Ticket.sentiment_score)))
    
    # Cluster distribution
    cluster_result = await db.execute(
        select(Ticket.cluster_label, func.count(Ticket.id).label("count"))
        .group_by(Ticket.cluster_label)
        .order_by(desc("count"))
        .limit(8)
    )
    clusters = [{"label": r[0], "count": r[1]} for r in cluster_result]
    
    return {
        "total_tickets": total.scalar() or 0,
        "critical_unresolved": critical.scalar() or 0,
        "escalated": escalated.scalar() or 0,
        "avg_composite_score": round(avg_score.scalar() or 0, 1),
        "avg_sentiment": round(avg_sentiment.scalar() or 0, 1),
        "clusters": clusters
    }

# ─── Sentiment timeline (for heatmap) ───
@app.get("/sentiment-timeline")
async def sentiment_timeline(db: AsyncSession = Depends(get_db)):
    """Return sentiment scores for last 2 hours, bucketed by 10-minute intervals."""
    two_hours_ago = datetime.utcnow() - timedelta(hours=2)
    result = await db.execute(
        select(Ticket.created_at, Ticket.sentiment_score, Ticket.cluster_label)
        .where(Ticket.created_at >= two_hours_ago)
        .order_by(Ticket.created_at)
    )
    rows = result.all()
    return [{"time": r[0].isoformat(), "sentiment": r[1], "cluster": r[2]} for r in rows]

# ─── Update ticket (resolve, assign) ───
@app.patch("/tickets/{ticket_id}")
async def update_ticket(
    ticket_id: str,
    update: dict,
    db: AsyncSession = Depends(get_db)
):
    ticket = await db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    allowed_fields = {"status", "assigned_agent", "is_escalated"}
    for field, value in update.items():
        if field in allowed_fields:
            setattr(ticket, field, value)
    
    await db.commit()
    await manager.broadcast({"type": "ticket_updated", "payload": {"id": ticket_id, **update}})
    return {"updated": True}

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}
```

### `backend/requirements.txt`
```
fastapi==0.115.0
uvicorn[standard]==0.30.6
sqlalchemy==2.0.35
asyncpg==0.29.0
httpx==0.27.2
pydantic==2.9.2
python-dotenv==1.0.1
redis==5.1.0
python-multipart==0.0.12
aiofiles==24.1.0
```

### `backend/Dockerfile`
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

### `backend/.env.example`
```
# Featherless AI
FEATHERLESS_API_KEY=your_featherless_api_key_here

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/triagesense

# Redis
REDIS_URL=redis://localhost:6379

# Frontend URL (for CORS)
FRONTEND_URL=https://triagesense.vercel.app
```

### `backend/redis_client.py`
```python
import redis.asyncio as redis
import os
import json

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
_redis_client = None

async def get_redis():
    global _redis_client
    if _redis_client is None:
        _redis_client = await redis.from_url(REDIS_URL, decode_responses=True)
    return _redis_client

async def publish_event(channel: str, data: dict):
    r = await get_redis()
    await r.publish(channel, json.dumps(data))
```

### `scripts/seed_demo_tickets.py`
```python
"""Run this to pre-populate the DB with demo tickets for the live demo."""
import asyncio
import httpx

BACKEND_URL = "http://localhost:8000"

DEMO_TICKETS = [
    {
        "raw_text": "URGENT: Our entire checkout pipeline has been down for 3 hours. We are an enterprise customer losing approximately $50,000 per hour. Our CTO has been notified. If this is not resolved within 30 minutes we are initiating a chargeback and moving to a competitor. This is completely unacceptable.",
        "subject": "PRODUCTION DOWN - Revenue Loss - Immediate Action Required",
        "customer_name": "Sarah Chen",
        "customer_email": "sarah.chen@megacorp.com",
        "customer_tier": "enterprise"
    },
    {
        "raw_text": "Hi there! Love your product so far. Just wondering if there's any chance you could add a dark mode option? It would really help with late-night work sessions. No rush at all, just a suggestion!",
        "subject": "Dark mode feature request",
        "customer_name": "Jake Miller",
        "customer_email": "jake@personal.com",
        "customer_tier": "free"
    },
    {
        "raw_text": "I have been charged twice for my Pro subscription this month — $99 charged on the 1st AND the 15th. I checked my bank statement and both charges are confirmed. I've emailed billing 3 times over the past week with no response. I am extremely frustrated and need this refunded immediately.",
        "subject": "Double charge - no response from billing",
        "customer_name": "Maria Santos",
        "customer_email": "m.santos@startup.io",
        "customer_tier": "pro"
    },
    {
        "raw_text": "Can't log into my account. Getting 'invalid credentials' even though I reset my password twice. This has been happening for 2 days and I have a client presentation that depends on accessing my data.",
        "subject": "Login not working - urgent presentation today",
        "customer_name": "David Park",
        "customer_email": "david@consultfirm.com",
        "customer_tier": "pro"
    },
    {
        "raw_text": "Login broken again", "subject": "Can't login", "customer_name": "User 1", "customer_email": "u1@test.com", "customer_tier": "free"
    },
    {
        "raw_text": "Password reset email never arrives. Tried 5 times.", "subject": "No reset email", "customer_name": "User 2", "customer_email": "u2@test.com", "customer_tier": "free"
    },
    {
        "raw_text": "Getting invalid credentials on login. Already cleared cache.", "subject": "Login error", "customer_name": "User 3", "customer_email": "u3@test.com", "customer_tier": "free"
    },
    {
        "raw_text": "Can't sign in. 'Account not found' error.", "subject": "Sign in broken", "customer_name": "User 4", "customer_email": "u4@test.com", "customer_tier": "pro"
    },
    {
        "raw_text": "Authentication is broken for all users on our team", "subject": "Team auth broken", "customer_name": "User 5", "customer_email": "u5@enterprise.com", "customer_tier": "enterprise"
    },
    {
        "raw_text": "Dashboard loading takes 45+ seconds every time I open it. The rest of the app is fine. This started yesterday after your update.",
        "subject": "Dashboard extremely slow",
        "customer_name": "Priya Patel",
        "customer_email": "priya@techco.in",
        "customer_tier": "pro"
    },
    {
        "raw_text": "How do I export my data to CSV? I've been looking through the settings and can't find it. Thanks!",
        "subject": "How to export data?",
        "customer_name": "Tom Wilson",
        "customer_email": "tom@smallbiz.com",
        "customer_tier": "free"
    },
    {
        "raw_text": "SECURITY ALERT: I just noticed someone logged into my account from an IP in Russia. I have never been to Russia. I immediately changed my password but I'm extremely worried. What data was accessed? Do I need to worry about my payment information?",
        "subject": "Unauthorized account access - security breach",
        "customer_name": "Alex Kumar",
        "customer_email": "alex.kumar@fintech.com",
        "customer_tier": "enterprise"
    },
]

async def seed():
    async with httpx.AsyncClient(timeout=60.0) as client:
        print(f"Seeding {len(DEMO_TICKETS)} demo tickets...")
        for i, ticket in enumerate(DEMO_TICKETS):
            response = await client.post(f"{BACKEND_URL}/tickets", json=ticket)
            print(f"[{i+1}/{len(DEMO_TICKETS)}] Submitted: {ticket['subject'][:50]}... → {response.status_code}")
            await asyncio.sleep(2)  # Stagger to not overwhelm
        print("Done! Tickets are being processed by AI agents.")

asyncio.run(seed())
```

---

## FRONTEND — BUILD THIS EXACTLY

### Design System — COMMIT TO THIS AESTHETIC

**Aesthetic direction**: "Mission Control" — dark, authoritative, data-dense but surgically organized. Like NASA's flight control mixed with a Bloomberg terminal. Every pixel earns its place. Not a generic SaaS dashboard.

**Color tokens** (paste into `tailwind.config.ts`):
```typescript
colors: {
  void: '#08090E',        // deepest background
  surface: '#0F1117',     // card backgrounds
  panel: '#161820',       // elevated panels
  border: '#1E2030',      // subtle borders
  borderHover: '#2A2D42', // hover borders
  
  // Brand
  signal: '#00FFB3',      // primary teal — the "live" color
  signalDim: '#00FFB320', // signal at 12% opacity
  
  // Urgency spectrum (critical → low)
  critical: '#FF2D55',
  high: '#FF9500',
  medium: '#FFD60A',
  low: '#34C759',
  
  // Sentiment
  angry: '#FF453A',
  frustrated: '#FF9F0A',
  neutral: '#8E8E93',
  hopeful: '#64D2FF',
  grateful: '#30D158',
  
  // Text
  textPrimary: '#F5F5F7',
  textSecondary: '#8E8E93',
  textTertiary: '#48484A',
}
```

**Typography**: Import from Google Fonts in `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
```
- Display/Numbers: `Space Mono` (monospace, terminal feel — perfect for scores and live counters)
- Body/Labels: `DM Sans` (clean, slightly geometric, readable at small sizes)

**Global CSS** (`src/index.css`):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* { box-sizing: border-box; }
body {
  background: #08090E;
  color: #F5F5F7;
  font-family: 'DM Sans', sans-serif;
  overflow-x: hidden;
}

/* Scanline overlay for the mission control aesthetic */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 255, 179, 0.008) 2px,
    rgba(0, 255, 179, 0.008) 4px
  );
  pointer-events: none;
  z-index: 9999;
}

/* Pulsing critical badge */
@keyframes criticalPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 45, 85, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(255, 45, 85, 0); }
}
.badge-critical { animation: criticalPulse 2s ease-in-out infinite; }

/* Live dot pulse */
@keyframes livePulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}
.live-dot { animation: livePulse 1.5s ease-in-out infinite; }

/* Score counter font */
.mono { font-family: 'Space Mono', monospace; }

/* Ticket card slide-in */
@keyframes slideInRight {
  from { transform: translateX(40px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.ticket-enter { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }

/* Cluster storm flash */
@keyframes stormFlash {
  0%, 100% { border-color: #FF9500; }
  50% { border-color: transparent; }
}
.storm-active { animation: stormFlash 0.8s ease-in-out infinite; }
```

### `src/types/index.ts`
```typescript
export interface Ticket {
  id: string;
  raw_text: string;
  subject?: string;
  customer_name?: string;
  customer_tier: 'free' | 'pro' | 'enterprise';
  urgency_score?: number;
  urgency_label?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  urgency_signals?: string[];
  urgency_confidence?: number;
  sentiment_score?: number;
  primary_emotion?: string;
  escalation_risk?: number;
  sentiment_signals?: string[];
  category?: string;
  cluster_label?: string;
  draft_subject?: string;
  draft_body?: string;
  response_tone?: string;
  suggested_next_action?: string;
  composite_score?: number;
  is_escalated: number;
  status: 'pending' | 'processing' | 'resolved' | 'escalated';
  processing_time_ms?: number;
  created_at: string;
}

export interface Stats {
  total_tickets: number;
  critical_unresolved: number;
  escalated: number;
  avg_composite_score: number;
  avg_sentiment: number;
  clusters: { label: string; count: number }[];
}

export type WSMessage =
  | { type: 'ticket_processing'; payload: { id: string; status: string; created_at: string } }
  | { type: 'ticket_processed'; payload: Ticket }
  | { type: 'ticket_updated'; payload: Partial<Ticket> & { id: string } }
  | { type: 'cluster_storm'; payload: { cluster_label: string; count: number; category: string } }
  | { type: 'ping' };
```

### `src/lib/utils.ts`
```typescript
import { Ticket } from '../types';

export const urgencyColor = (label?: string) => ({
  CRITICAL: '#FF2D55',
  HIGH: '#FF9500',
  MEDIUM: '#FFD60A',
  LOW: '#34C759',
}[label ?? ''] ?? '#8E8E93');

export const urgencyBg = (label?: string) => ({
  CRITICAL: 'rgba(255,45,85,0.12)',
  HIGH: 'rgba(255,149,0,0.12)',
  MEDIUM: 'rgba(255,214,10,0.12)',
  LOW: 'rgba(52,199,89,0.12)',
}[label ?? ''] ?? 'rgba(142,142,147,0.12)');

export const emotionEmoji = (emotion?: string) => ({
  angry: '😡',
  frustrated: '😤',
  panicked: '😱',
  confused: '😕',
  disappointed: '😞',
  neutral: '😐',
  hopeful: '🙂',
  grateful: '😊',
}[emotion ?? ''] ?? '😐');

export const emotionColor = (emotion?: string) => ({
  angry: '#FF453A',
  frustrated: '#FF9F0A',
  panicked: '#FF2D55',
  confused: '#64D2FF',
  disappointed: '#FF9F0A',
  neutral: '#8E8E93',
  hopeful: '#64D2FF',
  grateful: '#30D158',
}[emotion ?? ''] ?? '#8E8E93');

export const scoreGradient = (score?: number): string => {
  if (!score) return '#8E8E93';
  if (score >= 85) return '#FF2D55';
  if (score >= 65) return '#FF9500';
  if (score >= 40) return '#FFD60A';
  return '#34C759';
};

export const tierBadgeStyle = (tier: string) => ({
  enterprise: { bg: 'rgba(0,255,179,0.1)', color: '#00FFB3', label: 'ENTERPRISE' },
  pro: { bg: 'rgba(100,210,255,0.1)', color: '#64D2FF', label: 'PRO' },
  free: { bg: 'rgba(142,142,147,0.1)', color: '#8E8E93', label: 'FREE' },
}[tier] ?? { bg: 'rgba(142,142,147,0.1)', color: '#8E8E93', label: tier.toUpperCase() });

export const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
};
```

### `src/store/ticketStore.ts`
```typescript
import { create } from 'zustand';
import { Ticket, Stats, WSMessage } from '../types';

interface TicketStore {
  tickets: Ticket[];
  stats: Stats | null;
  selectedTicket: Ticket | null;
  clusterStorm: { cluster_label: string; count: number } | null;
  processingIds: Set<string>;
  
  addTicket: (ticket: Ticket) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  setTickets: (tickets: Ticket[]) => void;
  setStats: (stats: Stats) => void;
  selectTicket: (ticket: Ticket | null) => void;
  handleWSMessage: (msg: WSMessage) => void;
  dismissStorm: () => void;
}

export const useTicketStore = create<TicketStore>((set, get) => ({
  tickets: [],
  stats: null,
  selectedTicket: null,
  clusterStorm: null,
  processingIds: new Set(),
  
  addTicket: (ticket) => set((state) => ({
    tickets: [ticket, ...state.tickets].slice(0, 200), // Keep last 200
  })),
  
  updateTicket: (id, updates) => set((state) => ({
    tickets: state.tickets.map(t => t.id === id ? { ...t, ...updates } : t),
    selectedTicket: state.selectedTicket?.id === id
      ? { ...state.selectedTicket, ...updates }
      : state.selectedTicket,
  })),
  
  setTickets: (tickets) => set({ tickets }),
  setStats: (stats) => set({ stats }),
  selectTicket: (ticket) => set({ selectedTicket: ticket }),
  dismissStorm: () => set({ clusterStorm: null }),
  
  handleWSMessage: (msg) => {
    switch (msg.type) {
      case 'ticket_processing':
        set((state) => ({
          processingIds: new Set([...state.processingIds, msg.payload.id])
        }));
        break;
        
      case 'ticket_processed': {
        const { addTicket, updateTicket } = get();
        const exists = get().tickets.find(t => t.id === msg.payload.id);
        if (exists) {
          updateTicket(msg.payload.id, msg.payload);
        } else {
          addTicket(msg.payload);
        }
        set((state) => {
          const next = new Set(state.processingIds);
          next.delete(msg.payload.id);
          return { processingIds: next };
        });
        break;
      }
        
      case 'ticket_updated':
        get().updateTicket(msg.payload.id, msg.payload);
        break;
        
      case 'cluster_storm':
        set({ clusterStorm: msg.payload });
        break;
    }
  },
}));
```

### `src/hooks/useWebSocket.ts`
```typescript
import { useEffect, useRef } from 'react';
import { useTicketStore } from '../store/ticketStore';
import { WSMessage } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const handleWSMessage = useTicketStore(s => s.handleWSMessage);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>();

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        if (msg.type !== 'ping') handleWSMessage(msg);
      } catch {}
    };

    ws.onclose = () => {
      reconnectTimeout.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  };

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, []);

  return wsRef;
}
```

### `src/components/StatsBar.tsx`
```tsx
import { useEffect } from 'react';
import { useTicketStore } from '../store/ticketStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function StatsBar() {
  const { stats, setStats, processingIds, tickets } = useTicketStore();
  
  const { data } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get('/stats').then(r => r.data),
    refetchInterval: 10000,
  });
  
  useEffect(() => { if (data) setStats(data); }, [data]);
  
  const criticalCount = tickets.filter(t => t.urgency_label === 'CRITICAL').length;
  const processingCount = processingIds.size;
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '1px',
      background: '#1E2030',
      borderBottom: '1px solid #1E2030',
    }}>
      {[
        { label: 'TOTAL TICKETS', value: stats?.total_tickets ?? tickets.length, color: '#F5F5F7' },
        { label: 'CRITICAL', value: criticalCount, color: '#FF2D55' },
        { label: 'ESCALATED', value: stats?.escalated ?? 0, color: '#FF9500' },
        { label: 'PROCESSING', value: processingCount, color: '#00FFB3' },
        { label: 'AVG PRIORITY', value: stats ? `${Math.round(stats.avg_composite_score)}/100` : '—', color: '#64D2FF' },
      ].map(stat => (
        <div key={stat.label} style={{
          background: '#0F1117',
          padding: '12px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          <span style={{ fontSize: 10, letterSpacing: '0.1em', color: '#48484A', fontFamily: 'Space Mono, monospace' }}>
            {stat.label}
          </span>
          <span style={{ fontSize: 24, fontFamily: 'Space Mono, monospace', color: stat.color, fontWeight: 700 }}>
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
```

### `src/components/TicketCard.tsx`
```tsx
import { Ticket } from '../types';
import { urgencyColor, urgencyBg, emotionEmoji, emotionColor, scoreGradient, tierBadgeStyle, timeAgo } from '../lib/utils';
import { useTicketStore } from '../store/ticketStore';

interface Props {
  ticket: Ticket;
  index: number;
}

export function TicketCard({ ticket, index }: Props) {
  const selectTicket = useTicketStore(s => s.selectTicket);
  const tier = tierBadgeStyle(ticket.customer_tier);
  
  const isProcessing = ticket.status === 'processing';
  
  return (
    <div
      className="ticket-enter"
      style={{
        animationDelay: `${index * 40}ms`,
        background: ticket.urgency_label === 'CRITICAL' ? 'rgba(255,45,85,0.04)' : '#0F1117',
        border: `1px solid ${ticket.urgency_label === 'CRITICAL' ? 'rgba(255,45,85,0.3)' : '#1E2030'}`,
        borderLeft: `3px solid ${urgencyColor(ticket.urgency_label)}`,
        borderRadius: 8,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'background 0.2s, border-color 0.2s',
        marginBottom: 6,
      }}
      onClick={() => !isProcessing && selectTicket(ticket)}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.background = '#161820';
        (e.currentTarget as HTMLDivElement).style.borderColor = '#2A2D42';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.background =
          ticket.urgency_label === 'CRITICAL' ? 'rgba(255,45,85,0.04)' : '#0F1117';
        (e.currentTarget as HTMLDivElement).style.borderColor =
          ticket.urgency_label === 'CRITICAL' ? 'rgba(255,45,85,0.3)' : '#1E2030';
      }}
    >
      {isProcessing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%', background: '#00FFB3',
                animation: `livePulse 1s ease-in-out ${i * 0.2}s infinite`,
              }}/>
            ))}
          </div>
          <span style={{ fontSize: 13, color: '#00FFB3', fontFamily: 'Space Mono, monospace' }}>
            AI ANALYZING...
          </span>
          <span style={{ fontSize: 12, color: '#48484A', marginLeft: 'auto' }}>
            {ticket.customer_name ?? 'Unknown'}
          </span>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
            {/* Priority Score */}
            <div style={{
              minWidth: 44, height: 44, borderRadius: 6,
              background: `${scoreGradient(ticket.composite_score)}18`,
              border: `1px solid ${scoreGradient(ticket.composite_score)}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column',
            }}>
              <span style={{ fontSize: 16, fontFamily: 'Space Mono, monospace', fontWeight: 700, color: scoreGradient(ticket.composite_score), lineHeight: 1 }}>
                {ticket.composite_score ?? '—'}
              </span>
              <span style={{ fontSize: 8, color: '#48484A', letterSpacing: '0.05em' }}>SCORE</span>
            </div>
            
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Subject + Tier */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                {ticket.urgency_label && (
                  <span
                    className={ticket.urgency_label === 'CRITICAL' ? 'badge-critical' : ''}
                    style={{
                      fontSize: 9, fontFamily: 'Space Mono, monospace', fontWeight: 700,
                      padding: '2px 7px', borderRadius: 4,
                      background: urgencyBg(ticket.urgency_label),
                      color: urgencyColor(ticket.urgency_label),
                      letterSpacing: '0.08em',
                      border: `1px solid ${urgencyColor(ticket.urgency_label)}30`,
                    }}
                  >{ticket.urgency_label}</span>
                )}
                <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, background: tier.bg, color: tier.color, fontFamily: 'Space Mono, monospace', letterSpacing: '0.06em' }}>
                  {tier.label}
                </span>
                <span style={{ fontSize: 11, color: '#48484A', marginLeft: 'auto' }}>{timeAgo(ticket.created_at)}</span>
              </div>
              <p style={{ fontSize: 13, color: '#F5F5F7', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                {ticket.subject ?? ticket.raw_text.slice(0, 80)}
              </p>
            </div>
          </div>
          
          {/* Bottom row: emotion + cluster + action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 54 }}>
            {ticket.primary_emotion && (
              <span style={{ fontSize: 12, color: emotionColor(ticket.primary_emotion), display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 14 }}>{emotionEmoji(ticket.primary_emotion)}</span>
                {ticket.primary_emotion}
              </span>
            )}
            {ticket.cluster_label && (
              <span style={{ fontSize: 11, color: '#48484A', background: '#161820', padding: '2px 8px', borderRadius: 4, border: '1px solid #1E2030' }}>
                {ticket.cluster_label}
              </span>
            )}
            {ticket.suggested_next_action && (
              <span style={{ fontSize: 11, color: '#64D2FF', marginLeft: 'auto' }}>
                → {ticket.suggested_next_action.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
```

### `src/components/TicketModal.tsx`
```tsx
import { useTicketStore } from '../store/ticketStore';
import { urgencyColor, emotionEmoji, emotionColor, scoreGradient, tierBadgeStyle } from '../lib/utils';
import { useState } from 'react';
import { api } from '../lib/api';

export function TicketModal() {
  const { selectedTicket, selectTicket, updateTicket } = useTicketStore();
  const [draftBody, setDraftBody] = useState('');
  const [resolving, setResolving] = useState(false);
  const [escalating, setEscalating] = useState(false);
  
  if (!selectedTicket) return null;
  const t = selectedTicket;
  const tier = tierBadgeStyle(t.customer_tier);

  const handleOpen = () => {
    setDraftBody(t.draft_body ?? '');
  };

  const resolve = async () => {
    setResolving(true);
    await api.patch(`/tickets/${t.id}`, { status: 'resolved' });
    updateTicket(t.id, { status: 'resolved' });
    setResolving(false);
    selectTicket(null);
  };

  const escalate = async () => {
    setEscalating(true);
    await api.patch(`/tickets/${t.id}`, { status: 'escalated', is_escalated: 1 });
    updateTicket(t.id, { status: 'escalated', is_escalated: 1 });
    setEscalating(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(8,9,14,0.8)', backdropFilter: 'blur(4px)', zIndex: 100 }}
        onClick={() => selectTicket(null)}
      />
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '600px',
        background: '#0F1117', borderLeft: '1px solid #1E2030', zIndex: 101,
        overflow: 'auto', padding: 28,
        animation: 'slideInRight 0.3s cubic-bezier(0.16,1,0.3,1) both',
      }}
      onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 10,
            background: `${scoreGradient(t.composite_score)}18`,
            border: `1px solid ${scoreGradient(t.composite_score)}50`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
          }}>
            <span style={{ fontSize: 22, fontFamily: 'Space Mono, monospace', fontWeight: 700, color: scoreGradient(t.composite_score), lineHeight: 1 }}>
              {t.composite_score}
            </span>
            <span style={{ fontSize: 8, color: '#48484A' }}>PRIORITY</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: `${urgencyColor(t.urgency_label)}18`, color: urgencyColor(t.urgency_label), fontFamily: 'Space Mono, monospace' }}>
                {t.urgency_label}
              </span>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: tier.bg, color: tier.color, fontFamily: 'Space Mono, monospace' }}>
                {tier.label}
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 500, color: '#F5F5F7' }}>
              {t.subject ?? 'Support Ticket'}
            </h2>
            {t.customer_name && (
              <p style={{ margin: 0, fontSize: 12, color: '#8E8E93', marginTop: 2 }}>from {t.customer_name}</p>
            )}
          </div>
          <button
            onClick={() => selectTicket(null)}
            style={{ background: 'none', border: 'none', color: '#48484A', fontSize: 20, cursor: 'pointer', padding: 8 }}
          >✕</button>
        </div>

        {/* Raw ticket text */}
        <Section title="TICKET CONTENT">
          <p style={{ fontSize: 13, lineHeight: 1.6, color: '#8E8E93', margin: 0 }}>{t.raw_text}</p>
        </Section>

        {/* AI Intelligence Panel */}
        <Section title="AI ANALYSIS">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <MiniStat label="Urgency" value={`${t.urgency_score}/100`} color={urgencyColor(t.urgency_label)} />
            <MiniStat label="Sentiment" value={`${t.sentiment_score ?? 0}`} color={emotionColor(t.primary_emotion)} />
            <MiniStat label="Escalation Risk" value={`${t.escalation_risk}%`} color={t.escalation_risk! > 70 ? '#FF2D55' : '#FF9500'} />
            <MiniStat label="Processing" value={`${t.processing_time_ms}ms`} color="#00FFB3" />
          </div>
          
          {/* Emotion */}
          {t.primary_emotion && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>{emotionEmoji(t.primary_emotion)}</span>
              <span style={{ fontSize: 14, color: emotionColor(t.primary_emotion) }}>{t.primary_emotion}</span>
              {t.churn_indicators && t.churn_indicators.length > 0 && (
                <span style={{ fontSize: 11, background: 'rgba(255,45,85,0.1)', color: '#FF2D55', padding: '2px 8px', borderRadius: 4, marginLeft: 'auto' }}>
                  ⚠ Churn Risk
                </span>
              )}
            </div>
          )}
          
          {/* Signals */}
          {t.urgency_signals && t.urgency_signals.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 10, color: '#48484A', letterSpacing: '0.1em', fontFamily: 'Space Mono, monospace' }}>URGENCY SIGNALS</span>
              <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {t.urgency_signals.map((s, i) => (
                  <div key={i} style={{ fontSize: 12, color: urgencyColor(t.urgency_label), background: `${urgencyColor(t.urgency_label)}10`, padding: '4px 10px', borderRadius: 4, borderLeft: `2px solid ${urgencyColor(t.urgency_label)}` }}>
                    "{s}"
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Cluster */}
          {t.cluster_label && (
            <div style={{ padding: '10px 14px', background: '#161820', borderRadius: 6, border: '1px solid #1E2030' }}>
              <span style={{ fontSize: 10, color: '#48484A', letterSpacing: '0.1em', fontFamily: 'Space Mono, monospace' }}>CLUSTER</span>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64D2FF' }}>{t.cluster_label}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#48484A' }}>{t.category} › {t.subcategory}</p>
            </div>
          )}
        </Section>

        {/* AI Draft Response */}
        {t.draft_body && (
          <Section title="AI DRAFTED RESPONSE">
            <p style={{ fontSize: 11, color: '#48484A', marginBottom: 6 }}>
              Tone: <span style={{ color: '#64D2FF' }}>{t.response_tone}</span> · 
              Action: <span style={{ color: '#00FFB3' }}>{t.suggested_next_action?.replace(/_/g, ' ')}</span>
            </p>
            <textarea
              value={draftBody || t.draft_body}
              onChange={e => setDraftBody(e.target.value)}
              onClick={handleOpen}
              style={{
                width: '100%', minHeight: 150, background: '#161820', border: '1px solid #1E2030',
                borderRadius: 6, color: '#F5F5F7', fontSize: 13, padding: 12, lineHeight: 1.6,
                fontFamily: 'DM Sans, sans-serif', resize: 'vertical',
              }}
            />
          </Section>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button
            onClick={escalate}
            disabled={escalating || t.is_escalated === 1}
            style={{
              flex: 1, padding: '12px', border: '1px solid rgba(255,45,85,0.4)',
              background: t.is_escalated ? 'rgba(255,45,85,0.15)' : 'none',
              color: '#FF2D55', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500,
            }}
          >{t.is_escalated ? '🚨 Escalated' : escalating ? 'Escalating...' : '🚨 Escalate'}</button>
          <button
            onClick={resolve}
            disabled={resolving || t.status === 'resolved'}
            style={{
              flex: 1, padding: '12px', border: '1px solid rgba(52,199,89,0.4)',
              background: t.status === 'resolved' ? 'rgba(52,199,89,0.15)' : 'none',
              color: '#34C759', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500,
            }}
          >{t.status === 'resolved' ? '✓ Resolved' : resolving ? 'Resolving...' : '✓ Mark Resolved'}</button>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, color: '#48484A', letterSpacing: '0.12em', fontFamily: 'Space Mono, monospace', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #1E2030' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: '#161820', border: '1px solid #1E2030', borderRadius: 6, padding: '10px 12px' }}>
      <div style={{ fontSize: 10, color: '#48484A', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontFamily: 'Space Mono, monospace', fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
```

### `src/components/ClusterStormBanner.tsx`
```tsx
import { useTicketStore } from '../store/ticketStore';

export function ClusterStormBanner() {
  const { clusterStorm, dismissStorm } = useTicketStore();
  if (!clusterStorm) return null;
  
  return (
    <div className="storm-active" style={{
      background: 'rgba(255,149,0,0.08)',
      border: '1px solid #FF9500',
      borderRadius: 8,
      padding: '12px 16px',
      margin: '0 0 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <span style={{ fontSize: 20 }}>⛈</span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#FF9500', fontWeight: 600 }}>
          CLUSTER STORM DETECTED
        </p>
        <p style={{ margin: 0, fontSize: 12, color: '#8E8E93', marginTop: 2 }}>
          {clusterStorm.count} tickets matching "{clusterStorm.cluster_label}" in the last 30 minutes
        </p>
      </div>
      <button
        onClick={dismissStorm}
        style={{ background: 'none', border: '1px solid rgba(255,149,0,0.3)', color: '#FF9500', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
      >Dismiss</button>
    </div>
  );
}
```

### `src/components/SubmitTicket.tsx`
```tsx
import { useState } from 'react';
import { api } from '../lib/api';

const DEMO_TICKETS = [
  { label: '🚨 CRITICAL — Production Down', text: "URGENT: Our entire checkout pipeline has been down for 3 hours. We are an enterprise customer losing approximately $50,000 per hour. Our CTO has been notified. If this is not resolved within 30 minutes we are initiating a chargeback and moving to a competitor.", tier: 'enterprise' },
  { label: '😤 HIGH — Double Billing', text: "I have been charged twice for my Pro subscription this month — $99 charged on the 1st AND the 15th. I've emailed billing 3 times with no response. I am extremely frustrated and need this refunded immediately.", tier: 'pro' },
  { label: '😱 HIGH — Security Breach', text: "SECURITY ALERT: Someone logged into my account from an IP in Russia. I immediately changed my password but I'm extremely worried. What data was accessed? Do I need to worry about my payment information?", tier: 'enterprise' },
  { label: '😕 MEDIUM — Login Issue', text: "Can't log into my account. Getting 'invalid credentials' even though I reset my password twice. This has been happening for 2 days and I have a client presentation that depends on accessing my data.", tier: 'pro' },
  { label: '😐 LOW — Feature Request', text: "Hi there! Love your product so far. Just wondering if there's any chance you could add a dark mode option? It would really help with late-night work sessions. No rush at all, just a suggestion!", tier: 'free' },
];

export function SubmitTicket() {
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [tier, setTier] = useState('free');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const submit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    await api.post('/tickets', {
      raw_text: text,
      customer_name: name || undefined,
      customer_tier: tier,
    });
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
    setText('');
    setName('');
  };
  
  const loadDemo = (demo: typeof DEMO_TICKETS[0]) => {
    setText(demo.text);
    setTier(demo.tier);
  };
  
  return (
    <div style={{ padding: 24, background: '#0F1117', borderBottom: '1px solid #1E2030' }}>
      <h2 style={{ margin: '0 0 16px', fontSize: 12, color: '#48484A', letterSpacing: '0.12em', fontFamily: 'Space Mono, monospace' }}>
        SUBMIT TICKET — LIVE DEMO
      </h2>
      
      {/* Demo presets */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {DEMO_TICKETS.map(d => (
          <button
            key={d.label}
            onClick={() => loadDemo(d)}
            style={{
              fontSize: 11, padding: '5px 10px', borderRadius: 4,
              background: '#161820', border: '1px solid #1E2030',
              color: '#8E8E93', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = '#00FFB3'; (e.target as HTMLButtonElement).style.color = '#00FFB3'; }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = '#1E2030'; (e.target as HTMLButtonElement).style.color = '#8E8E93'; }}
          >{d.label}</button>
        ))}
      </div>
      
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Customer name (optional)"
          style={{ flex: 1, background: '#161820', border: '1px solid #1E2030', borderRadius: 6, padding: '8px 12px', color: '#F5F5F7', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}
        />
        <select
          value={tier}
          onChange={e => setTier(e.target.value)}
          style={{ background: '#161820', border: '1px solid #1E2030', borderRadius: 6, padding: '8px 12px', color: '#F5F5F7', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}
        >
          <option value="free">Free tier</option>
          <option value="pro">Pro tier</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>
      
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Paste or type the support ticket text here..."
        rows={4}
        style={{
          width: '100%', background: '#161820', border: '1px solid #1E2030', borderRadius: 6,
          padding: '10px 12px', color: '#F5F5F7', fontSize: 13, lineHeight: 1.6,
          fontFamily: 'DM Sans, sans-serif', resize: 'vertical', marginBottom: 10,
        }}
      />
      
      <button
        onClick={submit}
        disabled={submitting || !text.trim()}
        style={{
          width: '100%', padding: '12px', borderRadius: 6, border: 'none',
          background: submitted ? 'rgba(52,199,89,0.2)' : submitting ? '#161820' : '#00FFB3',
          color: submitted ? '#34C759' : submitting ? '#8E8E93' : '#08090E',
          fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s', fontFamily: 'DM Sans, sans-serif',
        }}
      >
        {submitted ? '✓ Submitted — Watch the queue!' : submitting ? 'Sending to AI agents...' : '⚡ Analyze with AI Agents'}
      </button>
    </div>
  );
}
```

### `src/components/Dashboard.tsx`
```tsx
import { useEffect } from 'react';
import { useTicketStore } from '../store/ticketStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { StatsBar } from './StatsBar';
import { TicketCard } from './TicketCard';
import { TicketModal } from './TicketModal';
import { ClusterStormBanner } from './ClusterStormBanner';
import { SubmitTicket } from './SubmitTicket';

export function Dashboard() {
  const { tickets, setTickets } = useTicketStore();
  useWebSocket();
  
  const { data } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => api.get('/tickets?limit=50').then(r => r.data),
  });
  
  useEffect(() => { if (data) setTickets(data); }, [data]);
  
  const sorted = [...tickets].sort((a, b) => (b.composite_score ?? 0) - (a.composite_score ?? 0));
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top nav */}
      <div style={{ background: '#08090E', borderBottom: '1px solid #1E2030', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="live-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#00FFB3' }}/>
          <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Space Mono, monospace', color: '#F5F5F7', letterSpacing: '0.05em' }}>TRIAGESENSE</span>
        </div>
        <span style={{ fontSize: 11, color: '#48484A', marginLeft: 8 }}>AI Support Intelligence</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {['Dashboard', 'Analytics', 'Submit'].map(label => (
            <button key={label} style={{ background: 'none', border: '1px solid #1E2030', color: '#8E8E93', padding: '5px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>
              {label}
            </button>
          ))}
        </div>
      </div>
      
      <StatsBar />
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Main queue */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          <ClusterStormBanner />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 10, color: '#48484A', letterSpacing: '0.12em', fontFamily: 'Space Mono, monospace' }}>
              PRIORITY QUEUE — {sorted.length} TICKETS
            </span>
            <span style={{ fontSize: 10, color: '#48484A' }}>sorted by composite score ↓</span>
          </div>
          {sorted.map((ticket, i) => (
            <TicketCard key={ticket.id} ticket={ticket} index={i} />
          ))}
          {sorted.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#48484A' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
              <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 13 }}>Queue empty. Submit a ticket to see AI analysis.</p>
            </div>
          )}
        </div>
        
        {/* Right sidebar */}
        <div style={{ width: 380, borderLeft: '1px solid #1E2030', overflow: 'auto' }}>
          <SubmitTicket />
        </div>
      </div>
      
      <TicketModal />
    </div>
  );
}
```

### `src/lib/api.ts`
```typescript
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000,
});
```

### `src/App.tsx`
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from './components/Dashboard';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}
```

### `frontend/package.json`
```json
{
  "name": "triagesense-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@tanstack/react-query": "^5.56.0",
    "zustand": "^5.0.0",
    "axios": "^1.7.0",
    "recharts": "^2.12.0",
    "framer-motion": "^11.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0"
  }
}
```

### `frontend/vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8000', rewrite: path => path.replace(/^\/api/, '') }
    }
  }
});
```

### `frontend/.env.example`
```
VITE_API_URL=https://your-backend.railway.app
VITE_WS_URL=wss://your-backend.railway.app/ws
```

---

## DOCUMENTATION FILES — CREATE ALL FOUR

### `docs/PROJECT_DOCUMENTATION.md`
```markdown
# TriageSense — Project Documentation

## Overview
TriageSense is an AI-powered support ticket intelligence platform built for the Product Space AI Hackathon. It solves the critical problem of triage cognitive load in support teams by running 5 parallel AI agents on every ticket in under 3 seconds.

## Problem Being Solved
Support teams receive hundreds of tickets daily. Urgent issues get buried under low-priority noise, causing:
- Delayed resolution of critical issues (production outages, security breaches)
- Agent decision fatigue and burnout
- No visibility into customer sentiment trends  
- No proactive detection of coordinated issue spikes (cluster storms)

## Solution
TriageSense analyzes every ticket across 5 dimensions simultaneously:
1. **Urgency** (0-100) — severity classification with verbatim signal extraction
2. **Sentiment** (-100 to +100) — emotion detection with churn risk scoring
3. **Cluster** — semantic grouping into issue families
4. **Response** — AI-drafted human-quality reply matched to urgency/tone
5. **Composite Score** — weighted priority score (urgency × 0.40 + sentiment impact × 0.25 + escalation risk × 0.20 + tier bonus × 0.15)

## Architecture
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + Framer Motion
- **Backend**: Python FastAPI (async) + PostgreSQL + Redis + WebSockets
- **AI**: Featherless.ai API (Qwen/Qwen3-32B) — 4 parallel LLM calls per ticket
- **Orchestration**: n8n for workflow automation and webhook integrations
- **Deployment**: Vercel (frontend) + Railway (backend + DB + Redis)

## Key Innovations
1. **Parallel agent execution** — all agents run simultaneously via `asyncio.gather`, not sequentially
2. **Cluster Storm Detection** — real-time alert when 10+ tickets share a cluster in 30 minutes
3. **AI Confidence Transparency** — every AI decision shows verbatim signals and confidence score
4. **Composite scoring** — weighted formula incorporating customer tier (enterprise gets priority boost)
5. **WebSocket real-time** — ticket appears on dashboard within seconds of submission

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /tickets | Submit single ticket for analysis |
| POST | /tickets/bulk | Submit up to 20 tickets |
| GET | /tickets | Get all tickets sorted by priority |
| PATCH | /tickets/{id} | Update ticket status |
| GET | /stats | Dashboard statistics |
| GET | /sentiment-timeline | Sentiment data for heatmap |
| WS | /ws | Real-time WebSocket connection |

## Database Schema
See `backend/models.py` for full SQLAlchemy model. Key fields per ticket:
- Identity: id, raw_text, subject, customer_name, customer_email, customer_tier
- Urgency: urgency_score, urgency_label, urgency_signals, urgency_confidence
- Sentiment: sentiment_score, primary_emotion, escalation_risk, sentiment_signals
- Cluster: category, subcategory, cluster_label, cluster_keywords
- Response: draft_subject, draft_body, response_tone, suggested_next_action
- Score: composite_score, is_escalated, status, processing_time_ms
```

### `docs/PROGRESS.md`
```markdown
# TriageSense — Build Progress

## Status: 🟡 IN PROGRESS

Last updated: [UPDATE THIS EVERY TIME YOU MAKE PROGRESS]

## Completion Checklist

### Backend
- [ ] FastAPI app bootstrapped
- [ ] PostgreSQL models + migrations
- [ ] Redis client
- [ ] Featherless.ai API connection tested
- [ ] Urgency agent working + returning valid JSON
- [ ] Sentiment agent working + returning valid JSON
- [ ] Cluster agent working + returning valid JSON
- [ ] Response agent working + returning valid JSON
- [ ] Parallel execution with asyncio.gather working
- [ ] Composite scorer implemented
- [ ] WebSocket manager implemented
- [ ] POST /tickets endpoint working
- [ ] GET /tickets endpoint working
- [ ] GET /stats endpoint working
- [ ] PATCH /tickets/{id} endpoint working
- [ ] Cluster storm detection working
- [ ] Deployed to Railway

### Frontend
- [ ] Vite + React + TypeScript project created
- [ ] Tailwind configured with custom design tokens
- [ ] Google Fonts (Space Mono + DM Sans) loaded
- [ ] Global CSS (scanlines, animations) applied
- [ ] Zustand store implemented
- [ ] WebSocket hook implemented
- [ ] API lib configured
- [ ] StatsBar component built
- [ ] TicketCard component built (with urgency colors + animations)
- [ ] TicketModal drawer built (with AI panel)
- [ ] ClusterStormBanner built
- [ ] SubmitTicket form built (with demo presets)
- [ ] Dashboard layout assembled
- [ ] Loading skeleton states implemented
- [ ] Deployed to Vercel

### Integration
- [ ] Frontend connects to Railway backend
- [ ] WebSocket delivers real-time ticket updates to dashboard
- [ ] Demo tickets seed script working
- [ ] End-to-end flow tested: submit → AI analysis → dashboard update

### n8n
- [ ] Featherless.ai HTTP node configured
- [ ] Webhook trigger working
- [ ] Workflow exported as JSON

### Documentation
- [ ] PROJECT_DOCUMENTATION.md complete
- [ ] PROGRESS.md (this file) being updated
- [ ] MANUAL_SETUP.md complete
- [ ] DEPLOYMENT_GUIDE.md complete

## Session Log
| Date | What was done | Issues encountered |
|------|--------------|-------------------|
| Day 1 AM | Project scaffolded, backend structure created | — |
| Day 1 PM | AI agents implemented and tested | Rate limits on Featherless — added retry |
| Day 2 AM | Frontend built, WebSocket working | CORS — fixed with allow_origins=* |
| Day 2 PM | Deployed, demo tested, LinkedIn post drafted | — |
```

### `docs/MANUAL_SETUP.md`
```markdown
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
   - Click "+ New" → "Database" → "PostgreSQL" → Deploy
   - Click "+ New" → "Database" → "Redis" → Deploy
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

### 4. n8n Cloud Setup
1. Go to https://n8n.io and start free trial
2. Import `n8n/triagesense-workflow.json` via the Import menu
3. Add credential: HTTP Header Auth
   - Name: Featherless API
   - Header: Authorization
   - Value: Bearer YOUR_API_KEY
4. Activate the workflow
5. Copy the webhook URL and add it as `N8N_WEBHOOK_URL` in your Railway env

### 5. Google Fonts
- No manual setup needed — loaded via CDN in index.html

### 6. Seed Demo Data
After deployment, run locally pointing at the live backend:
```bash
cd scripts
BACKEND_URL=https://your-backend.up.railway.app python seed_demo_tickets.py
```

### 7. Database Initialization
The database tables are auto-created on first startup via `init_db()` in lifespan.
If tables are not created, run manually:
```bash
# SSH into Railway or run via Railway CLI
python -c "import asyncio; from database import init_db; asyncio.run(init_db())"
```

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
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Then fill in your values
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env.local  # Point to localhost:8000
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
```

### `docs/DEPLOYMENT_GUIDE.md`
```markdown
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
BACKEND_URL=https://your-app.up.railway.app python scripts/seed_demo_tickets.py
```

### Step 6: End-to-End Test
1. Open https://triagesense.vercel.app
2. Verify stats bar shows tickets
3. Submit a ticket via the form
4. Watch it appear in the queue with AI analysis within 5 seconds
5. Click ticket → verify drawer shows AI analysis, urgency signals, draft response

### Step 7: Test WebSocket
Open browser DevTools → Console:
```javascript
const ws = new WebSocket('wss://your-app.up.railway.app/ws');
ws.onmessage = e => console.log(JSON.parse(e.data));
// Submit a ticket via the UI — you should see {type: "ticket_processed", payload: {...}}
```

## Environment Variables Reference
| Variable | Service | Description |
|----------|---------|-------------|
| `FEATHERLESS_API_KEY` | Backend | Your Featherless.ai API key |
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `REDIS_URL` | Backend | Redis connection string |
| `FRONTEND_URL` | Backend | Vercel URL (for CORS) |
| `VITE_API_URL` | Frontend | Backend HTTP URL |
| `VITE_WS_URL` | Frontend | Backend WebSocket URL (wss://) |

## Monitoring / Debugging in Production
- Railway → your service → Logs (real-time log stream)
- Vercel → Deployments → Functions (serverless logs)
- Test backend health: `curl https://your-app.up.railway.app/health`
- Test tickets: `curl https://your-app.up.railway.app/tickets | python -m json.tool`

## Rollback
Railway: Click previous deployment → "Redeploy"
Vercel: Deployments tab → any previous deploy → "Promote to Production"
```

---

## `docker-compose.yml` (local dev)
```yaml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: triagesense
      POSTGRES_USER: triagesense
      POSTGRES_PASSWORD: triagesense
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

---

## n8n WORKFLOW (`n8n/triagesense-workflow.json`)

Create this workflow in n8n:
1. **Webhook** node (POST `/triagesense/ticket`) 
2. **HTTP Request** node → Featherless.ai API (urgency agent)
3. **HTTP Request** node → Featherless.ai API (sentiment agent)
4. **HTTP Request** node → Featherless.ai API (cluster agent)
5. **Merge** node (wait for all 3)
6. **HTTP Request** node → POST to FastAPI `/tickets` endpoint with enriched data
7. **IF** node → composite_score > 85 → **Slack** notification node

Export the workflow JSON and commit it to `n8n/triagesense-workflow.json`.

---

## LINKEDIN POSTS — WRITE THESE EXACTLY

### POST 1 (Day 1, within first 3 hours)
```
I just chose the hardest problem at the Product Space AI Hackathon.

Support teams get 400+ tickets a day. "Our checkout is down, we're losing $50k/hour" gets buried under "can you add dark mode?"

I'm building TriageSense — 5 AI agents that analyze every ticket in parallel in under 3 seconds.

Here's what it detects that humans miss:
→ Exact phrases that signal urgency ("CTO has been notified" = CRITICAL)
→ Customer emotional trajectory (frustrated → about to churn)
→ Coordinated issue spikes before they become crises

Building with n8n + Python FastAPI + Featherless.ai (Qwen3-32B)

Day 2 update incoming — follow along.

#ProductSpace #AIHackathon #BuildInPublic #AI
```

### POST 2 (Day 2, final demo post)
```
Built a full AI product in 48 hours. Here's the demo: [LINK]

TriageSense — 5 parallel AI agents. Every support ticket, analyzed in under 3 seconds.

What it does that nothing else does:

🎯 URGENCY AGENT
Scores 0-100. Extracts verbatim signals.
"We are initiating a chargeback" → CRITICAL (score: 97)
"can you add dark mode?" → LOW (score: 12)

😤 SENTIMENT AGENT  
Detects emotion + churn probability.
Sees "I've emailed 3 times with no response" and flags escalation risk.

🔍 CLUSTER AGENT
Groups similar tickets automatically.
10 "login broken" variants in 30 min → CLUSTER STORM alert.

✍️ RESPONSE AGENT
Drafts human-quality replies matched to urgency.
CRITICAL ticket gets action-first response. Low ticket gets warm FAQ.

📊 COMPOSITE SCORER
Urgency × 0.40 + Sentiment × 0.25 + Escalation risk × 0.20 + Enterprise tier bonus × 0.15

The part I'm most proud of: CLUSTER STORM DETECTION.
When frustration spikes across a cluster, your team sees it before it becomes a crisis.

Stack: n8n · Python FastAPI · React · PostgreSQL · Featherless.ai

Live demo: [INSERT VERCEL URL]
GitHub: [INSERT REPO URL]

#AIHackathon #ProductSpace #BuildInPublic #CustomerSupport #AI
```

---

## DEMO SCRIPT (Memorize This for the Presentation)

**Duration**: 60 seconds maximum

1. **Open the live dashboard** — show the empty queue, point out the live indicator dot
2. **Click "CRITICAL — Production Down" demo preset** — paste fills automatically
3. **Hit "Analyze with AI Agents"** — say "watch the queue"
4. **In 3 seconds**: ticket appears with score 97, CRITICAL badge pulsing red
5. **Click the ticket** — show the drawer: urgency signals ("$50k/hour", "CTO notified"), sentiment (panicked, 87% escalation risk), AI drafted response
6. **Click "LOW — Feature Request"** — submit it
7. **It appears at the BOTTOM of the queue** — score 12, LOW badge green
8. **Say**: "Same speed. Different priority. The AI knew exactly where to put it."
9. **Submit 5 login tickets rapidly** — cluster storm banner fires
10. **Say**: "That's Cluster Storm Detection. 5 login tickets in 30 seconds — the system noticed before any human would."

---

## SCORING STRATEGY REMINDERS

### AI Integration (25%) — HOW TO SCORE 25/25
- Show PARALLEL execution (mention `asyncio.gather` in your LinkedIn post)  
- Show verbatim signal extraction — judges love explainability
- Show the composite scoring formula on screen
- Processing time display (`~2.8s`) proves real AI, not mocked

### UX (20%) — HOW TO SCORE 19/20
- The "Mission Control" dark aesthetic is instantly memorable
- Space Mono font for scores = terminal authority
- Pulsing CRITICAL badge = visual urgency that works without explanation
- Skeleton loading states = production quality signal
- Demo presets = judges can try it themselves in 1 click

### Innovation (15%) — HOW TO SCORE 15/15
- Cluster Storm Detection (nobody else has this)
- AI Confidence Transparency (verbatim signals visible to user)
- Composite scoring with tier multiplier (nuanced, not naive)
- Sentiment timeline + escalation risk (predicts future, not just reports present)

---

## WHAT TO DO IF THINGS BREAK DURING DEMO

1. **Featherless API is slow/down**: Pre-seed the DB with `seed_demo_tickets.py` before demo. The dashboard will show real processed tickets even if live submission is slow.

2. **WebSocket not connecting**: Reload the page. WebSocket auto-reconnects in 3 seconds.

3. **Railway backend down**: Have localhost running as backup. Switch `VITE_API_URL` to `http://localhost:8000` and rebuild.

4. **Database empty**: Run `python scripts/seed_demo_tickets.py` again.

5. **CORS error**: Verify `FRONTEND_URL` env var in Railway matches your exact Vercel URL.

---

## FINAL CHECKLIST BEFORE DEMO

- [ ] Backend health check returns 200: `curl https://your-backend.up.railway.app/health`
- [ ] Frontend loads without console errors
- [ ] WebSocket connects (check Network tab in DevTools → WS)
- [ ] Submit one ticket manually and verify it appears on dashboard
- [ ] Seed demo tickets are loaded
- [ ] LinkedIn posts scheduled/drafted
- [ ] Loom video recorded (60 seconds, no dead air)
- [ ] GitHub repo is public with README
- [ ] vercel.app URL works on mobile (judges will check)

---

*End of prompt. Build everything in this document. Do not skip any section.*
*The goal is not a good demo. The goal is a WINNER.*
```
