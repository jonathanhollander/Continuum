import { registerSync } from "$lib/services/sync.svelte";

export interface Document {
    id?: number;
    user_id?: number;
    title: string;
    category: string;
    file_path?: string;
    location_physical?: string;
    is_digitized: boolean;
    status: string;
    notes?: string;
    // Compatibility fields
    name?: string;
    location?: string;
}

const mapper = (data: any): Document => ({
    ...data,
    id: typeof data.id === 'string' && data.id.length > 10 ? undefined : Number(data.id) || data.id,
    is_digitized: data.is_digitized ?? data.isDigitized ?? false,
    location_physical: data.location_physical ?? data.locationPhysical ?? data.location ?? '',
});

const manager = registerSync<Document>('documents', 'documents', mapper, '/api/data')
    .setAffirmationContext('documents');

export const documentStore = {
    subscribe: manager.subscribe.bind(manager),
    get items() { return manager.items; },
    get status() { return manager.status; },
    create: (item: Omit<Document, 'id'>) => manager.create(item as Document),
    update: (id: number, updates: Partial<Document>) => manager.update(id, updates as Document),
    delete: (id: number) => manager.delete(id),
    sync: () => manager.sync()
};
