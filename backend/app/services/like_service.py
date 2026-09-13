from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.discovery import LikeActionRequest, LikeActionResponse
from app.schemas.likes import PendingRequestsResponse
from app.services.connection_service import ConnectionService
from app.services.interest_service import InterestService
from app.services.pass_service import PassService


class LikeService:
    """Like/pass actions: Clic-Match interest or persistent pass."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.interests = InterestService(db)
        self.passes = PassService(db)
        self.connections = ConnectionService(db)

    async def like_or_pass(self, sender: User, data: LikeActionRequest) -> LikeActionResponse:
        if not data.is_like:
            await self.passes.pass_profile(sender, data.receiver_id)
            return LikeActionResponse(is_like=False, is_match=False, match_id=None)

        return await self.interests.send_interest(sender, data.receiver_id)

    async def get_pending_requests(self, user: User) -> PendingRequestsResponse:
        pending = await self.connections.get_pending_requests(user)
        return PendingRequestsResponse(
            received=pending.received,
            sent=pending.sent,
        )

    async def get_received_likes(self, user: User) -> list[UUID]:
        result = await self.interests.get_received(user)
        return [item.user_id for item in result.received]
