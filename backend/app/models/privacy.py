from __future__ import annotations

import uuid

from sqlalchemy import Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class UserPrivacySettings(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "user_privacy_settings"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    show_online: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    show_last_seen: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # Reserved for P1-A.2 — not exposed via API in P1-A.1
    incognito_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="privacy_settings")
