"""One Pulse escalation tier per (user_id, tier_number).

Removes duplicate default tiers left by parallel first loads (keeps the lowest id per
user and tier, and points any guardian on a removed duplicate at the kept row), then adds
the unique constraint. A no-op where the constraint already exists.

Revision ID: a1c3e5f7b9d1
Revises: e0f2a4c6b8d0
"""
from alembic import op
import sqlalchemy as sa

revision = "a1c3e5f7b9d1"
down_revision = "e0f2a4c6b8d0"
branch_labels = None
depends_on = None

NAME = "uq_pulse_escalation_tiers_user_tier"


def upgrade():
    bind = op.get_bind()
    if NAME in {c["name"] for c in sa.inspect(bind).get_unique_constraints("pulse_escalation_tiers")}:
        return
    keep = ("SELECT MIN(k.id) FROM pulse_escalation_tiers k "
            "WHERE k.user_id = t.user_id AND k.tier_number = t.tier_number")
    op.execute(f"""
        UPDATE pulse_contacts SET tier_id = (
            SELECT ({keep}) FROM pulse_escalation_tiers t WHERE t.id = pulse_contacts.tier_id)
        WHERE tier_id IS NOT NULL
    """)
    op.execute(f"DELETE FROM pulse_escalation_tiers WHERE id NOT IN (SELECT keep_id FROM "
               f"(SELECT MIN(id) AS keep_id FROM pulse_escalation_tiers GROUP BY user_id, tier_number) kept)")
    with op.batch_alter_table("pulse_escalation_tiers") as batch:
        batch.create_unique_constraint(NAME, ["user_id", "tier_number"])


def downgrade():
    with op.batch_alter_table("pulse_escalation_tiers") as batch:
        batch.drop_constraint(NAME, type_="unique")
