from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.live import LiveRoomStatus
from app.schemas.common import ORMModel, TimestampSchema


class LiveRoomCreate(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    is_vip_only: bool = False


class LiveRoomResponse(ORMModel, TimestampSchema):
    id: UUID
    host_id: UUID
    host_display_name: str
    title: str
    description: str | None = None
    status: LiveRoomStatus
    viewer_count: int
    is_vip_only: bool
    started_at: datetime
    is_host: bool = False
    is_joined: bool = False


class LiveRoomListResponse(BaseModel):
    rooms: list[LiveRoomResponse]
    total_live: int
