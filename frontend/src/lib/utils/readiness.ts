import { getStored } from "$lib/stores/persistence";

export type ModuleStatus = {
    id: string;
    name: string;
    hasData: boolean;
    lastUpdated?: string;
    itemCount: number;
    health: 'critical' | 'partial' | 'healthy';
    path: string;
};

// Keys are the SyncManager storage keys (persistence.ts namespaces them per account and profile):
// e.g. 'financial_assets' -> continuum_acc_{id}_prof_{pid}_financial_assets
export const MODULES_CONFIG = [
    { id: 'financial_assets', name: 'Financial Accounts', path: '/modules/financial-accounts' },
    { id: 'documents', name: 'Legal Documents', path: '/modules/legal-documents' },
    { id: 'insurance_policies', name: 'Insurance', path: '/modules/insurance' },
    { id: 'subscriptions', name: 'Subscriptions', path: '/modules/subscriptions' },
    { id: 'heirlooms', name: 'Heirlooms', path: '/modules/heirlooms' },
    { id: 'family_memories', name: 'Family Memories', path: '/modules/family-hub' },
    { id: 'timeline_events', name: 'Life Timeline', path: '/modules/timeline' },
    { id: 'digital_guardian', name: 'Digital Guardian', path: '/modules/digital-guardian' },
    { id: 'pets', name: 'Pets', path: '/modules/pets' },
    { id: 'funeral_data', name: 'Funeral Plans', path: '/modules/funeral' },
];

/** A value someone actually filled in: text, a number, a yes, or a list or object holding one. */
function isFilled(v: unknown): boolean {
    if (v === null || v === undefined || v === '' || v === false) return false;
    if (Array.isArray(v)) return v.some(isFilled);
    if (typeof v === 'object') return Object.values(v as object).some(isFilled);
    return true;
}

export function analyzeEstateHealth(): ModuleStatus[] {
    if (typeof localStorage === 'undefined') return [];

    return MODULES_CONFIG.map(mod => {
        const data = getStored<any>(mod.id, null);

        let count = 0;
        try {
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            if (Array.isArray(parsed)) {
                count = parsed.filter(Boolean).length;
            } else if (parsed && typeof parsed === 'object') {
                // Single-record stores (Digital Guardian, Funeral Plans): the fields someone filled in
                count = Object.values(parsed).filter(isFilled).length;
            }
        } catch (e) {
            console.error(`Failed to analyze ${mod.id}`, e);
        }

        const hasData = count > 0;
        return {
            id: mod.id,
            name: mod.name,
            path: mod.path,
            hasData,
            itemCount: count,
            health: hasData ? 'healthy' : 'critical'
        };
    });
}
