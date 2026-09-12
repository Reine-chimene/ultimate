"""International expansion: country, timezone, travel plans

Revision ID: 002
Revises: 001
Create Date: 2026-09-12

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE relationship_intention ADD VALUE IF NOT EXISTS 'tonight'")
    op.execute("ALTER TYPE relationship_intention ADD VALUE IF NOT EXISTS 'travel'")

    op.add_column("users", sa.Column("country", sa.String(2), nullable=False, server_default="CA"))
    op.add_column("users", sa.Column("timezone", sa.String(64), nullable=False, server_default="America/Toronto"))
    op.add_column("users", sa.Column("latitude", sa.Float(), nullable=True))
    op.add_column("users", sa.Column("longitude", sa.Float(), nullable=True))
    op.create_index("ix_users_country", "users", ["country"])

    op.create_table(
        "travel_plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("country", sa.String(2), nullable=False),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("arrival_date", sa.Date(), nullable=False),
        sa.Column("departure_date", sa.Date(), nullable=False),
        sa.Column("wants_to_meet", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_travel_plans_user_id", "travel_plans", ["user_id"])
    op.create_index("ix_travel_plans_country", "travel_plans", ["country"])


def downgrade() -> None:
    op.drop_index("ix_travel_plans_country", "travel_plans")
    op.drop_index("ix_travel_plans_user_id", "travel_plans")
    op.drop_table("travel_plans")
    op.drop_index("ix_users_country", "users")
    op.drop_column("users", "longitude")
    op.drop_column("users", "latitude")
    op.drop_column("users", "timezone")
    op.drop_column("users", "country")
