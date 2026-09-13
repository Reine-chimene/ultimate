from pydantic import BaseModel, Field

from app.models.enums import DiscoveryMode, Gender, RelationshipIntention
from app.schemas.profile import PublicProfileResponse


class SearchFilters(BaseModel):
    gender: Gender | None = None
    min_age: int | None = Field(default=None, ge=18, le=99)
    max_age: int | None = Field(default=None, ge=18, le=99)
    country: str | None = Field(default=None, min_length=2, max_length=2)
    city: str | None = None
    max_distance_km: int | None = Field(default=None, ge=1, le=500)
    intention: RelationshipIntention | None = None
    available_tonight: bool = False
    has_photo: bool = False
    online_only: bool = False
    interest_category: str | None = None
    mode: DiscoveryMode = DiscoveryMode.NEAR_ME
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=50)


class SearchResponse(BaseModel):
    profiles: list[PublicProfileResponse]
    total: int
    page: int
    page_size: int
    has_more: bool
