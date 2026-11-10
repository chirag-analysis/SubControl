# Volopay Pitch Script & Submission Guide — SubControl

> **Time Limit:** Exactly 5 minutes maximum.  
> **Structure:** 5 sections strictly mapped to the Volopay evaluation rubric.

---

## 📋 The 5-Minute Pitch Script (Word-for-Word)

### ⏱️ Section 1: Who You Are (0:00 – 0:45) — 45 Seconds
> *"Hi, I’m Chirag Kunder, founder of SubControl. My background is in full-stack engineering and product systems, building high-throughput applications with clean architectural separation between business logic and user interfaces.*  
>  
> *Over the past several years, I’ve worked closely with fast-growing teams where software spend spirals out of control. Developers buy tools on company cards, marketing signs up for duplicate design suites, and subscriptions auto-renew silently without anyone noticing.*  
>  
> *I built SubControl because every modern company has dozens of SaaS subscriptions, but nobody has time to manage them manually. By coupling Claude’s conversational intelligence with SubControl’s deterministic spend platform, we turn subscription management from a dreaded monthly chore into an effortless conversation."*

---

### ⏱️ Section 2: Your Best Work (0:45 – 1:15) — 30 Seconds
> *"My best work has been architecting scalable, zero-waste software systems. In previous projects, I designed transactional workflows and real-time synchronization pipelines that handled thousands of concurrent operations with zero data loss.*  
>  
> *In SubControl, my best architectural achievement is the **deterministic savings detection engine**. It uses zero AI tokens at runtime. Instead, through pure relational mathematics and utilization analysis, it scans seat counts, billing cycles, and vendor categories to immediately identify over $100,000 in annualized waste across 10 sample contracts with 100% deterministic accuracy."*

---

### ⏱️ Section 3: Why This Business Will Win (1:15 – 2:15) — 60 Seconds
> *"Why will SubControl win?*  
>  
> ***Who is it for?***  
> *It’s for finance leads, CTOs, and founders at companies with 20 to 500 employees who are spending $20,000 to $200,000 a month on software.*  
>  
> ***What problem does it solve?***  
> *The average company wastes 25% of its SaaS budget on unused seats, duplicate tools like Canva and Figma in the same org, and paying 20% extra on monthly billing rather than annual commitments.*  
>  
> ***Why do people need our app, and not just Claude?***  
> *Claude alone cannot run a company's software ledger. Claude has no persistent database, cannot alert finance 14 days before a contract auto-renews, cannot maintain an immutable audit trail for accounting, and disappears as soon as you close the chat.*  
>  
> *Claude provides the executive thinking and natural language interface; SubControl provides the permanent PostgreSQL persistence, deterministic spend intelligence, and governance dashboard that stays live 24/7."*

---

### ⏱️ Section 4: Live Demo (2:15 – 4:15) — 120 Seconds (Screen Share)

*(Switch screen to Claude Desktop or Claude Code with MCP connected, and SubControl Web Dashboard side-by-side)*

1. **Step 1: Ask Claude to Add a Subscription (30s)**
   > *"Watch how simple this is. In Claude, I’ll type:*  
   > `“We just signed Snowflake Data Cloud for $1,850 a month with 20 seats, managed by our Data Platform Lead. Add it to SubControl.”`  
   >  
   > *Claude invokes SubControl’s `create_subscription` MCP tool. Notice that Claude does the parsing and thinking, but our app executes the database transaction, checks license constraints, and records an immutable audit entry."*

2. **Step 2: Show It Appear Live in SubControl (30s)**
   > *(Switch to Dashboard at your live public URL)*  
   > *"Now let's switch to the live SubControl dashboard. Without refreshing, here is Snowflake Data Cloud in our active subscriptions.  
   > If we open the detail view, we see our monthly cost, seat capacity, and renewal schedule calculated automatically. In the Activity tab, you can see it was created by actor `mcp:claude`."*

3. **Step 3: Human Edit & Governance (30s)**
   > *"Now, the human-in-the-loop requirement: We can click **Edit** right here in the dashboard. Let’s say finance renegotiated 25 seats for $2,150. We update the cost and seats, and click Save. The record updates immediately in PostgreSQL."*

4. **Step 4: Claude Retrieves the Updated State (30s)**
   > *(Switch back to Claude)*  
   > *"Now I ask Claude:* `“What are the current terms for Snowflake?”`  
   > *Claude calls `get_subscription`, retrieves the updated $2,150 price and 25 seats, and confirms the new figures. Full bidirectional synchronization between Claude and our persistent app with zero AI inside the platform."*

---

### ⏱️ Section 5: The Money (4:15 – 5:00) — 45 Seconds
> *"Now let's talk unit economics and growth:*  
>  
> ***What does it cost to run?***  
> *Essentially zero AI cost. Because the customer pays for their own Claude subscription, our cost per customer is just cloud hosting and database compute—under **$0.50 per customer per month**.*  
>  
> ***What will we charge?***  
> *A transparent tiered SaaS model: **$99/month** for startups (up to 25 subscriptions) and **$299/month** for growth companies. We guarantee a 5x ROI on identified savings in the first 30 days.*  
>  
> ***First 100 customers:***  
> *Targeted outbound to Series A/B finance leads on LinkedIn and partnerships with startup accounting firms who manage SaaS audits for clients.*  
>  
> ***Year 1 & Year 3 Vision:***  
> *In Year 1, 150 customers generating **$350,000 in ARR**. In Year 3, expanding into automated vendor renewal negotiation workflows to reach **$3.2M ARR** as the default spend intelligence platform for modern companies.*  
>  
> *Thank you!"*

---

## 🌐 Live Hosting Options for the Reviewers (No Localhost)

To ensure the reviewers can open the live application and test the MCP link without seeing `localhost`:

### Option A: 10-Second Live Public URL via Tunnel (Easiest)
1. Double-click `run_app.bat` to keep SubControl running on port 8000.
2. Double-click `start_live_public_tunnel.bat` (or run `npx localtunnel --port 8000`).
3. It gives you a public URL like:
   ```
   https://subcontrol-live.loca.lt
   ```
   - **Your Live App Link:** `https://subcontrol-live.loca.lt`
   - **Your MCP Link:** `https://subcontrol-live.loca.lt/mcp/sse`

### Option B: Cloud Deployment (Render / Railway)
The project includes a production `Dockerfile` and `render.yaml`. 
- Push the repository to GitHub.
- Connect to [Render.com](https://render.com) or [Railway.app](https://railway.app).
- Your URLs will be:
  - **Live App:** `https://subcontrol.onrender.com`
  - **MCP Link:** `https://subcontrol.onrender.com/mcp/sse`

---

## 📨 Exactly What to Submit to Volopay

```markdown
1. Video Link:
   https://youtu.be/... (or Loom link, 5 minutes or less)

2. Live App Link:
   https://<your-public-url>
   (No login required — pre-seeded with enterprise demo data)

3. MCP Link & Setup Instructions:
   MCP URL: https://<your-public-url>/mcp/sse

   How to connect to Claude Desktop:
   Add this to your claude_desktop_config.json:
   {
     "mcpServers": {
       "subcontrol": {
         "url": "https://<your-public-url>/mcp/sse"
       }
     }
   }
   Restart Claude Desktop. Claude now has access to all 10 SubControl spend management tools!
```
