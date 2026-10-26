export type SubscriptionCycle = 'Monthly' | 'Yearly';

// Canonical page choices win. Legacy rows may keep the column default "monthly"
// in cycle and their real cadence in frequency (including the older "Anual" label).
const YEARLY = /^(yearly|year|annual|annually|anual)$/i;
export const subscriptionCycle = (cycle: unknown, frequency: unknown): SubscriptionCycle => {
    const c = String(cycle ?? '').trim();
    if (c === 'Monthly' || c === 'Yearly') return c;
    const named = c && c.toLowerCase() !== 'monthly' ? c : String(frequency ?? c).trim();
    return YEARLY.test(named) ? 'Yearly' : 'Monthly';
};
