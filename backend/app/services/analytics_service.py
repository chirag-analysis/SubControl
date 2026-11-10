"""Analytics service — spend intelligence and recurring analytics."""

from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Optional

from dateutil.relativedelta import relativedelta
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from ..models.category import Category
from ..models.payment import PaymentHistory
from ..models.savings import SavingsOpportunity
from ..models.subscription import Subscription


def _to_monthly(cost: Decimal, cycle: str) -> Decimal:
    """Normalize cycle cost to monthly equivalent."""
    if cycle == "monthly":
        return cost
    elif cycle == "quarterly":
        return cost / Decimal("3")
    elif cycle == "annual":
        return cost / Decimal("12")
    return cost


def _to_annual(cost: Decimal, cycle: str) -> Decimal:
    """Normalize cycle cost to annual equivalent."""
    if cycle == "monthly":
        return cost * Decimal("12")
    elif cycle == "quarterly":
        return cost * Decimal("4")
    elif cycle == "annual":
        return cost
    return cost * Decimal("12")


def get_overview_metrics(db: Session) -> dict:
    """Compute high-level spend KPIs."""
    active_subs = (
        db.query(Subscription)
        .filter(Subscription.status == "active")
        .all()
    )

    total_monthly_spend = Decimal("0.00")
    total_licenses = 0
    used_licenses = 0

    for sub in active_subs:
        total_monthly_spend += _to_monthly(sub.cost_per_cycle, sub.billing_cycle)
        if sub.license_count:
            total_licenses += sub.license_count
            if sub.used_licenses:
                used_licenses += sub.used_licenses

    total_annual_spend = total_monthly_spend * Decimal("12")
    active_count = len(active_subs)
    avg_cost = (
        (total_monthly_spend / Decimal(active_count)) if active_count > 0 else Decimal("0.00")
    )

    license_utilization = (
        round((used_licenses / total_licenses) * 100, 1)
        if total_licenses > 0
        else 0.0
    )

    # Potential savings
    active_savings = (
        db.query(SavingsOpportunity)
        .filter(SavingsOpportunity.status.in_(["identified", "in_progress"]))
        .all()
    )
    potential_savings_amount = sum(
        (opp.estimated_savings for opp in active_savings), Decimal("0.00")
    )

    # Upcoming renewals within 30 days
    today = date.today()
    in_30_days = today + timedelta(days=30)
    upcoming_renewals_count = (
        db.query(func.count(Subscription.id))
        .filter(
            Subscription.status == "active",
            Subscription.next_renewal_date.isnot(None),
            Subscription.next_renewal_date <= in_30_days,
            Subscription.next_renewal_date >= today,
        )
        .scalar()
        or 0
    )

    return {
        "active_subscriptions": active_count,
        "total_monthly_spend": round(total_monthly_spend, 2),
        "total_annual_spend": round(total_annual_spend, 2),
        "average_monthly_per_sub": round(avg_cost, 2),
        "potential_annual_savings": round(potential_savings_amount, 2),
        "active_savings_count": len(active_savings),
        "upcoming_renewals_30d": upcoming_renewals_count,
        "total_licenses": total_licenses,
        "used_licenses": used_licenses,
        "license_utilization_rate": license_utilization,
    }


def get_spend_by_category(db: Session) -> list[dict]:
    """Spend breakdown by subscription category."""
    active_subs = (
        db.query(Subscription)
        .options(joinedload(Subscription.category))
        .filter(Subscription.status == "active")
        .all()
    )

    categories_map: dict[str, dict] = {}
    total_monthly = Decimal("0.00")

    for sub in active_subs:
        cat_name = sub.category.name if sub.category else "Uncategorized"
        monthly = _to_monthly(sub.cost_per_cycle, sub.billing_cycle)
        total_monthly += monthly

        if cat_name not in categories_map:
            categories_map[cat_name] = {
                "category": cat_name,
                "monthly_spend": Decimal("0.00"),
                "annual_spend": Decimal("0.00"),
                "count": 0,
            }

        categories_map[cat_name]["monthly_spend"] += monthly
        categories_map[cat_name]["annual_spend"] += monthly * Decimal("12")
        categories_map[cat_name]["count"] += 1

    results = []
    for cat_data in categories_map.values():
        pct = (
            round((cat_data["monthly_spend"] / total_monthly) * 100, 1)
            if total_monthly > 0
            else 0.0
        )
        results.append(
            {
                "category": cat_data["category"],
                "monthly_spend": round(cat_data["monthly_spend"], 2),
                "annual_spend": round(cat_data["annual_spend"], 2),
                "subscription_count": cat_data["count"],
                "percentage": pct,
            }
        )

    results.sort(key=lambda x: x["monthly_spend"], reverse=True)
    return results


