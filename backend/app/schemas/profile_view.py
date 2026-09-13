from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.profile import PublicProfileResponse


class ProfileVisitorItem(BaseModel):
    user_id: UUID
    visited_at: datetime
    profile: PublicProfileResponse


class ProfileVisitorsResponse(BaseModel):
    is_premium: bool
    total_count: int
    page: int = 1
    limit: int = 20
    visitors: list[ProfileVisitorItem] = Field(default_factory=list)
    teaser: str | None = None
