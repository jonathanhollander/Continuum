"""make_financial_account_institution_nullable

Revision ID: 08fcd9308bab
Revises: f343b5ae2de8
Create Date: 2026-01-24 12:18:31.089172

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '08fcd9308bab'
down_revision: Union[str, Sequence[str], None] = 'f343b5ae2de8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def column_is_nullable(table_name: str, column_name: str) -> bool:
    """Check if a column is nullable."""
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = inspector.get_columns(table_name)
    for col in columns:
        if col['name'] == column_name:
            return col['nullable']
    return False


def upgrade() -> None:
    """Upgrade schema - make financial_accounts.institution and account_type nullable."""
    # Only modify financial_accounts table - the key columns needed
    # SQLite requires batch mode for ALTER COLUMN operations

    # Check if we need to make changes
    if not column_is_nullable('financial_accounts', 'institution'):
        with op.batch_alter_table('financial_accounts') as batch_op:
            batch_op.alter_column('institution',
                existing_type=sa.VARCHAR(),
                nullable=True)

    if not column_is_nullable('financial_accounts', 'account_type'):
        with op.batch_alter_table('financial_accounts') as batch_op:
            batch_op.alter_column('account_type',
                existing_type=sa.VARCHAR(),
                nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    # Note: Cannot easily revert to NOT NULL if there are NULL values
    # This is intentionally a no-op for safety
    pass
