from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import dataclass, field
from uuid import UUID

from fastapi import WebSocket

logger = logging.getLogger(__name__)


@dataclass
class MessagePeer:
    user_id: UUID
    websocket: WebSocket
    send_lock: asyncio.Lock = field(default_factory=asyncio.Lock)


class MessageHub:
    """Salons WebSocket par match — messages, typing, read receipts."""

    def __init__(self) -> None:
        self._rooms: dict[UUID, dict[UUID, MessagePeer]] = {}

    def _room(self, match_id: UUID) -> dict[UUID, MessagePeer]:
        return self._rooms.setdefault(match_id, {})

    async def connect(self, match_id: UUID, user_id: UUID, websocket: WebSocket) -> MessagePeer:
        await websocket.accept()
        peers = self._room(match_id)
        existing = peers.get(user_id)
        if existing is not None:
            try:
                await existing.websocket.close(code=4000, reason="Replaced")
            except Exception:
                pass
        peer = MessagePeer(user_id=user_id, websocket=websocket)
        peers[user_id] = peer
        await self._send(peer, {"type": "connected", "user_id": str(user_id)})
        await self._broadcast(
            match_id,
            {"type": "presence", "user_id": str(user_id), "online": True},
            exclude=user_id,
        )
        return peer

    async def disconnect(self, match_id: UUID, user_id: UUID) -> None:
        peers = self._rooms.get(match_id)
        if not peers:
            return
        peers.pop(user_id, None)
        await self._broadcast(
            match_id,
            {"type": "presence", "user_id": str(user_id), "online": False},
            exclude=user_id,
        )
        if not peers:
            self._rooms.pop(match_id, None)

    async def relay_typing(self, match_id: UUID, sender_id: UUID, is_typing: bool) -> None:
        await self._broadcast(
            match_id,
            {"type": "typing", "user_id": str(sender_id), "is_typing": is_typing},
            exclude=sender_id,
        )

    async def send_to_user(self, match_id: UUID, user_id: UUID, payload: dict) -> None:
        peer = self._rooms.get(match_id, {}).get(user_id)
        if peer is not None:
            await self._send(peer, payload)

    async def broadcast_payload(
        self,
        match_id: UUID,
        payload: dict,
        exclude: UUID | None = None,
    ) -> None:
        await self._broadcast(match_id, payload, exclude=exclude)

    async def _send(self, peer: MessagePeer, payload: dict) -> None:
        async with peer.send_lock:
            try:
                await peer.websocket.send_text(json.dumps(payload, default=str))
            except Exception:
                logger.debug("message hub send failed user=%s", peer.user_id)

    async def _broadcast(
        self,
        match_id: UUID,
        payload: dict,
        exclude: UUID | None = None,
    ) -> None:
        peers = self._rooms.get(match_id, {})
        for uid, peer in list(peers.items()):
            if exclude is not None and uid == exclude:
                continue
            await self._send(peer, payload)


message_hub = MessageHub()
