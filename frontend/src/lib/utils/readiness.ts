import { financialAssetsSync } from "$lib/stores/financialAssetsStore.svelte";
import { documentSync } from "$lib/stores/documentStore.svelte";
import { insuranceSync } from "$lib/stores/insuranceStore.svelte";
import { subscriptionsSync } from "$lib/stores/subscriptionStore.svelte";
import { heirloomSync } from "$lib/stores/heirloomStore.svelte";
import { familyMemories } from "$lib/stores/visualMemoryStore.svelte";
import { timelineSync } from "$lib/stores/timelineStore.svelte";
import { digitalGuardianSync } from "$lib/stores/digitalGuardianStore.svelte";
import { petSync } from "$lib/stores/petStore.svelte";
import { funeralSync } from "$lib/stores/funeralStore.svelte";

export type ModuleStatus = {
    id: string;
    name: string;
    hasData: boolean;
    lastUpdated?: string;
    itemCount: number;
    health: 'critical' | 'healthy';
    path: string;
};

/** A value someone actually filled in: text, a number, a yes, or a list or object holding one. */
function isFilled(v: unknown): boolean {
    if (v === null || v === undefined || v === false) return false;
    if (typeof v === 'string') return v.trim() !== '';
    if (Array.isArray(v)) return v.some(isFilled);
    if (typeof v === 'object') return Object.values(v as object).some(isFilled);
    return true;
}

const listCount = (items: unknown[] | undefined) => (items ?? []).filter(Boolean).length;

// Each module counts what its own store holds (the device copy at once, the server's after sync),
// so a module saved from another browser shows here too. Reading a store from a page marks it shown,
// which syncs it now.
export const MODULES_CONFIG: { id: string; name: string; path: string; count: () => number }[] = [
    { id: 'financial_assets', name: 'Financial Accounts', path: '/modules/financial-accounts', count: () => listCount(financialAssetsSync.items) },
    { id: 'documents', name: 'Legal Documents', path: '/modules/legal-documents', count: () => listCount(documentSync.items) },
    { id: 'insurance_policies', name: 'Insurance', path: '/modules/insurance', count: () => listCount(insuranceSync.items) },
    { id: 'subscriptions', name: 'Subscriptions', path: '/modules/subscriptions', count: () => listCount(subscriptionsSync.items) },
    { id: 'heirlooms', name: 'Heirlooms', path: '/modules/heirlooms', count: () => listCount(heirloomSync.items) },
    { id: 'family_memories', name: 'Family Memories', path: '/modules/family-hub', count: () => listCount(familyMemories.items) },
    { id: 'timeline_events', name: 'Life Timeline', path: '/modules/timeline', count: () => listCount(timelineSync.items) },
    {
        // The checklist and fire-drill steps marked done
        id: 'digital_guardian', name: 'Digital Guardian', path: '/modules/digital-guardian',
        count: () => {
            const d = digitalGuardianSync.data;
            return [d?.setupStatus, d?.fireDrill].reduce((n, m) => n + Object.values(m ?? {}).filter((v) => v === true).length, 0);
        },
    },
    { id: 'pets', name: 'Pets', path: '/modules/pets', count: () => listCount(petSync.items) },
    {
        // The wishes filled in (the untouched default tradition, "secular", is no choice yet) and the budget lines
        id: 'funeral_data', name: 'Funeral Plans', path: '/modules/funeral',
        count: () => {
            const d = funeralSync.data;
            const wishes = d?.wishes && typeof d.wishes === 'object' ? Object.entries(d.wishes) : [];
            const filledWishes = wishes.filter(([k, v]) => !(k === 'religiousTradition' && v === 'secular') && isFilled(v)).length;
            return filledWishes + listCount(Array.isArray(d?.budget) ? d.budget : []);
        },
    },
];

/** Call from a $derived (or effect) so the result follows each store as it syncs. */
export function analyzeEstateHealth(): ModuleStatus[] {
    return MODULES_CONFIG.map(mod => {
        let count = 0;
        try {
            count = mod.count();
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
