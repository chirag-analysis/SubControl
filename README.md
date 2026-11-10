# SubControl — SaaS Spend Intelligence & Subscription Management Platform

SubControl is a production-grade subscription management and recurring spend intelligence platform built for finance and engineering leadership.

The application features **zero runtime AI APIs or AI inference** — all savings detection, renewal workflows, and spend analytics are 100% deterministic. Claude connects externally through the **Model Context Protocol (MCP)** using the official Python SDK, sharing the exact same PostgreSQL database and business service layer as the web application.

---

## 🚀 Quick Start (Keeping the App Live)

### 1. Start the Live Server
Double-click **`run_app.bat`** in the project root, or open your terminal:

```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Once running:
- **Web Dashboard:** [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check Endpoint:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

*(The built React + Tailwind frontend is embedded and served directly by FastAPI at `/`).*

---

## 🤖 Connecting Claude via MCP

SubControl includes an MCP server (`backend/mcp_server.py`) configured for Claude Desktop or Claude Code.

### Claude Desktop Configuration
Add the following configuration to your `claude_desktop_config.json`:
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "subcontrol": {
      "command": "python",
      "args": [
        "c:/Users/chirag.kunder/Desktop/Volopay_assignment/SubControl/backend/mcp_server.py"
      ],
      "env": {
        "DATABASE_URL": "postgresql://postgres:postgres@localhost:5432/subcontrol"
      }
    }
  }
}
```

### Registered MCP Tools Available to Claude:
| MCP Tool Name | Description |
|---|---|
| `list_subscriptions` | Query active or filtered subscriptions by status, owner, or search term |
| `get_subscription` | Get full subscription details including invoices, reviews, and savings |
| `create_subscription` | Create a new subscription contract (shares business validation rules) |
| `update_subscription` | Modify cost, seats, status, owner, or billing frequency |
| `cancel_subscription` | Soft-cancel a subscription with an audit timestamp and cancellation reason |
| `get_spend_analytics` | Retrieve normalized MRR, annual commitments, and seat utilization |
| `get_upcoming_renewals`| List renewals approaching in the next 30, 60, or 90 days by urgency tier |
| `detect_savings` | Trigger deterministic rule evaluation for cost reduction opportunities |
| `create_renewal_review`| Record formal renewal decisions (approve, cancel, downgrade, renegotiate) |
| `get_activity_log` | Retrieve the immutable audit trail with actor attribution (`mcp:claude` vs `web_ui`) |

---

## 🧪 Acceptance Test Verification

The critical acceptance test validates that Claude can create a subscription through MCP, the subscription immediately appears in the web dashboard, a user can edit it in the UI, and Claude can retrieve the updated state through MCP.

To run the automated acceptance test suite at any time:

```bash
python backend/run_acceptance_test.py
```

### Verified Test Flow:
1. **Claude creates subscription via MCP:**
   - Invokes `create_subscription("Snowflake Data Cloud", ...)`
   - Generated ID: `702aa90f-5462-4e38-9391-6109f95e72b1`
   - Logged in audit trail with actor `mcp:claude`
2. **Dashboard queries subscription:**
   - `GET /api/subscriptions/{id}` returns the record created by MCP
3. **User edits subscription in Dashboard:**
   - `PUT /api/subscriptions/{id}` upgrades seats to 25 and updates recurring cost to \$2,150.00
4. **Claude retrieves updated subscription via MCP:**
   - Invokes `get_subscription({id})`
   - Claude verifies the new price (\$2,150.00) and seat capacity (22/25) in real time

---

## 🏗 Architecture & Tech Stack

```
SubControl/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app with static frontend mounting
│   │   ├── config.py            # Pydantic environment configuration
│   │   ├── database.py          # SQLAlchemy PostgreSQL session factory
│   │   ├── models/              # Relational models (Subscriptions, Categories, Payments, Reviews, Savings, Activity)
│   │   ├── schemas/             # Pydantic v2 validation contracts
│   │   ├── services/            # Shared business logic layer (used by REST & MCP)
│   │   ├── routers/             # REST API route handlers
│   │   └── seed.py              # Realistic production demo data seeder
│   ├── mcp_server.py            # Official MCP Python SDK server (stdio transport)
│   ├── run_acceptance_test.py   # Bidirectional MCP <-> UI acceptance test
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # Sidebar, Header, MetricCard, SubscriptionModal
│   │   ├── pages/               # Dashboard, Subscriptions, Detail, Renewals, Savings, Reviews, Activity
│   │   ├── api/client.js        # Axios client
│   │   └── App.jsx
│   ├── dist/                    # Production built assets
│   ├── package.json
│   └── vite.config.js
├── claude_mcp_config.json       # MCP configuration for Claude Desktop
├── run_app.bat                  # One-click Windows runner script
└── README.md
```

### Deterministic Savings Engine (Zero AI Inference)
1. **Unused License Waste:** Detects tools where seat utilization is below 70% with 5+ seats, calculating exact annualized wasted spend.
2. **Redundant Tool Overlap:** Identifies multiple active software products in the same category (e.g., Canva and Figma, or HubSpot and Salesforce).
3. **Annual Switch Arbitrage:** Identifies high-cost tools billed monthly (\$1,200+/yr) that qualify for 15–20% annual prepay discounts.
4. **Renewal Negotiation Leverage:** Flags high-cost contracts (\$5,000+/yr) renewing within 60 days to initiate vendor price concessions.

---

## 🔒 Security & Data Integrity
- Real PostgreSQL database persistence with proper constraints and relational integrity.
- License validation enforced at the service layer: `used_licenses <= license_count`.
- No credentials or secrets committed to frontend code.
- Immutable `activity_log` audit trail tracking every mutation with before/after state diffs.

