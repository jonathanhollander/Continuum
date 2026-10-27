import { writable } from 'svelte/store';
import { getStored, setStored } from '$lib/stores/persistence';

const TEST_REGISTRY_KEY = 'continuum_test_registry';
const SYNC_KEY: Record<string, string> = {
    assets: 'properties', financial_accounts: 'financial_assets',
};
export const sampleSyncKey = (module: string) => SYNC_KEY[module] ?? module;
export type SampleRegistry = Record<string, string[]>;
type SampleOwner = { account: string; profile: string };
export type CreateOrigin = 'admin-sample';

// Refresh mounted marker views without resetting their generation/removal controls.
export const sampleRegistryRevision = writable(0);

function normalizedRegistry(registry: unknown): SampleRegistry {
    const normalized: SampleRegistry = {};
    if (!registry || typeof registry !== 'object' || Array.isArray(registry)) return normalized;
    for (const [module, ids] of Object.entries(registry)) {
        if (!Array.isArray(ids)) continue;
        const key = sampleSyncKey(module);
        normalized[key] = [...new Set([...(normalized[key] || []), ...ids
            .filter(id => typeof id === 'string' || typeof id === 'number').map(String)])];
    }
    return normalized;
}

export const sampleRegistryFor = (owner: SampleOwner): SampleRegistry =>
    normalizedRegistry(getStored(TEST_REGISTRY_KEY, {}, owner.profile, owner.account));

export function saveSampleRegistry(owner: SampleOwner, registry: SampleRegistry): void {
    setStored(TEST_REGISTRY_KEY, registry, owner.profile, owner.account);
    sampleRegistryRevision.update(revision => revision + 1);
}

/** Called only with a server-confirmed ID, in the create's initiating namespace. */
export function markConfirmedSample(owner: SampleOwner, module: string, id: string | number): void {
    const registry = sampleRegistryFor(owner);
    const key = sampleSyncKey(module);
    registry[key] = [...new Set([...(registry[key] || []), String(id)])];
    saveSampleRegistry(owner, registry);
}
