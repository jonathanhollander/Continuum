"""Rewrite stored insurance and utility enum values to documented spelling (X173)

Revision ID: d1f6a3b8c2e5
Revises: c5e2a9f7d3b1
Create Date: 2026-10-26

Card X173. X164 made new saves use the documented spelling; rows stored earlier
may hold other cases. This rewrites insurance_policies.insurance_type,
premium_frequency, status and utilities.service_type, matching case-insensitively
(and ignoring surrounding spaces). Values outside the lists are left alone.
UPDATE only; idempotent. Downgrade is a no-op: the earlier spellings cannot be
recovered.
"""
from typing import Sequence, Union

from alembic import op


revision: str = 'd1f6a3b8c2e5'
down_revision: Union[str, Sequence[str], None] = 'c5e2a9f7d3b1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

CANONICAL = [
    ("insurance_policies", "insurance_type", ["Life", "Health", "Auto", "Home", "Disability", "Other"]),
    ("insurance_policies", "premium_frequency", ["Monthly", "Quarterly", "Annually"]),
    ("insurance_policies", "status", ["Active", "Inactive", "Pending"]),
    ("utilities", "service_type", ["water", "electric", "gas"]),
]


def upgrade() -> None:
    for table, col, values in CANONICAL:
        for v in values:
            op.execute(
                f"UPDATE {table} SET {col} = '{v}' "
                f"WHERE lower(trim({col})) = '{v.lower()}' AND {col} <> '{v}'"
            )


def downgrade() -> None:
    pass
