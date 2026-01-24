import { registerSync } from "$lib/services/sync.svelte";

export interface JournalEntry {
    id?: number;
    user_id?: number;
    type: string;
    title?: string;
    content: string;
    tags?: string;
    created_at?: string;
}

const mapper = (data: any): JournalEntry => ({
    ...data,
    id: typeof data.id === 'string' && data.id.length > 10 ? undefined : Number(data.id) || data.id,
    created_at: data.created_at ?? data.createdAt,
});

const manager = registerSync<JournalEntry>('journal_entries', 'journal_entries', mapper, '/api/data')
    .setAffirmationContext('general');

export const journalStore = {
    subscribe: manager.subscribe.bind(manager),
    get items() { return manager.items; },
    get status() { return manager.status; },
    create: (item: Omit<JournalEntry, 'id'>) => manager.create(item as JournalEntry),
    update: (id: number, updates: Partial<JournalEntry>) => manager.update(id, updates as JournalEntry),
    delete: (id: number) => manager.delete(id),
    sync: () => manager.sync()
};
