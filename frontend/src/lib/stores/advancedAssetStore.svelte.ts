import { registerSingletonSync } from "$lib/services/sync.svelte";

export interface AssetTransaction {
    id: string;
    assetId: string;
    date: string;
    type: 'purchase' | 'sale' | 'transfer' | 'valuation_update';
    amount: number;
    description: string;
    performBy: string;
    custom_attributes?: string; // JSON string of custom field values
}

export interface MaintenanceLog {
    id: string;
    propertyId: string;
    date: string;
    item: string;
    provider: string;
    cost: number;
    nextDueDate?: string;
    custom_attributes?: string; // JSON string of custom field values
}

export interface InsuranceClaim {
    id: string;
    policyId: string;
    claimNumber: string;
    dateFiled: string;
    status: 'pending' | 'approved' | 'denied' | 'paid';
    amountClaimed: number;
    amountPaid?: number;
    note: string;
    custom_attributes?: string; // JSON string of custom field values
}

export interface AdvancedAssetState {
    transactions: AssetTransaction[];
    maintenance: MaintenanceLog[];
    claims: InsuranceClaim[];
}

export const DEFAULT_ADVANCED_STATE: AdvancedAssetState = {
    transactions: [],
    maintenance: [],
    claims: []
};

// Always returns arrays: the server stores these as JSON text but accepts real arrays on save
// (SINGLETON_JSON_FIELDS), so nothing here re-stringifies and running it twice is harmless.
const parseList = (v: any): any[] => {
    if (Array.isArray(v)) return v;
    if (typeof v !== 'string' || !v) return [];
    try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
};

const betterMapper = (data: Record<string, unknown>) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return { ...DEFAULT_ADVANCED_STATE };
    return {
        ...data,
        transactions: parseList(data.transactions),
        maintenance: parseList(data.maintenance),
        claims: parseList(data.claims)
    };
};

export const advancedAssetSync = registerSingletonSync<AdvancedAssetState>('advanced_assets', 'advanced_assets', betterMapper, '/api/data').setAffirmationContext('general');

export const advancedAssetStore = {
    get transactions() { return advancedAssetSync.data?.transactions || []; },
    get maintenance() { return advancedAssetSync.data?.maintenance || []; },
    get claims() { return advancedAssetSync.data?.claims || []; },

    addTransaction: (tx: Omit<AssetTransaction, 'id'>) => {
        const current = advancedAssetSync.data || DEFAULT_ADVANCED_STATE;
        return advancedAssetSync.update({
            ...current,
            transactions: [{ ...tx, id: crypto.randomUUID() }, ...current.transactions]
        });
    },

    addMaintenance: (log: Omit<MaintenanceLog, 'id'>) => {
        const current = advancedAssetSync.data || DEFAULT_ADVANCED_STATE;
        return advancedAssetSync.update({
            ...current,
            maintenance: [{ ...log, id: crypto.randomUUID() }, ...current.maintenance]
        });
    },

    addClaim: (claim: Omit<InsuranceClaim, 'id'>) => {
        const current = advancedAssetSync.data || DEFAULT_ADVANCED_STATE;
        return advancedAssetSync.update({
            ...current,
            claims: [{ ...claim, id: crypto.randomUUID() }, ...current.claims]
        });
    },

    sync: () => advancedAssetSync.sync(),

    subscribe: advancedAssetSync.subscribe.bind(advancedAssetSync)
};
