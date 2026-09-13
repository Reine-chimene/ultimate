from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import (
    PrivateAlbumAccessStatus,
    PrivateAlbumMediaType,
    PrivateAlbumPhotoModerationStatus,
)
from app.schemas.common import ORMModel, TimestampSchema


class PrivateAlbumCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    is_visible_on_profile: bool = True


class PrivateAlbumUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    is_visible_on_profile: bool | None = None


class PrivateAlbumPhotoResponse(ORMModel, TimestampSchema):
    id: UUID
    album_id: UUID
    media_type: PrivateAlbumMediaType = PrivateAlbumMediaType.PHOTO
    mime_type: str
    file_size: int
    width: int | None = None
    height: int | None = None
    moderation_status: PrivateAlbumPhotoModerationStatus
    view_url: str | None = None


class PrivateAlbumAccessRequestResponse(ORMModel, TimestampSchema):
    id: UUID
    album_id: UUID
    requester_id: UUID
    requester_display_name: str
    status: PrivateAlbumAccessStatus
    responded_at: object | None = None


class PrivateAlbumSummary(BaseModel):
    id: UUID
    owner_id: UUID
    title: str
    description: str | None = None
    photo_count: int
    is_owner: bool
    access_status: PrivateAlbumAccessStatus | None = None
    can_view_photos: bool
    is_visible_on_profile: bool = True
    photos: list[PrivateAlbumPhotoResponse] = []


class PrivateAlbumDetail(PrivateAlbumSummary):
    pending_request_count: int = 0


class PrivateAlbumListResponse(BaseModel):
    albums: list[PrivateAlbumSummary]


class PrivateAlbumAccessRequestListResponse(BaseModel):
    requests: list[PrivateAlbumAccessRequestResponse]
