import asyncio
import httpx
import json
import os
import time
import re
from typing import Any

FEATHERLESS_API_KEY = os.environ.get("FEATHERLESS_API_KEY", "")
FEATHERLESS_BASE_URL = "https://api.featherless.ai/v1"
MODEL = "Qwen/Qwen3-32B"


async def call_featherless(system_prompt: str, user_content: str, max_tokens: int = 800) -> dict:
    """Single async call to Featherless.ai — returns parsed JSON dict."""
    if not FEATHERLESS_API_KEY:
        raise Exception("No API key configured")
    
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
        
        # Also handle thinking tags from Qwen3
        content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL).strip()
        
        # Try to extract JSON from the content
        try:
            return json.loads(content.strip())
        except json.JSONDecodeError:
            # Try to find JSON object in the content
            match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', content)
            if match:
                return json.loads(match.group())
            raise


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
# MASTER: RUN ALL AGENTS IN PARALLEL
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
