"""add_view_preferences_to_users

Revision ID: 817c6b026811
Revises: 08fcd9308bab
Create Date: 2026-01-25 20:03:25.015029

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '817c6b026811'
down_revision: Union[str, Sequence[str], None] = '08fcd9308bab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - add view_preferences to users table."""
    # Add view_preferences column to users table
    # Uses JSON type for PostgreSQL, TEXT for SQLite
    op.add_column('users', sa.Column('view_preferences', sa.JSON(), nullable=True))


def downgrade() -> None:
    """Downgrade schema - remove view_preferences from users table."""
    # Remove view_preferences column from users table
    op.drop_column('users', 'view_preferences')
