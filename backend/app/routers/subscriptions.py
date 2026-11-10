"""Subscription router."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.subscription import (
    SubscriptionCreate,
    SubscriptionDetailResponse,
    SubscriptionResponse,
    SubscriptionUpdate,
)
from ..services import (
    cancel_subscription,
    create_subscription,
    get_subscription_detail,
    get_subscriptions,
    update_subscription,
)

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


@router.get("", response_model=list[SubscriptionResponse])
def list_subscriptions_endpoint(
    status: Optional[str] = Query(None, description="Filter by status (e.g. active, paused)"),
    category_id: Optional[UUID] = Query(None, description="Filter by category ID"),
    owner: Optional[str] = Query(None, description="Filter by owner"),
    search: Optional[str] = Query(None, description="Search term for name, vendor, description"),
    sort_by: str = Query("name", description="Field to sort by"),
    order: str = Query("asc", description="Sort direction (asc or desc)"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return get_subscriptions(
        db=db,
        status=status,
        category_id=category_id,
        owner=owner,
        search=search,
        sort_by=sort_by,
        order=order,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def create_subscription_endpoint(
    payload: SubscriptionCreate,
    db: Session = Depends(get_db),
):
    try:
        sub = create_subscription(db, payload, performed_by="web_ui")
        return get_subscription_detail(db, sub.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{subscription_id}", response_model=SubscriptionDetailResponse)
def get_subscription_endpoint(
    subscription_id: UUID,
    db: Session = Depends(get_db),
):
    sub = get_subscription_detail(db, subscription_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return sub


@router.put("/{subscription_id}", response_model=SubscriptionResponse)
def update_subscription_endpoint(
    subscription_id: UUID,
    payload: SubscriptionUpdate,
    db: Session = Depends(get_db),
):
    try:
        sub = update_subscription(db, subscription_id, payload, performed_by="web_ui")
        if not sub:
            raise HTTPException(status_code=404, detail="Subscription not found")
        return get_subscription_detail(db, sub.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{subscription_id}", response_model=SubscriptionResponse)
def cancel_subscription_endpoint(
    subscription_id: UUID,
    reason: Optional[str] = Query(None, description="Reason for cancellation"),
    db: Session = Depends(get_db),
):
    sub = cancel_subscription(db, subscription_id, reason=reason, performed_by="web_ui")
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return get_subscription_detail(db, sub.id)
