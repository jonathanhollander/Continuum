import { registerSync } from '$lib/services/sync.svelte';

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

const mapper = (data: any): Vendor => ({
    ...data,
    id: typeof data.id === 'string' && data.id.length > 10 ? undefined : Number(data.id) || data.id,
});

const manager = registerSync<Vendor>('vendors', 'vendors', mapper, '/api/data')
    .setAffirmationContext('general');

export const vendorStore = {
    subscribe: manager.subscribe.bind(manager),
    get items() { return manager.items; },
    create: (item: Omit<Vendor, 'id'>) => manager.create(item as Vendor),
    update: (id: number, updates: Partial<Vendor>) => manager.update(id, updates as Vendor),
    delete: (id: number) => manager.delete(id),
    sync: () => manager.sync()
};
