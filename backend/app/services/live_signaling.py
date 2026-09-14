from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import dataclass, field
from uuid import UUID

from fastapi import WebSocket

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


@dataclass
class LivePeer:
    user_id: UUID
    display_name: str
    is_host: bool
    websocket: WebSocket
    send_lock: asyncio.Lock = field(default_factory=asyncio.Lock)


class LiveSignalingHub:
    """In-memory WebRTC signaling par salon (1 hôte → N spectateurs)."""

    def __init__(self) -> None:
        self._rooms: dict[UUID, dict[UUID, LivePeer]] = {}

    def _room(self, room_id: UUID) -> dict[UUID, LivePeer]:
        return self._rooms.setdefault(room_id, {})

    async def connect(
        self,
        room_id: UUID,
        user_id: UUID,
        display_name: str,
        is_host: bool,
        websocket: WebSocket,
    ) -> LivePeer | None:
        peers = self._room(room_id)
        if not is_host:
            viewer_count = sum(1 for p in peers.values() if not p.is_host)
            if viewer_count >= settings.live_max_viewers:
                await websocket.close(code=4429, reason="Salon complet")
                return None

        await websocket.accept()
        existing = peers.get(user_id)
        if existing is not None:
            try:
                await existing.websocket.close(code=4000, reason="Replaced")
            except Exception:
                pass
        peer = LivePeer(
            user_id=user_id,
            display_name=display_name,
            is_host=is_host,
            websocket=websocket,
        )
        peers[user_id] = peer

        await self._send(
            peer,
            {
                "type": "connected",
                "user_id": str(user_id),
                "is_host": is_host,
                "peers": [
                    {
                        "user_id": str(p.user_id),
                        "display_name": p.display_name,
                        "is_host": p.is_host,
                    }
                    for pid, p in peers.items()
                    if pid != user_id
                ],
            },
        )

        if not is_host:
            host = self._host_peer(peers)
            if host is not None:
                await self._send(
                    host,
                    {
                        "type": "viewer-joined",
                        "user_id": str(user_id),
                        "display_name": display_name,
                    },
                )
        return peer

    async def disconnect(self, room_id: UUID, user_id: UUID) -> None:
        peers = self._rooms.get(room_id)
        if not peers:
            return
        peer = peers.pop(user_id, None)
        if peer is None:
            return
        if peer.is_host:
            await self._broadcast(
                room_id,
                {"type": "host-left"},
                exclude=user_id,
            )
            self._rooms.pop(room_id, None)
            return
        host = self._host_peer(peers)
        if host is not None:
            await self._send(
                host,
                {"type": "viewer-left", "user_id": str(user_id)},
            )
        if not peers:
            self._rooms.pop(room_id, None)

    async def relay(self, room_id: UUID, sender_id: UUID, message: dict) -> None:
        peers = self._rooms.get(room_id)
        if not peers or sender_id not in peers:
            return

        msg_type = message.get("type")
        if msg_type in {"offer", "answer", "ice"}:
            target_raw = message.get("to")
            if not target_raw:
                return
            target_id = UUID(str(target_raw))
            target = peers.get(target_id)
            if target is None:
                return
            payload = {**message, "from": str(sender_id)}
            await self._send(target, payload)
            return

        if msg_type == "ping":
            await self._send(peers[sender_id], {"type": "pong"})

    @staticmethod
    def _host_peer(peers: dict[UUID, LivePeer]) -> LivePeer | None:
        for peer in peers.values():
            if peer.is_host:
                return peer
        return None

    async def _send(self, peer: LivePeer, payload: dict) -> None:
        async with peer.send_lock:
            try:
                await peer.websocket.send_text(json.dumps(payload))
            except Exception:
                logger.debug("live signal send failed user=%s", peer.user_id)

    async def _broadcast(
        self,
        room_id: UUID,
        payload: dict,
        exclude: UUID | None = None,
    ) -> None:
        peers = self._rooms.get(room_id, {})
        for uid, peer in list(peers.items()):
            if exclude is not None and uid == exclude:
                continue
            await self._send(peer, payload)


live_signaling_hub = LiveSignalingHub()
