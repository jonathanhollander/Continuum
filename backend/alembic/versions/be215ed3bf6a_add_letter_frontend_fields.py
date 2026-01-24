"""add_letter_frontend_fields

Revision ID: be215ed3bf6a
Revises: bef362c8a2e2
Create Date: 2026-01-24 11:56:37.294344

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = 'be215ed3bf6a'
down_revision: Union[str, Sequence[str], None] = 'bef362c8a2e2'
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
    # Add new columns to letters table for frontend SyncManager compatibility
    # Only add columns that don't exist

    if not column_exists('letters', 'date'):
        op.add_column('letters', sa.Column('date', sa.String(), nullable=True))

    if not column_exists('letters', 'type'):
        op.add_column('letters', sa.Column('type', sa.String(), nullable=True))

    if not column_exists('letters', 'triggerDate'):
        op.add_column('letters', sa.Column('triggerDate', sa.String(), nullable=True))

    if not column_exists('letters', 'triggerMilestone'):
        op.add_column('letters', sa.Column('triggerMilestone', sa.String(), nullable=True))

    if not column_exists('letters', 'isLocked'):
        op.add_column('letters', sa.Column('isLocked', sa.Boolean(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove the added columns from letters table
    with op.batch_alter_table('letters') as batch_op:
        if column_exists('letters', 'isLocked'):
            batch_op.drop_column('isLocked')
        if column_exists('letters', 'triggerMilestone'):
            batch_op.drop_column('triggerMilestone')
        if column_exists('letters', 'triggerDate'):
            batch_op.drop_column('triggerDate')
        if column_exists('letters', 'type'):
            batch_op.drop_column('type')
        if column_exists('letters', 'date'):
            batch_op.drop_column('date')
