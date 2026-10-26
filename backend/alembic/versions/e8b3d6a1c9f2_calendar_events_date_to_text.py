"""calendar_events.date becomes text on PostgreSQL

Revision ID: e8b3d6a1c9f2
Revises: d5f1b9c3a7e2
Create Date: 2026-10-26

Card X13. Production has calendar_events.date as `timestamp without time zone`,
but the model stores text ("MMDD"/"YYYYMMDD", "MM-DD"), which a timestamp column
cannot hold. On PostgreSQL, and only if the column is still a timestamp, convert
it to VARCHAR keeping every value as "YYYY-MM-DD". SQLite (and fresh databases,
where the column is already text) are untouched. Re-running changes nothing.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e8b3d6a1c9f2'
down_revision: Union[str, Sequence[str], None] = 'd5f1b9c3a7e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != 'postgresql':
        return
    insp = sa.inspect(bind)
    if 'calendar_events' not in insp.get_table_names():
        return
    col = {c['name']: c for c in insp.get_columns('calendar_events')}.get('date')
    if col is None or not isinstance(col['type'], (sa.DateTime, sa.Date)):
        return
    op.execute(
        "ALTER TABLE calendar_events ALTER COLUMN date TYPE VARCHAR "
        "USING to_char(date, 'YYYY-MM-DD')"
    )


def downgrade() -> None:
    # No-op: text values such as "MMDD" cannot be cast back to a timestamp.
    pass
