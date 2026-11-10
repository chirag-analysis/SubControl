"""Deterministic Savings Detection Service.

Pure rule evaluation — zero AI.
Rules:
1. Unused Licenses: utilization < 70% with >= 5 licenses
2. Duplicate Tools: multiple active subscriptions in same category
3. Annual Switch: monthly subscription costing > $1,200/yr (save ~15-20%)
4. High-Cost Renewal: renewal within 60 days with annualized cost > $5,000
"""

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from ..models.savings import SavingsOpportunity
from ..models.subscription import Subscription
from .activity_service import log_activity


def _annualized_cost(cost: Decimal, cycle: str) -> Decimal:
    if cycle == "monthly":
        return cost * 12
    elif cycle == "quarterly":
        return cost * 4
    elif cycle == "annual":
        return cost
    return cost * 12


def get_savings_opportunities(
    db: Session,
    status: Optional[str] = None,
    opportunity_type: Optional[str] = None,
) -> list[dict]:
    query = (
        db.query(SavingsOpportunity)
        .options(joinedload(SavingsOpportunity.subscription))
        .order_by(SavingsOpportunity.detected_at.desc())
    )
    if status:
        query = query.filter(SavingsOpportunity.status == status)
    if opportunity_type:
        query = query.filter(SavingsOpportunity.opportunity_type == opportunity_type)

    opportunities = query.all()
    return [
        {
            "id": o.id,
            "subscription_id": o.subscription_id,
            "opportunity_type": o.opportunity_type,
            "description": o.description,
            "estimated_savings": o.estimated_savings,
            "currency": o.currency,
            "status": o.status,
            "detected_at": o.detected_at,
            "resolved_at": o.resolved_at,
            "subscription_name": o.subscription.name if o.subscription else None,
        }
        for o in opportunities
    ]


