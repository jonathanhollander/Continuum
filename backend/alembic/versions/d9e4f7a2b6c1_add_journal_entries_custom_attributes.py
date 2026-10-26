"""add journal_entries.custom_attributes (X66)

Revision ID: d9e4f7a2b6c1
Revises: c3d4e5f6a7b8
Create Date: 2026-10-26

Idempotent and additive: the legacy-journal reflection form keeps its Custom
Fields here (JSON text, like every other model's custom_attributes). Existing
rows read as "{}".
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'd9e4f7a2b6c1'
down_revision: Union[str, Sequence[str], None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    insp = sa.inspect(op.get_bind())
    if 'journal_entries' not in insp.get_table_names():
        return
    if 'custom_attributes' not in {c['name'] for c in insp.get_columns('journal_entries')}:
        op.add_column('journal_entries', sa.Column('custom_attributes', sa.String(), nullable=True, server_default='{}'))


def downgrade() -> None:
    pass
