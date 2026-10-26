// One tier meaning on every Pulse page: a contact's Pulse tier is its tier_id when set,
// otherwise the contacts-page call tier ("1_Immediate" -> 1, "2_SameDay" -> 2,
// "3_Service" -> 3). "4_DNR" is "Kept private" (off the call list), so it maps to no tier.
const CALL_TIER_NUMBER: Record<string, number> = {
    "1_Immediate": 1,
    "2_SameDay": 2,
    "3_Service": 3,
};

export function pulseTierNumber(contact: any, tiers: any[]): number | null {
    if (contact?.tier_id) {
        const tier = tiers.find((t) => t.id === contact.tier_id);
        if (tier) return tier.tier_number;
    }
    return CALL_TIER_NUMBER[contact?.call_tier] ?? null;
}
