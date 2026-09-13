from uuid import UUID

from pydantic import BaseModel, Field

from datetime import date

from app.models.enums import AccountType, Gender, RelationshipIntention
from app.schemas.common import ORMModel, TimestampSchema
from app.schemas.fantasies import FantasyResponse


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
    category: str | None = Field(default=None, max_length=50)


class InterestResponse(ORMModel, TimestampSchema):
    id: UUID
    name: str
    category: str | None = None


class CoupleProfileUpdate(BaseModel):
    partner_first_name: str | None = Field(default=None, min_length=2, max_length=100)
    partner_gender: Gender | None = None
    partner_date_of_birth: date | None = None


class ProfileUpdate(BaseModel):
    bio: str | None = Field(default=None, max_length=2000)
    relationship_intention: RelationshipIntention | None = None
    occupation: str | None = Field(default=None, max_length=150)
    city: str | None = Field(default=None, min_length=2, max_length=100)
    country: str | None = Field(default=None, min_length=2, max_length=2)
    timezone: str | None = Field(default=None, min_length=3, max_length=64)
    display_name: str | None = Field(default=None, min_length=2, max_length=50)
    account_type: AccountType | None = None
    partner_first_name: str | None = Field(default=None, min_length=2, max_length=100)
    partner_gender: Gender | None = None
    partner_date_of_birth: date | None = None


class PreferencesUpdate(BaseModel):
    looking_for_genders: list[Gender] | None = None
    preferred_intentions: list[RelationshipIntention] | None = None
    preferred_countries: list[str] | None = None
    min_age: int | None = Field(default=None, ge=18, le=99)
    max_age: int | None = Field(default=None, ge=18, le=99)
    max_distance_km: int | None = Field(default=None, ge=1, le=500)


class PreferencesResponse(BaseModel):
    looking_for_genders: list[Gender]
    preferred_intentions: list[RelationshipIntention]
    preferred_countries: list[str]
    min_age: int
    max_age: int
    max_distance_km: int


class ProfileResponse(ORMModel, TimestampSchema):
    id: UUID
    user_id: UUID
    account_type: AccountType = AccountType.SINGLE
    display_name: str | None = None
    bio: str | None
    relationship_intention: RelationshipIntention
    looking_for_genders: list[Gender]
    preferred_intentions: list[RelationshipIntention] = []
    preferred_countries: list[str] = []
    min_age: int
    max_age: int
    max_distance_km: int
    occupation: str | None
    city: str | None = None
    country: str | None = None
    country_name: str | None = None
    timezone: str | None = None
    photos: list[PhotoResponse] = []
    interests: list[InterestResponse] = []
    partner_first_name: str | None = None
    partner_gender: Gender | None = None
    partner_date_of_birth: date | None = None
    fantasies: list["FantasyResponse"] = []


class PublicProfileResponse(ORMModel):
    id: UUID
    user_id: UUID
    account_type: AccountType = AccountType.SINGLE
    display_name: str
    first_name: str | None = None
    age: int
    online_status: str | None = None
    gender: Gender
    city: str
    country: str
    country_name: str
    country_flag: str
    timezone: str
    location_label: str
    bio: str | None
    relationship_intention: RelationshipIntention
    occupation: str | None
    photos: list[PhotoResponse] = []
    interests: list[InterestResponse] = []
    compatibility_score: float | None = None
    compatibility_indicators: list[str] = []
    is_available_tonight: bool = False
    availability_note: str | None = None
    distance_km: float | None = None
    is_connected: bool = False
    profile_completion_percent: int | None = None
    connection_state: str | None = None
    partner_first_name: str | None = None
    partner_gender: Gender | None = None
    partner_age: int | None = None
    fantasies: list[str] = []
