"""add_subscription_frontend_fields

Revision ID: f6fd52b98296
Revises: be215ed3bf6a
Create Date: 2026-01-24 12:05:33.073208

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = 'f6fd52b98296'
down_revision: Union[str, Sequence[str], None] = 'be215ed3bf6a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade() -> None:
    """Upgrade schema - add subscription frontend fields."""
    # Add new columns to subscriptions table for frontend compatibility
    # Only add columns that don't exist

    if not column_exists('subscriptions', 'cancellationInstructions'):
        op.add_column('subscriptions', sa.Column('cancellationInstructions', sa.String(), nullable=True))

    if not column_exists('subscriptions', 'nextBilling'):
        op.add_column('subscriptions', sa.Column('nextBilling', sa.String(), nullable=True))

    if not column_exists('subscriptions', 'loginUrl'):
        op.add_column('subscriptions', sa.Column('loginUrl', sa.String(), nullable=True))

    if not column_exists('subscriptions', 'notes'):
        op.add_column('subscriptions', sa.Column('notes', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('subscriptions') as batch_op:
        if column_exists('subscriptions', 'notes'):
            batch_op.drop_column('notes')
        if column_exists('subscriptions', 'loginUrl'):
            batch_op.drop_column('loginUrl')
        if column_exists('subscriptions', 'nextBilling'):
            batch_op.drop_column('nextBilling')
        if column_exists('subscriptions', 'cancellationInstructions'):
            batch_op.drop_column('cancellationInstructions')
