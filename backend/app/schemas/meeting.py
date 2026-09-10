from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import MeetingStatus
from app.schemas.common import ORMModel, TimestampSchema


class MeetingCreate(BaseModel):
    receiver_id: UUID
    proposed_at: datetime
    location: str | None = Field(default=None, max_length=255)
    message: str | None = Field(default=None, max_length=500)


class MeetingResponse(ORMModel, TimestampSchema):
    id: UUID
    requester_id: UUID
    receiver_id: UUID
    proposed_at: datetime
    location: str | None
    message: str | None
    status: MeetingStatus
    requester_name: str | None = None
    receiver_name: str | None = None
