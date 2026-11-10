"""Category service — manages subscription categories."""

import uuid
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..models.category import Category
from ..models.subscription import Subscription
from ..schemas.category import CategoryCreate, CategoryUpdate
from .activity_service import log_activity


def get_categories(db: Session) -> list[dict]:
    """List all categories with subscription counts."""
    results = (
        db.query(
            Category,
            func.count(Subscription.id).label("subscription_count"),
        )
        .outerjoin(Subscription, Subscription.category_id == Category.id)
        .group_by(Category.id)
        .order_by(Category.name)
        .all()
    )

    categories = []
    for cat, count in results:
        categories.append(
            {
                "id": cat.id,
                "name": cat.name,
                "description": cat.description,
                "budget_limit": cat.budget_limit,
                "created_at": cat.created_at,
                "updated_at": cat.updated_at,
                "subscription_count": count,
            }
        )
    return categories


def get_category_by_id(db: Session, category_id: uuid.UUID) -> Optional[Category]:
    return db.query(Category).filter(Category.id == category_id).first()


def create_category(
    db: Session, data: CategoryCreate, performed_by: str = "web_ui"
) -> Category:
    existing = db.query(Category).filter(Category.name == data.name).first()
    if existing:
        raise ValueError(f"Category '{data.name}' already exists")

    cat = Category(
        name=data.name,
        description=data.description,
        budget_limit=data.budget_limit,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)

    log_activity(
        db,
        entity_type="category",
        entity_id=cat.id,
        action="created",
        performed_by=performed_by,
        changes={"name": {"old": None, "new": cat.name}},
    )
    db.commit()
    return cat


def update_category(
    db: Session,
    category_id: uuid.UUID,
    data: CategoryUpdate,
    performed_by: str = "web_ui",
) -> Optional[Category]:
    cat = get_category_by_id(db, category_id)
    if not cat:
        return None

    changes = {}
    for field, value in data.model_dump(exclude_unset=True).items():
        old_val = getattr(cat, field)
        if old_val != value:
            changes[field] = {"old": str(old_val), "new": str(value)}
            setattr(cat, field, value)

    if changes:
        log_activity(
            db,
            entity_type="category",
            entity_id=cat.id,
            action="updated",
            performed_by=performed_by,
            changes=changes,
        )
        db.commit()
        db.refresh(cat)

    return cat
