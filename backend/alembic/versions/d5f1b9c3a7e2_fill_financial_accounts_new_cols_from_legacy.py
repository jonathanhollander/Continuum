"""fill new financial_accounts columns from legacy ones where empty

Revision ID: d5f1b9c3a7e2
Revises: c4e8a2f6b1d7
Create Date: 2026-10-26

Data-only, idempotent (CU-001, card B0.2). Rows written before the frontend
fields existed carry institution / account_type / balance_estimate but have
NULL name / type / value, so the UI shows them blank. This copies:

  name  <- institution       (only where name  IS NULL)
  type  <- account_type      (only where type  IS NULL), mapped to the UI's
                             asset types; unrecognised values are copied as-is
  value <- balance_estimate  (only where value IS NULL; 0 is preserved)

Never overwrites a non-NULL value, never deletes or drops, and leaves the
legacy columns untouched. account_number_encrypted is deliberately NOT copied
into accountNumber (it may be encrypted). Skips cleanly if the table or a
column is missing. Re-running changes nothing.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = 'd5f1b9c3a7e2'
down_revision: Union[str, Sequence[str], None] = 'c4e8a2f6b1d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# AssetManager's types: Financial, Property, Vehicle, Business, Digital, Other.
# Only clearly-financial legacy bank/investment labels are mapped (to
# 'Financial'); anything else is copied unchanged.
_FINANCIAL = (
    'checking', 'savings', 'investment', 'brokerage', 'retirement', 'bank',
    'credit', 'credit card', 'money market', 'cd', 'ira', '401k',
)


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    if 'financial_accounts' not in insp.get_table_names():
        return
    cols = {c['name'] for c in insp.get_columns('financial_accounts')}

    if {'name', 'institution'} <= cols:
        op.execute(sa.text(
            "UPDATE financial_accounts SET name = institution "
            "WHERE name IS NULL AND institution IS NOT NULL"
        ))
    if {'type', 'account_type'} <= cols:
        in_list = ", ".join(f"'{v}'" for v in _FINANCIAL)
        op.execute(sa.text(
            "UPDATE financial_accounts SET type = CASE "
            f"WHEN LOWER(TRIM(account_type)) IN ({in_list}) THEN 'Financial' "
            "ELSE account_type END "
            "WHERE type IS NULL AND account_type IS NOT NULL"
        ))
    if {'value', 'balance_estimate'} <= cols:
        op.execute(sa.text(
            "UPDATE financial_accounts SET value = balance_estimate "
            "WHERE value IS NULL AND balance_estimate IS NOT NULL"
        ))


def downgrade() -> None:
    # Intentionally a no-op: the copied values cannot be told apart from
    # user-entered ones, and removing them would lose data.
    pass
