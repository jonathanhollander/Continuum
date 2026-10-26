"""medical_directives.custom_attributes; index on estates.user_id (X103)

Revision ID: a7c3e9d2b5f1
Revises: a1b2c3d4e5f7
Create Date: 2026-10-26

Card X103. The medical page saves custom field values with each directive, but the
table had no column for them, so the server dropped them. Also indexes
estates.user_id, which every snapshot and recipient view filters on (O1 Wave D).
Idempotent and additive: create_all may already have added the column or index;
then that step is skipped.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a7c3e9d2b5f1'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLE = 'medical_directives'
COLUMN = 'custom_attributes'
ESTATES = 'estates'
INDEX = 'ix_estates_user_id'


def upgrade() -> None:
    insp = sa.inspect(op.get_bind())
    tables = insp.get_table_names()
    if TABLE in tables and COLUMN not in {c['name'] for c in insp.get_columns(TABLE)}:
        op.add_column(TABLE, sa.Column(COLUMN, sa.String(), nullable=True, server_default='{}'))
    if ESTATES in tables:
        indexed = [i for i in insp.get_indexes(ESTATES)
                   if i['name'] == INDEX or list(i.get('column_names') or []) == ['user_id']]
        if not indexed:
            op.create_index(INDEX, ESTATES, ['user_id'])


def downgrade() -> None:
    insp = sa.inspect(op.get_bind())
    tables = insp.get_table_names()
    if ESTATES in tables and INDEX in {i['name'] for i in insp.get_indexes(ESTATES)}:
        op.drop_index(INDEX, table_name=ESTATES)
    if TABLE in tables and COLUMN in {c['name'] for c in insp.get_columns(TABLE)}:
        with op.batch_alter_table(TABLE) as batch_op:
            batch_op.drop_column(COLUMN)
