"""Quick smoke test for all AI agents."""
import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

from agents import run_urgency_agent, run_sentiment_agent, run_cluster_agent, run_response_agent, analyze_ticket_parallel

TEST_TICKET = """URGENT: Our entire checkout pipeline has been down for 3 hours. 
We are an enterprise customer losing approximately $50,000 per hour. 
Our CTO has been notified. If this is not resolved within 30 minutes 
we are initiating a chargeback and moving to a competitor."""


async def test():
    print("=" * 60)
    print("TriageSense — Agent Smoke Test")
    print("=" * 60)

    print("\n🔍 Testing Urgency Agent...")
    urgency = await run_urgency_agent(TEST_TICKET)
    print(f"   Score: {urgency.get('urgency_score')}")
    print(f"   Label: {urgency.get('urgency_label')}")
    print(f"   Confidence: {urgency.get('confidence')}")
    print(f"   ✅ Urgency Agent OK" if urgency.get('urgency_score', 0) > 0 else "   ❌ Urgency Agent Failed")

    print("\n😤 Testing Sentiment Agent...")
    sentiment = await run_sentiment_agent(TEST_TICKET)
    print(f"   Score: {sentiment.get('sentiment_score')}")
    print(f"   Emotion: {sentiment.get('primary_emotion')}")
    print(f"   Escalation Risk: {sentiment.get('escalation_risk')}")
    print(f"   ✅ Sentiment Agent OK" if sentiment.get('primary_emotion') else "   ❌ Sentiment Agent Failed")

    print("\n🏷️ Testing Cluster Agent...")
    cluster = await run_cluster_agent(TEST_TICKET)
    print(f"   Category: {cluster.get('category')}")
    print(f"   Cluster: {cluster.get('cluster_label')}")
    print(f"   ✅ Cluster Agent OK" if cluster.get('category') else "   ❌ Cluster Agent Failed")

    print("\n✍️ Testing Response Agent...")
    response = await run_response_agent(TEST_TICKET)
    print(f"   Tone: {response.get('response_tone')}")
    print(f"   Action: {response.get('suggested_next_action')}")
    print(f"   ✅ Response Agent OK" if response.get('draft_body') else "   ❌ Response Agent Failed")

    print("\n🚀 Testing Parallel Execution (all agents)...")
    result = await analyze_ticket_parallel(TEST_TICKET, "enterprise")
    print(f"   Composite Score: {result.get('composite_score')}")
    print(f"   Processing Time: {result.get('processing_time_ms')}ms")
    print(f"   Auto-Escalated: {'Yes' if result.get('is_escalated') else 'No'}")
    print(f"   ✅ Parallel Execution OK" if result.get('composite_score', 0) > 0 else "   ❌ Parallel Execution Failed")

    print("\n" + "=" * 60)
    print("Smoke test complete!")
    print("=" * 60)


asyncio.run(test())
