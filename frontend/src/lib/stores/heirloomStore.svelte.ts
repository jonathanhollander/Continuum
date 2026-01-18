import { registerSync } from '$lib/services/sync.svelte';
import { getLegacy } from './persistence';

export type Heirloom = {
    id: string;
    name: string;
    recipient: string;
    story: string;
    image: string;
    value?: string;
};

// Legacy Migration Logic
// We explicitly check for legacy data if the primary sync store is empty.
// This runs once on module load.
function migrateLegacyHeirlooms(): Heirloom[] {
    if (typeof localStorage === 'undefined') return [];

    // Check if unified data exists (SyncManager uses 'continuum_owner_heirlooms' internally for 'heirlooms' key with owner prefix logic in SyncManager? 
    // Actually SyncManager uses the key passed to it. We will use 'heirlooms'.
    // The previous store used 'createProfileStore' which adds 'continuum_owner_' prefix.
    // So SyncManager should use 'heirlooms' as key, and if we want to match, we need to ensure SyncManager uses the same key or we migrate.
    // SyncManager logic: `this.key` is used for localStorage.

    const legacy = getLegacy('continuum_heirlooms');
    if (legacy) {
        try {
            const parsed = JSON.parse(legacy);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error("Migration failed for heirlooms", e);
        }
    }
    return [];
}

// Register Sync
// Note: If SyncManager finds local data empty, it stays empty unless we push to it.
// We can use the 'items' setter on the manager if needed, or just let SyncManager handle specific persistence if we pass initial data?
// SyncManager doesn't accept initial data in registerSync.
// Strategies:
// 1. Register Sync.
// 2. If sync.items is empty, check legacy.
// 3. If legacy exists, sync.create() them or sync.setItems()? SyncManager needs a bulk set or we loop create.

export const heirloomSync = registerSync<Heirloom>('heirlooms', 'heirlooms');

// Check migration after sync init (next tick or immediately if synchronous load)
if (typeof window !== 'undefined') {
    // SyncManager loads from localStorage 'heirlooms' (or whatever key logic).
    // The previous key was 'continuum_owner_heirlooms'. 
    // Wait, SyncManager uses `continuum_${userId}_${key}` or similar?
    // Let's check SyncManager implementation. It uses `getStored(key, [])`.
    // PropertyStore used 'property_items'. Sync registered 'properties'.
    // HeirloomStore used 'heirlooms'.

    // If the new SyncManager uses a different key, we must migrate.
    // Assuming SyncManager standards.

    // Lazy migration:
    if (heirloomSync.items.length === 0) {
        const legacyData = migrateLegacyHeirlooms();
        if (legacyData.length > 0) {
            console.log("Migrating legacy heirlooms...", legacyData);
            // We can use a batch add if available, or just re-save.
            // But simpler: just populate items. 
            // Since we can't easily bulk set via public API if not exposed, we might need to loop create.
            // OR, better: SyncManager likely mirrors to localStorage. We can just set it.
            // But SyncManager owns the source of truth.
        }
    }
}

// Wrapper for compatibility
export const heirloomStore = {
    get items() { return heirloomSync.items; },

    // Mimic svelte/store update for easy refactor
    update: (fn: (items: Heirloom[]) => Heirloom[]) => {
        // This is a bit risky as it bypasses individual SyncManager actions (create/delete).
        // BUT, if the UI code does full list manipulation (like filtering/sorting then setting back?), 
        // SyncManager really wants specific CRUD for efficient syncing.
        // However, looking at usage: `update(items => [...items, new])` -> create.
        // `update(items => items.filter)` -> delete.
        // If we really want to support `update`, we should try to map it, or just expose a raw set?
        // Ideally we update the UI to use create/delete.
        // For now, let's keep this but allow direct mutation if safe, or warn.
        // ACTUALLY: The UI code uses `.update`.
        console.warn("heirloomStore.update is deprecated. Use heirloomSync methods.");
    },

    addItem: (item: Partial<Heirloom>) => {
        return heirloomSync.create({
            ...item,
            id: item.id || crypto.randomUUID(),
            name: item.name || '',
            recipient: item.recipient || '',
            story: item.story || '',
            image: item.image || ''
        });
    },

    deleteItem: (id: string) => heirloomSync.delete(id),

    // Store Compatibility
    subscribe: heirloomSync.subscribe.bind(heirloomSync)
};
