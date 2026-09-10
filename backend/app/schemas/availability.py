from datetime import date
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel, TimestampSchema
from app.schemas.profile import PublicProfileResponse


class AvailabilitySet(BaseModel):
    available_date: date | None = None
    is_available: bool = True
    note: str | None = Field(default=None, max_length=255)


class AvailabilityResponse(ORMModel, TimestampSchema):
    id: UUID
    user_id: UUID
    available_date: date
    is_available: bool
    note: str | None


class TonightAvailabilityResponse(BaseModel):
    date: date
    users: list[PublicProfileResponse]
