"""Persist administrator designations without granting any account automatically.

Revision ID: c6e8a0b2d4f6
Revises: b2e4a6c8d0f1
"""
from alembic import op
import sqlalchemy as sa

revision = "c6e8a0b2d4f6"
down_revision = "b2e4a6c8d0f1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if "is_admin" not in {c["name"] for c in sa.inspect(bind).get_columns("users")}:
        op.add_column("users", sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false()))
    if "ix_users_is_admin" not in {i["name"] for i in sa.inspect(bind).get_indexes("users")}:
        op.create_index("ix_users_is_admin", "users", ["is_admin"])


def downgrade() -> None:
    # Retain recorded designations; dropping this column would discard them.
    pass
