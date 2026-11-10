"""Automated backend test suite covering REST APIs, DB operations, and MCP tools."""

import json
import os
import sys
from datetime import date
from decimal import Decimal
from uuid import UUID

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pytest
from fastapi.testclient import TestClient

from app.database import Base, SessionLocal, engine
from app.main import app
from app.models.category import Category
from app.models.subscription import Subscription
from mcp_server import (
    create_subscription as mcp_create_subscription,
    get_subscription as mcp_get_subscription,
    update_subscription as mcp_update_subscription,
)

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_list_categories():
    response = client.get("/api/categories")
    assert response.status_code == 200
    cats = response.json()
    assert isinstance(cats, list)
    assert len(cats) >= 5


def test_list_subscriptions():
    response = client.get("/api/subscriptions")
    assert response.status_code == 200
    subs = response.json()
    assert isinstance(subs, list)
    assert len(subs) >= 10


def test_subscription_license_validation():
    """Verify that used_licenses > license_count is rejected with HTTP 400."""
    payload = {
        "name": "Invalid License Tool",
        "vendor": "Test Vendor",
        "cost_per_cycle": 100.0,
        "billing_cycle": "monthly",
        "start_date": str(date.today()),
        "owner": "Tester",
        "license_count": 10,
        "used_licenses": 15,  # Exceeds total!
    }
    response = client.post("/api/subscriptions", json=payload)
    assert response.status_code == 400
    assert "cannot exceed" in response.json()["detail"].lower()


def test_subscription_crud_lifecycle():
    """Test full CRUD lifecycle via REST API."""
    # 1. Create
    create_payload = {
        "name": "Postman Team Plan",
        "vendor": "Postman Inc.",
        "description": "API collaboration workspace",
        "cost_per_cycle": 144.0,
        "billing_cycle": "monthly",
        "currency": "USD",
        "status": "active",
        "start_date": str(date.today()),
        "owner": "QA Lead",
        "license_count": 12,
        "used_licenses": 8,
    }
    create_res = client.post("/api/subscriptions", json=create_payload)
    assert create_res.status_code == 201
    created = create_res.json()
    sub_id = created["id"]
    assert created["name"] == "Postman Team Plan"
    assert created["cost_per_cycle"] == "144.00"

    # 2. Get Detail
    get_res = client.get(f"/api/subscriptions/{sub_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Postman Team Plan"

    # 3. Update
    update_payload = {
        "cost_per_cycle": 120.0,
        "notes": "Negotiated 15% promotional discount",
    }
    update_res = client.put(f"/api/subscriptions/{sub_id}", json=update_payload)
    assert update_res.status_code == 200
    assert update_res.json()["cost_per_cycle"] == "120.00"

    # 4. Cancel
    cancel_res = client.delete(f"/api/subscriptions/{sub_id}?reason=Migration%20to%20Hoppscotch")
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"
    assert cancel_res.json()["end_date"] is not None


def test_analytics_endpoints():
    """Test spend intelligence endpoints return valid non-null figures."""
    res_overview = client.get("/api/analytics/overview")
    assert res_overview.status_code == 200
    data = res_overview.json()
    assert "total_monthly_spend" in data
    assert "total_annual_spend" in data
    assert data["active_subscriptions"] > 0

    res_cat = client.get("/api/analytics/spend-by-category")
    assert res_cat.status_code == 200
    assert len(res_cat.json()) > 0

    res_trend = client.get("/api/analytics/spend-trend")
    assert res_trend.status_code == 200
    assert len(res_trend.json()) == 12

    res_renewals = client.get("/api/analytics/upcoming-renewals?days=90")
    assert res_renewals.status_code == 200
    assert isinstance(res_renewals.json(), list)


def test_deterministic_savings_detection():
    """Test that detection runs and returns opportunities."""
    res = client.post("/api/savings/detect")
    assert res.status_code == 200
    opps = res.json()
    assert len(opps) > 0
    # Every opportunity must have valid fields
    for o in opps:
        assert o["opportunity_type"] in [
            "unused_licenses",
            "duplicate_tool",
            "downgrade_possible",
            "annual_switch",
            "negotiation",
        ]
        assert float(o["estimated_savings"]) > 0


def test_activity_log():
    """Verify that mutations generate activity log audit records."""
    res = client.get("/api/activity?limit=10")
    assert res.status_code == 200
    entries = res.json()
    assert len(entries) > 0
    assert "entity_type" in entries[0]
    assert "performed_by" in entries[0]


def test_acceptance_criteria_mcp_to_db_roundtrip():
    """CRITICAL ACCEPTANCE TEST:

    1. Claude creates a subscription through MCP tool
    2. The subscription appears in the database / REST API
    3. We edit the subscription via the API (simulating user in dashboard)
    4. Claude retrieves the updated information via MCP tool
    """
    # Step 1: Create via MCP tool
    mcp_result_str = mcp_create_subscription(
        name="Linear Pro Plan",
        vendor="Linear Orbit, Inc.",
        cost_per_cycle=360.0,
        billing_cycle="monthly",
        owner="Engineering Product Team",
        start_date=str(date.today()),
        category_name="Engineering",
        license_count=30,
        used_licenses=26,
        description="Issue tracking and engineering sprints",
        notes="Created autonomously via MCP Tool by Claude",
    )
    mcp_result = json.loads(mcp_result_str)
    assert mcp_result.get("success") is True
    sub_id = mcp_result["subscription"]["id"]

    # Step 2: Verify in DB / REST API (appears in the dashboard)
    api_res = client.get(f"/api/subscriptions/{sub_id}")
    assert api_res.status_code == 200
    api_data = api_res.json()
    assert api_data["name"] == "Linear Pro Plan"
    assert api_data["cost_per_cycle"] == "360.00"
    assert api_data["owner"] == "Engineering Product Team"

    # Step 3: Edit in Dashboard (via REST API)
    edit_payload = {
        "cost_per_cycle": 420.0,
        "license_count": 35,
        "used_licenses": 32,
        "notes": "Upgraded to 35 seats from dashboard",
    }
    edit_res = client.put(f"/api/subscriptions/{sub_id}", json=edit_payload)
    assert edit_res.status_code == 200
    assert edit_res.json()["cost_per_cycle"] == "420.00"

    # Step 4: Claude retrieves the updated information via MCP tool
    mcp_get_str = mcp_get_subscription(subscription_id=sub_id)
    mcp_get_data = json.loads(mcp_get_str)
    assert mcp_get_data["name"] == "Linear Pro Plan"
    assert mcp_get_data["cost_per_cycle"] == 420.0
    assert mcp_get_data["license_count"] == 35
    assert mcp_get_data["used_licenses"] == 32
    assert "Upgraded to 35 seats" in mcp_get_data["notes"]
