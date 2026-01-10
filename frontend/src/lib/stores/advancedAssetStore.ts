import { createProfileStore } from './persistence';

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

interface AdvancedAssetState {
    transactions: AssetTransaction[];
    maintenance: MaintenanceLog[];
    claims: InsuranceClaim[];
}

const DEFAULT_STATE: AdvancedAssetState = {
    transactions: [],
    maintenance: [],
    claims: []
};

// Migration / Initialization
const getInitialData = (): AdvancedAssetState => {
    if (typeof localStorage === 'undefined') return DEFAULT_STATE;

    const unified = localStorage.getItem('continuum_owner_advanced_assets');
    if (unified) return DEFAULT_STATE;

    const legacy = localStorage.getItem('continuum_advanced_assets');
    if (legacy) {
        try {
            return { ...DEFAULT_STATE, ...JSON.parse(legacy) };
        } catch (e) {
            console.error("Migration failed for advanced assets", e);
        }
    }
    return DEFAULT_STATE;
};

function createReactiveAdvancedAssetStore() {
    const store = createProfileStore<AdvancedAssetState>('advanced_assets', getInitialData());
    const { subscribe, update } = store;

    return {
        subscribe,
        // Transaction methods
        addTransaction: (tx: Omit<AssetTransaction, 'id'>) => {
            update(s => ({ ...s, transactions: [{ ...tx, id: crypto.randomUUID() }, ...s.transactions] }));
        },
        removeTransaction: (id: string) => {
            update(s => ({ ...s, transactions: s.transactions.filter(t => t.id !== id) }));
        },

        // Maintenance methods
        addMaintenance: (log: Omit<MaintenanceLog, 'id'>) => {
            update(s => ({ ...s, maintenance: [{ ...log, id: crypto.randomUUID() }, ...s.maintenance] }));
        },
        removeMaintenance: (id: string) => {
            update(s => ({ ...s, maintenance: s.maintenance.filter(m => m.id !== id) }));
        },

        // Claims methods
        addClaim: (claim: Omit<InsuranceClaim, 'id'>) => {
            update(s => ({ ...s, claims: [{ ...claim, id: crypto.randomUUID() }, ...s.claims] }));
        },
        updateClaimStatus: (id: string, status: InsuranceClaim['status'], paid?: number) => {
            update(s => ({ ...s, claims: s.claims.map(c => c.id === id ? { ...c, status, amountPaid: paid ?? c.amountPaid } : c) }));
        },
        removeClaim: (id: string) => {
            update(s => ({ ...s, claims: s.claims.filter(c => c.id !== id) }));
        }
    };
}

export const advancedAssetStore = createReactiveAdvancedAssetStore();
