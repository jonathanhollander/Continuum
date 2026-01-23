import { registerSync } from "$lib/services/sync.svelte.ts";

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
}

const timelineMapper = (item: any) => {
    if (!item) return item;
    return {
        ...item,
        // Remote -> Local
        isHighlight: item.is_highlight ?? item.isHighlight ?? false,
        assignedContactId: item.assigned_contact_id ?? item.assignedContactId,
        // Local -> Remote
        is_highlight: item.isHighlight ?? item.is_highlight,
        assigned_contact_id: item.assignedContactId ?? item.assigned_contact_id
    };
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
