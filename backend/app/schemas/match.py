from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel, TimestampSchema
from app.schemas.profile import PublicProfileResponse


class MatchResponse(ORMModel, TimestampSchema):
    id: UUID
    user1_id: UUID
    user2_id: UUID
    conversation_id: UUID
    matched_at: datetime
    other_user: PublicProfileResponse | None = None


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class MessageResponse(ORMModel, TimestampSchema):
    id: UUID
    conversation_id: UUID
    sender_id: UUID
    content: str
    read_at: datetime | None


class ConversationResponse(ORMModel, TimestampSchema):
    id: UUID
    match_id: UUID | None = None
    messages: list[MessageResponse] = []
