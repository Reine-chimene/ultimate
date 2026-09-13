from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import SubscriptionPlan, SubscriptionStatus
from app.models.live import LiveRoom, LiveRoomStatus, LiveRoomViewer
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.live import LiveRoomCreate, LiveRoomListResponse, LiveRoomResponse
from app.services.notification_service import NotificationService


class LiveService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.notifications = NotificationService(db)

    @staticmethod
    def _display_name(user: User) -> str:
        return (user.display_name or user.first_name).strip()

    async def _is_vip(self, user: User) -> bool:
        result = await self.db.execute(
            select(Subscription).where(
                Subscription.user_id == user.id,
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.plan == SubscriptionPlan.VIP,
            )
        )
        sub = result.scalars().first()
        if sub is None:
            return False
        if sub.expires_at and sub.expires_at < datetime.now(UTC):
            return False
        return True

    async def _room_response(
        self, room: LiveRoom, viewer: User, joined_ids: set[UUID] | None = None
    ) -> LiveRoomResponse:
        joined_ids = joined_ids or set()
        return LiveRoomResponse(
            id=room.id,
            host_id=room.host_id,
            host_display_name=self._display_name(room.host),
            title=room.title,
            description=room.description,
            status=room.status,
            viewer_count=room.viewer_count,
            is_vip_only=room.is_vip_only,
            started_at=room.started_at,
            is_host=room.host_id == viewer.id,
            is_joined=room.id in joined_ids,
            created_at=room.created_at,
            updated_at=room.updated_at,
        )

    async def list_live_rooms(self, user: User) -> LiveRoomListResponse:
        result = await self.db.execute(
            select(LiveRoom)
            .where(LiveRoom.status == LiveRoomStatus.LIVE)
            .options(selectinload(LiveRoom.host))
            .order_by(LiveRoom.viewer_count.desc(), LiveRoom.started_at.desc())
        )
        rooms = result.scalars().all()
        joined = await self.db.execute(
            select(LiveRoomViewer.room_id).where(LiveRoomViewer.user_id == user.id)
        )
        joined_ids = {row[0] for row in joined.all()}
        items = [await self._room_response(r, user, joined_ids) for r in rooms]
        return LiveRoomListResponse(rooms=items, total_live=len(items))

    async def start_room(self, user: User, data: LiveRoomCreate) -> LiveRoomResponse:
        if data.is_vip_only and not await self._is_vip(user):
            raise ValueError("Seuls les membres VIP Gold peuvent diffuser en salon VIP")

        existing = await self.db.execute(
            select(LiveRoom).where(
                LiveRoom.host_id == user.id,
                LiveRoom.status == LiveRoomStatus.LIVE,
            )
        )
        if existing.scalar_one_or_none() is not None:
            raise ValueError("Vous avez déjà un salon en direct")

        room = LiveRoom(
            host_id=user.id,
            title=data.title.strip(),
            description=data.description,
            is_vip_only=data.is_vip_only,
            status=LiveRoomStatus.LIVE,
        )
        self.db.add(room)
        await self.db.commit()
        await self.db.refresh(room)
        await self.db.refresh(room, attribute_names=["host"])
        return await self._room_response(room, user, {room.id})

    async def join_room(self, user: User, room_id: UUID) -> LiveRoomResponse:
        room = await self._get_live_room(room_id)
        if room is None:
            raise ValueError("Salon introuvable")
        if room.host_id == user.id:
            return await self._room_response(room, user, {room.id})

        existing = await self.db.execute(
            select(LiveRoomViewer).where(
                LiveRoomViewer.room_id == room_id,
                LiveRoomViewer.user_id == user.id,
            )
        )
        if existing.scalar_one_or_none() is None:
            self.db.add(LiveRoomViewer(room_id=room_id, user_id=user.id))
            room.viewer_count += 1
            await self.db.commit()
            await self.db.refresh(room)

        return await self._room_response(room, user, {room.id})

    async def leave_room(self, user: User, room_id: UUID) -> None:
        result = await self.db.execute(
            select(LiveRoomViewer).where(
                LiveRoomViewer.room_id == room_id,
                LiveRoomViewer.user_id == user.id,
            )
        )
        viewer = result.scalar_one_or_none()
        if viewer is None:
            return
        room = await self._get_live_room(room_id)
        await self.db.delete(viewer)
        if room and room.viewer_count > 0:
            room.viewer_count -= 1
        await self.db.commit()

    async def end_room(self, user: User, room_id: UUID) -> None:
        room = await self._get_live_room(room_id)
        if room is None:
            raise ValueError("Salon introuvable")
        if room.host_id != user.id:
            raise ValueError("Seul l'hôte peut terminer le salon")
        room.status = LiveRoomStatus.ENDED
        room.ended_at = datetime.now(UTC)
        await self.db.commit()

    async def _get_live_room(self, room_id: UUID) -> LiveRoom | None:
        result = await self.db.execute(
            select(LiveRoom)
            .where(LiveRoom.id == room_id, LiveRoom.status == LiveRoomStatus.LIVE)
            .options(selectinload(LiveRoom.host))
        )
        return result.scalar_one_or_none()
