"""add letters.recipient_contact_id (card C3)

Revision ID: c3d4e5f6a7b8
Revises: c1d0c5a7e3b2
Create Date: 2026-10-26

Idempotent. a7c1b0e3d9f4 adds model columns on databases that have not run it
yet; this covers databases already past it. Existing rows keep NULL (their
recipient_name text is unchanged).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel  # noqa: F401

revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, Sequence[str], None] = 'c1d0c5a7e3b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    insp = sa.inspect(op.get_bind())
    if 'letters' not in insp.get_table_names():
        return
    if 'recipient_contact_id' not in {c['name'] for c in insp.get_columns('letters')}:
        op.add_column('letters', sa.Column('recipient_contact_id', sa.Integer(), nullable=True))


def downgrade() -> None:
    insp = sa.inspect(op.get_bind())
    if 'recipient_contact_id' in {c['name'] for c in insp.get_columns('letters')}:
        op.drop_column('letters', 'recipient_contact_id')
