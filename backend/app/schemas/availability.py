from datetime import date, time
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel, TimestampSchema
from app.schemas.profile import PublicProfileResponse


class AvailabilitySet(BaseModel):
    available_date: date | None = None
    is_available: bool = True
    note: str | None = Field(default=None, max_length=255)
    start_time: time | None = None
    end_time: time | None = None


class AvailabilityResponse(ORMModel, TimestampSchema):
    id: UUID
    user_id: UUID
    available_date: date
    is_available: bool
    note: str | None
    start_time: time | None = None
    end_time: time | None = None
    availability_label: str | None = None


class TonightAvailabilityResponse(BaseModel):
    date: date
    users: list[PublicProfileResponse]
