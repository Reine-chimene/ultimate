from __future__ import annotations

import io

from PIL import Image, ImageOps, UnidentifiedImageError

from app.models.user import User
from app.schemas.profile import PhotoResponse
from app.services.profile_service import ProfileService
from app.services.storage_service import StorageService

MAX_UPLOAD_BYTES = 5 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}


class PhotoUploadError(ValueError):
    pass


class PhotoUploadService:
    def __init__(self, profile_service: ProfileService):
        self.profile_service = profile_service
        self.storage = StorageService()

    def validate_and_process(self, content: bytes, content_type: str | None) -> bytes:
        if len(content) == 0:
            raise PhotoUploadError("Aucun fichier fourni")
        if len(content) > MAX_UPLOAD_BYTES:
            raise PhotoUploadError("La photo ne peut pas dépasser 5 Mo")

        normalized_type = (content_type or "").split(";")[0].strip().lower()
        if normalized_type not in ALLOWED_CONTENT_TYPES:
            raise PhotoUploadError("Format non supporté. Utilisez JPEG, PNG ou WEBP.")

        try:
            with Image.open(io.BytesIO(content)) as img:
                img.verify()
            with Image.open(io.BytesIO(content)) as img:
                img = ImageOps.exif_transpose(img)
                if img.mode not in ("RGB", "L"):
                    img = img.convert("RGB")
                img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
                out = io.BytesIO()
                img.save(out, format="JPEG", quality=85, optimize=True)
                processed = out.getvalue()
        except UnidentifiedImageError as exc:
            raise PhotoUploadError("Fichier image invalide ou corrompu.") from exc

        if len(processed) > MAX_UPLOAD_BYTES:
            raise PhotoUploadError("La photo ne peut pas dépasser 5 Mo après traitement")

        return processed

    async def upload(self, user: User, content: bytes, content_type: str | None, is_primary: bool) -> PhotoResponse:
        processed = self.validate_and_process(content, content_type)
        _, public_url = await self.storage.save(user.id, processed, "jpg")

        profile = await self.profile_service._get_profile_by_user_id(user.id)
        make_primary = is_primary or profile is None or len(profile.photos) == 0

        from app.schemas.profile import PhotoCreate

        return await self.profile_service.add_photo(
            user,
            PhotoCreate(url=public_url, is_primary=make_primary),
        )
