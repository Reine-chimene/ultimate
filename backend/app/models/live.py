from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import pg_enum


class LiveRoomStatus(str, enum.Enum):
    LIVE = "live"
    ENDED = "ended"


class LiveRoom(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "live_rooms"

    host_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[LiveRoomStatus] = mapped_column(
        pg_enum(LiveRoomStatus, "live_room_status", create_type=False),
        default=LiveRoomStatus.LIVE,
        nullable=False,
        index=True,
    )
    viewer_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_vip_only: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    host = relationship("User", foreign_keys=[host_id])
    viewers = relationship("LiveRoomViewer", back_populates="room", cascade="all, delete-orphan")


class LiveRoomViewer(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "live_room_viewers"
    __table_args__ = (UniqueConstraint("room_id", "user_id", name="uq_live_room_viewer"),)

    room_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("live_rooms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    room = relationship("LiveRoom", back_populates="viewers")
    user = relationship("User")
