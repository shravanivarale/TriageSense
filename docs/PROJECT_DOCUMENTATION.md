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
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS v4 + Recharts
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
6. **Mission Control UI** — dark, data-dense interface inspired by NASA flight control

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /tickets | Submit single ticket for analysis |
| POST | /tickets/bulk | Submit up to 20 tickets |
| GET | /tickets | Get all tickets sorted by priority |
| PATCH | /tickets/{id} | Update ticket status |
| GET | /stats | Dashboard statistics |
| GET | /sentiment-timeline | Sentiment data for timeline chart |
| GET | /health | Health check |
| WS | /ws | Real-time WebSocket connection |

## Database Schema
See `backend/models.py` for full SQLAlchemy model. Key fields per ticket:
- Identity: id, raw_text, subject, customer_name, customer_email, customer_tier
- Urgency: urgency_score, urgency_label, urgency_signals, urgency_confidence
- Sentiment: sentiment_score, primary_emotion, escalation_risk, sentiment_signals
- Cluster: category, subcategory, cluster_label, cluster_keywords
- Response: draft_subject, draft_body, response_tone, suggested_next_action
- Score: composite_score, is_escalated, status, processing_time_ms
