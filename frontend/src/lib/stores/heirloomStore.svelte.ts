import { registerSync } from "$lib/services/sync.svelte";
import { getLegacy } from './persistence';

export type Heirloom = {
    id: string | number;
    name: string;
    recipient: string;
    story: string;
    image: string;
    value?: string;
    custom_attributes?: string; // JSON string of custom field values
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

const heirloomMapper = (item: any) => {
    if (!item) return item;
    return {
        ...item,
        // Remote (valuation) -> Local (value)
        value: item.valuation !== undefined ? String(item.valuation) : item.value,
        // Local (value) -> Remote (valuation)
        valuation: item.value !== undefined ? parseFloat(item.value) : item.valuation
    };
};

export const heirloomSync = registerSync<Heirloom>('heirlooms', 'heirlooms', heirloomMapper).setAffirmationContext('heirlooms');

// Check migration after sync init (next tick or immediately if synchronous load)
if (typeof window !== 'undefined') {
    // Lazy migration:
    if (heirloomSync.items.length === 0) {
        const legacyData = migrateLegacyHeirlooms();
        if (legacyData.length > 0) {
            console.log("Migrating legacy heirlooms...", legacyData);
            // We migrate by creating them on the backend one by one, or letting SyncManager handle it if we push to items.
            // SyncManager.items setter usually triggers a sync if implemented that way, but often it's better to use create().
            // Let's loop and create.
            legacyData.forEach(item => {
                heirloomSync.create({
                    ...item,
                    // Ensure IDs are valid for backend if needed, or let backend assign? 
                    // If backend assigns, we drop ID. If UUID, we keep. 
                    // SQLModel ID is int? No, look at model: id: Optional[int]. 
                    // So we should DROP the ID and let backend assign a new int ID.
                    id: undefined
                });
            });
        }
    }
}

// Wrapper for compatibility
export const heirloomStore = {
    get items() { return heirloomSync.items; },

    addItem: (item: Partial<Heirloom>) => {
        return heirloomSync.create({
            ...item,
            // id: item.id  <-- Drop ID, let backend assign auto-increment int
            name: item.name || 'Unknown Treasure',
            recipient: item.recipient || 'Undecided',
            story: item.story || '',
            image: item.image || ''
        });
    },

    updateItem: (id: string | number, updates: Partial<Heirloom>) => heirloomSync.update(id, updates),
    deleteItem: (id: string | number) => heirloomSync.delete(id),

    // Store Compatibility
    subscribe: heirloomSync.subscribe.bind(heirloomSync)
};

