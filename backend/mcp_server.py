"""SubControl MCP Server.

Provides Model Context Protocol tools for AI agents (like Claude)
to interact with SubControl using the exact same database and service
layer as the web application.

Run via stdio transport:
    python backend/mcp_server.py
"""

import json
import os
import sys
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from mcp.server.mcpserver import MCPServer

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import SessionLocal
from app.models.category import Category
from app.schemas.review import ReviewCreate
from app.schemas.subscription import SubscriptionCreate, SubscriptionUpdate
import app.services.subscription_service as sub_svc
import app.services.analytics_service as analytics_svc
import app.services.review_service as review_svc
import app.services.savings_service as savings_svc
import app.services.activity_service as activity_svc

# Initialize MCP Server
server = MCPServer(
    name="subcontrol",
    description="SaaS Subscription Management and Recurring Spend Intelligence MCP Server",
    version="1.0.0",
)


def _serialize(obj: Any) -> Any:
    """Helper to convert dates, decimals, and UUIDs to JSON-serializable primitives."""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, UUID):
        return str(obj)
    if isinstance(obj, dict):
        return {k: _serialize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_serialize(item) for item in obj]
    return obj


@server.tool()
def list_subscriptions(
    status: Optional[str] = None,
    owner: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
) -> str:
    """List subscriptions from SubControl with optional filters.

    Args:
        status: Filter by status ('active', 'paused', 'cancelled', 'trial', 'pending_review')
        owner: Filter by owner name or team
        search: Free-text search matching name, vendor, or description
        limit: Max subscriptions to return (default 50)
    """
    db = SessionLocal()
    try:
        subs = sub_svc.get_subscriptions(
            db=db,
            status=status,
            owner=owner,
            search=search,
            limit=limit,
        )
        return json.dumps(_serialize(subs), indent=2)
    finally:
        db.close()


@server.tool()
def get_subscription(subscription_id: str) -> str:
    """Get full details of a specific subscription, including payment history,

    renewal reviews, and detected savings opportunities.

    Args:
        subscription_id: The UUID of the subscription
    """
    db = SessionLocal()
    try:
        sub_uuid = UUID(subscription_id)
        sub = sub_svc.get_subscription_detail(db, sub_uuid)
        if not sub:
            return json.dumps({"error": f"Subscription '{subscription_id}' not found"})
        return json.dumps(_serialize(sub), indent=2)
    except ValueError as e:
        return json.dumps({"error": f"Invalid subscription ID or data: {str(e)}"})
    finally:
        db.close()


@server.tool()
def create_subscription(
    name: str,
    vendor: str,
    cost_per_cycle: float,
    billing_cycle: str,
    owner: str,
    start_date: str,
    category_name: Optional[str] = None,
    license_count: Optional[int] = None,
    used_licenses: Optional[int] = None,
    payment_method: Optional[str] = None,
    description: Optional[str] = None,
    notes: Optional[str] = None,
) -> str:
    """Create a new SaaS subscription in SubControl.

    Args:
        name: Product or tool name (e.g. 'Figma Organization', 'Datadog APM')
        vendor: Vendor or company name (e.g. 'Figma', 'Datadog')
        cost_per_cycle: Amount charged per billing cycle
        billing_cycle: One of 'monthly', 'quarterly', 'annual'
        owner: Team or employee responsible for this tool
        start_date: Start date in ISO format (YYYY-MM-DD)
        category_name: Optional category (e.g. 'Engineering & Infrastructure', 'Design & Creative', 'Productivity & Collaboration', 'Sales & Marketing', 'Security & Compliance')
        license_count: Optional total purchased seats
        used_licenses: Optional currently used seats
        payment_method: e.g. 'credit_card', 'invoice', 'wire'
        description: Brief description of purpose
        notes: Internal notes or contract references
    """
    db = SessionLocal()
    try:
        parsed_date = date.fromisoformat(start_date)
        cat_id = None
        if category_name:
            cat = (
                db.query(Category)
                .filter(Category.name.ilike(f"%{category_name}%"))
                .first()
            )
            if cat:
                cat_id = cat.id

        payload = SubscriptionCreate(
            name=name,
            vendor=vendor,
            description=description,
            category_id=cat_id,
            cost_per_cycle=Decimal(str(cost_per_cycle)),
            billing_cycle=billing_cycle,  # type: ignore
            start_date=parsed_date,
            owner=owner,
            license_count=license_count,
            used_licenses=used_licenses,
            payment_method=payment_method,
            notes=notes,
        )

        sub = sub_svc.create_subscription(db, payload, performed_by="mcp:claude")
        detail = sub_svc.get_subscription_detail(db, sub.id)
        return json.dumps(
            {
                "success": True,
                "message": f"Subscription '{name}' created successfully",
                "subscription": _serialize(detail),
            },
            indent=2,
        )
    except Exception as e:
        db.rollback()
        return json.dumps({"error": str(e)})
    finally:
        db.close()


