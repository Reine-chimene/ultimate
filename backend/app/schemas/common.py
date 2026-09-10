from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseModel):
    message: str


class IDResponse(BaseModel):
    id: UUID


class TimestampSchema(BaseModel):
    created_at: datetime
    updated_at: datetime
