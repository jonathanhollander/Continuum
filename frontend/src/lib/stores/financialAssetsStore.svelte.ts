import { registerSync } from "$lib/services/sync.svelte";
import { getLegacy } from './persistence';

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
    image?: string;
    is_closed: boolean;
    closure_date?: string;
    customAttributes?: string;
}

// Migration from legacy localStorage keys
function migrateFinancialAssets(): FinancialAsset[] {
    if (typeof localStorage === 'undefined') return [];

    let combined: FinancialAsset[] = [];

    // Check legacy key
    const legacyData = getLegacy('financial_assets');
    if (legacyData) {
        try {
            const parsed = JSON.parse(legacyData);
            if (Array.isArray(parsed)) combined = [...combined, ...parsed];
        } catch { }
    }

    return combined.map(a => ({
        ...a,
        id: String(a.id)
    }));
}

const financialAssetMapper = (item: any) => {
    if (!item) return item;
    return {
        ...item,
        // Remote (snake) -> Local (camel)
        is_closed: item.is_closed ?? item.isClosed ?? false,
        closure_date: item.closure_date ?? item.closureDate,
        // Ensure valueHistory is an array
        valueHistory: Array.isArray(item.valueHistory) ? item.valueHistory : []
    };
};

export const financialAssetsSync = registerSync<FinancialAsset>('financial_assets', 'financial_assets', financialAssetMapper).setAffirmationContext('general');

// Lazy Migration
if (typeof window !== 'undefined') {
    if (financialAssetsSync.items.length === 0) {
        const legacy = migrateFinancialAssets();
        if (legacy.length > 0) {
            console.log("Migrating financial assets...", legacy);
            financialAssetsSync.items = legacy;
        }
    }
}

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
