from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, computed_field

from app.schemas.common import ORMModel, TimestampSchema


class NotificationResponse(ORMModel, TimestampSchema):
    id: UUID
    user_id: UUID
    type: str
    title: str
    body: str
    actor_user_id: UUID | None = None
    reference_type: str | None = None
    reference_id: UUID | None = None
    read_at: datetime | None

    @computed_field  # type: ignore[prop-decorator]
    @property
    def is_read(self) -> bool:
        return self.read_at is not None


class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    total: int
    page: int
    limit: int
    unread_count: int
