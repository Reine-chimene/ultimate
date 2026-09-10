from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import Gender, RelationshipIntention
from app.schemas.common import ORMModel, TimestampSchema


class PhotoCreate(BaseModel):
    url: str = Field(max_length=500)
    is_primary: bool = False
    sort_order: int = 0


class PhotoResponse(ORMModel, TimestampSchema):
    id: UUID
    url: str
    is_primary: bool
    sort_order: int


class InterestCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class InterestResponse(ORMModel, TimestampSchema):
    id: UUID
    name: str


class ProfileUpdate(BaseModel):
    bio: str | None = Field(default=None, max_length=2000)
    relationship_intention: RelationshipIntention | None = None
    looking_for_genders: list[Gender] | None = None
    min_age: int | None = Field(default=None, ge=18, le=99)
    max_age: int | None = Field(default=None, ge=18, le=99)
    max_distance_km: int | None = Field(default=None, ge=1, le=500)
    occupation: str | None = Field(default=None, max_length=150)


class ProfileResponse(ORMModel, TimestampSchema):
    id: UUID
    user_id: UUID
    bio: str | None
    relationship_intention: RelationshipIntention
    looking_for_genders: list[Gender]
    min_age: int
    max_age: int
    max_distance_km: int
    occupation: str | None
    photos: list[PhotoResponse] = []
    interests: list[InterestResponse] = []


class PublicProfileResponse(ORMModel):
    id: UUID
    user_id: UUID
    first_name: str
    age: int
    gender: Gender
    city: str
    bio: str | None
    relationship_intention: RelationshipIntention
    occupation: str | None
    photos: list[PhotoResponse] = []
    interests: list[InterestResponse] = []
    compatibility_score: float | None = None
    is_available_tonight: bool = False
