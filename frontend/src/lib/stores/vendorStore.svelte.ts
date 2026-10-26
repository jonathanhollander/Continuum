import { registerSync } from "$lib/services/sync.svelte";

export interface Vendor {
    id?: number;
    user_id?: number;
    name: string;
    category: string;
    phone?: string;
    email?: string;
    website?: string;
    notes?: string;
}

// Runs on server records, local records and outgoing payloads alike: keep the server id.
const mapper = (data: any): Vendor => {
    const { role, ...rest } = data;
    return {
        ...rest,
        id: typeof data.id === 'string' && data.id.length > 10 ? undefined : Number(data.id) || data.id,
        category: data.category || role || 'Other', // server requires a category
    };
};

const manager = registerSync<Vendor>('vendors', 'vendors', mapper, '/api/data')
    .setAffirmationContext('general');

export const vendorStore = {
    subscribe: manager.subscribe.bind(manager),
    get items() { return manager.items; },
    get status() { return manager.status; },
    create: (item: Omit<Vendor, 'id'>) => manager.create(item as Vendor),
    update: (id: number, updates: Partial<Vendor>) => manager.update(id, updates as Vendor),
    delete: (id: number) => manager.delete(id),
    sync: () => manager.sync()
};
