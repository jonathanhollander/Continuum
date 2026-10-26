"""add timecapsulemessage.recipient_contact_id (card X100)

Revision ID: a1b2c3d4e5f7
Revises: f2d5a8c1e7b4
Create Date: 2026-10-26

Card X100. A time capsule can name the person it is for from contacts, as letters
do (C3), so the recipient start page (D2) matches it by id. Idempotent and
additive: startup create_all may already have added the column; then it is
skipped. Existing rows keep NULL and still match on their recipient text.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel  # noqa: F401

revision: str = 'a1b2c3d4e5f7'
down_revision: Union[str, Sequence[str], None] = 'f2d5a8c1e7b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLE = 'timecapsulemessage'
COLUMN = 'recipient_contact_id'


def upgrade() -> None:
    insp = sa.inspect(op.get_bind())
    if TABLE not in insp.get_table_names():
        return
    if COLUMN not in {c['name'] for c in insp.get_columns(TABLE)}:
        op.add_column(TABLE, sa.Column(COLUMN, sa.Integer(), nullable=True))


def downgrade() -> None:
    insp = sa.inspect(op.get_bind())
    if TABLE not in insp.get_table_names():
        return
    if COLUMN in {c['name'] for c in insp.get_columns(TABLE)}:
        with op.batch_alter_table(TABLE) as batch_op:
            batch_op.drop_column(COLUMN)
