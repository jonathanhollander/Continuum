import { registerSync } from "$lib/services/sync.svelte";

export type AssetType = 'Property' | 'Financial' | 'Business' | 'Vehicle' | 'Digital' | 'Debt' | 'Other';

/** A row the family owes (loan, mortgage, credit card): subtracted from the estate, never added. */
export function isDebt(a: { type?: string } | null | undefined): boolean {
    const t = String(a?.type ?? '').trim().toLowerCase();
    return t === 'debt' || t === 'liability';
}

/** The owned share of a row's value; an unset ownership is 100%. */
export function ownedValue(a: { value?: any; ownershipPercentage?: any }): number {
    const pct = a.ownershipPercentage === null || a.ownershipPercentage === undefined || a.ownershipPercentage === ''
        ? 100 : Number(a.ownershipPercentage);
    const share = Number.isFinite(pct) ? pct / 100 : 1;
    return (Number(a.value) || 0) * share;
}

/** The one estate total: open assets minus open debts. */
export function estateTotals(items: any[]): { assets: number; debts: number; net: number } {
    let assets = 0, debts = 0;
    for (const a of items) {
        if (!a || a.is_closed) continue;
        if (isDebt(a)) debts += Math.abs(ownedValue(a)); // an amount owed, however it was typed
        else assets += ownedValue(a);
    }
    return { assets, debts, net: assets - debts };
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
    return {
        ...item,
        // Remote (snake) -> Local (camel)
        is_closed: item.is_closed ?? item.isClosed ?? false,
        closure_date: item.closure_date ?? item.closureDate,
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
