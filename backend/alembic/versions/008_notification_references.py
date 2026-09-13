"""P1-A.3: notification references and indexes

Revision ID: 008
Revises: 007
Create Date: 2026-09-13

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "notifications",
        sa.Column("actor_user_id", sa.UUID(), nullable=True),
    )
    op.add_column(
        "notifications",
        sa.Column("reference_type", sa.String(length=50), nullable=True),
    )
    op.add_column(
        "notifications",
        sa.Column("reference_id", sa.UUID(), nullable=True),
    )
    op.create_foreign_key(
        "fk_notifications_actor_user_id",
        "notifications",
        "users",
        ["actor_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_notifications_user_id_created_at",
        "notifications",
        ["user_id", "created_at"],
    )
    op.create_index(
        "ix_notifications_user_id_read_at_created_at",
        "notifications",
        ["user_id", "read_at", "created_at"],
    )
    op.create_index(
        "ix_notifications_actor_user_id",
        "notifications",
        ["actor_user_id"],
    )
    op.create_index(
        "uq_notifications_dedupe_match",
        "notifications",
        ["user_id", "type", "reference_id"],
        unique=True,
        postgresql_where=sa.text("type = 'match_created' AND reference_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_notifications_dedupe_match", table_name="notifications")
    op.drop_index("ix_notifications_actor_user_id", table_name="notifications")
    op.drop_index("ix_notifications_user_id_read_at_created_at", table_name="notifications")
    op.drop_index("ix_notifications_user_id_created_at", table_name="notifications")
    op.drop_constraint("fk_notifications_actor_user_id", "notifications", type_="foreignkey")
    op.drop_column("notifications", "reference_id")
    op.drop_column("notifications", "reference_type")
    op.drop_column("notifications", "actor_user_id")
