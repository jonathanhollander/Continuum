import { fromCents, toCents } from './money';
import { subscriptionCycle } from './subscriptionCadence';

/** Monetary equivalents for the caller's open services, rounded after aggregation. */
export function subscriptionAmounts(rows: { cost?: unknown; cycle?: unknown; frequency?: unknown }[]) {
    let monthlyCents = 0;
    let annualCents = 0;
    for (const row of rows) {
        const cents = toCents(row.cost);
        if (subscriptionCycle(row.cycle, row.frequency) === 'Yearly') annualCents += cents;
        else monthlyCents += cents;
    }
    return {
        monthly: fromCents(monthlyCents + Math.round(annualCents / 12)),
        yearly: fromCents(monthlyCents * 12 + annualCents)
    };
}
