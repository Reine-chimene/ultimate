from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from jose import JWTError, jwt

from app.config import get_settings

settings = get_settings()


def create_access_token(subject: UUID | str, extra: dict[str, Any] | None = None) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    payload: dict[str, Any] = {"sub": str(subject), "exp": expire, "type": "access"}
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(subject: UUID | str) -> str:
    expire = datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)
    payload = {"sub": str(subject), "exp": expire, "type": "refresh"}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])


def verify_refresh_token(token: str) -> UUID:
    try:
        payload = decode_token(token)
        if payload.get("type") != "refresh":
            raise JWTError("Type de jeton invalide")
        user_id = payload.get("sub")
        if not user_id:
            raise JWTError("Jeton invalide")
        return UUID(user_id)
    except (JWTError, ValueError) as exc:
        raise JWTError("Jeton invalide ou expiré") from exc


def verify_access_token(token: str) -> UUID:
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise JWTError("Type de jeton invalide")
        user_id = payload.get("sub")
        if not user_id:
            raise JWTError("Jeton invalide")
        return UUID(user_id)
    except (JWTError, ValueError) as exc:
        raise JWTError("Jeton invalide ou expiré") from exc
