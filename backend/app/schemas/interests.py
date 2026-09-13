from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.schemas.profile import PublicProfileResponse


class InterestListItem(BaseModel):
    user_id: UUID
    profile: PublicProfileResponse
    created_at: datetime


class InterestListsResponse(BaseModel):
    received: list[InterestListItem] = []
    sent: list[InterestListItem] = []
    likes_remaining: int = 0
