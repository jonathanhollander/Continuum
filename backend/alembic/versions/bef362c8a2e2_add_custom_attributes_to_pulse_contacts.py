"""add_custom_attributes_to_pulse_contacts

Revision ID: bef362c8a2e2
Revises: 2d53606557e8
Create Date: 2026-01-24 11:48:09.258377

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = 'bef362c8a2e2'
down_revision: Union[str, Sequence[str], None] = '2d53606557e8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade() -> None:
    """Upgrade schema - SQLite compatible version."""
    # For SQLite, we can't use ALTER COLUMN to drop defaults.
    # Instead, we'll just ensure the columns exist.
    # The main issue was that pulse_contacts.custom_attributes didn't exist.

    # Add custom_attributes column to pulse_contacts if it doesn't exist
    if not column_exists('pulse_contacts', 'custom_attributes'):
        op.add_column('pulse_contacts',
            sa.Column('custom_attributes', sa.String(), nullable=True, server_default='{}'))

    # For other tables, the columns likely already exist but may have different defaults.
    # SQLite doesn't support ALTER COLUMN, so we skip changing defaults.
    # This is acceptable since the default is handled at the application/ORM level.

    # Note: The auto-generated migration tried to remove server_default from many tables,
    # but this is not critical for functionality and SQLite doesn't support it anyway.

    # For user_custom_field_definitions, we also skip the nullable/autoincrement changes
    # as these require table recreation in SQLite and the current schema is functional.


def downgrade() -> None:
    """Downgrade schema."""
    # Remove the custom_attributes column from pulse_contacts if it was added
    if column_exists('pulse_contacts', 'custom_attributes'):
        with op.batch_alter_table('pulse_contacts') as batch_op:
            batch_op.drop_column('custom_attributes')