@server.tool()
def update_subscription(
    subscription_id: str,
    name: Optional[str] = None,
    vendor: Optional[str] = None,
    cost_per_cycle: Optional[float] = None,
    billing_cycle: Optional[str] = None,
    owner: Optional[str] = None,
    status: Optional[str] = None,
    license_count: Optional[int] = None,
    used_licenses: Optional[int] = None,
    notes: Optional[str] = None,
) -> str:
    """Update an existing subscription in SubControl.

    Args:
        subscription_id: UUID of the subscription to update
        name: Updated name
        vendor: Updated vendor
        cost_per_cycle: Updated cost per cycle
        billing_cycle: 'monthly', 'quarterly', or 'annual'
        owner: Updated owner name
        status: 'active', 'paused', 'cancelled', 'trial', or 'pending_review'
        license_count: Total purchased seats
        used_licenses: Active seats
        notes: Additional notes or reasons for change
    """
    db = SessionLocal()
    try:
        sub_uuid = UUID(subscription_id)
        update_data: dict[str, Any] = {}
        if name is not None:
            update_data["name"] = name
        if vendor is not None:
            update_data["vendor"] = vendor
        if cost_per_cycle is not None:
            update_data["cost_per_cycle"] = Decimal(str(cost_per_cycle))
        if billing_cycle is not None:
            update_data["billing_cycle"] = billing_cycle
        if owner is not None:
            update_data["owner"] = owner
        if status is not None:
            update_data["status"] = status
        if license_count is not None:
            update_data["license_count"] = license_count
        if used_licenses is not None:
            update_data["used_licenses"] = used_licenses
        if notes is not None:
            update_data["notes"] = notes

        payload = SubscriptionUpdate(**update_data)
        updated = sub_svc.update_subscription(
            db, sub_uuid, payload, performed_by="mcp:claude"
        )
        if not updated:
            return json.dumps({"error": f"Subscription '{subscription_id}' not found"})

        detail = sub_svc.get_subscription_detail(db, sub_uuid)
        return json.dumps(
            {
                "success": True,
                "message": f"Subscription '{updated.name}' updated successfully",
                "subscription": _serialize(detail),
            },
            indent=2,
        )
    except Exception as e:
        db.rollback()
        return json.dumps({"error": str(e)})
    finally:
        db.close()


@server.tool()
def cancel_subscription(subscription_id: str, reason: Optional[str] = None) -> str:
    """Cancel a subscription in SubControl (soft delete / status change).

    Args:
        subscription_id: The UUID of the subscription to cancel
        reason: Justification or context for the cancellation
    """
    db = SessionLocal()
    try:
        sub_uuid = UUID(subscription_id)
        cancelled = sub_svc.cancel_subscription(
            db, sub_uuid, reason=reason, performed_by="mcp:claude"
        )
        if not cancelled:
            return json.dumps({"error": f"Subscription '{subscription_id}' not found"})
        return json.dumps(
            {
                "success": True,
                "message": f"Subscription '{cancelled.name}' marked as cancelled",
                "end_date": str(cancelled.end_date),
            },
            indent=2,
        )
    except Exception as e:
        db.rollback()
        return json.dumps({"error": str(e)})
    finally:
        db.close()


