// One tier meaning on every Pulse page: a contact's Pulse tier is its tier_id when set,
// otherwise the contacts-page call tier ("1_Immediate" -> 1, "2_SameDay" -> 2,
// "3_Service" -> 3). "4_DNR" is "Kept private" (off the call list), so it maps to no tier.
const CALL_TIER_NUMBER: Record<string, number> = {
    "1_Immediate": 1,
    "2_SameDay": 2,
    "3_Service": 3,
};

export function pulseTierNumber(contact: any, tiers: any[]): number | null {
    // SyncManager uses camelCase; the Pulse pages also pass wire-shaped rows.
    const tierId = contact?.tierId !== undefined ? contact.tierId : contact?.tier_id;
    if (tierId) {
        const tier = tiers.find((t) => t.id === tierId);
        if (tier) return tier.tierNumber ?? tier.tier_number;
    }
    const callTier = contact?.callTier !== undefined ? contact.callTier : contact?.call_tier;
    return CALL_TIER_NUMBER[callTier] ?? null;
}

/** The source rows and their resolved tiers, shared by guardian facts and their recount. */
export function enrolledPulseContacts<T>(contacts: T[], tiers: any[]): { contact: T; tierNumber: number }[] {
    return contacts.flatMap(contact => {
        const tierNumber = pulseTierNumber(contact, tiers);
        return tierNumber === null ? [] : [{ contact, tierNumber }];
    });
}
