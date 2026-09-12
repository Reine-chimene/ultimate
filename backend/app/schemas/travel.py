from datetime import date
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel, TimestampSchema
from app.schemas.profile import PublicProfileResponse


class TravelPlanCreate(BaseModel):
    country: str = Field(min_length=2, max_length=2)
    city: str = Field(min_length=2, max_length=100)
    arrival_date: date
    departure_date: date
    wants_to_meet: bool = True


class TravelPlanResponse(ORMModel, TimestampSchema):
    id: UUID
    user_id: UUID
    country: str
    city: str
    arrival_date: date
    departure_date: date
    wants_to_meet: bool
    is_active: bool


class TravelOverviewResponse(BaseModel):
    active_plan: TravelPlanResponse | None
    destination_profiles: list[PublicProfileResponse]


class TravelMeResponse(BaseModel):
    active_plan: TravelPlanResponse | None
    plans: list[TravelPlanResponse]
    destination_profiles: list[PublicProfileResponse]