def detect_savings_opportunities(db: Session) -> list[dict]:
    """Run all deterministic rules and insert newly found opportunities.

    Skips existing active opportunities of the same type for the same subscription.
    """
    active_subs = (
        db.query(Subscription)
        .filter(Subscription.status == "active")
        .all()
    )

    # Fetch existing active savings to avoid duplicates
    existing = (
        db.query(
            SavingsOpportunity.subscription_id,
            SavingsOpportunity.opportunity_type,
        )
        .filter(SavingsOpportunity.status.in_(["identified", "in_progress"]))
        .all()
    )
    existing_set = set(existing)

    new_opportunities = []
    today = date.today()

    for sub in active_subs:
        annual_cost = _annualized_cost(sub.cost_per_cycle, sub.billing_cycle)

        # Rule 1: Unused licenses (< 70% utilization, >= 5 seats)
        if (
            sub.license_count
            and sub.license_count >= 5
            and sub.used_licenses is not None
        ):
            utilization = sub.used_licenses / sub.license_count
            if utilization < 0.70:
                key = (sub.id, "unused_licenses")
                if key not in existing_set:
                    unused = sub.license_count - sub.used_licenses
                    cost_per_seat = sub.cost_per_cycle / Decimal(sub.license_count)
                    annual_waste = _annualized_cost(
                        cost_per_seat * unused, sub.billing_cycle
                    )
                    opp = SavingsOpportunity(
                        subscription_id=sub.id,
                        opportunity_type="unused_licenses",
                        description=(
                            f"{sub.name}: {unused} of {sub.license_count} seats unused "
                            f"({utilization:.0%} utilization). Downsizing could save "
                            f"${annual_waste:,.2f}/yr."
                        ),
                        estimated_savings=round(annual_waste, 2),
                        currency=sub.currency,
                    )
                    db.add(opp)
                    new_opportunities.append(opp)
                    existing_set.add(key)

        # Rule 3: Annual switch (monthly billing with annual cost > $1,200)
        if sub.billing_cycle == "monthly" and annual_cost >= Decimal("1200"):
            key = (sub.id, "annual_switch")
            if key not in existing_set:
                # 17% average annual discount
                savings = annual_cost * Decimal("0.17")
                opp = SavingsOpportunity(
                    subscription_id=sub.id,
                    opportunity_type="annual_switch",
                    description=(
                        f"{sub.name}: currently billed monthly at "
                        f"${sub.cost_per_cycle}/mo (${annual_cost:,.2f}/yr). "
                        f"Switching to annual billing typically saves ~17% (~${savings:,.2f}/yr)."
                    ),
                    estimated_savings=round(savings, 2),
                    currency=sub.currency,
                )
                db.add(opp)
                new_opportunities.append(opp)
                existing_set.add(key)

        # Rule 4: High-cost renewal approaching (within 60 days, annual > $5,000)
        if (
            sub.next_renewal_date
            and annual_cost >= Decimal("5000")
        ):
            days_until = (sub.next_renewal_date - today).days
            if 0 <= days_until <= 60:
                key = (sub.id, "negotiation")
                if key not in existing_set:
                    savings = annual_cost * Decimal("0.10")  # 10% negotiation target
                    opp = SavingsOpportunity(
                        subscription_id=sub.id,
                        opportunity_type="negotiation",
                        description=(
                            f"{sub.name}: renews in {days_until} days (${annual_cost:,.2f}/yr). "
                            f"Target a 10% renewal negotiation discount (~${savings:,.2f}/yr)."
                        ),
                        estimated_savings=round(savings, 2),
                        currency=sub.currency,
                    )
                    db.add(opp)
                    new_opportunities.append(opp)
                    existing_set.add(key)

    # Rule 2: Duplicate tools in same category
    # Group active subscriptions by category
    category_subs: dict[uuid.UUID, list[Subscription]] = {}
    for sub in active_subs:
        if sub.category_id:
            category_subs.setdefault(sub.category_id, []).append(sub)

    for cat_id, cat_sub_list in category_subs.items():
        if len(cat_sub_list) >= 2:
            # Sort by annual cost descending — the cheaper ones are potential redundancies
            sorted_subs = sorted(
                cat_sub_list,
                key=lambda s: _annualized_cost(s.cost_per_cycle, s.billing_cycle),
                reverse=True,
            )
            # The cheaper ones are candidates for consolidation
            for secondary in sorted_subs[1:]:
                key = (secondary.id, "duplicate_tool")
                if key not in existing_set:
                    secondary_cost = _annualized_cost(
                        secondary.cost_per_cycle, secondary.billing_cycle
                    )
                    primary = sorted_subs[0]
                    opp = SavingsOpportunity(
                        subscription_id=secondary.id,
                        opportunity_type="duplicate_tool",
                        description=(
                            f"Potential redundancy: {secondary.name} (${secondary_cost:,.2f}/yr) "
                            f"shares the same category with {primary.name}. "
                            f"Consolidating could save ${secondary_cost:,.2f}/yr."
                        ),
                        estimated_savings=round(secondary_cost, 2),
                        currency=secondary.currency,
                    )
                    db.add(opp)
                    new_opportunities.append(opp)
                    existing_set.add(key)

    if new_opportunities:
        db.commit()
        for o in new_opportunities:
            db.refresh(o)
            log_activity(
                db,
                entity_type="savings",
                entity_id=o.id,
                action="created",
                performed_by="savings_engine",
                changes={
                    "type": {"old": None, "new": o.opportunity_type},
                    "estimated_savings": {"old": None, "new": str(o.estimated_savings)},
                },
            )
        db.commit()

    return [
        {
            "id": o.id,
            "subscription_id": o.subscription_id,
            "opportunity_type": o.opportunity_type,
            "description": o.description,
            "estimated_savings": o.estimated_savings,
            "currency": o.currency,
            "status": o.status,
            "detected_at": o.detected_at,
            "resolved_at": o.resolved_at,
        }
        for o in new_opportunities
    ]


def update_savings_status(
    db: Session,
    opportunity_id: uuid.UUID,
    new_status: str,
    performed_by: str = "web_ui",
) -> Optional[SavingsOpportunity]:
    opp = (
        db.query(SavingsOpportunity)
        .filter(SavingsOpportunity.id == opportunity_id)
        .first()
    )
    if not opp:
        return None

    old_status = opp.status
    opp.status = new_status
    if new_status in ("realized", "dismissed"):
        opp.resolved_at = datetime.utcnow()

    log_activity(
        db,
        entity_type="savings",
        entity_id=opp.id,
        action="status_changed",
        performed_by=performed_by,
        changes={"status": {"old": old_status, "new": new_status}},
    )
    db.commit()
    db.refresh(opp)
    return opp
