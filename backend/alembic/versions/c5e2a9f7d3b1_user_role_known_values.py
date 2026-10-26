"""Store only known user_role values (X125)

Revision ID: c5e2a9f7d3b1
Revises: b8d4f0e3c6a2
Create Date: 2026-10-26

Card X125. users.user_role is read as one of planning/executor/family/advisor
(X118), and the auth router now accepts only those. Older rows hold 'owner'
(the old manual-migration default), NULL, or other strings; this sets each of
them to 'planning', which is how the app already reads them. Idempotent: a
second run finds no rows. Downgrade is a no-op: the old values cannot be told
apart from rows that were 'planning' already.
"""
from typing import Sequence, Union

from alembic import op


revision: str = 'c5e2a9f7d3b1'
down_revision: Union[str, Sequence[str], None] = 'b8d4f0e3c6a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "UPDATE users SET user_role = 'planning' "
        "WHERE user_role IS NULL "
        "OR user_role NOT IN ('planning', 'executor', 'family', 'advisor')"
    )


def downgrade() -> None:
    # No-op: rewritten rows cannot be told apart from ones already 'planning'.
    pass
