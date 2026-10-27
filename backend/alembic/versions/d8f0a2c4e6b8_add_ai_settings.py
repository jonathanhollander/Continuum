"""Add shared and per-purpose AI settings.

Revision ID: d8f0a2c4e6b8
Revises: c6e8a0b2d4f6
"""
from alembic import op
import sqlalchemy as sa

revision = "d8f0a2c4e6b8"
down_revision = "c6e8a0b2d4f6"
branch_labels = None
depends_on = None


def upgrade():
    if not sa.inspect(op.get_bind()).has_table("ai_settings"):
        op.create_table(
            "ai_settings",
            sa.Column("purpose", sa.String(64), primary_key=True),
            sa.Column("variant", sa.String(64), primary_key=True, server_default=""),
            sa.Column("model_id", sa.String(256), nullable=True),
            sa.Column("additional_context", sa.Text(), nullable=False, server_default=""),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.Column("updated_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        )


def downgrade():
    # Preserve administrator choices when rolling application code back.
    pass
