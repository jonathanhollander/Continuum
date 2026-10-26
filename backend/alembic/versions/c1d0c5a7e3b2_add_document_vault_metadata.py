"""documents: vault metadata columns (witnesses, dates, stored file id, custom fields)

Revision ID: c1d0c5a7e3b2
Revises: c8d1a2b3e4f5
Create Date: 2026-10-26

Card C1. Adds the columns DocumentVault saves. Idempotent: the app's startup
create_all or a7c1b0e3d9f4 may already have added them on a fresh database.
No data is changed.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = 'c1d0c5a7e3b2'
down_revision: Union[str, Sequence[str], None] = 'c8d1a2b3e4f5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

COLUMNS = [
    ('witnesses', sqlmodel.sql.sqltypes.AutoString(), None),
    ('signed_date', sqlmodel.sql.sqltypes.AutoString(), None),
    ('next_review_date', sqlmodel.sql.sqltypes.AutoString(), None),
    ('media_id', sa.Integer(), None),
    ('custom_attributes', sqlmodel.sql.sqltypes.AutoString(), sa.text("'{}'")),
]


def _have() -> set:
    insp = sa.inspect(op.get_bind())
    if 'documents' not in insp.get_table_names():
        return set()
    return {c['name'] for c in insp.get_columns('documents')}


def upgrade() -> None:
    have = _have()
    if not have:
        return
    for name, type_, default in COLUMNS:
        if name not in have:
            op.add_column('documents', sa.Column(name, type_, nullable=True, server_default=default))


def downgrade() -> None:
    have = _have()
    drop = [name for name, _, _ in COLUMNS if name in have]
    if drop:
        with op.batch_alter_table('documents') as batch_op:
            for name in drop:
                batch_op.drop_column(name)
