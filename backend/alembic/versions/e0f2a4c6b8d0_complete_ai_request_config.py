"""Add complete AI request configuration without changing saved choices.

Revision ID: e0f2a4c6b8d0
Revises: d8f0a2c4e6b8
"""
from alembic import op
import sqlalchemy as sa

revision = "e0f2a4c6b8d0"
down_revision = "d8f0a2c4e6b8"
branch_labels = None
depends_on = None


def upgrade():
    if "request_config" not in {column["name"] for column in sa.inspect(op.get_bind()).get_columns("ai_settings")}:
        op.add_column("ai_settings", sa.Column("request_config", sa.JSON(), nullable=True))


def downgrade():
    # Preserve administrator-authored instructions when rolling code back.
    pass
