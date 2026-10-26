"""add_global_custom_fields_support

Revision ID: 2d53606557e8
Revises: 57c5130143b3
Create Date: 2026-01-24 03:47:56.782613

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2d53606557e8'
down_revision: Union[str, Sequence[str], None] = '57c5130143b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

CUSTOM_ATTRIBUTE_TABLES = (
    'funeraldata', 'heirlooms', 'letters', 'lifeevent',
    'pulse_contacts', 'subscriptions', 'timecapsulemessage',
)
CUSTOM_FIELD_TABLE = 'user_custom_field_definitions'
CUSTOM_FIELD_INDEXES = (
    ('ix_user_custom_field_definitions_entity_type', 'entity_type'),
    ('ix_user_custom_field_definitions_user_id', 'user_id'),
)


def upgrade() -> None:
    """Upgrade schema - add custom_attributes to tables that need it."""
    inspector = sa.inspect(op.get_bind())
    tables = set(inspector.get_table_names())
    for table in CUSTOM_ATTRIBUTE_TABLES:
        if table in tables and 'custom_attributes' not in {
            column['name'] for column in inspector.get_columns(table)
        }:
            op.add_column(table, sa.Column(
                'custom_attributes', sa.String(), nullable=True, server_default='{}'
            ))

    # Some historical schemas have this optional table only after B0's repair.
    # Check before issuing DDL: catching a missing-table/duplicate-index error
    # would leave a PostgreSQL migration transaction aborted.
    if CUSTOM_FIELD_TABLE in tables:
        columns = {column['name'] for column in inspector.get_columns(CUSTOM_FIELD_TABLE)}
        indexes = {index['name'] for index in inspector.get_indexes(CUSTOM_FIELD_TABLE)}
        for name, column in CUSTOM_FIELD_INDEXES:
            if name not in indexes and column in columns:
                op.create_index(op.f(name), CUSTOM_FIELD_TABLE, [column], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    inspector = sa.inspect(op.get_bind())
    tables = set(inspector.get_table_names())
    if CUSTOM_FIELD_TABLE in tables:
        indexes = {index['name'] for index in inspector.get_indexes(CUSTOM_FIELD_TABLE)}
        for name, _ in reversed(CUSTOM_FIELD_INDEXES):
            if name in indexes:
                op.drop_index(op.f(name), table_name=CUSTOM_FIELD_TABLE)

    for table in reversed(CUSTOM_ATTRIBUTE_TABLES):
        if table in tables and 'custom_attributes' in {
            column['name'] for column in inspector.get_columns(table)
        }:
            op.drop_column(table, 'custom_attributes')
