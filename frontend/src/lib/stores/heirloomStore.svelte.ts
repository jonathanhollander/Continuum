import { registerSync } from "$lib/services/sync.svelte";

export type Heirloom = {
    id: string | number;
    name: string;
    recipient: string;
    story: string;
    image: string;
    value?: string;
    // Provenance (where it came from, who held it): saved to the Asset model's ownershipDetails column.
    ownershipDetails?: string;
    custom_attributes?: string; // JSON string of custom field values
};

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

// The un-namespaced legacy key ('continuum_heirlooms') carries no account, so it is never adopted,
// and nothing is created at module load (that ran before sign-in, or into whoever was signed in).

// Wrapper for compatibility
export const heirloomStore = {
    get items() { return heirloomSync.items; },

    addItem: (item: Partial<Heirloom>) => {
        return heirloomSync.create({
            ...item,
            // id: item.id  <-- Drop ID, let backend assign auto-increment int
            name: item.name || '',
            recipient: item.recipient || '',
            story: item.story || '',
            image: item.image || ''
        });
    },

    updateItem: (id: string | number, updates: Partial<Heirloom>) => heirloomSync.update(id, updates),
    deleteItem: (id: string | number) => heirloomSync.delete(id),

    // Store Compatibility
    subscribe: heirloomSync.subscribe.bind(heirloomSync)
};

