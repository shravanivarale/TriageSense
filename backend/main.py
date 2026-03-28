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
import httpx
import os


# ─── WebSocket connection manager ───
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead.append(connection)
        for d in dead:
            if d in self.active_connections:
                self.active_connections.remove(d)


manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="TriageSense API",
    version="1.0.0",
    description="AI-powered support ticket intelligence platform — 5 parallel AI agents analyze every ticket in under 3 seconds",
    lifespan=lifespan
)

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
    except Exception:
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

        # Fire outbound webhook to n8n (Orchestration Layer) if configured
        webhook_url = os.environ.get("N8N_WEBHOOK_URL")
        if webhook_url:
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(webhook_url, json=ticket_dict, timeout=3.0)
            except Exception as e:
                print(f"Failed to trigger n8n webhook: {e}")

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
    avg_processing = await db.execute(select(func.avg(Ticket.processing_time_ms)))

    # Cluster distribution
    cluster_result = await db.execute(
        select(Ticket.cluster_label, func.count(Ticket.id).label("count"))
        .where(Ticket.cluster_label.isnot(None))
        .group_by(Ticket.cluster_label)
        .order_by(desc("count"))
        .limit(8)
    )
    clusters = [{"label": r[0], "count": r[1]} for r in cluster_result]

    # Category distribution
    category_result = await db.execute(
        select(Ticket.category, func.count(Ticket.id).label("count"))
        .where(Ticket.category.isnot(None))
        .group_by(Ticket.category)
        .order_by(desc("count"))
        .limit(8)
    )
    categories = [{"label": r[0], "count": r[1]} for r in category_result]

    # Urgency distribution
    urgency_result = await db.execute(
        select(Ticket.urgency_label, func.count(Ticket.id).label("count"))
        .where(Ticket.urgency_label.isnot(None))
        .group_by(Ticket.urgency_label)
    )
    urgency_distribution = [{"label": r[0], "count": r[1]} for r in urgency_result]

    return {
        "total_tickets": total.scalar() or 0,
        "critical_unresolved": critical.scalar() or 0,
        "escalated": escalated.scalar() or 0,
        "avg_composite_score": round(avg_score.scalar() or 0, 1),
        "avg_sentiment": round(avg_sentiment.scalar() or 0, 1),
        "avg_processing_ms": round(avg_processing.scalar() or 0, 0),
        "clusters": clusters,
        "categories": categories,
        "urgency_distribution": urgency_distribution,
    }


# ─── Sentiment timeline (for heatmap) ───
@app.get("/sentiment-timeline")
async def sentiment_timeline(db: AsyncSession = Depends(get_db)):
    """Return sentiment scores for last 2 hours, bucketed by 10-minute intervals."""
    two_hours_ago = datetime.utcnow() - timedelta(hours=2)
    result = await db.execute(
        select(Ticket.created_at, Ticket.sentiment_score, Ticket.cluster_label, Ticket.urgency_label)
        .where(Ticket.created_at >= two_hours_ago)
        .order_by(Ticket.created_at)
    )
    rows = result.all()
    return [{"time": r[0].isoformat(), "sentiment": r[1], "cluster": r[2], "urgency": r[3]} for r in rows]


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
    return {"status": "ok", "version": "1.0.0", "timestamp": datetime.utcnow().isoformat()}
