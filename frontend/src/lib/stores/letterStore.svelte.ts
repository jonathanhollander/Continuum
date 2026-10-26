import { registerSync } from "$lib/services/sync.svelte";

// The page works in camelCase; SyncManager sends recipientName -> recipient_name etc.,
// while triggerDate / triggerMilestone / isLocked go as named (CAMEL_WIRE_KEYS).
export interface Letter {
    id: number | string;
    title: string;
    content: string;
    recipientName?: string;
    recipientContactId?: number | null; // contacts row (PulseContact.id)
    releaseCondition?: string;
    status?: string;
    date?: string;
    type?: string; // "emotional" | "transactional"
    triggerDate?: string | null; // stored and shown with the letter
    triggerMilestone?: string | null; // stored and shown with the letter
    isLocked?: boolean; // "Hold": kept back from the recipient view
    customAttributes?: string; // JSON text of custom field values
}

// Runs on server rows (already camelCased) and on outgoing items: one spelling per field,
// so a stale snake_case copy can never overwrite an edit on the wire.
const mapper = (data: Record<string, unknown>): Letter => {
    const {
        recipient_name, recipient_contact_id, release_condition, custom_attributes,
        user_id, userId, ...rest
    } = data;
    return {
        ...rest,
        id: typeof data.id === 'string' && data.id.length > 10 ? data.id : Number(data.id) || data.id,
        recipientName: data.recipientName ?? recipient_name ?? '',
        recipientContactId: data.recipientContactId ?? recipient_contact_id ?? null,
        releaseCondition: data.releaseCondition ?? release_condition ?? 'death',
        customAttributes: data.customAttributes ?? custom_attributes ?? '{}',
        isLocked: !!data.isLocked,
    } as Letter;
};

// The one owner of 'letters' (the letters page uses it too).
export const lettersSync = registerSync<Letter>('letters', 'letters', mapper, '/api/data')
    .setAffirmationContext('letters');
const manager = lettersSync;

export const letterStore = {
    subscribe: manager.subscribe.bind(manager),
    get items() { return manager.items; },
    get status() { return manager.status; },
    create: (item: Omit<Letter, 'id'>) => manager.create(item as Letter),
    update: (id: number | string, updates: Partial<Letter>) => manager.update(id, updates),
    delete: (id: number | string) => manager.delete(id),
    sync: () => manager.sync()
};
