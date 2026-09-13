from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel, TimestampSchema


class FeedPostCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)
    image_url: str | None = Field(default=None, max_length=500)


class FeedCommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=1000)


class FeedAuthorSummary(BaseModel):
    user_id: UUID
    display_name: str
    account_type: str = "single"


class FeedCommentResponse(ORMModel, TimestampSchema):
    id: UUID
    post_id: UUID
    author_id: UUID
    author_display_name: str
    content: str


class FeedPostResponse(ORMModel, TimestampSchema):
    id: UUID
    author_id: UUID
    author_display_name: str
    author_account_type: str = "single"
    content: str
    image_url: str | None = None
    like_count: int = 0
    comment_count: int = 0
    liked_by_me: bool = False
    comments: list[FeedCommentResponse] = []


class FeedListResponse(BaseModel):
    items: list[FeedPostResponse]
    total: int
    page: int
    limit: int
