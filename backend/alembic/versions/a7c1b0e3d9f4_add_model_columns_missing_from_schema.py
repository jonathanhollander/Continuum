"""add model columns and tables missing from migrated and production schemas

Revision ID: a7c1b0e3d9f4
Revises: 817c6b026811
Create Date: 2026-10-26

Idempotent drift repair (CU-001). Compares SQLModel.metadata with the live
database and ADDS any missing table or column. Never drops, renames, alters
or touches data. Missing columns are added nullable, or with a server_default
taken from the model's scalar default when the model says NOT NULL.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlmodel import SQLModel


revision: str = 'a7c1b0e3d9f4'
down_revision: Union[str, Sequence[str], None] = '817c6b026811'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _server_default(col):
    d = col.default
    if d is None or not getattr(d, 'is_scalar', False) or d.arg is None:
        return None
    v = d.arg
    if isinstance(v, bool):
        return sa.true() if v else sa.false()
    if isinstance(v, (int, float)):
        return sa.text(str(v))
    if isinstance(v, str):
        return sa.text("'" + v.replace("'", "''") + "'")
    return None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing = set(insp.get_table_names())

    for table in SQLModel.metadata.sorted_tables:
        if table.name not in existing:
            table.create(bind, checkfirst=True)
            continue
        have = {c['name'] for c in insp.get_columns(table.name)}
        for col in table.columns:
            if col.name in have or col.primary_key:
                continue
            sd = _server_default(col)
            nullable = col.nullable or sd is None
            op.add_column(
                table.name,
                sa.Column(col.name, col.type, nullable=nullable, server_default=sd),
            )


def downgrade() -> None:
    # Intentionally a no-op: dropping the added columns/tables could destroy data.
    pass
