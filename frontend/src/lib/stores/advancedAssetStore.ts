import { registerSingletonSync } from '$lib/services/sync.svelte';
import { getLegacy } from './persistence';

// --- Transactions ---
export interface AssetTransaction {
    id: string;
    assetId: string;
    date: string;
    type: 'purchase' | 'sale' | 'transfer' | 'valuation_update';
    amount: number;
    description: string;
    performBy: string;
}

// --- Maintenance ---
export interface MaintenanceLog {
    id: string;
    propertyId: string;
    date: string;
    item: string;
    provider: string;
    cost: number;
    nextDueDate?: string;
}

// --- Claims ---
export interface InsuranceClaim {
    id: string;
    policyId: string;
    claimNumber: string;
    dateFiled: string;
    status: 'pending' | 'approved' | 'denied' | 'paid';
    amountClaimed: number;
    amountPaid?: number;
    note: string;
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

const advancedAssetMapper = (data: any) => ({
    ...data,
    transactions: JSON.stringify(data.transactions),
    maintenance: JSON.stringify(data.maintenance),
    claims: JSON.stringify(data.claims)
});

// Initialize Sync Manager
export const advancedAssetSync = registerSingletonSync<AdvancedAssetState>('advanced_assets', 'advanced_assets', advancedAssetMapper, '/api/data');

// Migration / Initialization
if (!advancedAssetSync.data || Object.keys(advancedAssetSync.data).length === 0) {
    const legacy = getLegacy('continuum_advanced_assets');
    if (legacy) {
        try {
            advancedAssetSync.update({ ...DEFAULT_ADVANCED_STATE, ...JSON.parse(legacy) }, true);
        } catch (e) {
            console.error("Migration failed for advanced assets", e);
        }
    } else {
        advancedAssetSync.update(DEFAULT_ADVANCED_STATE, true);
    }
}

// Wrapper for compatibility
export const advancedAssetStore = {
    get data() { return advancedAssetSync.data as AdvancedAssetState; },
    get transactions() { return (advancedAssetSync.data as AdvancedAssetState)?.transactions || []; },
    get maintenance() { return (advancedAssetSync.data as AdvancedAssetState)?.maintenance || []; },
    get claims() { return (advancedAssetSync.data as AdvancedAssetState)?.claims || []; },

    addTransaction: (tx: Omit<AssetTransaction, 'id'>) => {
        const current = advancedAssetSync.data as AdvancedAssetState;
        advancedAssetSync.update({
            ...current,
            transactions: [{ ...tx, id: crypto.randomUUID() }, ...current.transactions]
        });
    },

    addMaintenance: (log: Omit<MaintenanceLog, 'id'>) => {
        const current = advancedAssetSync.data as AdvancedAssetState;
        advancedAssetSync.update({
            ...current,
            maintenance: [{ ...log, id: crypto.randomUUID() }, ...current.maintenance]
        });
    },

    addClaim: (claim: Omit<InsuranceClaim, 'id'>) => {
        const current = advancedAssetSync.data as AdvancedAssetState;
        advancedAssetSync.update({
            ...current,
            claims: [{ ...claim, id: crypto.randomUUID() }, ...current.claims]
        });
    },

    subscribe: advancedAssetSync.subscribe.bind(advancedAssetSync)
};
