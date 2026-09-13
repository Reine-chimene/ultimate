from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel, TimestampSchema


class FantasyCreate(BaseModel):
    tag: str = Field(min_length=1, max_length=100)
    category: str | None = Field(default=None, max_length=50)


class FantasyResponse(ORMModel, TimestampSchema):
    id: UUID
    tag: str
    category: str | None = None


class FantasyCatalogResponse(BaseModel):
    categories: dict[str, list[str]]
