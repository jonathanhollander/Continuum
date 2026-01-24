"""add_financial_account_frontend_fields

Revision ID: f343b5ae2de8
Revises: f6fd52b98296
Create Date: 2026-01-24 12:10:23.891769

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = 'f343b5ae2de8'
down_revision: Union[str, Sequence[str], None] = 'f6fd52b98296'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade() -> None:
    """Upgrade schema - add frontend compatibility fields to financial_accounts."""
    # Add new columns only if they don't exist
    new_columns = [
        ('name', sa.String(), True),
        ('type', sa.String(), True),
        ('value', sa.Float(), True),
        ('location', sa.String(), True),
        ('accountNumber', sa.String(), True),
        ('ownershipPercentage', sa.Float(), True),
        ('beneficiaries', sa.String(), True),
        ('notes', sa.String(), True),
        ('loginUrl', sa.String(), True),
        ('beneficiaryEmail', sa.String(), True),
        ('image', sa.String(), True),
        ('is_closed', sa.Boolean(), True),  # nullable=True for existing rows
        ('closure_date', sa.String(), True),
        ('valueHistory', sa.String(), True),
        ('closureNotes', sa.String(), True),
        ('customAttributes', sa.String(), True),
    ]

    for col_name, col_type, nullable in new_columns:
        if not column_exists('financial_accounts', col_name):
            op.add_column('financial_accounts', sa.Column(col_name, col_type, nullable=nullable))


def downgrade() -> None:
    """Downgrade schema."""
    columns_to_drop = [
        'customAttributes', 'closureNotes', 'valueHistory', 'closure_date',
        'is_closed', 'image', 'beneficiaryEmail', 'loginUrl', 'notes',
        'beneficiaries', 'ownershipPercentage', 'accountNumber', 'location',
        'value', 'type', 'name'
    ]

    with op.batch_alter_table('financial_accounts') as batch_op:
        for col_name in columns_to_drop:
            if column_exists('financial_accounts', col_name):
                batch_op.drop_column(col_name)
