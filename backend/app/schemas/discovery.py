from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import DiscoveryMode, Gender, RelationshipIntention
from app.schemas.profile import PublicProfileResponse


class DiscoveryFilters(BaseModel):
    min_age: int | None = Field(default=None, ge=18, le=99)
    max_age: int | None = Field(default=None, ge=18, le=99)
    city: str | None = None
    country: str | None = Field(default=None, min_length=2, max_length=2)
    gender: Gender | None = None
    intention: RelationshipIntention | None = None
    available_tonight: bool = False
    mode: DiscoveryMode = DiscoveryMode.NEAR_ME
    max_distance_km: int | None = Field(default=None, ge=1, le=500)
    limit: int = Field(default=20, ge=1, le=50)


class DiscoveryResponse(BaseModel):
    profiles: list[PublicProfileResponse]
    total: int


class LikeActionRequest(BaseModel):
    receiver_id: UUID
    is_like: bool = True
    intro_message: str | None = Field(default=None, max_length=150)


class LikeActionResponse(BaseModel):
    is_like: bool
    is_match: bool
    match_id: UUID | None = None
    likes_remaining: int | None = None
