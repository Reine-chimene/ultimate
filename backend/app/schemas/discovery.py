from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.profile import PublicProfileResponse


class DiscoveryFilters(BaseModel):
    min_age: int | None = Field(default=None, ge=18, le=99)
    max_age: int | None = Field(default=None, ge=18, le=99)
    city: str | None = None
    available_tonight: bool = False
    limit: int = Field(default=20, ge=1, le=50)


class DiscoveryResponse(BaseModel):
    profiles: list[PublicProfileResponse]
    total: int


class LikeActionRequest(BaseModel):
    receiver_id: UUID
    is_like: bool = True


class LikeActionResponse(BaseModel):
    is_like: bool
    is_match: bool
    match_id: UUID | None = None
