"""Subscription service — core business logic for subscription lifecycle."""

import uuid
from datetime import date, datetime
from dateutil.relativedelta import relativedelta
from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from ..models.subscription import Subscription
from ..schemas.subscription import SubscriptionCreate, SubscriptionUpdate
from .activity_service import log_activity


def _compute_next_renewal(start: date, cycle: str) -> date:
    """Compute the next renewal date based on billing cycle."""
    today = date.today()
    renewal = start
    while renewal <= today:
        if cycle == "monthly":
            renewal += relativedelta(months=1)
        elif cycle == "quarterly":
            renewal += relativedelta(months=3)
        elif cycle == "annual":
            renewal += relativedelta(years=1)
        else:
            renewal += relativedelta(months=1)
    return renewal


def get_subscriptions(
    db: Session,
    status: Optional[str] = None,
    category_id: Optional[uuid.UUID] = None,
    owner: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "name",
    order: str = "asc",
    limit: int = 100,
    offset: int = 0,
) -> list[dict]:
    """List subscriptions with optional filtering, sorting, and pagination."""
    query = db.query(Subscription).options(joinedload(Subscription.category))

    if status:
        query = query.filter(Subscription.status == status)
    if category_id:
        query = query.filter(Subscription.category_id == category_id)
    if owner:
        query = query.filter(Subscription.owner.ilike(f"%{owner}%"))
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Subscription.name.ilike(pattern),
                Subscription.vendor.ilike(pattern),
                Subscription.description.ilike(pattern),
                Subscription.notes.ilike(pattern),
            )
        )

    # Sorting
    sort_column = getattr(Subscription, sort_by, Subscription.name)
    if order.lower() == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    subs = query.offset(offset).limit(limit).all()

    result = []
    for s in subs:
        result.append(
            {
                "id": s.id,
                "name": s.name,
                "vendor": s.vendor,
                "description": s.description,
                "category_id": s.category_id,
                "cost_per_cycle": s.cost_per_cycle,
                "billing_cycle": s.billing_cycle,
                "currency": s.currency,
                "status": s.status,
                "start_date": s.start_date,
                "next_renewal_date": s.next_renewal_date,
                "end_date": s.end_date,
                "owner": s.owner,
                "license_count": s.license_count,
                "used_licenses": s.used_licenses,
                "payment_method": s.payment_method,
                "notes": s.notes,
                "created_at": s.created_at,
                "updated_at": s.updated_at,
                "category_name": s.category.name if s.category else None,
            }
        )
    return result


def get_subscription_detail(
    db: Session, subscription_id: uuid.UUID
) -> Optional[dict]:
    """Get complete subscription details including relations."""
    sub = (
        db.query(Subscription)
        .options(
            joinedload(Subscription.category),
            joinedload(Subscription.payments),
            joinedload(Subscription.reviews),
            joinedload(Subscription.savings),
        )
        .filter(Subscription.id == subscription_id)
        .first()
    )
    if not sub:
        return None

    return {
        "id": sub.id,
        "name": sub.name,
        "vendor": sub.vendor,
        "description": sub.description,
        "category_id": sub.category_id,
        "cost_per_cycle": sub.cost_per_cycle,
        "billing_cycle": sub.billing_cycle,
        "currency": sub.currency,
        "status": sub.status,
        "start_date": sub.start_date,
        "next_renewal_date": sub.next_renewal_date,
        "end_date": sub.end_date,
        "owner": sub.owner,
        "license_count": sub.license_count,
        "used_licenses": sub.used_licenses,
        "payment_method": sub.payment_method,
        "notes": sub.notes,
        "created_at": sub.created_at,
        "updated_at": sub.updated_at,
        "category_name": sub.category.name if sub.category else None,
        "payments": [
            {
                "id": p.id,
                "subscription_id": p.subscription_id,
                "amount": p.amount,
                "currency": p.currency,
                "payment_date": p.payment_date,
                "status": p.status,
                "invoice_reference": p.invoice_reference,
                "created_at": p.created_at,
            }
            for p in sub.payments
        ],
        "reviews": [
            {
                "id": r.id,
                "subscription_id": r.subscription_id,
                "review_date": r.review_date,
                "decision": r.decision,
                "reviewer": r.reviewer,
                "notes": r.notes,
                "previous_cost": r.previous_cost,
                "proposed_cost": r.proposed_cost,
                "created_at": r.created_at,
                "updated_at": r.updated_at,
                "subscription_name": sub.name,
            }
            for r in sub.reviews
        ],
        "savings": [
            {
                "id": so.id,
                "subscription_id": so.subscription_id,
                "opportunity_type": so.opportunity_type,
                "description": so.description,
                "estimated_savings": so.estimated_savings,
                "currency": so.currency,
                "status": so.status,
                "detected_at": so.detected_at,
                "resolved_at": so.resolved_at,
                "subscription_name": sub.name,
            }
            for so in sub.savings
        ],
    }


