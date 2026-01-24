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

// Keys should now be the suffix used in persistence.ts
// e.g. 'assets' -> continuum_acc_{id}_prof_{pid}_assets
export const MODULES_CONFIG = [
    { id: 'assets_assets-main', name: 'Financial Accounts', path: '/financial-accounts' },
    { id: 'docs_legal-vault', name: 'Legal Documents', path: '/modules/legal-documents' },
    { id: 'insurance_policies', name: 'Insurance', path: '/modules/insurance' },
    { id: 'subscriptions', name: 'Subscriptions', path: '/modules/subscriptions' },
    { id: 'heirlooms', name: 'Heirlooms', path: '/modules/heirlooms' },
    { id: 'family_memories', name: 'Family Memories', path: '/modules/family-hub' },
    { id: 'timeline_events', name: 'Life Timeline', path: '/modules/timeline' },
    { id: 'executor_tasks', name: 'Executor Tasks', path: '/modules/executor-toolkit' },
    { id: 'digital_guardian', name: 'Digital Guardian', path: '/modules/digital-guardian' },
    { id: 'pets', name: 'Pets', path: '/modules/pets' },
    { id: 'funeral_wishes', name: 'Funeral Plans', path: '/modules/funeral' },
];

export function analyzeEstateHealth(): ModuleStatus[] {
    if (typeof localStorage === 'undefined') return [];

    return MODULES_CONFIG.map(mod => {
        // Use getStored to handle account/profile namespacing automatically
        const data = getStored<any>(mod.id, null);

        let count = 0;
        let hasData = false;

        if (data) {
            try {
                // If getStored returns a string (unlikely if we typed it, but possible for legacy), parse it
                // But getStored implementation JSON.parses for us usually.
                // However, let's assume it returns the object already.
                const parsed = typeof data === 'string' ? JSON.parse(data) : data;

                if (Array.isArray(parsed)) {
                    count = parsed.length;
                    hasData = count > 0;
                } else if (typeof parsed === 'object') {
                    // For single object stores like Digital Guardian
                    count = Object.keys(parsed).length;
                    hasData = count > 0;
                }
            } catch (e) {
                console.error(`Failed to analyze ${mod.id}`, e);
            }
        }

        let health: 'critical' | 'partial' | 'healthy' = 'critical';
        if (hasData) {
            health = 'healthy';
            // Add custom logic for partial here if needed, e.g. checking specific fields
            if (mod.id === 'assets_assets-main' && count < 3) health = 'partial'; // Arbitrary threshold
        }

        return {
            id: mod.id,
            name: mod.name,
            path: mod.path,
            hasData,
            itemCount: count,
            health
        };
    });
}

