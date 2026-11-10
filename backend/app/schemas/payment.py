"""Pydantic schemas for PaymentHistory operations."""

from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class PaymentCreate(BaseModel):
    subscription_id: UUID
    amount: Decimal = Field(..., gt=0)
    currency: str = Field(default="USD", max_length=3)
    payment_date: date
    status: Literal["completed", "pending", "failed", "refunded"] = "completed"
    invoice_reference: Optional[str] = Field(None, max_length=100)


class PaymentResponse(BaseModel):
    id: UUID
    subscription_id: UUID
    amount: Decimal
    currency: str
    payment_date: date
    status: str
    invoice_reference: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}

