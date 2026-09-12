from __future__ import annotations

import asyncio
from pathlib import Path
from uuid import UUID, uuid4

from app.config import get_settings

settings = get_settings()


class StorageService:
    """Local filesystem or S3-compatible object storage."""

    def __init__(self) -> None:
        self._local_root = Path(settings.media_storage_path)

    def _user_key(self, user_id: UUID, extension: str) -> str:
        safe_ext = extension.lower().lstrip(".")
        if safe_ext not in {"jpg", "jpeg", "png", "webp"}:
            safe_ext = "jpg"
        return f"users/{user_id}/{uuid4()}.{safe_ext}"

    def public_url(self, storage_key: str) -> str:
        base = settings.media_public_url.rstrip("/")
        if settings.storage_backend == "s3" and settings.s3_public_base_url:
            return f"{settings.s3_public_base_url.rstrip('/')}/{storage_key}"
        return f"{base}/media/{storage_key}"

    async def save(self, user_id: UUID, content: bytes, extension: str = "jpg") -> tuple[str, str]:
        key = self._user_key(user_id, extension)
        if settings.storage_backend == "s3":
            await asyncio.to_thread(self._save_s3, key, content)
        else:
            await asyncio.to_thread(self._save_local, key, content)
        return key, self.public_url(key)

    async def delete_by_url(self, url: str) -> None:
        key = self.extract_storage_key(url)
        if key is None:
            return
        if settings.storage_backend == "s3":
            await asyncio.to_thread(self._delete_s3, key)
        else:
            await asyncio.to_thread(self._delete_local, key)

    def extract_storage_key(self, url: str) -> str | None:
        if settings.storage_backend == "s3" and settings.s3_public_base_url:
            prefix = settings.s3_public_base_url.rstrip("/") + "/"
            if url.startswith(prefix):
                return url[len(prefix) :]
        marker = "/media/"
        if marker in url:
            return url.split(marker, 1)[1]
        return None

    def _save_local(self, key: str, content: bytes) -> None:
        path = self._local_root / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)

    def _delete_local(self, key: str) -> None:
        path = self._local_root / key
        if path.is_file():
            path.unlink()

    def _save_s3(self, key: str, content: bytes) -> None:
        import boto3

        client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint or None,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            region_name=settings.s3_region,
        )
        client.put_object(
            Bucket=settings.s3_bucket,
            Key=key,
            Body=content,
            ContentType="image/jpeg",
            ACL="public-read",
        )

    def _delete_s3(self, key: str) -> None:
        import boto3

        client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint or None,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            region_name=settings.s3_region,
        )
        client.delete_object(Bucket=settings.s3_bucket, Key=key)

    def ensure_local_directory(self) -> None:
        if settings.storage_backend == "local":
            self._local_root.mkdir(parents=True, exist_ok=True)
