import { registerSync } from "$lib/services/sync.svelte.ts";

export interface Letter {
    id?: number;
    user_id?: number;
    recipient_name?: string;
    title: string;
    content: string;
    release_condition: string;
    status: string;
}

const mapper = (data: any): Letter => ({
    ...data,
    id: typeof data.id === 'string' && data.id.length > 10 ? undefined : Number(data.id) || data.id,
    recipient_name: data.recipient_name ?? data.recipientName,
    release_condition: data.release_condition ?? data.releaseCondition ?? 'death',
});

const manager = registerSync<Letter>('letters', 'letters', mapper, '/api/data')
    .setAffirmationContext('letters');

export const letterStore = {
    subscribe: manager.subscribe.bind(manager),
    get items() { return manager.items; },
    create: (item: Omit<Letter, 'id'>) => manager.create(item as Letter),
    update: (id: number, updates: Partial<Letter>) => manager.update(id, updates as Letter),
    delete: (id: number) => manager.delete(id),
    sync: () => manager.sync()
};
