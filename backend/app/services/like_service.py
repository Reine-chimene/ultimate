from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ConnectionState
from app.models.user import User
from app.schemas.connections import ConnectionRequestCreate
from app.schemas.discovery import LikeActionRequest, LikeActionResponse
from app.schemas.likes import PendingRequestsResponse
from app.services.connection_service import ConnectionService


class LikeService:
    """Backward-compatible wrapper around ConnectionService."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.connections = ConnectionService(db)

    async def like_or_pass(self, sender: User, data: LikeActionRequest) -> LikeActionResponse:
        if not data.is_like:
            from sqlalchemy import select
            from app.models.enums import ConnectionRequestStatus
            from app.models.social import Like

            existing = await self.db.execute(
                select(Like).where(
                    Like.sender_id == sender.id,
                    Like.receiver_id == data.receiver_id,
                )
            )
            like = existing.scalar_one_or_none()
            if like:
                like.is_like = False
                like.request_status = ConnectionRequestStatus.DECLINED
            else:
                like = Like(
                    sender_id=sender.id,
                    receiver_id=data.receiver_id,
                    is_like=False,
                    request_status=ConnectionRequestStatus.DECLINED,
                )
                self.db.add(like)
            await self.db.commit()
            return LikeActionResponse(is_like=False, is_match=False, match_id=None)

        result = await self.connections.send_request(
            sender,
            ConnectionRequestCreate(receiver_id=data.receiver_id, intro_message=getattr(data, "intro_message", None)),
        )
        return LikeActionResponse(
            is_like=True,
            is_match=result.state == ConnectionState.CONNECTED,
            match_id=result.match_id,
        )

    async def get_pending_requests(self, user: User) -> PendingRequestsResponse:
        pending = await self.connections.get_pending_requests(user)
        return PendingRequestsResponse(
            received=pending.received,
            sent=pending.sent,
        )

    async def get_received_likes(self, user: User) -> list[UUID]:
        pending = await self.connections.get_pending_requests(user)
        return [item.user_id for item in pending.received]
