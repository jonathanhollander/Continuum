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

const advancedAssetMapper = (data: any) => {
    if (!data) return data;

    // Remote -> Local (if it's a string)
    let transactions = data.transactions;
    if (typeof transactions === 'string') {
        try { transactions = JSON.parse(transactions); } catch { transactions = []; }
    }

    let maintenance = data.maintenance;
    if (typeof maintenance === 'string') {
        try { maintenance = JSON.parse(maintenance); } catch { maintenance = []; }
    }

    let claims = data.claims;
    if (typeof claims === 'string') {
        try { claims = JSON.parse(claims); } catch { claims = []; }
    }

    // Local -> Remote (if it's an object)
    // Actually, SQLModel expects strings. But if we send objects, Pydantic might complain.
    // Our mapper in SyncManager handles this for payload.
    const isLocal = Array.isArray(transactions);

    return {
        ...data,
        transactions: isLocal ? JSON.stringify(transactions) : transactions,
        maintenance: isLocal ? JSON.stringify(maintenance) : maintenance,
        claims: isLocal ? JSON.stringify(claims) : claims,
        // Also provide plain parsed versions for local use
        _local: {
            transactions: Array.isArray(transactions) ? transactions : JSON.parse(transactions || '[]'),
            maintenance: Array.isArray(maintenance) ? maintenance : JSON.parse(maintenance || '[]'),
            claims: Array.isArray(claims) ? claims : JSON.parse(claims || '[]')
        }
    };
};

// Wait, the mapper pattern I used above is a bit messy because it mixes formats.
// Better to have SyncManager handle the "serialize" and "deserialize" steps if needed,
// OR just make the mapper pure for the direction it's being used.
// If SyncManager.sync calls it: it should return Local format.
// If SyncManager.update calls it: it should return Remote format.

// Actually, the simplest way is to check the type of input.
const betterMapper = (data: any) => {
    if (!data) return data;

    const isRemote = typeof data.transactions === 'string';

    if (isRemote) {
        return {
            ...data,
            transactions: JSON.parse(data.transactions || '[]'),
            maintenance: JSON.parse(data.maintenance || '[]'),
            claims: JSON.parse(data.claims || '[]')
        };
    } else {
        return {
            ...data,
            transactions: JSON.stringify(data.transactions || []),
            maintenance: JSON.stringify(data.maintenance || []),
            claims: JSON.stringify(data.claims || [])
        };
    }
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

    subscribe: advancedAssetSync.subscribe.bind(advancedAssetSync)
};
