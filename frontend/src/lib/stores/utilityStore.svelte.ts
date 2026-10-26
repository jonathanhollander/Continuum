import { registerSync } from "$lib/services/sync.svelte";

export interface Utility {
    id: number;
    user_id?: number;
    provider: string;
    service_type: string;
    location?: string;
    account_number?: string;
    support_phone?: string;
}

// Runs on server records (camelCase), local records and outgoing payloads alike: keep the
// server id, and keep one spelling of each field so an edit is the value that gets sent.
// The page's utility types; API rows can arrive lowercase ("water"), so read them as the page's option.
const SERVICE_TYPES = ['Water', 'Gas', 'Electric', 'Internet', 'Other'];
const pageType = (v: unknown) => SERVICE_TYPES.find(t => t.toLowerCase() === String(v ?? '').trim().toLowerCase()) ?? v;

const mapper = (data: any): Utility => {
    const { serviceType, accountNumber, supportPhone, type, ...rest } = data;
    return {
        ...rest,
        id: typeof data.id === 'string' && data.id.length > 10 ? undefined : Number(data.id) || data.id,
        service_type: pageType(data.service_type ?? serviceType ?? type) as string,
        account_number: data.account_number ?? accountNumber,
        support_phone: data.support_phone ?? supportPhone,
    };
};

const manager = registerSync<Utility>('utilities', 'utilities', mapper, '/api/data')
    .setAffirmationContext('general');

export const utilityStore = {
    subscribe: manager.subscribe.bind(manager),
    get items() { return manager.items; },
    get status() { return manager.status; },
    create: (item: Omit<Utility, 'id'>) => manager.create(item as Utility),
    update: (id: number, updates: Partial<Utility>) => manager.update(id, updates as Utility),
    delete: (id: number) => manager.delete(id),
    sync: () => manager.sync()
};
