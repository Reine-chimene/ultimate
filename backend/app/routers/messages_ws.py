import json
import logging
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError

from app.auth.jwt import verify_access_token
from app.database import async_session_factory
from app.models.user import User
from app.services.match_service import MatchService, MessagingNotAllowedError
from app.services.message_hub import message_hub

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/messages", tags=["messages"])


async def _authenticate_ws(websocket: WebSocket) -> User | None:
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4401, reason="Token requis")
        return None
    try:
        user_id = verify_access_token(token)
    except JWTError:
        await websocket.close(code=4401, reason="Token invalide")
        return None

    from sqlalchemy import select

    async with async_session_factory() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None or not user.is_active:
            await websocket.close(code=4401, reason="Utilisateur invalide")
            return None
        return user


@router.websocket("/{match_id}/ws")
async def message_realtime(websocket: WebSocket, match_id: UUID) -> None:
    user = await _authenticate_ws(websocket)
    if user is None:
        return

    async with async_session_factory() as db:
        service = MatchService(db)
        try:
            match = await service._get_match_for_user(match_id, user.id)
            await service._validate_messaging(match, user)
        except (ValueError, MessagingNotAllowedError):
            await websocket.close(code=4403, reason="Accès refusé")
            return

    peer = await message_hub.connect(match_id, user.id, websocket)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                message = json.loads(raw)
            except json.JSONDecodeError:
                continue
            if not isinstance(message, dict):
                continue
            msg_type = message.get("type")
            if msg_type == "typing":
                is_typing = bool(message.get("is_typing", False))
                await message_hub.relay_typing(match_id, user.id, is_typing)
            elif msg_type == "ping":
                await message_hub.send_to_user(match_id, user.id, {"type": "pong"})
    except WebSocketDisconnect:
        logger.debug("message ws disconnect match=%s user=%s", match_id, user.id)
    except Exception:
        logger.exception("message ws error match=%s user=%s", match_id, user.id)
    finally:
        await message_hub.disconnect(match_id, user.id)
