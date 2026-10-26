import { registerSync } from "$lib/services/sync.svelte";

export type AssetType = 'Property' | 'Financial' | 'Business' | 'Vehicle' | 'Digital' | 'Other';

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
        return financialAssetsSync.items
            .filter(a => !a.is_closed)
            .reduce((sum, a) => sum + (a.value || 0), 0);
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
