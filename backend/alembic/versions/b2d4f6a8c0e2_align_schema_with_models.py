"""Align the schema with the models (PL-23)

Revision ID: b2d4f6a8c0e2
Revises: a1c3e5f7b9d1

- assets.purchaseDate: DATETIME -> text (the model keeps YYYY-MM-DD text).
- Drops financial_accounts.customAttributes and calendar_events.recurrence (no model uses them).
- The model booleans below become NOT NULL: NULLs are filled with false first.
- Drops server defaults the models do not declare (custom_attributes '{}', those booleans,
  pulse_contacts.is_recipient); the models supply these values on every insert.
Idempotent: every step checks the live schema first, so it is a no-op where already right.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b2d4f6a8c0e2'
down_revision: Union[str, Sequence[str], None] = 'a1c3e5f7b9d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

NOT_NULL_BOOLEANS = {
    'assets': ['is_closed'],
    'financial_accounts': ['is_closed'],
    'pulse_contacts': ['is_beneficiary', 'is_executor', 'is_emergency_contact'],
    'users': ['overwhelm_muted', 'onboarding_completed'],
}
DROP_COLUMNS = {'financial_accounts': ['customAttributes'], 'calendar_events': ['recurrence']}
DROP_DEFAULTS = {'pulse_contacts': ['is_recipient']}


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    sqlite = bind.dialect.name == 'sqlite'
    tables = set(insp.get_table_names())
    # table -> list of (kind, column) changes, applied in one batch per table on SQLite
    plan = {}

    for table in tables:
        columns = {c['name']: c for c in insp.get_columns(table)}
        changes = plan.setdefault(table, [])
        if table == 'assets' and 'purchaseDate' in columns and not isinstance(columns['purchaseDate']['type'], sa.String):
            changes.append(('text', 'purchaseDate'))
        for name in DROP_COLUMNS.get(table, []):
            if name in columns:
                changes.append(('drop', name))
        for name in NOT_NULL_BOOLEANS.get(table, []):
            if name in columns:
                if columns[name]['nullable']:
                    op.execute(sa.text(f'UPDATE {table} SET {name} = false WHERE {name} IS NULL'))
                    changes.append(('not_null', name))
                if columns[name].get('default') is not None:
                    changes.append(('no_default', name))
        for name in ['custom_attributes'] + DROP_DEFAULTS.get(table, []):
            if name in columns and columns[name].get('default') is not None:
                changes.append(('no_default', name))

    for table, changes in plan.items():
        if not changes:
            continue
        if sqlite:
            with op.batch_alter_table(table) as batch:
                _apply(batch, table, changes, sqlite)
        else:
            _apply(op, table, changes, sqlite)

    if sqlite and plan.get('assets') and ('text', 'purchaseDate') in plan['assets']:
        op.execute(sa.text('UPDATE assets SET "purchaseDate" = substr("purchaseDate", 1, 10) WHERE length("purchaseDate") > 10'))


def _apply(target, table, changes, sqlite):
    kw = {} if sqlite else {'table_name': table}
    for kind, name in changes:
        if kind == 'text':
            extra = {} if sqlite else {'postgresql_using': 'to_char("purchaseDate", \'YYYY-MM-DD\')'}
            target.alter_column(column_name=name, type_=sa.String(), existing_nullable=True, **extra, **kw)
        elif kind == 'drop':
            target.drop_column(column_name=name, **kw)
        elif kind == 'not_null':
            target.alter_column(column_name=name, nullable=False, existing_type=sa.Boolean(), **kw)
        elif kind == 'no_default':
            target.alter_column(column_name=name, server_default=None, **kw)


def downgrade() -> None:
    # Data-preserving alignment; the dropped columns held no model data.
    pass
