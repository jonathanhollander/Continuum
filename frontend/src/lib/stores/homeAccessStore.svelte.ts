import { registerSync } from "$lib/services/sync.svelte";

export interface HomeAccess {
    id: number;
    user_id?: number;
    location: string;
    code_encrypted: string;
    instructions?: string;
}

// Runs on server records (camelCase), local records and outgoing payloads alike: keep the
// server id, and keep one spelling of each field so an edit is the value that gets sent.
const mapper = (data: any): HomeAccess => {
    const { codeEncrypted, code, label, notes, ...rest } = data;
    return {
        ...rest,
        id: typeof data.id === 'string' && data.id.length > 10 ? undefined : Number(data.id) || data.id,
        location: data.location || label || 'Unknown',
        code_encrypted: data.code_encrypted ?? codeEncrypted ?? code ?? '',
        instructions: data.instructions ?? notes,
    };
};

const manager = registerSync<HomeAccess>('home_access', 'home_access', mapper, '/api/data')
    .setAffirmationContext('general');

export const homeAccessStore = {
    subscribe: manager.subscribe.bind(manager),
    get items() { return manager.items; },
    get status() { return manager.status; },
    create: (item: Omit<HomeAccess, 'id'>) => manager.create(item as HomeAccess),
    update: (id: number, updates: Partial<HomeAccess>) => manager.update(id, updates as HomeAccess),
    delete: (id: number) => manager.delete(id),
    sync: () => manager.sync()
};