@server.tool()
def get_spend_analytics() -> str:
    """Get high-level recurring spend intelligence and KPIs (monthly spend,

    annual spend, license utilization, savings potential, etc.).
    """
    db = SessionLocal()
    try:
        metrics = analytics_svc.get_overview_metrics(db)
        return json.dumps(_serialize(metrics), indent=2)
    finally:
        db.close()


@server.tool()
def get_upcoming_renewals(days: int = 60) -> str:
    """Get upcoming subscription renewals grouped by urgency within the specified timeframe.

    Args:
        days: Lookahead window in days (default 60)
    """
    db = SessionLocal()
    try:
        renewals = analytics_svc.get_upcoming_renewals(db, days=days)
        return json.dumps(_serialize(renewals), indent=2)
    finally:
        db.close()


@server.tool()
def detect_savings() -> str:
    """Run SubControl's deterministic rule engine to discover cost-saving opportunities

    (unused licenses, duplicate category tools, annual switch savings, renewal leverage).
    """
    db = SessionLocal()
    try:
        new_opps = savings_svc.detect_savings_opportunities(db)
        all_opps = savings_svc.get_savings_opportunities(db, status="identified")
        return json.dumps(
            {
                "newly_detected_count": len(new_opps),
                "total_active_opportunities": len(all_opps),
                "opportunities": _serialize(all_opps),
            },
            indent=2,
        )
    finally:
        db.close()


@server.tool()
def create_renewal_review(
    subscription_id: str,
    decision: str,
    reviewer: str,
    notes: Optional[str] = None,
    proposed_cost: Optional[float] = None,
) -> str:
    """Record an official renewal review decision for a subscription.

    Args:
        subscription_id: UUID of the subscription
        decision: One of 'approve', 'cancel', 'downgrade', 'renegotiate', 'pending'
        reviewer: Name or email of reviewer
        notes: Rationale or negotiation notes
        proposed_cost: Proposed new cost per cycle (if negotiating or downsizing)
    """
    db = SessionLocal()
    try:
        sub_uuid = UUID(subscription_id)
        cost_dec = Decimal(str(proposed_cost)) if proposed_cost is not None else None
        payload = ReviewCreate(
            subscription_id=sub_uuid,
            review_date=date.today(),
            decision=decision,  # type: ignore
            reviewer=reviewer,
            notes=notes,
            proposed_cost=cost_dec,
        )
        rev = review_svc.create_review(db, payload, performed_by="mcp:claude")
        return json.dumps(
            {
                "success": True,
                "message": f"Review recorded for decision '{decision}'",
                "review_id": str(rev.id),
            },
            indent=2,
        )
    except Exception as e:
        db.rollback()
        return json.dumps({"error": str(e)})
    finally:
        db.close()


@server.tool()
def get_activity_log(limit: int = 25) -> str:
    """Retrieve recent audit activity log entries showing changes made by UI or MCP.

    Args:
        limit: Number of entries to return (default 25)
    """
    db = SessionLocal()
    try:
        entries = activity_svc.get_activity_log(db, limit=limit)
        serialized = [
            {
                "id": str(e.id),
                "entity_type": e.entity_type,
                "entity_id": str(e.entity_id),
                "action": e.action,
                "performed_by": e.performed_by,
                "performed_at": e.performed_at.isoformat(),
                "changes": e.changes,
            }
            for e in entries
        ]
        return json.dumps(serialized, indent=2)
    finally:
        db.close()


if __name__ == "__main__":
    # Run standalone stdio server for Claude or MCP client
    server.run()
