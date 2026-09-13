from __future__ import annotations

import uuid

from sqlalchemy import Boolean, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class FeedPost(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "feed_posts"

    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    author = relationship("User", foreign_keys=[author_id])
    likes = relationship("FeedPostLike", back_populates="post", cascade="all, delete-orphan")
    comments = relationship(
        "FeedPostComment",
        back_populates="post",
        cascade="all, delete-orphan",
        order_by="FeedPostComment.created_at",
    )


class FeedPostLike(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "feed_post_likes"
    __table_args__ = (UniqueConstraint("post_id", "user_id", name="uq_feed_post_like"),)

    post_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("feed_posts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    post = relationship("FeedPost", back_populates="likes")
    user = relationship("User")


class FeedPostComment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "feed_post_comments"

    post_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("feed_posts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)

    post = relationship("FeedPost", back_populates="comments")
    author = relationship("User")
