import { registerSync } from '$lib/services/sync.svelte';

export interface Utility {
    id?: number;
    user_id?: number;
    provider: string;
    service_type: string;
    location?: string;
    account_number?: string;
    support_phone?: string;
}

const mapper = (data: any): Utility => ({
    ...data,
    id: typeof data.id === 'string' && data.id.length > 10 ? undefined : Number(data.id) || data.id,
    service_type: data.service_type ?? data.serviceType,
    account_number: data.account_number ?? data.accountNumber,
    support_phone: data.support_phone ?? data.supportPhone,
});

const manager = registerSync<Utility>('utilities', 'utilities', mapper, '/api/data')
    .setAffirmationContext('general');

export const utilityStore = {
    subscribe: manager.subscribe.bind(manager),
    get items() { return manager.items; },
    create: (item: Omit<Utility, 'id'>) => manager.create(item as Utility),
    update: (id: number, updates: Partial<Utility>) => manager.update(id, updates as Utility),
    delete: (id: number) => manager.delete(id),
    sync: () => manager.sync()
};
