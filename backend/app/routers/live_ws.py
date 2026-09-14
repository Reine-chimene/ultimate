import json
import logging
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError
from sqlalchemy import select

from app.auth.jwt import verify_access_token
from app.database import async_session_factory
from app.models.live import LiveRoom, LiveRoomStatus, LiveRoomViewer
from app.models.user import User
from app.services.live_signaling import live_signaling_hub

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/live", tags=["live"])


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

    async with async_session_factory() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None or not user.is_active:
            await websocket.close(code=4401, reason="Utilisateur invalide")
            return None
        return user


async def _can_access_room(room_id: UUID, user: User) -> tuple[LiveRoom | None, bool]:
    async with async_session_factory() as db:
        result = await db.execute(
            select(LiveRoom).where(
                LiveRoom.id == room_id,
                LiveRoom.status == LiveRoomStatus.LIVE,
            )
        )
        room = result.scalar_one_or_none()
        if room is None:
            return None, False
        if room.host_id == user.id:
            return room, True
        viewer = await db.execute(
            select(LiveRoomViewer).where(
                LiveRoomViewer.room_id == room_id,
                LiveRoomViewer.user_id == user.id,
            )
        )
        return room, viewer.scalar_one_or_none() is not None


@router.websocket("/rooms/{room_id}/signal")
async def live_room_signal(websocket: WebSocket, room_id: UUID) -> None:
    user = await _authenticate_ws(websocket)
    if user is None:
        return

    room, allowed = await _can_access_room(room_id, user)
    if room is None:
        await websocket.close(code=4404, reason="Salon introuvable")
        return
    if not allowed:
        await websocket.close(code=4403, reason="Rejoignez le salon d'abord")
        return

    is_host = room.host_id == user.id
    display_name = (user.display_name or user.first_name).strip()

    peer = await live_signaling_hub.connect(
        room_id=room_id,
        user_id=user.id,
        display_name=display_name,
        is_host=is_host,
        websocket=websocket,
    )

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                message = json.loads(raw)
            except json.JSONDecodeError:
                await live_signaling_hub.relay(room_id, user.id, {"type": "ping"})
                continue
            if not isinstance(message, dict):
                continue
            await live_signaling_hub.relay(room_id, user.id, message)
    except WebSocketDisconnect:
        logger.debug("live ws disconnect room=%s user=%s", room_id, user.id)
    except Exception:
        logger.exception("live ws error room=%s user=%s", room_id, user.id)
    finally:
        await live_signaling_hub.disconnect(room_id, user.id)
