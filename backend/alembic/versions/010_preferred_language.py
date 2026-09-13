"""Phase 1: preferred language on user accounts

Revision ID: 010
Revises: 009
Create Date: 2026-09-13

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "010"
down_revision: Union[str, None] = "009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "preferred_language",
            sa.String(length=5),
            nullable=False,
            server_default="fr",
        ),
    )
    op.create_index("ix_users_preferred_language", "users", ["preferred_language"])


def downgrade() -> None:
    op.drop_index("ix_users_preferred_language", table_name="users")
    op.drop_column("users", "preferred_language")
