from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import (
    PrivateAlbumAccessStatus,
    PrivateAlbumPhotoModerationStatus,
    pg_enum,
)


class PrivateAlbum(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "private_albums"

    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_visible_on_profile: Mapped[bool] = mapped_column(default=True, nullable=False)

    owner = relationship("User", back_populates="private_albums")
    photos = relationship(
        "PrivateAlbumPhoto",
        back_populates="album",
        cascade="all, delete-orphan",
        order_by="PrivateAlbumPhoto.created_at",
    )
    access_requests = relationship(
        "PrivateAlbumAccessRequest",
        back_populates="album",
        cascade="all, delete-orphan",
    )


class PrivateAlbumPhoto(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "private_album_photos"

    album_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("private_albums.id", ondelete="CASCADE"), nullable=False
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    storage_key: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False, default="image/jpeg")
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    moderation_status: Mapped[PrivateAlbumPhotoModerationStatus] = mapped_column(
        pg_enum(PrivateAlbumPhotoModerationStatus, "private_album_photo_moderation_status"),
        nullable=False,
        default=PrivateAlbumPhotoModerationStatus.APPROVED,
    )

    album = relationship("PrivateAlbum", back_populates="photos")
    owner = relationship("User", back_populates="private_album_photos")


class PrivateAlbumAccessRequest(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "private_album_access_requests"
    __table_args__ = (
        CheckConstraint("requester_id != owner_id", name="ck_private_album_access_no_self"),
        Index("ix_private_album_access_album_id", "album_id"),
        Index("ix_private_album_access_requester_id", "requester_id"),
        Index("ix_private_album_access_owner_id", "owner_id"),
        Index("ix_private_album_access_status", "status"),
        UniqueConstraint(
            "album_id",
            "requester_id",
            name="uq_private_album_access_album_requester",
        ),
    )

    album_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("private_albums.id", ondelete="CASCADE"), nullable=False
    )
    requester_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[PrivateAlbumAccessStatus] = mapped_column(
        pg_enum(PrivateAlbumAccessStatus, "private_album_access_status"),
        nullable=False,
        default=PrivateAlbumAccessStatus.PENDING,
    )
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    album = relationship("PrivateAlbum", back_populates="access_requests")
    requester = relationship("User", foreign_keys=[requester_id])
    owner = relationship("User", foreign_keys=[owner_id])
