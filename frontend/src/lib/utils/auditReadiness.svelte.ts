import { getRegistry } from '$lib/services/sync.svelte';
import { hasFuneralWishes } from '$lib/stores/auditStore.svelte';
import { financialAssetsSync } from '$lib/stores/financialAssetsStore.svelte';
import { insuranceSync } from '$lib/stores/insuranceStore.svelte';
import { contactSync } from '$lib/stores/familyStore.svelte';
import { directiveSync } from '$lib/stores/medicalStore.svelte';
import { digitalAssetsSync } from '$lib/stores/digitalAssetsStore.svelte';
import { heirloomSync } from '$lib/stores/heirloomStore.svelte';
import { lettersSync } from '$lib/stores/letterStore.svelte';
import { funeralSync } from '$lib/stores/funeralStore.svelte';
import { journalStore } from '$lib/stores/journalStore.svelte';
import { visualMemories } from '$lib/stores/visualMemoryStore.svelte';
import { timeCapsuleSync } from '$lib/stores/timeCapsuleStore.svelte';

type SourceManager = { lastSync: Date | null; status: string; sync(): Promise<void> };
export type AuditSource = {
    id: string;
    name: string;
    path: string;
    state: 'loading' | 'ready' | 'cached' | 'error';
    known: boolean;
    recordIds: (string | number)[];
};
export type AuditReadiness = {
    sources: AuditSource[];
    canScore: boolean;
    confirmed: boolean;
    hasErrors: boolean;
    hasCached: boolean;
};

/** Exactly the sources calculateAudit reads, including every alternative in the memory score.
 * Read all managers on each call: their getters also bring on-demand sources into this page's load.
 * A meaningful device copy is usable, labelled provisional. An unconfirmed empty copy is unknown.
 * A successful empty server answer is known, unlike a failed read; only confirmed reads may redirect.
 */
function sourceDependencies() {
    const reg = getRegistry();
    const funeral = funeralSync.data;
    const funeralId = (funeral as { id?: string | number } | null)?.id;
    const list = (id: string, name: string, path: string, manager: SourceManager | undefined,
        items: { id?: string | number }[]) => ({ id, name, path, manager,
            hasRecords: items.length > 0,
            recordIds: items.flatMap((item) => item.id === undefined ? [] : [item.id]),
        });
    return [
        list('financial_assets', 'Financial accounts', '/modules/financial-accounts', financialAssetsSync, financialAssetsSync.items),
        list('insurance_policies', 'Insurance', '/modules/insurance', insuranceSync, insuranceSync.items),
        list('family_members', 'Contacts', '/modules/contacts', contactSync, contactSync.items),
        list('medical_directives', 'Medical wishes', '/modules/medical', directiveSync, directiveSync.items),
        list('digital_assets', 'Digital accounts', '/modules/digital-guardian', digitalAssetsSync, digitalAssetsSync.items),
        list('heirlooms', 'Heirlooms', '/modules/heirlooms', heirloomSync, heirloomSync.items),
        list('letters', 'Letters', '/modules/letters', lettersSync, lettersSync.items),
        { id: 'funeral_data', name: 'Funeral wishes', path: '/modules/funeral', manager: funeralSync,
            hasRecords: hasFuneralWishes(funeral?.wishes), recordIds: funeralId === undefined ? [] : [funeralId] },
        list('journal_entries', 'Journal', '/modules/legacy-journal', reg['journal_entries'], journalStore.items),
        list('visual_memories', 'Memories', '/modules/visual-memories', reg['visual_memories'], visualMemories.items),
        list('time_capsule', 'Time capsules', '/modules/time-capsule', timeCapsuleSync, timeCapsuleSync.items),
    ];
}

/** Call in a $derived so every source's answer, retry and account reset updates the view. */
export function auditReadiness(): AuditReadiness {
    const sources: AuditSource[] = sourceDependencies().map(({ manager, hasRecords, ...source }) => {
        const lastSync = manager?.lastSync;
        const status = manager?.status;
        const known = !!lastSync || hasRecords;
        const state = status === 'error' ? 'error'
            : lastSync && status === 'synced' ? 'ready'
                : known ? 'cached' : 'loading';
        return { ...source, state, known };
    });
    return {
        sources,
        canScore: sources.every((s) => s.known),
        confirmed: sources.every((s) => s.state === 'ready'),
        hasErrors: sources.some((s) => s.state === 'error'),
        hasCached: sources.some((s) => s.state !== 'ready' && s.known),
    };
}

/** Retry the affected existing managers; sync() joins any request already running. */
export async function retryAuditSources(): Promise<void> {
    await Promise.allSettled(sourceDependencies()
        .filter(({ manager }) => manager && (manager.status === 'error' || !manager.lastSync))
        .map(({ manager }) => manager!.sync()));
}
