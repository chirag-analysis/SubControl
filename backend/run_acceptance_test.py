"""Critical Acceptance Test Runner for SubControl.

Verifies:
1. Claude creates a subscription via MCP Tool
2. The subscription appears in the database / API
3. The subscription is edited via API (dashboard simulation)
4. Claude retrieves the updated information via MCP Tool
"""

import json
import os
import sys
from datetime import date
from decimal import Decimal

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app
from mcp_server import (
    create_subscription as mcp_create_subscription,
    get_subscription as mcp_get_subscription,
    update_subscription as mcp_update_subscription,
    get_spend_analytics as mcp_get_spend_analytics,
)

client = TestClient(app)

def run_acceptance_test():
    print("==================================================================")
    print("RUNNING CRITICAL ACCEPTANCE TEST: MCP <-> DASHBOARD BIDIRECTIONAL")
    print("==================================================================")

    # Step 1: Claude creates a subscription via MCP
    print("\n[Step 1] Claude invoking MCP tool 'create_subscription'...")
    mcp_res_raw = mcp_create_subscription(
        name="Snowflake Data Cloud",
        vendor="Snowflake Inc.",
        cost_per_cycle=1850.0,
        billing_cycle="monthly",
        owner="Data Platform Lead",
        start_date=str(date.today()),
        category_name="Engineering & Infrastructure",
        license_count=20,
        used_licenses=12,
        description="Enterprise data warehousing and telemetry analytics",
        notes="Created via Claude MCP Tool during end-to-end verification",
    )
    mcp_result = json.loads(mcp_res_raw)
    assert mcp_result.get("success") is True, f"MCP create failed: {mcp_res_raw}"
    created_sub = mcp_result["subscription"]
    sub_id = created_sub["id"]
    print(f" -> SUCCESS: Subscription created via MCP with ID: {sub_id}")
    print(f"    Name: {created_sub['name']}, Cost: ${created_sub['cost_per_cycle']}/cycle")

    # Step 2: Verify it appears in Dashboard / REST API
    print("\n[Step 2] Dashboard REST API retrieving subscription...")
    api_res = client.get(f"/api/subscriptions/{sub_id}")
    assert api_res.status_code == 200, f"API get failed: {api_res.text}"
    api_sub = api_res.json()
    assert api_sub["name"] == "Snowflake Data Cloud"
    assert api_sub["cost_per_cycle"] == "1850.00"
    print(f" -> SUCCESS: Subscription retrieved from API matching MCP data exactly.")

    # Step 3: User edits the subscription in Dashboard
    print("\n[Step 3] User editing subscription in Dashboard (PUT /api/subscriptions)...")
    edit_payload = {
        "cost_per_cycle": 2150.0,
        "license_count": 25,
        "used_licenses": 22,
        "notes": "Upgraded tier to 25 seats via Dashboard UI",
    }
    edit_res = client.put(f"/api/subscriptions/{sub_id}", json=edit_payload)
    assert edit_res.status_code == 200, f"API edit failed: {edit_res.text}"
    print(f" -> SUCCESS: Dashboard updated cost to $2150.00 and seats to 25.")

    # Step 4: Claude retrieves the updated information via MCP tool
    print("\n[Step 4] Claude invoking MCP tool 'get_subscription'...")
    mcp_get_raw = mcp_get_subscription(subscription_id=sub_id)
    mcp_data = json.loads(mcp_get_raw)
    assert mcp_data["name"] == "Snowflake Data Cloud"
    assert mcp_data["cost_per_cycle"] == 2150.0, f"Expected 2150.0, got {mcp_data['cost_per_cycle']}"
    assert mcp_data["license_count"] == 25, f"Expected 25, got {mcp_data['license_count']}"
    assert mcp_data["used_licenses"] == 22, f"Expected 22, got {mcp_data['used_licenses']}"
    assert "Upgraded tier to 25 seats" in mcp_data["notes"]
    print(f" -> SUCCESS: Claude retrieved updated state via MCP tool:")
    print(f"    Updated Cost: ${mcp_data['cost_per_cycle']}")
    print(f"    Updated Seats: {mcp_data['used_licenses']} / {mcp_data['license_count']}")
    print(f"    Updated Notes: {mcp_data['notes']}")

    # Step 5: Verify MCP Spend Analytics
    print("\n[Step 5] Claude invoking MCP tool 'get_spend_analytics'...")
    analytics_raw = mcp_get_spend_analytics()
    analytics_data = json.loads(analytics_raw)
    print(f" -> Total Monthly Spend: ${analytics_data['total_monthly_spend']}")
    print(f"    Active Subscriptions: {analytics_data['active_subscriptions']}")
    print(f"    Identified Annual Savings: ${analytics_data['potential_annual_savings']}")

    print("\n==================================================================")
    print("ALL ACCEPTANCE CRITERIA VERIFIED & CONFIRMED WORKING!")
    print("==================================================================")

if __name__ == "__main__":
    run_acceptance_test()
