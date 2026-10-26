"""pulse_contacts: call_tier and notification_status for the contacts call list

Revision ID: c8d1a2b3e4f5
Revises: a7c4e2f91b3d
Create Date: 2026-10-26

Card C8. The contacts page's call-list tier ("1_Immediate" ... "4_DNR") and the
notification status ("Pending", "Called", ...) were UI-only and lost on reload.
They get their own columns, kept apart from tier_id, which enrolls a contact in
Pulse escalation alerts. Startup migrate_db may already have added them; then
each add is skipped.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = 'c8d1a2b3e4f5'
down_revision: Union[str, Sequence[str], None] = 'a7c4e2f91b3d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

COLUMNS = ('call_tier', 'notification_status')


def upgrade() -> None:
    existing = {c['name'] for c in sa.inspect(op.get_bind()).get_columns('pulse_contacts')}
    for name in COLUMNS:
        if name not in existing:
            op.add_column('pulse_contacts', sa.Column(name, sqlmodel.sql.sqltypes.AutoString(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('pulse_contacts') as batch_op:
        for name in COLUMNS:
            batch_op.drop_column(name)
