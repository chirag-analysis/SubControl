"""Pydantic schemas for RenewalReview operations."""

from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    subscription_id: UUID
    review_date: date
    decision: Literal["approve", "cancel", "downgrade", "renegotiate", "pending"] = (
        "pending"
    )
    reviewer: str = Field(..., min_length=1, max_length=150)
    notes: Optional[str] = None
    previous_cost: Optional[Decimal] = None
    proposed_cost: Optional[Decimal] = None


class ReviewUpdate(BaseModel):
    decision: Optional[
        Literal["approve", "cancel", "downgrade", "renegotiate", "pending"]
    ] = None
    notes: Optional[str] = None
    proposed_cost: Optional[Decimal] = None


class ReviewResponse(BaseModel):
    id: UUID
    subscription_id: UUID
    review_date: date
    decision: str
    reviewer: str
    notes: Optional[str] = None
    previous_cost: Optional[Decimal] = None
    proposed_cost: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime
    subscription_name: Optional[str] = None

    model_config = {"from_attributes": True}

