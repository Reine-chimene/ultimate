from datetime import datetime
from uuid import UUID

from app.schemas.common import ORMModel, TimestampSchema


class NotificationResponse(ORMModel, TimestampSchema):
    id: UUID
    user_id: UUID
    type: str
    title: str
    body: str
    read_at: datetime | None
