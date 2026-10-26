"""add executor_steps (D3, CU-015)

Revision ID: f3b8d1c6e4a2
Revises: e2a7c9d4b1f3
Create Date: 2026-10-26

Idempotent and additive: Executor Toolkit ticks and notes, one row per user
per checklist step, served by /api/data/executor_steps. A database built by
create_all already has the table and this skips it.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'f3b8d1c6e4a2'
down_revision: Union[str, Sequence[str], None] = 'e2a7c9d4b1f3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    insp = sa.inspect(op.get_bind())
    if 'executor_steps' not in insp.get_table_names():
        op.create_table(
            'executor_steps',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
            sa.Column('step_id', sa.String(), nullable=False),
            sa.Column('done', sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column('note', sa.String(), nullable=True, server_default=''),
        )
        insp = sa.inspect(op.get_bind())
    names = {i['name'] for i in insp.get_indexes('executor_steps')}
    if 'ix_executor_steps_user_id' not in names:
        op.create_index('ix_executor_steps_user_id', 'executor_steps', ['user_id'])
    if 'ix_executor_steps_user_id_step_id' not in names:
        op.create_index('ix_executor_steps_user_id_step_id', 'executor_steps', ['user_id', 'step_id'])


def downgrade() -> None:
    pass
