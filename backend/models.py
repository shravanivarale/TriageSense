from sqlalchemy import Column, String, Integer, Float, DateTime, Text, JSON
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

    # AI outputs — Urgency Agent
    urgency_score = Column(Integer)       # 0-100
    urgency_label = Column(String(20))    # CRITICAL | HIGH | MEDIUM | LOW
    urgency_signals = Column(JSON)        # list of verbatim phrases
    urgency_confidence = Column(Float)    # 0.0-1.0

    # AI outputs — Sentiment Agent
    sentiment_score = Column(Integer)     # -100 to 100
    primary_emotion = Column(String(50))  # frustrated | angry | calm | etc.
    escalation_risk = Column(Integer)     # 0-100
    sentiment_signals = Column(JSON)
    sentiment_confidence = Column(Float)

    # AI outputs — Cluster Agent
    category = Column(String(100))
    subcategory = Column(String(200))
    cluster_id = Column(String(100))
    cluster_label = Column(String(200))
    similar_signals = Column(JSON)

    # AI outputs — Response Agent
    draft_subject = Column(String(500))
    draft_body = Column(Text)
    response_tone = Column(String(50))
    suggested_next_action = Column(String(50))

    # Composite scoring
    composite_score = Column(Integer)     # final 0-100 priority
    is_escalated = Column(Integer, default=0)
    assigned_agent = Column(String(200))

    # Status tracking
    status = Column(String(50), default="pending")  # pending | processing | resolved | escalated
    processing_time_ms = Column(Integer)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