def get_spend_trend(db: Session) -> list[dict]:
    """Historical or projected 12-month spend trend.
    
    Combines recorded payment history with monthly recurring baselines.
    """
    today = date.today()
    months = []
    
    # Generate past 6 months and next 6 months projection
    for i in range(-5, 7):
        target_month_date = today + relativedelta(months=i)
        month_label = target_month_date.strftime("%b %Y")
        month_start = date(target_month_date.year, target_month_date.month, 1)
        next_month = month_start + relativedelta(months=1)

        # Actual payments in this month if in past or current
        actual_payments = (
            db.query(func.coalesce(func.sum(PaymentHistory.amount), Decimal("0.00")))
            .filter(
                PaymentHistory.status == "completed",
                PaymentHistory.payment_date >= month_start,
                PaymentHistory.payment_date < next_month,
            )
            .scalar()
        ) or Decimal("0.00")

        # Active recurring baseline
        active_subs = (
            db.query(Subscription)
            .filter(
                Subscription.status == "active",
                Subscription.start_date <= next_month,
                or_(Subscription.end_date.is_(None), Subscription.end_date >= month_start),
            )
            .all()
        )
        projected = sum(
            (_to_monthly(s.cost_per_cycle, s.billing_cycle) for s in active_subs),
            Decimal("0.00"),
        )

        months.append(
            {
                "month": month_label,
                "is_projected": i > 0,
                "actual_spend": round(actual_payments, 2) if actual_payments > 0 else None,
                "projected_spend": round(projected, 2),
            }
        )

    return months


def get_top_vendors(db: Session, limit: int = 5) -> list[dict]:
    """Top vendors ranked by annualized spend."""
    active_subs = (
        db.query(Subscription)
        .filter(Subscription.status == "active")
        .all()
    )

    vendor_map: dict[str, dict] = {}
    for sub in active_subs:
        ann = _to_annual(sub.cost_per_cycle, sub.billing_cycle)
        mon = _to_monthly(sub.cost_per_cycle, sub.billing_cycle)
        if sub.vendor not in vendor_map:
            vendor_map[sub.vendor] = {
                "vendor": sub.vendor,
                "annual_spend": Decimal("0.00"),
                "monthly_spend": Decimal("0.00"),
                "subscription_count": 0,
            }
        vendor_map[sub.vendor]["annual_spend"] += ann
        vendor_map[sub.vendor]["monthly_spend"] += mon
        vendor_map[sub.vendor]["subscription_count"] += 1

    vendor_list = [
        {
            "vendor": v["vendor"],
            "annual_spend": round(v["annual_spend"], 2),
            "monthly_spend": round(v["monthly_spend"], 2),
            "subscription_count": v["subscription_count"],
        }
        for v in vendor_map.values()
    ]
    vendor_list.sort(key=lambda x: x["annual_spend"], reverse=True)
    return vendor_list[:limit]


def get_upcoming_renewals(db: Session, days: int = 90) -> list[dict]:
    """Upcoming subscription renewals categorized into urgency tiers."""
    today = date.today()
    cutoff = today + timedelta(days=days)

    subs = (
        db.query(Subscription)
        .options(joinedload(Subscription.category))
        .filter(
            Subscription.status == "active",
            Subscription.next_renewal_date.isnot(None),
            Subscription.next_renewal_date <= cutoff,
        )
        .order_by(Subscription.next_renewal_date.asc())
        .all()
    )

    results = []
    for s in subs:
        if not s.next_renewal_date:
            continue
        days_remaining = (s.next_renewal_date - today).days

        if days_remaining < 0:
            urgency = "overdue"
        elif days_remaining <= 7:
            urgency = "critical"
        elif days_remaining <= 30:
            urgency = "high"
        elif days_remaining <= 60:
            urgency = "medium"
        else:
            urgency = "low"

        results.append(
            {
                "id": s.id,
                "name": s.name,
                "vendor": s.vendor,
                "cost_per_cycle": s.cost_per_cycle,
                "billing_cycle": s.billing_cycle,
                "currency": s.currency,
                "next_renewal_date": s.next_renewal_date,
                "days_remaining": days_remaining,
                "urgency": urgency,
                "owner": s.owner,
                "category_name": s.category.name if s.category else None,
            }
        )
    return results
