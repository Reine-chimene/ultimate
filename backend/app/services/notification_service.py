from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profile import Profile
from app.models.subscription import Notification
from app.models.user import User
from app.schemas.notification import NotificationListResponse, NotificationResponse


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def display_name(user: User) -> str:
        return (user.display_name or user.first_name).strip()

    async def create(
        self,
        user_id: UUID,
        type: str,
        title: str,
        body: str,
        *,
        actor_user_id: UUID | None = None,
        reference_type: str | None = None,
        reference_id: UUID | None = None,
        dedupe_reference: bool = False,
    ) -> Notification | None:
        if dedupe_reference and reference_id is not None:
            existing = await self.db.execute(
                select(Notification.id).where(
                    Notification.user_id == user_id,
                    Notification.type == type,
                    Notification.reference_id == reference_id,
                )
            )
            if existing.scalar_one_or_none() is not None:
                return None

        notification = Notification(
            user_id=user_id,
            type=type,
            title=title,
            body=body,
            actor_user_id=actor_user_id,
            reference_type=reference_type,
            reference_id=reference_id,
        )
        self.db.add(notification)
        return notification

    async def notify_like_received(self, receiver: User, sender: User) -> None:
        await self.create(
            receiver.id,
            "like_received",
            "Nouvel intérêt",
            f"❤️ {self.display_name(sender)} s'intéresse à vous",
            actor_user_id=sender.id,
            reference_type="profile",
            reference_id=await self._profile_id_for_user(sender.id),
        )

    async def notify_match_created(
        self, user: User, other: User, match_id: UUID
    ) -> None:
        await self.create(
            user.id,
            "match_created",
            "Nouveau match",
            f"💕 Vous avez un nouveau match avec {self.display_name(other)}",
            actor_user_id=other.id,
            reference_type="match",
            reference_id=match_id,
            dedupe_reference=True,
        )

    async def notify_message_received(
        self, recipient: User, sender: User, match_id: UUID, preview: str
    ) -> None:
        snippet = preview.strip()[:120]
        existing = await self.db.execute(
            select(Notification).where(
                Notification.user_id == recipient.id,
                Notification.type == "message_received",
                Notification.reference_type == "match",
                Notification.reference_id == match_id,
                Notification.read_at.is_(None),
            )
        )
        row = existing.scalar_one_or_none()
        if row is not None:
            row.body = f"💬 {self.display_name(sender)} : {snippet}"
            row.title = "Nouveau message"
            return

        await self.create(
            recipient.id,
            "message_received",
            "Nouveau message",
            f"💬 Vous avez reçu un nouveau message de {self.display_name(sender)}",
            actor_user_id=sender.id,
            reference_type="match",
            reference_id=match_id,
        )

    async def notify_profile_view(
        self, viewed_user: User, viewer: User, profile_id: UUID
    ) -> None:
        await self.create(
            viewed_user.id,
            "profile_view",
            "Visite de profil",
            f"👀 {self.display_name(viewer)} a visité votre profil",
            actor_user_id=viewer.id,
            reference_type="profile",
            reference_id=profile_id,
        )

    async def notify_connection_request(
        self, receiver_id: UUID, sender: User
    ) -> None:
        await self.create(
            receiver_id,
            "connection_request",
            "Nouvelle demande de connexion",
            f"{self.display_name(sender)} souhaite se connecter avec vous.",
            actor_user_id=sender.id,
            reference_type="profile",
            reference_id=await self._profile_id_for_user(sender.id),
        )

    async def notify_connection_accepted(
        self, sender_id: UUID, accepter: User, match_id: UUID
    ) -> None:
        await self.create(
            sender_id,
            "connection_accepted",
            "Demande acceptée",
            f"{self.display_name(accepter)} a accepté votre demande de connexion!",
            actor_user_id=accepter.id,
            reference_type="match",
            reference_id=match_id,
        )

    async def notify_meeting_invitation(
        self, receiver_id: UUID, requester: User
    ) -> None:
        await self.create(
            receiver_id,
            "meeting",
            "Invitation à une rencontre",
            f"{requester.first_name} souhaite vous rencontrer!",
            actor_user_id=requester.id,
        )

    async def notify_meeting_accepted(
        self, requester_id: UUID, accepter: User
    ) -> None:
        await self.create(
            requester_id,
            "meeting",
            "Rencontre acceptée",
            f"{accepter.first_name} a accepté votre invitation!",
            actor_user_id=accepter.id,
        )

    async def notify_connection_declined(
        self, sender_id: UUID, decliner: User
    ) -> None:
        await self.create(
            sender_id,
            "connection_declined",
            "Demande déclinée",
            f"{self.display_name(decliner)} a décliné votre demande de connexion.",
            actor_user_id=decliner.id,
            reference_type="profile",
            reference_id=await self._profile_id_for_user(decliner.id),
        )

    async def _profile_id_for_user(self, user_id: UUID) -> UUID | None:
        result = await self.db.execute(select(Profile.id).where(Profile.user_id == user_id))
        return result.scalar_one_or_none()

    async def list_notifications(
        self,
        user: User,
        page: int = 1,
        limit: int = 20,
        unread_only: bool = False,
    ) -> NotificationListResponse:
        page = max(page, 1)
        limit = min(max(limit, 1), 50)
        offset = (page - 1) * limit

        base = select(Notification).where(Notification.user_id == user.id)
        if unread_only:
            base = base.where(Notification.read_at.is_(None))

        filters = [Notification.user_id == user.id]
        if unread_only:
            filters.append(Notification.read_at.is_(None))
        total_result = await self.db.execute(
            select(func.count()).select_from(Notification).where(*filters)
        )
        total = int(total_result.scalar_one() or 0)

        result = await self.db.execute(
            base.order_by(Notification.created_at.desc()).offset(offset).limit(limit)
        )
        unread_count = await self.unread_count(user)

        return NotificationListResponse(
            items=[NotificationResponse.model_validate(n) for n in result.scalars().all()],
            total=total,
            page=page,
            limit=limit,
            unread_count=unread_count,
        )

    async def mark_read(self, user: User, notification_id: UUID) -> NotificationResponse:
        result = await self.db.execute(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.user_id == user.id,
            )
        )
        notification = result.scalar_one_or_none()
        if notification is None:
            raise ValueError("Notification introuvable")

        notification.read_at = datetime.now(UTC)
        await self.db.commit()
        await self.db.refresh(notification)
        return NotificationResponse.model_validate(notification)

    async def mark_all_read(self, user: User) -> int:
        result = await self.db.execute(
            select(Notification).where(
                Notification.user_id == user.id,
                Notification.read_at.is_(None),
            )
        )
        notifications = result.scalars().all()
        now = datetime.now(UTC)
        for n in notifications:
            n.read_at = now
        await self.db.commit()
        return len(notifications)

    async def unread_count(self, user: User) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(Notification).where(
                Notification.user_id == user.id,
                Notification.read_at.is_(None),
            )
        )
        return int(result.scalar_one() or 0)
