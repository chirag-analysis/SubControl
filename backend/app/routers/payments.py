"""Payment history router."""

from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.payment import PaymentCreate, PaymentResponse
from ..services import create_payment, get_payments

router = APIRouter(prefix="/payments", tags=["Payment History"])


@router.get("", response_model=list[PaymentResponse])
def list_payments_endpoint(
    subscription_id: Optional[UUID] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return get_payments(
        db,
        subscription_id=subscription_id,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
    )


@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment_endpoint(
    payload: PaymentCreate,
    db: Session = Depends(get_db),
):
    return create_payment(db, payload, performed_by="web_ui")
