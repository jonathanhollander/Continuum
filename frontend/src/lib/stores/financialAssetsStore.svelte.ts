import { registerSync } from "$lib/services/sync.svelte";
import { oneSpelling } from "$lib/utils/oneSpelling";
import { toCents, fromCents } from "$lib/utils/money";

export type AssetType = 'Property' | 'Financial' | 'Business' | 'Vehicle' | 'Digital' | 'Debt' | 'Other';

// Recognize saved liability labels without rewriting the author's type or amount. A present
// current type always wins; an old account kind never reclassifies an explicit Financial row.
const DEBT_TYPES = new Set(['debt', 'liability', 'credit', 'credit card', 'creditcard', 'loan',
    'mortgage', 'line of credit', 'credit line']);
const financialTypeKey = (v: unknown): string => String(v ?? '').trim().toLowerCase()
    .replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');

/** A row the family owes: subtracted once, whether its amount was entered positive or negative. */
export function isDebt(a: { type?: unknown; account_type?: unknown; accountType?: unknown } | null | undefined): boolean {
    const current = financialTypeKey(a?.type);
    return DEBT_TYPES.has(current || financialTypeKey(a?.account_type ?? a?.accountType));
}

/** The owned share of a row's value; an unset ownership is 100%. */
export function ownedValue(a: { value?: any; ownershipPercentage?: any }): number {
    const pct = a.ownershipPercentage === null || a.ownershipPercentage === undefined || a.ownershipPercentage === ''
        ? 100 : Number(a.ownershipPercentage);
    const share = Number.isFinite(pct) ? pct / 100 : 1;
    return (Number(a.value) || 0) * share;
}

/** The one estate total: open assets minus open debts, each row's share taken to the cent (half-up) and summed in whole cents. */
export function estateTotals(items: any[]): { assets: number; debts: number; net: number } {
    let assets = 0, debts = 0; // whole cents
    for (const a of items) {
        if (!a || a.is_closed) continue;
        const cents = toCents(ownedValue(a));
        if (isDebt(a)) debts += Math.abs(cents); // an amount owed, however it was typed
        else assets += cents;
    }
    return { assets: fromCents(assets), debts: fromCents(debts), net: fromCents(assets - debts) };
}

export interface FinancialAsset {
    id: string;
    name: string;
    type: AssetType;
    value: number;
    location: string;
    accountNumber?: string;
    ownershipPercentage?: number;
    beneficiaries: string;
    notes: string;
    valueHistory: number[];
    loginUrl?: string;
    beneficiaryEmail?: string;
    closureNotes?: string;
    documents?: string;
    image?: string;
    is_closed: boolean;
    closure_date?: string;
    customAttributes?: string;
}

function parseHistory(v: any): number[] {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string' && v) {
        try {
            const parsed = JSON.parse(v);
            if (Array.isArray(parsed)) return parsed;
        } catch { }
    }
    return [];
}

const financialAssetMapper = (item: any) => {
    if (!item) return item;
    // One spelling per field: the pages read is_closed / closure_date; server rows arrive camel-cased.
    const out = oneSpelling(item, { is_closed: 'isClosed', closure_date: 'closureDate' });
    return {
        ...out,
        is_closed: out.is_closed ?? false,
        // Wire is a JSON string (sync.svelte.ts stringifies on write); keep an array locally
        valueHistory: parseHistory(item.valueHistory)
    };
};

export const financialAssetsSync = registerSync<FinancialAsset>('financial_assets', 'financial_assets', financialAssetMapper).setAffirmationContext('general');

// Un-namespaced legacy keys ('financial_assets') carry no account, so they are never adopted:
// the first signed-in account with an empty list would otherwise upload someone else's records.

// Wrapper for dashboard compatibility
export const financialAssetsStore = {
    get items() { return financialAssetsSync.items; },
    get totalValue() {
        return estateTotals(financialAssetsSync.items).net;
    },
    addAsset: (asset: Omit<FinancialAsset, 'id'>) => {
        return financialAssetsSync.create({
            ...asset,
            id: crypto.randomUUID()
        });
    },
    removeAsset: (id: string) => financialAssetsSync.delete(id),
    updateAsset: (id: string, data: Partial<FinancialAsset>) => financialAssetsSync.update(id, data),
    subscribe: financialAssetsSync.subscribe.bind(financialAssetsSync)
};
