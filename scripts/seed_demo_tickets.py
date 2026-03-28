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
        "raw_text": "Login broken again",
        "subject": "Can't login",
        "customer_name": "User 1",
        "customer_email": "u1@test.com",
        "customer_tier": "free"
    },
    {
        "raw_text": "Password reset email never arrives. Tried 5 times.",
        "subject": "No reset email",
        "customer_name": "User 2",
        "customer_email": "u2@test.com",
        "customer_tier": "free"
    },
    {
        "raw_text": "Getting invalid credentials on login. Already cleared cache.",
        "subject": "Login error",
        "customer_name": "User 3",
        "customer_email": "u3@test.com",
        "customer_tier": "free"
    },
    {
        "raw_text": "Can't sign in. 'Account not found' error.",
        "subject": "Sign in broken",
        "customer_name": "User 4",
        "customer_email": "u4@test.com",
        "customer_tier": "pro"
    },
    {
        "raw_text": "Authentication is broken for all users on our team",
        "subject": "Team auth broken",
        "customer_name": "User 5",
        "customer_email": "u5@enterprise.com",
        "customer_tier": "enterprise"
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
            try:
                response = await client.post(f"{BACKEND_URL}/tickets", json=ticket)
                print(f"[{i+1}/{len(DEMO_TICKETS)}] Submitted: {ticket['subject'][:50]}... → {response.status_code}")
            except Exception as e:
                print(f"[{i+1}/{len(DEMO_TICKETS)}] FAILED: {ticket['subject'][:50]}... → {e}")
            await asyncio.sleep(2)  # Stagger to not overwhelm
        print("Done! Tickets are being processed by AI agents.")


asyncio.run(seed())