def create_subscription(
    db: Session, data: SubscriptionCreate, performed_by: str = "web_ui"
) -> Subscription:
    """Create a new subscription and log the event."""
    # Validation: used_licenses <= license_count
    if (
        data.license_count is not None
        and data.used_licenses is not None
        and data.used_licenses > data.license_count
    ):
        raise ValueError(
            f"Used licenses ({data.used_licenses}) cannot exceed "
            f"total license count ({data.license_count})"
        )

    # Auto-compute next renewal date if not provided
    renewal = data.next_renewal_date
    if not renewal:
        renewal = _compute_next_renewal(data.start_date, data.billing_cycle)

    sub = Subscription(
        name=data.name,
        vendor=data.vendor,
        description=data.description,
        category_id=data.category_id,
        cost_per_cycle=data.cost_per_cycle,
        billing_cycle=data.billing_cycle,
        currency=data.currency,
        status=data.status,
        start_date=data.start_date,
        next_renewal_date=renewal,
        owner=data.owner,
        license_count=data.license_count,
        used_licenses=data.used_licenses,
        payment_method=data.payment_method,
        notes=data.notes,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)

    log_activity(
        db,
        entity_type="subscription",
        entity_id=sub.id,
        action="created",
        performed_by=performed_by,
        changes={
            "name": {"old": None, "new": sub.name},
            "cost_per_cycle": {"old": None, "new": str(sub.cost_per_cycle)},
            "billing_cycle": {"old": None, "new": sub.billing_cycle},
            "status": {"old": None, "new": sub.status},
        },
    )
    db.commit()
    return sub


def update_subscription(
    db: Session,
    subscription_id: uuid.UUID,
    data: SubscriptionUpdate,
    performed_by: str = "web_ui",
) -> Optional[Subscription]:
    """Update subscription fields and record diff in activity log."""
    sub = (
        db.query(Subscription)
        .filter(Subscription.id == subscription_id)
        .first()
    )
    if not sub:
        return None

    # Validation: license counts
    new_total = (
        data.license_count
        if data.license_count is not None
        else sub.license_count
    )
    new_used = (
        data.used_licenses
        if data.used_licenses is not None
        else sub.used_licenses
    )
    if new_total is not None and new_used is not None and new_used > new_total:
        raise ValueError(
            f"Used licenses ({new_used}) cannot exceed total license count ({new_total})"
        )

    changes = {}
    update_data = data.model_dump(exclude_unset=True)

    for field, new_val in update_data.items():
        old_val = getattr(sub, field)
        if old_val != new_val:
            changes[field] = {"old": str(old_val), "new": str(new_val)}
            setattr(sub, field, new_val)

    if changes:
        # Check if status changed to cancelled — set end_date
        if (
            "status" in changes
            and changes["status"]["new"] == "cancelled"
            and not sub.end_date
        ):
            sub.end_date = date.today()
            changes["end_date"] = {
                "old": None,
                "new": str(sub.end_date),
            }

        log_activity(
            db,
            entity_type="subscription",
            entity_id=sub.id,
            action="updated",
            performed_by=performed_by,
            changes=changes,
        )
        db.commit()
        db.refresh(sub)

    return sub


def cancel_subscription(
    db: Session,
    subscription_id: uuid.UUID,
    reason: Optional[str] = None,
    performed_by: str = "web_ui",
) -> Optional[Subscription]:
    """Soft-cancel a subscription."""
    sub = (
        db.query(Subscription)
        .filter(Subscription.id == subscription_id)
        .first()
    )
    if not sub:
        return None

    old_status = sub.status
    sub.status = "cancelled"
    sub.end_date = date.today()
    if reason:
        sub.notes = f"{sub.notes or ''}\n[Cancellation Reason]: {reason}".strip()

    log_activity(
        db,
        entity_type="subscription",
        entity_id=sub.id,
        action="status_changed",
        performed_by=performed_by,
        changes={
            "status": {"old": old_status, "new": "cancelled"},
            "end_date": {"old": None, "new": str(sub.end_date)},
        },
    )
    db.commit()
    db.refresh(sub)
    return sub
