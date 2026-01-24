import { registerSync } from "$lib/services/sync.svelte";

export interface HomeAccess {
    id?: number;
    user_id?: number;
    location: string;
    code_encrypted: string;
    instructions?: string;
}

const mapper = (data: any): HomeAccess => ({
    ...data,
    id: typeof data.id === 'string' && data.id.length > 10 ? undefined : Number(data.id) || data.id,
    code_encrypted: data.code_encrypted ?? data.codeEncrypted ?? data.code ?? '',
});

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
