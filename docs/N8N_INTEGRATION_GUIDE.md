# n8n Integration Guide for TriageSense

This guide will help you build the fastest, most effective demo pipeline to prove our exact hackathon problem statement.

## 🎯 The Core Problem & Our Solution
**The Problem:** Support teams receive hundreds of tickets (emails) daily. Urgent issues get mixed with low-priority requests, causing delays and frustration.
**Our Solution (TriageSense):** We built an AI agent to analyze incoming support tickets, identify urgency/sentiment, group similar issues, and escalate critical cases with suggested responses.

For the demo, **we only need ONE enterprise-level input platform** to prove the pipeline works in the real world. We will use **Gmail** as our support inbox.

### The 3-Step Demo Architecture
1. **Input (Gmail):** A customer emails your dedicated support address (e.g., `triagesense.demo@gmail.com`).
2. **The Brain (TriageSense API):** n8n instantly catches the email and forwards the text to our FastAPI backend (`POST /tickets`). The 5 parallel agents analyze urgency, sentiment, and draft responses.
3. **Escalation Output (Slack):** If the AI determines the ticket is `CRITICAL`, TriageSense fires a webhook back to n8n, which automatically alerts the `#urgent-escalations` Slack channel.

---

## 🚀 Step 1: Running n8n Locally

n8n is completely self-hostable. The fastest way to start it locally alongside TriageSense is using Node.js.

1. Open a new terminal.
2. Run: `npx n8n` 
3. Open your browser to `http://localhost:5678`.

---

## 📥 Flow 1: Ingestion Pipeline (Gmail -> TriageSense)

We will use n8n to listen for new emails arriving in our support inbox.

**How to set it up in n8n:**
1. Create a new workflow.
2. Add a **Gmail Trigger Node**.
   - Authenticate your Google account.
   - Set it to trigger on **New Emails**.
3. Add an **HTTP Request Node**.
   - **Method:** `POST`
   - **URL:** `http://localhost:8000/tickets` (Make sure your backend is running!)
   - **Body Type:** JSON
   - **Data:**
     ```json
     {
       "raw_text": "={{$json.textPlain}}",
       "subject": "={{$json.subject}}",
       "customer_tier": "pro",
       "customer_name": "={{$json.from.name}}"
     }
     ```

*That’s it! Every incoming email instantly becomes an analyzed ticket on the TriageSense Dashboard.*

---

## 📤 Flow 2: Automated Escalation (TriageSense -> Slack)

When TriageSense detects an urgent issue (urgency score > 90), it will automatically fire a webhook back to n8n to escalate the ticket.

**How to set it up:**
1. In n8n, create a new workflow.
2. Add a **Webhook Node**.
   - Copy the "Test Webhook URL" (e.g., `http://localhost:5678/webhook/triagesense-action`).
3. Add that URL to the TriageSense backend `.env` file:
   ```env
   N8N_WEBHOOK_URL="http://localhost:5678/webhook/triagesense-action"
   ```
4. Add an **IF Node** to check if the incoming webhook payload proves it's urgent:
   - Condition: `{{$json.body.urgency_label}}` Equal to `CRITICAL`.
5. Connect a **Slack Node** to the "True" output of the IF Node.
   - Format a message dumping the ticket details and the AI's suggested response directly into the `#urgent-escalations` channel.

By isolating the demo to just **Gmail (Input) -> TriageSense AI -> Slack (Escalation)**, you perfectly prove the exact problem statement without confusing the judges with an overly complex web of third-party apps!

When TriageSense finishes evaluating a ticket, it can notify n8n. If the AI detects a `CRITICAL` issue (score > 90), n8n can blast an alert to the `#engineering` Slack channel with the recommended action.

We have generated a starter workflow template for you: `n8n/action-router-workflow.json`.

**How to set it up:**
1. Import `n8n/action-router-workflow.json` into n8n.
2. Double-click the **Webhook Node** at the start.
3. Select **Test Webhook URL** or **Production Webhook URL**.
4. Copy the URL (it will look like `http://localhost:5678/webhook/triagesense-action`).
5. Open `backend/.env` in the TriageSense project and add this line:
   ```env
   N8N_WEBHOOK_URL="http://localhost:5678/webhook/triagesense-action"
   ```
6. Now, whenever TriageSense processes a ticket, the Python backend will instantly POST the entire ticket JSON payload to this exact URL.
7. The workflow will use an **IF Node** to check `urgency_label === 'CRITICAL'`.
8. If true, it triggers the **Slack Node** to drop a beautifully formatted alert. (You'll need to auth Slack on this node).

---

## Testing the Full Pipeline

1. Start TriageSense backend: `python -m uvicorn main:app`
2. Start TriageSense frontend: `npm run dev`
3. Start n8n: `npx n8n`
4. Type a message in your test Slack channel: *"URGENT: Our production database just dropped offline and we are losing money! We need help ASAP"*
5. **Watch the magic happen:** 
   - n8n catches the Slack message and POSTs to TriageSense.
   - TriageSense instantly updates the UI dashboard with the new ticket.
   - The parallel AI agents run, determine it is `CRITICAL` (Score: 98).
   - TriageSense fires a POST back to n8n's Action Router webhook.
   - n8n receives it and automatically fires a Slack message back saying *"🚨 Critical Ticket Action Suggested: Escalate to Eng Tier 3"*.

This 5-second end-to-end self-driving support loop will blow the minds of the hackathon judges!
