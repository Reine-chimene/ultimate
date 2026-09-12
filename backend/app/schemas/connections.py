from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import ConnectionState
from app.schemas.profile import PublicProfileResponse


class ConnectionRequestCreate(BaseModel):
    receiver_id: UUID
    intro_message: str | None = Field(default=None, max_length=150)


class ConnectionActionResponse(BaseModel):
    state: ConnectionState
    match_id: UUID | None = None
    requests_remaining: int | None = None


class ConnectionStatusResponse(BaseModel):
    state: ConnectionState
    match_id: UUID | None = None
    intro_message: str | None = None
    requests_remaining: int | None = None


class PendingRequestItem(BaseModel):
    user_id: UUID
    profile: PublicProfileResponse
    intro_message: str | None = None
    created_at: datetime


class PendingRequestsResponse(BaseModel):
    received: list[PendingRequestItem]
    sent: list[PendingRequestItem]
    requests_remaining: int = 0


class ProfileCompletionResponse(BaseModel):
    percent: int
    is_complete: bool
    missing: list[str]
    items: list[dict]
