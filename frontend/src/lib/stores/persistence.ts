import { writable, get, type Writable } from 'svelte/store';
import { currentProfileId } from './profileContext';
import { activeAccountId } from './keyringStore';
import { syncWithBackend } from '../services/syncService';

// Helper: Get data from LocalStorage with Account & Profile Namespace
export const getStored = <T>(key: string, def: T, profileId?: string): T => {
    if (typeof localStorage === 'undefined') return def;

    const accId = get(activeAccountId) || 'anonymous';
    const pid = profileId || get(currentProfileId) || 'owner';

    // Namespaced Key Pattern: continuum_acc_{email}_prof_{pid}_{key}
    const fullKey = `continuum_acc_${accId}_prof_${pid}_${key}`;

    const stored = localStorage.getItem(fullKey);
    if (stored === null) return def;

    try {
        return JSON.parse(stored);
    } catch {
        return stored as unknown as T; // Handle simple strings
    }
};

// Helper: Save data to LocalStorage with Account & Profile Namespace
export const setStored = <T>(key: string, value: T, profileId?: string) => {
    if (typeof localStorage === 'undefined') return;

    const accId = get(activeAccountId) || 'anonymous';
    const pid = profileId || get(currentProfileId) || 'owner';
    const fullKey = `continuum_acc_${accId}_prof_${pid}_${key}`;

    const valToStore = typeof value === 'string' ? value : JSON.stringify(value);

    // 1. Local Persistence (LocalStorage)
    localStorage.setItem(fullKey, valToStore);

    // 2. Remote Persistence (Railway PostgreSQL via FastAPI)
    // Always attempt sync if we have a valid account or if it's the 'owner' profile
    if (accId !== 'anonymous') {
        console.log(`[Dual Persistence] Syncing ${key} to Railway...`);
        syncWithBackend({ [key]: value });
    }
};

// Helper: Get legacy non-namespaced data for migration
export const getLegacy = (key: string): string | null => {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
};

// Factory: Create a writable store that automatically syncs with the current profile
export function createProfileStore<T>(key: string, initialValue: T): Writable<T> {

    // Initialize with current profile's data
    const store = writable<T>(getStored(key, initialValue));

    if (typeof localStorage !== 'undefined') {
        // 1. Subscribe to account changes
        activeAccountId.subscribe(accId => {
            const data = getStored(key, initialValue);
            store.set(data);
        });

        // 2. Subscribe to profile changes
        currentProfileId.subscribe(pid => {
            const data = getStored(key, initialValue, pid);
            store.set(data);
        });

        // 3. Subscribe to store changes
        store.subscribe(value => {
            setStored(key, value);
        });
    }

    return store;
}
