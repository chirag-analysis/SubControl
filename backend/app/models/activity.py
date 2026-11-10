"""ActivityLog model — immutable audit trail for all mutations."""

import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import Index, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class ActivityLog(Base):
    __tablename__ = "activity_log"
    __table_args__ = (
        Index("idx_activity_entity", "entity_type", "entity_id"),
        Index("idx_activity_performed_at", "performed_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    action: Mapped[str] = mapped_column(String(30), nullable=False)
    changes: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    performed_by: Mapped[str] = mapped_column(String(150), nullable=False)
    performed_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), nullable=False
    )

