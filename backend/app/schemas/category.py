"""Pydantic schemas for Category CRUD operations."""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    budget_limit: Optional[Decimal] = Field(None, ge=0)


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    budget_limit: Optional[Decimal] = Field(None, ge=0)


class CategoryResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    budget_limit: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime
    subscription_count: int = 0

    model_config = {"from_attributes": True}

