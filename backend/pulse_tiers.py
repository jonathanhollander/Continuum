"""The same contact tier rule as the Pulse pages' pulseTiers.ts."""

from sqlalchemy import case, func
from sqlmodel import Session, select

from backend.pulse_models import PulseContact, PulseEscalationTier


CALL_TIER_NUMBER = {"1_Immediate": 1, "2_SameDay": 2, "3_Service": 3}


def pulse_tier_number(session: Session, contact: PulseContact):
    """An owner's explicit Pulse tier wins; otherwise use their contacts-page call tier."""
    if contact.tier_id:
        tier = session.get(PulseEscalationTier, contact.tier_id)
        if tier and tier.user_id == contact.user_id:
            return tier.tier_number
    return CALL_TIER_NUMBER.get(contact.call_tier)


def pulse_tier_expression():
    """SQL equivalent, so a tier's recipients are selected in one query without per-row reads."""
    explicit = select(PulseEscalationTier.tier_number).where(
        PulseEscalationTier.id == PulseContact.tier_id,
        PulseEscalationTier.user_id == PulseContact.user_id,
    ).scalar_subquery()
    return func.coalesce(explicit, case(CALL_TIER_NUMBER, value=PulseContact.call_tier))
