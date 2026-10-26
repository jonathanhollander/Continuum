import { browserStorage } from "$lib/services/browserStorage";
import { writable, get } from 'svelte/store';
import { activeAccountId } from './keyringStore';

// Types
export type UserRole = 'Owner' | 'Executor' | 'Family';

export interface Profile {
    id: string; // 'owner' or UUID
    name: string;
    role: UserRole;
    created: number;
    relationship?: string; // Relation to owner (e.g. "Wife")
}

// Internal helper for namespaced storage
const getAccStored = (key: string, def: any) => {
    if (typeof window === 'undefined') return def;
    const accId = get(activeAccountId) || 'anonymous';
    const stored = browserStorage.getItem(`continuum_acc_${accId}_${key}`);
    return stored || JSON.stringify(def);
};

// Global State (Namespaced by Account)
export const currentProfileId = writable<string>('owner');
export const profiles = writable<Profile[]>([]);

const defaultProfiles: Profile[] = [
    { id: 'owner', name: 'Me', role: 'Owner', created: Date.now() }
];

// Safe Parse Helper
const safeParse = (json: string | null, fallback: any) => {
    if (!json) return fallback;
    try {
        return JSON.parse(json);
    } catch (e) {
        return fallback;
    }
};

// Syncing logic
if (typeof window !== 'undefined') {
    let loadingStored = false;
    // 1. React to Account Changes
    activeAccountId.subscribe(accId => {
        const id = accId || 'anonymous';
        const storedPid = browserStorage.getItem(`continuum_acc_${id}_currentProfileId`) || 'owner';
        const storedProfs = browserStorage.getItem(`continuum_acc_${id}_profiles`);

        // Fallback to global if acc-specific doesn't exist (Migration support)
        const finalProfs = storedProfs
            ? safeParse(storedProfs, defaultProfiles)
            : safeParse(browserStorage.getItem('continuum_global_profiles'), defaultProfiles);

        loadingStored = true;
        currentProfileId.set(storedPid);
        profiles.set(finalProfs);
        loadingStored = false;
    });

    // 2. Persist profile changes to the current account namespace
    let firstProfile = true;
    currentProfileId.subscribe(pid => {
        if (firstProfile) { firstProfile = false; return; }
        if (loadingStored) return;
        const accId = get(activeAccountId) || 'anonymous';
        browserStorage.setItem(`continuum_acc_${accId}_currentProfileId`, pid);
    });

    let firstProfiles = true;
    profiles.subscribe(profs => {
        if (firstProfiles) { firstProfiles = false; return; }
        if (loadingStored) return;
        const accId = get(activeAccountId) || 'anonymous';
        if (profs.length > 0) {
            browserStorage.setItem(`continuum_acc_${accId}_profiles`, JSON.stringify(profs));
        }
    });
}
