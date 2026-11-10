"""Analytics router."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..services import (
    get_overview_metrics,
    get_spend_by_category,
    get_spend_trend,
    get_top_vendors,
    get_upcoming_renewals,
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview")
def overview_endpoint(db: Session = Depends(get_db)):
    return get_overview_metrics(db)


@router.get("/spend-by-category")
def spend_by_category_endpoint(db: Session = Depends(get_db)):
    return get_spend_by_category(db)


@router.get("/spend-trend")
def spend_trend_endpoint(db: Session = Depends(get_db)):
    return get_spend_trend(db)


@router.get("/top-vendors")
def top_vendors_endpoint(
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    return get_top_vendors(db, limit=limit)


@router.get("/upcoming-renewals")
def upcoming_renewals_endpoint(
    days: int = Query(90, ge=1, le=365),
    db: Session = Depends(get_db),
):
    return get_upcoming_renewals(db, days=days)
