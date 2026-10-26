import { registerSync } from "$lib/services/sync.svelte";
import { oneSpelling } from "$lib/utils/oneSpelling";

export interface LifeEvent {
    id: number | string;
    year: number;
    label: string;
    description?: string;
    date?: string; // ISO Date string YYYY-MM-DD
    type: "milestone" | "education" | "work" | "relationship" | "future" | "accomplishment";
    category?: "Career" | "Personal" | "Education" | "Relationships" | "Travel" | "Other";
    reflection?: string;
    isHighlight?: boolean;
    impact?: "High" | "Medium" | "Low";
    assignedContactId?: string;
    custom_attributes?: string; // JSON string of custom field values
}

const timelineMapper = (item: any) => {
    if (!item) return item;
    // One spelling per field (camel; the wire snake-cases it), newest value kept
    const out = oneSpelling(item, { isHighlight: 'is_highlight', assignedContactId: 'assigned_contact_id' });
    // "No one assigned" binds undefined, which JSON drops; null clears it on the server.
    return { ...out, isHighlight: out.isHighlight ?? false, assignedContactId: out.assignedContactId ?? null };
};

export const timelineSync = registerSync<LifeEvent>('timeline_events', 'timeline_events', timelineMapper).setAffirmationContext('timeline');

export const timelineStore = {
    get items() { return timelineSync.items; },
    get status() { return timelineSync.status; },

    addEvent: (item: Partial<LifeEvent>) => {
        return timelineSync.create({
            ...item,
            id: crypto.randomUUID()
        } as LifeEvent);
    },

    updateEvent: (id: string | number, updates: Partial<LifeEvent>) => {
        return timelineSync.update(id, updates);
    },

    removeEvent: (id: string | number) => timelineSync.delete(id),

    sync: () => timelineSync.sync(),

    // Store Compatibility
    subscribe: timelineSync.subscribe.bind(timelineSync)
};
