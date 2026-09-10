from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import ReportStatus
from app.schemas.common import MessageResponse, ORMModel, TimestampSchema


class ReportCreate(BaseModel):
    reported_id: UUID
    reason: str = Field(min_length=3, max_length=200)
    description: str | None = Field(default=None, max_length=1000)


class BlockCreate(BaseModel):
    blocked_id: UUID


class ReportResponse(ORMModel, TimestampSchema):
    id: UUID
    reporter_id: UUID
    reported_id: UUID
    reason: str
    description: str | None
    status: ReportStatus


class ReportStatusUpdate(BaseModel):
    status: ReportStatus


class BlockResponse(ORMModel, TimestampSchema):
    id: UUID
    blocker_id: UUID
    blocked_id: UUID
