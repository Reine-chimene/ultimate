from __future__ import annotations

import io
from datetime import UTC, datetime
from uuid import UUID

from PIL import Image
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import (
    PrivateAlbumAccessStatus,
    PrivateAlbumMediaType,
    PrivateAlbumPhotoModerationStatus,
)
from app.models.private_album import PrivateAlbum, PrivateAlbumAccessRequest, PrivateAlbumPhoto
from app.models.social import Block
from app.models.user import User
from app.schemas.private_album import (
    PrivateAlbumAccessRequestListResponse,
    PrivateAlbumAccessRequestResponse,
    PrivateAlbumCreate,
    PrivateAlbumDetail,
    PrivateAlbumListResponse,
    PrivateAlbumPhotoResponse,
    PrivateAlbumSummary,
    PrivateAlbumUpdate,
)
from app.services.notification_service import NotificationService
from app.services.photo_upload_service import PhotoUploadError, PhotoUploadService
from app.services.premium_service import PremiumService
from app.services.profile_service import ProfileService
from app.services.storage_service import StorageService

MAX_VIDEO_BYTES = 50 * 1024 * 1024
ALLOWED_VIDEO_TYPES = {
    "video/mp4": "mp4",
    "video/webm": "webm",
}


class PrivateAlbumService:
    API_PREFIX = "/api/v1/private-albums"

    def __init__(self, db: AsyncSession):
        self.db = db
        self.storage = StorageService()
        self.notifications = NotificationService(db)

    def _photo_view_url(self, album_id: UUID, photo_id: UUID) -> str:
        return f"{self.API_PREFIX}/{album_id}/photos/{photo_id}"

    async def _is_blocked(self, user_a_id: UUID, user_b_id: UUID) -> bool:
        result = await self.db.execute(
            select(Block.id).where(
                or_(
                    and_(Block.blocker_id == user_a_id, Block.blocked_id == user_b_id),
                    and_(Block.blocker_id == user_b_id, Block.blocked_id == user_a_id),
                )
            )
        )
        return result.scalar_one_or_none() is not None

    async def _get_album(self, album_id: UUID) -> PrivateAlbum | None:
        result = await self.db.execute(
            select(PrivateAlbum)
            .where(PrivateAlbum.id == album_id)
            .options(
                selectinload(PrivateAlbum.photos),
                selectinload(PrivateAlbum.access_requests),
            )
        )
        return result.scalar_one_or_none()

    async def _access_status_for(
        self, album: PrivateAlbum, viewer: User
    ) -> PrivateAlbumAccessStatus | None:
        if album.owner_id == viewer.id:
            return None
        for req in album.access_requests:
            if req.requester_id == viewer.id:
                return req.status
        return None

    async def can_view_album(self, album: PrivateAlbum, viewer: User) -> bool:
        if album.owner_id == viewer.id:
            return True
        if await self._is_blocked(album.owner_id, viewer.id):
            return False
        status = await self._access_status_for(album, viewer)
        return status == PrivateAlbumAccessStatus.APPROVED

    async def _photo_response(
        self, photo: PrivateAlbumPhoto, *, include_url: bool
    ) -> PrivateAlbumPhotoResponse:
        return PrivateAlbumPhotoResponse(
            id=photo.id,
            album_id=photo.album_id,
            media_type=photo.media_type,
            mime_type=photo.mime_type,
            file_size=photo.file_size,
            width=photo.width,
            height=photo.height,
            moderation_status=photo.moderation_status,
            view_url=self._photo_view_url(photo.album_id, photo.id) if include_url else None,
            created_at=photo.created_at,
            updated_at=photo.updated_at,
        )

    async def _album_summary(
        self,
        album: PrivateAlbum,
        viewer: User,
        *,
        include_photos: bool | None = None,
    ) -> PrivateAlbumSummary:
        is_owner = album.owner_id == viewer.id
        can_view = include_photos if include_photos is not None else await self.can_view_album(album, viewer)
        access_status = await self._access_status_for(album, viewer)
        visible_photos = [
            p
            for p in album.photos
            if p.moderation_status != PrivateAlbumPhotoModerationStatus.REJECTED
        ]
        photos: list[PrivateAlbumPhotoResponse] = []
        if can_view:
            photos = [
                await self._photo_response(p, include_url=True) for p in visible_photos
            ]
        return PrivateAlbumSummary(
            id=album.id,
            owner_id=album.owner_id,
            title=album.title,
            description=album.description,
            photo_count=len(visible_photos),
            is_owner=is_owner,
            access_status=access_status,
            can_view_photos=can_view,
            is_visible_on_profile=album.is_visible_on_profile,
            photos=photos,
        )

    async def list_owner_albums(self, user: User) -> PrivateAlbumListResponse:
        result = await self.db.execute(
            select(PrivateAlbum)
            .where(PrivateAlbum.owner_id == user.id)
            .options(selectinload(PrivateAlbum.photos))
            .order_by(PrivateAlbum.created_at.desc())
        )
        albums = result.scalars().all()
        summaries = [
            await self._album_summary(a, user, include_photos=True) for a in albums
        ]
        return PrivateAlbumListResponse(albums=summaries)

    async def list_visible_albums(
        self, owner_user_id: UUID, viewer: User
    ) -> PrivateAlbumListResponse:
        if owner_user_id == viewer.id:
            return await self.list_owner_albums(viewer)
        if await self._is_blocked(owner_user_id, viewer.id):
            return PrivateAlbumListResponse(albums=[])

        result = await self.db.execute(
            select(PrivateAlbum)
            .where(
                PrivateAlbum.owner_id == owner_user_id,
                PrivateAlbum.is_visible_on_profile.is_(True),
            )
            .options(
                selectinload(PrivateAlbum.photos),
                selectinload(PrivateAlbum.access_requests),
            )
            .order_by(PrivateAlbum.created_at.desc())
        )
        albums = result.scalars().all()
        summaries = [await self._album_summary(a, viewer) for a in albums]
        return PrivateAlbumListResponse(albums=summaries)

    async def get_owner_album_detail(self, user: User, album_id: UUID) -> PrivateAlbumDetail:
        album = await self._get_album(album_id)
        if album is None or album.owner_id != user.id:
            raise ValueError("Album introuvable")
        summary = await self._album_summary(album, user, include_photos=True)
        pending = sum(
            1
            for r in album.access_requests
            if r.status == PrivateAlbumAccessStatus.PENDING
        )
        return PrivateAlbumDetail(**summary.model_dump(), pending_request_count=pending)

    async def create_album(self, user: User, data: PrivateAlbumCreate) -> PrivateAlbumDetail:
        album = PrivateAlbum(
            owner_id=user.id,
            title=data.title.strip(),
            description=data.description,
            is_visible_on_profile=data.is_visible_on_profile,
        )
        self.db.add(album)
        await self.db.commit()
        await self.db.refresh(album)
        return await self.get_owner_album_detail(user, album.id)

    async def update_album(
        self, user: User, album_id: UUID, data: PrivateAlbumUpdate
    ) -> PrivateAlbumDetail:
        album = await self._get_album(album_id)
        if album is None or album.owner_id != user.id:
            raise ValueError("Album introuvable")
        update_data = data.model_dump(exclude_unset=True)
        if "title" in update_data and update_data["title"]:
            update_data["title"] = update_data["title"].strip()
        for key, value in update_data.items():
            setattr(album, key, value)
        await self.db.commit()
        return await self.get_owner_album_detail(user, album_id)

    async def delete_album(self, user: User, album_id: UUID) -> None:
        album = await self._get_album(album_id)
        if album is None or album.owner_id != user.id:
            raise ValueError("Album introuvable")
        for photo in album.photos:
            await self.storage.delete_key(photo.storage_key)
        await self.db.delete(album)
        await self.db.commit()

    async def add_photo(
        self, user: User, album_id: UUID, content: bytes, content_type: str | None
    ) -> PrivateAlbumPhotoResponse:
        album = await self._get_album(album_id)
        if album is None or album.owner_id != user.id:
            raise ValueError("Album introuvable")

        normalized_type = (content_type or "").split(";")[0].strip().lower()
        if normalized_type in ALLOWED_VIDEO_TYPES:
            if not await PremiumService(self.db).can_upload_private_videos(user):
                raise ValueError("Les vidéos privées sont réservées aux membres Premium")
            if len(content) == 0:
                raise PhotoUploadError("Aucun fichier fourni")
            if len(content) > MAX_VIDEO_BYTES:
                raise PhotoUploadError("La vidéo ne peut pas dépasser 50 Mo")
            ext = ALLOWED_VIDEO_TYPES[normalized_type]
            storage_key = await self.storage.save_private(user.id, content, ext)
            photo = PrivateAlbumPhoto(
                album_id=album.id,
                owner_id=user.id,
                storage_key=storage_key,
                media_type=PrivateAlbumMediaType.VIDEO,
                mime_type=normalized_type,
                file_size=len(content),
                width=None,
                height=None,
                moderation_status=PrivateAlbumPhotoModerationStatus.APPROVED,
            )
        else:
            processed = PhotoUploadService(ProfileService(self.db)).validate_and_process(
                content, content_type
            )
            width, height = self._image_dimensions(processed)
            storage_key = await self.storage.save_private(user.id, processed, "jpg")
            photo = PrivateAlbumPhoto(
                album_id=album.id,
                owner_id=user.id,
                storage_key=storage_key,
                media_type=PrivateAlbumMediaType.PHOTO,
                mime_type="image/jpeg",
                file_size=len(processed),
                width=width,
                height=height,
                moderation_status=PrivateAlbumPhotoModerationStatus.APPROVED,
            )
        self.db.add(photo)
        await self.db.commit()
        await self.db.refresh(photo)
        return await self._photo_response(photo, include_url=True)

    async def delete_photo(self, user: User, album_id: UUID, photo_id: UUID) -> None:
        album = await self._get_album(album_id)
        if album is None or album.owner_id != user.id:
            raise ValueError("Album introuvable")
        photo = next((p for p in album.photos if p.id == photo_id), None)
        if photo is None:
            raise ValueError("Photo introuvable")
        await self.storage.delete_key(photo.storage_key)
        await self.db.delete(photo)
        await self.db.commit()

    async def request_access(
        self, requester: User, owner_user_id: UUID, album_id: UUID
    ) -> PrivateAlbumAccessRequestResponse:
        if requester.id == owner_user_id:
            raise ValueError("Vous ne pouvez pas demander l'accès à votre propre album")
        if await self._is_blocked(owner_user_id, requester.id):
            raise ValueError("Accès refusé")

        album = await self._get_album(album_id)
        if album is None or album.owner_id != owner_user_id:
            raise ValueError("Album introuvable")
        if not album.is_visible_on_profile:
            raise ValueError("Album introuvable")

        existing = await self.db.execute(
            select(PrivateAlbumAccessRequest).where(
                PrivateAlbumAccessRequest.album_id == album_id,
                PrivateAlbumAccessRequest.requester_id == requester.id,
            )
        )
        req = existing.scalar_one_or_none()
        if req is not None:
            if req.status == PrivateAlbumAccessStatus.PENDING:
                raise ValueError("Une demande est déjà en attente")
            if req.status == PrivateAlbumAccessStatus.APPROVED:
                raise ValueError("Vous avez déjà accès à cet album")
            req.status = PrivateAlbumAccessStatus.PENDING
            req.responded_at = None
            access_request = req
        else:
            access_request = PrivateAlbumAccessRequest(
                album_id=album_id,
                requester_id=requester.id,
                owner_id=owner_user_id,
                status=PrivateAlbumAccessStatus.PENDING,
            )
            self.db.add(access_request)

        await self.notifications.notify_private_album_access_request(
            owner_id=owner_user_id,
            requester=requester,
            album=album,
        )
        await self.db.commit()
        await self.db.refresh(access_request)
        return await self._request_response(access_request, requester)

    async def list_access_requests_for_owner(
        self, user: User, album_id: UUID
    ) -> PrivateAlbumAccessRequestListResponse:
        album = await self._get_album(album_id)
        if album is None or album.owner_id != user.id:
            raise ValueError("Album introuvable")
        result = await self.db.execute(
            select(PrivateAlbumAccessRequest, User)
            .join(User, User.id == PrivateAlbumAccessRequest.requester_id)
            .where(PrivateAlbumAccessRequest.album_id == album_id)
            .order_by(PrivateAlbumAccessRequest.created_at.desc())
        )
        rows = result.all()
        requests = [
            PrivateAlbumAccessRequestResponse(
                id=req.id,
                album_id=req.album_id,
                requester_id=req.requester_id,
                requester_display_name=(u.display_name or u.first_name).strip(),
                status=req.status,
                responded_at=req.responded_at,
                created_at=req.created_at,
                updated_at=req.updated_at,
            )
            for req, u in rows
        ]
        return PrivateAlbumAccessRequestListResponse(requests=requests)

    async def list_my_access_requests(self, user: User) -> PrivateAlbumAccessRequestListResponse:
        result = await self.db.execute(
            select(PrivateAlbumAccessRequest, User)
            .join(User, User.id == PrivateAlbumAccessRequest.owner_id)
            .where(PrivateAlbumAccessRequest.requester_id == user.id)
            .order_by(PrivateAlbumAccessRequest.created_at.desc())
        )
        rows = result.all()
        requests = [
            PrivateAlbumAccessRequestResponse(
                id=req.id,
                album_id=req.album_id,
                requester_id=req.requester_id,
                requester_display_name=(u.display_name or u.first_name).strip(),
                status=req.status,
                responded_at=req.responded_at,
                created_at=req.created_at,
                updated_at=req.updated_at,
            )
            for req, u in rows
        ]
        return PrivateAlbumAccessRequestListResponse(requests=requests)

    async def approve_access(
        self, user: User, album_id: UUID, request_id: UUID
    ) -> PrivateAlbumAccessRequestResponse:
        req = await self._get_owner_request(user, album_id, request_id)
        if req.status != PrivateAlbumAccessStatus.PENDING:
            raise ValueError("Cette demande ne peut pas être approuvée")
        req.status = PrivateAlbumAccessStatus.APPROVED
        req.responded_at = datetime.now(UTC)
        requester = await self._get_user(req.requester_id)
        album = await self._get_album(album_id)
        if requester and album:
            await self.notifications.notify_private_album_access_approved(
                requester=requester,
                owner=user,
                album=album,
            )
        await self.db.commit()
        await self.db.refresh(req)
        requester = requester or await self._get_user(req.requester_id)
        return await self._request_response(req, requester)

    async def reject_access(
        self, user: User, album_id: UUID, request_id: UUID
    ) -> PrivateAlbumAccessRequestResponse:
        req = await self._get_owner_request(user, album_id, request_id)
        if req.status != PrivateAlbumAccessStatus.PENDING:
            raise ValueError("Cette demande ne peut pas être refusée")
        req.status = PrivateAlbumAccessStatus.REJECTED
        req.responded_at = datetime.now(UTC)
        requester = await self._get_user(req.requester_id)
        album = await self._get_album(album_id)
        if requester and album:
            await self.notifications.notify_private_album_access_rejected(
                requester=requester,
                owner=user,
                album=album,
            )
        await self.db.commit()
        await self.db.refresh(req)
        requester = requester or await self._get_user(req.requester_id)
        return await self._request_response(req, requester)

    async def revoke_access(
        self, user: User, album_id: UUID, request_id: UUID
    ) -> PrivateAlbumAccessRequestResponse:
        req = await self._get_owner_request(user, album_id, request_id)
        if req.status != PrivateAlbumAccessStatus.APPROVED:
            raise ValueError("Seul un accès approuvé peut être révoqué")
        req.status = PrivateAlbumAccessStatus.REVOKED
        req.responded_at = datetime.now(UTC)
        requester = await self._get_user(req.requester_id)
        album = await self._get_album(album_id)
        if requester and album:
            await self.notifications.notify_private_album_access_revoked(
                requester=requester,
                owner=user,
                album=album,
            )
        await self.db.commit()
        await self.db.refresh(req)
        requester = requester or await self._get_user(req.requester_id)
        return await self._request_response(req, requester)

    async def get_photo_content(
        self, viewer: User, album_id: UUID, photo_id: UUID
    ) -> tuple[bytes, str]:
        album = await self._get_album(album_id)
        if album is None:
            raise ValueError("Album introuvable")
        if not await self.can_view_album(album, viewer):
            raise ValueError("Accès refusé")
        photo = next((p for p in album.photos if p.id == photo_id), None)
        if photo is None:
            raise ValueError("Photo introuvable")
        if photo.moderation_status == PrivateAlbumPhotoModerationStatus.REJECTED:
            raise ValueError("Photo introuvable")
        try:
            content = await self.storage.read(photo.storage_key)
        except FileNotFoundError as exc:
            raise ValueError("Photo introuvable") from exc
        return content, photo.mime_type

    async def _get_owner_request(
        self, user: User, album_id: UUID, request_id: UUID
    ) -> PrivateAlbumAccessRequest:
        album = await self._get_album(album_id)
        if album is None or album.owner_id != user.id:
            raise ValueError("Album introuvable")
        result = await self.db.execute(
            select(PrivateAlbumAccessRequest).where(
                PrivateAlbumAccessRequest.id == request_id,
                PrivateAlbumAccessRequest.album_id == album_id,
            )
        )
        req = result.scalar_one_or_none()
        if req is None:
            raise ValueError("Demande introuvable")
        return req

    async def _get_user(self, user_id: UUID) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def _request_response(
        self, req: PrivateAlbumAccessRequest, requester: User | None
    ) -> PrivateAlbumAccessRequestResponse:
        name = "Utilisateur"
        if requester is not None:
            name = (requester.display_name or requester.first_name).strip()
        return PrivateAlbumAccessRequestResponse(
            id=req.id,
            album_id=req.album_id,
            requester_id=req.requester_id,
            requester_display_name=name,
            status=req.status,
            responded_at=req.responded_at,
            created_at=req.created_at,
            updated_at=req.updated_at,
        )

    @staticmethod
    def _image_dimensions(content: bytes) -> tuple[int | None, int | None]:
        try:
            with Image.open(io.BytesIO(content)) as img:
                return img.width, img.height
        except Exception:
            return None, None
