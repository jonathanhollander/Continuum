"""Preserve duplicate estate roots and enforce one root per account (X312).

Revision ID: b2e4a6c8d0f1
Revises: a8c3e1f5d7b9
"""
from alembic import op

from backend.estate_persistence import ensure_estate_singletons

revision = "b2e4a6c8d0f1"
down_revision = "a8c3e1f5d7b9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    ensure_estate_singletons(op.get_bind())


def downgrade() -> None:
    # Keep originals, the reconciled root and uniqueness: reversing would discard newer data.
    pass
