from __future__ import annotations

import uuid

from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import Gender, RelationshipIntention, pg_enum


class Profile(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    relationship_intention: Mapped[RelationshipIntention] = mapped_column(
        pg_enum(RelationshipIntention, "relationship_intention"),
        default=RelationshipIntention.UNSURE,
        nullable=False,
    )
    looking_for_genders: Mapped[list[Gender]] = mapped_column(
        ARRAY(pg_enum(Gender, "gender", create_type=False)), nullable=False, default=list
    )
    min_age: Mapped[int] = mapped_column(Integer, default=18, nullable=False)
    max_age: Mapped[int] = mapped_column(Integer, default=99, nullable=False)
    max_distance_km: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    preferred_intentions: Mapped[list[RelationshipIntention]] = mapped_column(
        ARRAY(pg_enum(RelationshipIntention, "relationship_intention", create_type=False)),
        nullable=False,
        default=list,
    )
    preferred_countries: Mapped[list[str]] = mapped_column(
        ARRAY(String(2)), nullable=False, default=list
    )
    occupation: Mapped[str | None] = mapped_column(String(150), nullable=True)
    partner_first_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    partner_gender: Mapped[Gender | None] = mapped_column(
        pg_enum(Gender, "gender", create_type=False), nullable=True
    )
    partner_date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="profile")
    photos: Mapped[list["Photo"]] = relationship(
        "Photo", back_populates="profile", cascade="all, delete-orphan", order_by="Photo.sort_order"
    )
    interests: Mapped[list["Interest"]] = relationship(
        "Interest", back_populates="profile", cascade="all, delete-orphan"
    )
    fantasies: Mapped[list["ProfileFantasy"]] = relationship(
        "ProfileFantasy", back_populates="profile", cascade="all, delete-orphan"
    )


class Photo(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "photos"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    is_primary: Mapped[bool] = mapped_column(default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    profile: Mapped["Profile"] = relationship("Profile", back_populates="photos")


class ProfileFantasy(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "profile_fantasies"
    __table_args__ = (UniqueConstraint("profile_id", "tag", name="uq_profile_fantasy_tag"),)

    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    tag: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)

    profile: Mapped["Profile"] = relationship("Profile", back_populates="fantasies")


class Interest(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "interests"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)

    profile: Mapped["Profile"] = relationship("Profile", back_populates="interests")
