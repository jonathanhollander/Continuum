/** Raw browser preferences and credentials. No app/store imports: bootstrap uses this first. */
const memory = new Map<string, string | null>();
const pending = new Set<string>();
const blocked = new Set<string>();
const listeners = new Set<(temporary: boolean) => void>();
let temporary = false;
let queued = false;

function changed() {
    const next = pending.size > 0 || blocked.size > 0;
    if (next === temporary) return;
    temporary = next;
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
        queued = false;
        listeners.forEach(run => run(temporary));
    });
}

function device(): Storage {
    // Accessing the localStorage property itself can throw, before getItem runs.
    if (typeof localStorage === 'undefined') throw new Error('Device storage unavailable');
    return localStorage;
}

export const browserStorage = {
    getItem(key: string): string | null {
        if (typeof window === 'undefined') return null;
        if (pending.has(key)) return memory.get(key) ?? null;
        try {
            const value = device().getItem(key);
            memory.set(key, value);
            blocked.delete(key);
            return value;
        } catch {
            blocked.add(key);
            return memory.get(key) ?? null;
        } finally { changed(); }
    },

    /** False means the value is available in this page's memory only. */
    setItem(key: string, value: string): boolean {
        if (typeof window === 'undefined') return false;
        memory.set(key, value);
        pending.add(key);
        try {
            device().setItem(key, value);
            pending.delete(key);
            blocked.delete(key);
            return true;
        } catch {
            blocked.add(key);
            return false;
        } finally { changed(); }
    },

    /** A memory tombstone keeps old device credentials out of this page after logout. */
    removeItem(key: string): boolean {
        if (typeof window === 'undefined') return false;
        memory.set(key, null);
        pending.add(key);
        try {
            device().removeItem(key);
            pending.delete(key);
            blocked.delete(key);
            return true;
        } catch {
            blocked.add(key);
            return false;
        } finally { changed(); }
    },
};

/** Plain subscription keeps this helper usable before Svelte and account stores initialize. */
export function subscribeTemporaryStorage(run: (temporary: boolean) => void): () => void {
    listeners.add(run);
    run(temporary);
    return () => listeners.delete(run);
}

if (typeof window !== 'undefined') {
    window.addEventListener('storage', event => {
        // An external sign-in/logout must be observed by sessionOwnership/auth, even
        // when this page had a pending credential write. Their listeners run afterwards.
        if (event.key === null) {
            memory.clear();
            pending.clear();
            blocked.clear();
        } else {
            memory.delete(event.key);
            pending.delete(event.key);
            blocked.delete(event.key);
        }
        changed();
    });
}
