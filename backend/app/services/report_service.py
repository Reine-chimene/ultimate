from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.social import Block, Report
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.report import BlockCreate, BlockResponse, ReportCreate, ReportResponse


class ReportService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_report(self, reporter: User, data: ReportCreate) -> ReportResponse:
        if reporter.id == data.reported_id:
            raise ValueError("Vous ne pouvez pas vous signaler vous-même")

        reported = await self.db.get(User, data.reported_id)
        if reported is None:
            raise ValueError("Utilisateur introuvable")

        report = Report(
            reporter_id=reporter.id,
            reported_id=data.reported_id,
            reason=data.reason.strip(),
            description=data.description,
        )
        self.db.add(report)
        await self.db.commit()
        await self.db.refresh(report)
        return ReportResponse.model_validate(report)

    async def block_user(self, blocker: User, data: BlockCreate) -> BlockResponse:
        if blocker.id == data.blocked_id:
            raise ValueError("Vous ne pouvez pas vous bloquer vous-même")

        blocked = await self.db.get(User, data.blocked_id)
        if blocked is None:
            raise ValueError("Utilisateur introuvable")

        existing = await self.db.execute(
            select(Block).where(
                Block.blocker_id == blocker.id,
                Block.blocked_id == data.blocked_id,
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError("Utilisateur déjà bloqué")

        block = Block(blocker_id=blocker.id, blocked_id=data.blocked_id)
        self.db.add(block)
        await self.db.commit()
        await self.db.refresh(block)
        return BlockResponse.model_validate(block)

    async def unblock_user(self, blocker: User, blocked_id: UUID) -> MessageResponse:
        result = await self.db.execute(
            select(Block).where(
                Block.blocker_id == blocker.id,
                Block.blocked_id == blocked_id,
            )
        )
        block = result.scalar_one_or_none()
        if block is None:
            raise ValueError("Blocage introuvable")

        await self.db.delete(block)
        await self.db.commit()
        return MessageResponse(message="Utilisateur débloqué")

    async def list_blocks(self, user: User) -> list[BlockResponse]:
        result = await self.db.execute(
            select(Block).where(Block.blocker_id == user.id).order_by(Block.created_at.desc())
        )
        return [BlockResponse.model_validate(b) for b in result.scalars().all()]
