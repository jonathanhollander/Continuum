"""pulse_contacts: recipient flag, note and start-page link (D2)

Revision ID: f2d5a8c1e7b4
Revises: f3b8d1c6e4a2
Create Date: 2026-10-26

Card D2 (CU-005). The owner marks a contact as a recipient, may leave them a
note, and issues one link (/for/<token>) to their start page. Idempotent and
additive: startup migrate_db or create_all may already have added a column or
the index; then that step is skipped. The executor flag already exists
(is_executor).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f2d5a8c1e7b4'
down_revision: Union[str, Sequence[str], None] = 'f3b8d1c6e4a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLE = 'pulse_contacts'
INDEX = 'ix_pulse_contacts_recipient_token'
COLUMNS = [
    ('is_recipient', lambda: sa.Column('is_recipient', sa.Boolean(), nullable=False, server_default=sa.false())),
    ('recipient_note', lambda: sa.Column('recipient_note', sa.String(), nullable=True)),
    ('recipient_token', lambda: sa.Column('recipient_token', sa.String(), nullable=True)),
    ('recipient_token_created_at', lambda: sa.Column('recipient_token_created_at', sa.DateTime(), nullable=True)),
]


def upgrade() -> None:
    insp = sa.inspect(op.get_bind())
    if TABLE not in insp.get_table_names():
        return
    existing = {c['name'] for c in insp.get_columns(TABLE)}
    for name, make in COLUMNS:
        if name not in existing:
            op.add_column(TABLE, make())
    indexed = [i for i in insp.get_indexes(TABLE)
               if i['name'] == INDEX or list(i.get('column_names') or []) == ['recipient_token']]
    if not indexed:
        op.create_index(INDEX, TABLE, ['recipient_token'])


def downgrade() -> None:
    insp = sa.inspect(op.get_bind())
    if TABLE not in insp.get_table_names():
        return
    if INDEX in {i['name'] for i in insp.get_indexes(TABLE)}:
        op.drop_index(INDEX, table_name=TABLE)
    existing = {c['name'] for c in insp.get_columns(TABLE)}
    with op.batch_alter_table(TABLE) as batch_op:
        for name, _ in reversed(COLUMNS):
            if name in existing:
                batch_op.drop_column(name)
