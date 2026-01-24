"""add_aaguid_to_pulse_credentials

Revision ID: ec250ef45965
Revises: 1e6d20bb64d7
Create Date: 2026-01-23 20:11:39.676509

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ec250ef45965'
down_revision: Union[str, Sequence[str], None] = '1e6d20bb64d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Only add aaguid to pulse_credentials (asset columns already exist)
    op.add_column('pulse_credentials', sa.Column('aaguid', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('pulse_credentials', 'aaguid')
