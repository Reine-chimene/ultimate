"""V1.0: separate search preferences from profile

Revision ID: 003
Revises: 002
Create Date: 2026-09-12

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

relationship_intention = postgresql.ENUM(
    "relationship",
    "casual",
    "friendship",
    "unsure",
    "tonight",
    "travel",
    name="relationship_intention",
    create_type=False,
)


def upgrade() -> None:
    op.add_column(
        "profiles",
        sa.Column(
            "preferred_intentions",
            postgresql.ARRAY(relationship_intention),
            nullable=False,
            server_default="{}",
        ),
    )
    op.add_column(
        "profiles",
        sa.Column(
            "preferred_countries",
            postgresql.ARRAY(sa.String(2)),
            nullable=False,
            server_default="{}",
        ),
    )
    op.execute(
        """
        UPDATE profiles
        SET preferred_intentions = ARRAY[relationship_intention]::relationship_intention[]
        WHERE cardinality(preferred_intentions) = 0
        """
    )


def downgrade() -> None:
    op.drop_column("profiles", "preferred_countries")
    op.drop_column("profiles", "preferred_intentions")
