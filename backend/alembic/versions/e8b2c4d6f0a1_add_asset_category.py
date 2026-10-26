"""add assets.category and its index (CU-004)

Revision ID: e8b2c4d6f0a1
Revises: d5f1b9c3a7e2
Create Date: 2026-10-26

Idempotent. a7c1b0e3d9f4 already adds the column on databases that have not
run it yet; this covers databases already past it. No data is changed: existing
rows keep category NULL (read-time rule in routers/estate_data.py).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'e8b2c4d6f0a1'
down_revision: Union[str, Sequence[str], None] = 'd5f1b9c3a7e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    insp = sa.inspect(op.get_bind())
    if 'assets' not in insp.get_table_names():
        return
    if 'category' not in {c['name'] for c in insp.get_columns('assets')}:
        op.add_column('assets', sa.Column('category', sa.String(), nullable=True))
    if 'ix_assets_user_category' not in {i['name'] for i in insp.get_indexes('assets')}:
        op.create_index('ix_assets_user_category', 'assets', ['user_id', 'category'])


def downgrade() -> None:
    pass
