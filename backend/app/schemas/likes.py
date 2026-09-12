from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.schemas.profile import PublicProfileResponse


class PendingRequestItem(BaseModel):
    user_id: UUID
    profile: PublicProfileResponse
    intro_message: str | None = None
    created_at: datetime


class PendingRequestsResponse(BaseModel):
    received: list[PendingRequestItem]
    sent: list[PendingRequestItem]
    requests_remaining: int = 0
