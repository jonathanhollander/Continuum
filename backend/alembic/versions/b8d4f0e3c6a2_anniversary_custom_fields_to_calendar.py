"""Move anniversary_event custom-field definitions to calendar (X115)

Revision ID: b8d4f0e3c6a2
Revises: a7c3e9d2b5f1
Create Date: 2026-10-26

Card X115. anniversary-manager and calendar both edit CalendarEvent rows but listed
custom fields under different entity types ("anniversary_event" vs "calendar"), so a
value added on one page had no input on the other. Both pages now use "calendar".
This moves each user's existing "anniversary_event" definitions to "calendar". Values
are keyed by field name in custom_attributes, so where the user already has a
"calendar" definition with the same name, the anniversary copy is a duplicate and is
removed instead of moved (no value is lost). Idempotent: a second run finds no rows.
Downgrade is a no-op: moved rows cannot be told apart from ones made on calendar.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b8d4f0e3c6a2'
down_revision: Union[str, Sequence[str], None] = 'a7c3e9d2b5f1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLE = 'user_custom_field_definitions'
OLD = 'anniversary_event'
NEW = 'calendar'


def upgrade() -> None:
    bind = op.get_bind()
    if TABLE not in sa.inspect(bind).get_table_names():
        return
    bind.execute(sa.text(
        f"DELETE FROM {TABLE} WHERE entity_type = :old AND EXISTS ("
        f" SELECT 1 FROM {TABLE} AS c WHERE c.entity_type = :new"
        f" AND c.user_id = {TABLE}.user_id AND c.name = {TABLE}.name)"
    ), {"old": OLD, "new": NEW})
    bind.execute(sa.text(
        f"UPDATE {TABLE} SET entity_type = :new WHERE entity_type = :old"
    ), {"old": OLD, "new": NEW})


def downgrade() -> None:
    pass
