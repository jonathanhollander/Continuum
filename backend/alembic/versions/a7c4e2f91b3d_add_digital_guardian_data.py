"""digital_guardian_data: one row per user for the setup checklist and fire drill

Revision ID: a7c4e2f91b3d
Revises: e8b3d6a1c9f2
Create Date: 2026-10-26

Card X42. Holds the digital-guardian setup status and fire-drill steps as JSON
text ({step: bool}), served by /api/data/digital_guardian like funeral_data.
The app's startup create_all may already have made the table; then this skips.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = 'a7c4e2f91b3d'
down_revision: Union[str, Sequence[str], None] = 'e8b3d6a1c9f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if 'digital_guardian_data' in sa.inspect(op.get_bind()).get_table_names():
        return
    op.create_table(
        'digital_guardian_data',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('setup_status', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('fire_drill', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )


def downgrade() -> None:
    op.drop_table('digital_guardian_data')
