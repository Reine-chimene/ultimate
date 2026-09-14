from __future__ import annotations

import io

from PIL import Image, ImageOps, UnidentifiedImageError

from app.models.user import User
from app.services.photo_upload_service import ALLOWED_CONTENT_TYPES, MAX_UPLOAD_BYTES, PhotoUploadError
from app.services.storage_service import StorageService


class FeedImageService:
    def __init__(self) -> None:
        self.storage = StorageService()

    def validate_and_process(self, content: bytes, content_type: str | None) -> tuple[bytes, str]:
        if len(content) == 0:
            raise PhotoUploadError("Aucun fichier fourni")
        if len(content) > MAX_UPLOAD_BYTES:
            raise PhotoUploadError("L'image ne peut pas dépasser 5 Mo")

        normalized_type = (content_type or "").split(";")[0].strip().lower()
        if normalized_type not in ALLOWED_CONTENT_TYPES:
            raise PhotoUploadError("Format non supporté. Utilisez JPEG, PNG ou WEBP.")

        ext = ALLOWED_CONTENT_TYPES[normalized_type]

        try:
            with Image.open(io.BytesIO(content)) as img:
                img.verify()
            with Image.open(io.BytesIO(content)) as img:
                img = ImageOps.exif_transpose(img)
                if img.mode not in ("RGB", "L"):
                    img = img.convert("RGB")
                img.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
                out = io.BytesIO()
                img.save(out, format="JPEG", quality=88, optimize=True)
                processed = out.getvalue()
        except UnidentifiedImageError as exc:
            raise PhotoUploadError("Fichier image invalide ou corrompu.") from exc

        if len(processed) > MAX_UPLOAD_BYTES:
            raise PhotoUploadError("L'image ne peut pas dépasser 5 Mo après traitement")

        return processed, "jpg"

    async def upload(self, user: User, content: bytes, content_type: str | None) -> str:
        processed, ext = self.validate_and_process(content, content_type)
        _, url = await self.storage.save_feed(user.id, processed, ext)
        return url
