import { writable, get, type Writable } from 'svelte/store';
import { currentProfileId } from './profileContext';
import { activeAccountId } from './keyringStore';

// A device-cache problem is independent of a server save. Keep the newest value in
// this page's account/profile namespace when the browser refuses storage operations.
type CacheEntry = { raw: string | null } | { value: unknown };
const memoryCache = new Map<string, CacheEntry>();
const pendingCache = new Set<string>();
const readFailures = new Set<string>();

function deviceStorage(): Storage | null {
    try { return typeof localStorage === 'undefined' ? null : localStorage; }
    catch { return null; }
}
const inBrowser = () => typeof window !== 'undefined' || deviceStorage() !== null;
const cacheKey = (key: string, profileId?: string, accountId?: string) =>
    `continuum_acc_${accountId || get(activeAccountId) || 'anonymous'}_prof_${profileId || get(currentProfileId) || 'owner'}_${key}`;
const decode = <T>(entry: CacheEntry | undefined, fallback: T): T => {
    if (!entry) return fallback;
    if ('value' in entry) return entry.value as T;
    if (entry.raw === null) return fallback;
    try { return JSON.parse(entry.raw) as T; } catch { return entry.raw as T; }
};
function readCached(key: string): CacheEntry | undefined {
    if (pendingCache.has(key)) return memoryCache.get(key);
    try {
        const storage = deviceStorage();
        if (!storage) throw new Error('Device storage unavailable');
        const entry = { raw: storage.getItem(key) };
        memoryCache.set(key, entry);
        readFailures.delete(key);
        return entry;
    } catch {
        readFailures.add(key);
        return memoryCache.get(key);
    }
}

// The optional account argument also reads an earlier owner's retained draft while
// another account is active; callers never change the current namespace to do so.
export const getStored = <T>(key: string, def: T, profileId?: string, accountId?: string): T => {
    if (!inBrowser()) return def;
    return decode(readCached(cacheKey(key, profileId, accountId)), def);
};

/** Whether this page's latest cached value still needs a device-only write. */
export const cacheStorageState = (key: string, profileId?: string, accountId?: string): 'device' | 'memory' | 'unavailable' => {
    const scoped = cacheKey(key, profileId, accountId);
    if (pendingCache.has(scoped) || readFailures.has(scoped)) return memoryCache.has(scoped) ? 'memory' : 'unavailable';
    return deviceStorage() ? 'device' : memoryCache.has(scoped) ? 'memory' : 'unavailable';
};

/** Retry only device persistence. This never starts an API write or another create. */
export const retryStored = (key: string, profileId?: string, accountId?: string): boolean => {
    const scoped = cacheKey(key, profileId, accountId);
    if (!pendingCache.has(scoped)) {
        try {
            const storage = deviceStorage();
            if (!storage) return false;
            memoryCache.set(scoped, { raw: storage.getItem(scoped) });
            readFailures.delete(scoped);
            return true;
        } catch { readFailures.add(scoped); return false; }
    }
    const entry = memoryCache.get(scoped);
    if (!entry) return false;
    try {
        const storage = deviceStorage();
        if (!storage) return false;
        const raw = 'raw' in entry ? entry.raw : typeof entry.value === 'string' ? entry.value : JSON.stringify(entry.value);
        if (raw === null) storage.removeItem(scoped);
        else storage.setItem(scoped, String(raw));
        memoryCache.set(scoped, { raw: raw === null ? null : String(raw) });
        pendingCache.delete(scoped);
        readFailures.delete(scoped);
        return true;
    } catch { return false; }
};

// Keep the original void-returning API: callers' control flow is about the record
// operation, not whether the optional device mirror succeeded.
export const setStored = <T>(key: string, value: T, profileId?: string, accountId?: string): void => {
    if (!inBrowser()) return;
    const scoped = cacheKey(key, profileId, accountId);
    let entry: CacheEntry;
    try { entry = { raw: typeof value === 'string' ? value : String(JSON.stringify(value)) }; }
    catch { entry = { value }; } // Even a cache serialization issue must not repeat a confirmed POST.
    memoryCache.set(scoped, entry);
    pendingCache.add(scoped);
    retryStored(key, profileId, accountId);
};

export const removeStored = (key: string, profileId?: string, accountId?: string): void => {
    if (!inBrowser()) return;
    const scoped = cacheKey(key, profileId, accountId);
    memoryCache.set(scoped, { raw: null });
    pendingCache.add(scoped);
    retryStored(key, profileId, accountId);
};

// Legacy reads keep their original raw-string interface while respecting blocked storage.
export const getLegacy = (key: string): string | null => {
    if (!inBrowser()) return null;
    const entry = readCached(key);
    return entry && 'raw' in entry ? entry.raw : null;
};

// Factory: Create a writable store that automatically syncs with the current profile
export function createProfileStore<T>(key: string, initialValue: T): Writable<T> {

    // Initialize with current profile's data
    const store = writable<T>(getStored(key, initialValue));
    let loadingStored = false;

    if (inBrowser()) {
        // 1. Subscribe to account changes
        activeAccountId.subscribe(accId => {
            const data = getStored(key, initialValue);
            loadingStored = true;
            store.set(data);
            loadingStored = false;
        });

        // 2. Subscribe to profile changes
        currentProfileId.subscribe(pid => {
            const data = getStored(key, initialValue, pid);
            loadingStored = true;
            store.set(data);
            loadingStored = false;
        });

        // 3. Subscribe to store changes
        let initial = true;
        store.subscribe(value => {
            // Reading a blocked key yields its fallback; it is not an instruction to
            // replace an existing, temporarily unreadable device value with defaults.
            if (initial) { initial = false; return; }
            if (!loadingStored) setStored(key, value);
        });
    }

    return store;
}
