"""Payment service — manages payment records."""

import uuid
from datetime import date
from typing import Optional

from sqlalchemy.orm import Session

from ..models.payment import PaymentHistory
from ..schemas.payment import PaymentCreate
from .activity_service import log_activity


def get_payments(
    db: Session,
    subscription_id: Optional[uuid.UUID] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    limit: int = 100,
) -> list[PaymentHistory]:
    query = db.query(PaymentHistory).order_by(PaymentHistory.payment_date.desc())
    if subscription_id:
        query = query.filter(PaymentHistory.subscription_id == subscription_id)
    if date_from:
        query = query.filter(PaymentHistory.payment_date >= date_from)
    if date_to:
        query = query.filter(PaymentHistory.payment_date <= date_to)
    return query.limit(limit).all()


def create_payment(
    db: Session, data: PaymentCreate, performed_by: str = "web_ui"
) -> PaymentHistory:
    payment = PaymentHistory(
        subscription_id=data.subscription_id,
        amount=data.amount,
        currency=data.currency,
        payment_date=data.payment_date,
        status=data.status,
        invoice_reference=data.invoice_reference,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    log_activity(
        db,
        entity_type="payment",
        entity_id=payment.id,
        action="created",
        performed_by=performed_by,
        changes={"amount": {"old": None, "new": str(payment.amount)}},
    )
    db.commit()
    return payment
