"""Renewal review service — handles review decisions and workflow."""

import uuid
from typing import Optional

from sqlalchemy.orm import Session, joinedload

from ..models.review import RenewalReview
from ..models.subscription import Subscription
from ..schemas.review import ReviewCreate, ReviewUpdate
from .activity_service import log_activity


def get_reviews(
    db: Session,
    subscription_id: Optional[uuid.UUID] = None,
    decision: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> list[dict]:
    query = (
        db.query(RenewalReview)
        .options(joinedload(RenewalReview.subscription))
        .order_by(RenewalReview.review_date.desc())
    )
    if subscription_id:
        query = query.filter(RenewalReview.subscription_id == subscription_id)
    if decision:
        query = query.filter(RenewalReview.decision == decision)

    reviews = query.offset(offset).limit(limit).all()
    return [
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
            "subscription_name": r.subscription.name if r.subscription else None,
        }
        for r in reviews
    ]


def create_review(
    db: Session, data: ReviewCreate, performed_by: str = "web_ui"
) -> RenewalReview:
    sub = db.query(Subscription).filter(Subscription.id == data.subscription_id).first()
    if not sub:
        raise ValueError("Subscription not found")

    prev_cost = data.previous_cost or sub.cost_per_cycle

    review = RenewalReview(
        subscription_id=data.subscription_id,
        review_date=data.review_date,
        decision=data.decision,
        reviewer=data.reviewer,
        notes=data.notes,
        previous_cost=prev_cost,
        proposed_cost=data.proposed_cost,
    )
    db.add(review)

    # If decision is cancel, update subscription status
    if data.decision == "cancel":
        sub.status = "cancelled"
        sub.end_date = data.review_date

    db.commit()
    db.refresh(review)

    log_activity(
        db,
        entity_type="review",
        entity_id=review.id,
        action="created",
        performed_by=performed_by,
        changes={
            "decision": {"old": None, "new": review.decision},
            "subscription": {"old": None, "new": sub.name},
        },
    )
    db.commit()
    return review


def update_review(
    db: Session,
    review_id: uuid.UUID,
    data: ReviewUpdate,
    performed_by: str = "web_ui",
) -> Optional[RenewalReview]:
    review = db.query(RenewalReview).filter(RenewalReview.id == review_id).first()
    if not review:
        return None

    changes = {}
    for field, val in data.model_dump(exclude_unset=True).items():
        old_val = getattr(review, field)
        if old_val != val:
            changes[field] = {"old": str(old_val), "new": str(val)}
            setattr(review, field, val)

    if changes:
        log_activity(
            db,
            entity_type="review",
            entity_id=review.id,
            action="updated",
            performed_by=performed_by,
            changes=changes,
        )
        db.commit()
        db.refresh(review)

    return review
