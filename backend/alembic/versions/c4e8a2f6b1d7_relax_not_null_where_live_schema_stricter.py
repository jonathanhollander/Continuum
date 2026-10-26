"""relax NOT NULL where the live schema is stricter than the models

Revision ID: c4e8a2f6b1d7
Revises: a7c1b0e3d9f4
Create Date: 2026-10-26

Idempotent drift repair (CU-001, card B0.1). Production's
financial_accounts.institution and account_type are NOT NULL although the
models say nullable (migration 08fcd9308bab never took effect there). For
every non-primary-key column that the model declares nullable but the live
database has as NOT NULL, this makes the column nullable. It never tightens,
drops, retypes or touches data. Re-running changes nothing.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlmodel import SQLModel


revision: str = 'c4e8a2f6b1d7'
down_revision: Union[str, Sequence[str], None] = 'a7c1b0e3d9f4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing = set(insp.get_table_names())

    for table in SQLModel.metadata.sorted_tables:
        if table.name not in existing:
            continue
        live = {c['name']: c for c in insp.get_columns(table.name)}
        todo = []
        for col in table.columns:
            lc = live.get(col.name)
            if lc is None or col.primary_key or not col.nullable:
                continue
            if not lc['nullable']:
                todo.append((col.name, lc['type']))
        if not todo:
            continue
        if bind.dialect.name == 'sqlite':
            # SQLite cannot ALTER nullability; batch mode rebuilds the table
            # and copies every row and column across.
            with op.batch_alter_table(table.name) as batch_op:
                for name, typ in todo:
                    batch_op.alter_column(name, existing_type=typ, nullable=True)
        else:
            for name, typ in todo:
                op.alter_column(table.name, name, existing_type=typ, nullable=True)


def downgrade() -> None:
    # Intentionally a no-op: re-tightening to NOT NULL could fail on rows that
    # now hold NULL, and the models declare these columns nullable.
    pass
