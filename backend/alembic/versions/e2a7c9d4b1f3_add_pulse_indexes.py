"""add Pulse lookup indexes (X88)

Revision ID: e2a7c9d4b1f3
Revises: d9e4f7a2b6c1
Create Date: 2026-10-26

Idempotent and additive. Status, portal, respond, confirm, nudge and the
scheduler read the Pulse tables by user_id, portal_token and contact_id; with
no index each read scanned the whole table. Names match the model flags in
pulse_models.py, so a database built by create_all already has them and this
skips each one. An index on the same columns under another name also counts.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'e2a7c9d4b1f3'
down_revision: Union[str, Sequence[str], None] = 'd9e4f7a2b6c1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

INDEXES = [
    ('ix_pulse_checkins_user_id_timestamp', 'pulse_checkins', ['user_id', 'timestamp']),
    ('ix_pulse_escalation_log_user_id', 'pulse_escalation_log', ['user_id']),
    ('ix_pulse_escalation_tiers_user_id', 'pulse_escalation_tiers', ['user_id']),
    ('ix_pulse_contacts_user_id', 'pulse_contacts', ['user_id']),
    ('ix_pulse_contacts_portal_token', 'pulse_contacts', ['portal_token']),
    ('ix_pulse_safety_timers_user_id', 'pulse_safety_timers', ['user_id']),
    ('ix_pulse_messages_user_id', 'pulse_messages', ['user_id']),
    ('ix_pulse_messages_contact_id', 'pulse_messages', ['contact_id']),
]


def upgrade() -> None:
    insp = sa.inspect(op.get_bind())
    tables = set(insp.get_table_names())
    for name, table, cols in INDEXES:
        if table not in tables:
            continue
        if not set(cols) <= {c['name'] for c in insp.get_columns(table)}:
            continue
        existing = insp.get_indexes(table)
        if any(ix['name'] == name or list(ix['column_names']) == cols for ix in existing):
            continue
        op.create_index(name, table, cols)


def downgrade() -> None:
    insp = sa.inspect(op.get_bind())
    tables = set(insp.get_table_names())
    for name, table, _cols in reversed(INDEXES):
        if table in tables and name in {ix['name'] for ix in insp.get_indexes(table)}:
            op.drop_index(name, table_name=table)
