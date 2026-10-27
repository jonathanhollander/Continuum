"""Give every Pulse guardian a portal link (G2, G0d gap 1)

Revision ID: a8c3e1f5d7b9
Revises: d1f6a3b8c2e5
Create Date: 2026-10-26

Card G2. Guardians made on Family & Contacts (POST /api/contacts, then a tier set by
PUT) were saved with no portal_token, so their alert emails linked to /portal/None.
contacts._apply now issues one when a tier is set or the safety-timer flag is on; this
backfills existing rows in that state: one new random token per row, only where the
token is empty. UPDATE only; idempotent. Downgrade is a no-op (clearing tokens would
break links already emailed).
"""
import secrets
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = 'a8c3e1f5d7b9'
down_revision: Union[str, Sequence[str], None] = 'd1f6a3b8c2e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    ids = [row[0] for row in bind.execute(sa.text(
        "SELECT id FROM pulse_contacts "
        "WHERE (portal_token IS NULL OR portal_token = '') "
        "AND (tier_id IS NOT NULL OR notify_on_safety_timer = :yes)"
    ), {"yes": True})]
    for contact_id in ids:
        bind.execute(sa.text(
            "UPDATE pulse_contacts SET portal_token = :tok "
            "WHERE id = :id AND (portal_token IS NULL OR portal_token = '')"
        ), {"tok": secrets.token_urlsafe(32), "id": contact_id})
    print(f"pulse_contacts portal_token backfill: {len(ids)} row(s)")


def downgrade() -> None:
    pass
