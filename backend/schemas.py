from pydantic import BaseModel
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
