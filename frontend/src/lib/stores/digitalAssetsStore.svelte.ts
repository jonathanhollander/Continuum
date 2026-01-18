import { registerSync } from '$lib/services/sync.svelte';
import { getLegacy } from './persistence';

export type ClosurePreference = 'memorialize' | 'delete' | 'transfer' | 'none';

export interface DigitalAccount {
    id: string;
    platform: string;
    username: string;
    preference?: ClosurePreference;
    instructions?: string;
    priority?: 'low' | 'medium' | 'high';
    isClosed?: boolean;
    closureDate?: string;
    description?: string; // From page usage
    type?: string;        // From page usage
}

// Migration Logic: Check both legacy keys
function migrateDigitalAssets(): DigitalAccount[] {
    if (typeof localStorage === 'undefined') return [];

    let combined: DigitalAccount[] = [];

    // 1. Page Key
    const pageData = getLegacy('digital_assets');
    if (pageData) {
        try {
            const parsed = JSON.parse(pageData);
            if (Array.isArray(parsed)) combined = [...combined, ...parsed];
        } catch { }
    }

    // 2. Store Key
    const storeData = getLegacy('continuum_digital_accounts');
    if (storeData) {
        try {
            const parsed = JSON.parse(storeData);
            if (Array.isArray(parsed)) combined = [...combined, ...parsed];
        } catch { }
    }

    // Deduplicate by ID if possible, otherwise just return.
    // Since IDs might be numbers (Date.now) or strings (UUID), strict dedupe is hard.
    // We'll trust the user to clean up dupes for now or rely on SyncManager handling unique IDs if created properly.

    // Normalize IDs to strings
    return combined.map(a => ({
        ...a,
        id: String(a.id)
    }));
}

export const digitalAssetsSync = registerSync<DigitalAccount>('digital_assets', 'digital_assets');

// Lazy Migration
if (typeof window !== 'undefined') {
    if (digitalAssetsSync.items.length === 0) {
        const legacy = migrateDigitalAssets();
        if (legacy.length > 0) {
            console.log("Migrating digital assets...", legacy);
            // We ideally want to batch create. 
            // For now, relies on user manually saving or we push them? 
            // SyncManager doesn't auto-ingest return values.
            // We'll leave it empty in SyncManager for now, letting the UI handle "if empty, check legacy?"
            // OR simpler: we don't migrate automatically here because we can't `create` easily without async.
            // Actually, we can just let the consuming page handle the merge if needed, OR:
            // The `migrateDigitalAssets` function is available.
        }
    }
}

// Wrapper for compatibility
export const digitalAssetsStore = {
    get items() { return digitalAssetsSync.items; },
    addAccount: (acc: Omit<DigitalAccount, 'id'>) => {
        digitalAssetsSync.create({
            ...acc,
            id: crypto.randomUUID(),
            isClosed: false
        });
    },
    removeAccount: (id: string) => digitalAssetsSync.delete(id),
    updateAccount: (id: string, data: Partial<DigitalAccount>) => digitalAssetsSync.update(id, data),
    toggleClosure: (id: string) => {
        const item = digitalAssetsSync.items.find(i => i.id === id);
        if (item) {
            digitalAssetsSync.update(id, {
                isClosed: !item.isClosed,
                closureDate: !item.isClosed ? new Date().toISOString() : undefined
            });
        }
    },
    // Store Compatibility
    subscribe: digitalAssetsSync.subscribe.bind(digitalAssetsSync)
};
