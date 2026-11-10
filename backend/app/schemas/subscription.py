"""Pydantic schemas for Subscription CRUD operations."""

from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from .payment import PaymentResponse
from .review import ReviewResponse
from .savings import SavingsResponse


class SubscriptionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    vendor: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    cost_per_cycle: Decimal = Field(..., gt=0)
    billing_cycle: Literal["monthly", "quarterly", "annual"]
    currency: str = Field(default="USD", max_length=3)
    status: Literal["active", "paused", "cancelled", "trial", "pending_review"] = (
        "active"
    )
    start_date: date
    next_renewal_date: Optional[date] = None
    owner: str = Field(..., min_length=1, max_length=150)
    license_count: Optional[int] = Field(None, ge=0)
    used_licenses: Optional[int] = Field(None, ge=0)
    payment_method: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None


class SubscriptionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    vendor: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    cost_per_cycle: Optional[Decimal] = Field(None, gt=0)
    billing_cycle: Optional[Literal["monthly", "quarterly", "annual"]] = None
    currency: Optional[str] = Field(None, max_length=3)
    status: Optional[
        Literal["active", "paused", "cancelled", "trial", "pending_review"]
    ] = None
    next_renewal_date: Optional[date] = None
    owner: Optional[str] = Field(None, min_length=1, max_length=150)
    license_count: Optional[int] = Field(None, ge=0)
    used_licenses: Optional[int] = Field(None, ge=0)
    payment_method: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None


class SubscriptionResponse(BaseModel):
    id: UUID
    name: str
    vendor: str
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    cost_per_cycle: Decimal
    billing_cycle: str
    currency: str
    status: str
    start_date: date
    next_renewal_date: Optional[date] = None
    end_date: Optional[date] = None
    owner: str
    license_count: Optional[int] = None
    used_licenses: Optional[int] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    category_name: Optional[str] = None

    model_config = {"from_attributes": True}


class SubscriptionDetailResponse(SubscriptionResponse):
    payments: list[PaymentResponse] = []
    reviews: list[ReviewResponse] = []
    savings: list[SavingsResponse] = []

