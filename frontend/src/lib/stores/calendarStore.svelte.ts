import { derived } from 'svelte/store';
import { registerSync } from "$lib/services/sync.svelte.ts";

export interface AnniversaryEvent {
    id: string | number;
    title: string;
    date: string; // ISO date or "MM-DD" for recurring
    type: 'birthday' | 'anniversary' | 'passing' | 'ritual';
    description?: string;
    ritualInstructions?: string;
    recurring: boolean;
    tags?: string[];
}

const calendarMapper = (item: any) => {
    if (!item) return item;

    const isRemote = typeof item.tags === 'string';

    if (isRemote) {
        return {
            ...item,
            // Remote -> Local
            ritualInstructions: item.ritual_instructions ?? item.ritualInstructions ?? '',
            tags: item.tags ? item.tags.split(',').filter(Boolean) : [],
        };
    } else {
        return {
            ...item,
            // Local -> Remote
            ritual_instructions: item.ritualInstructions ?? item.ritual_instructions,
            tags: Array.isArray(item.tags) ? item.tags.join(',') : (item.tags || '')
        };
    }
};

export const calendarSync = registerSync<AnniversaryEvent>('calendar_events', 'calendar_events', calendarMapper).setAffirmationContext('general');

export const calendarStore = {
    get items() { return calendarSync.items; },
    get status() { return calendarSync.status; },

    addEvent: (event: Omit<AnniversaryEvent, 'id'>) => {
        return calendarSync.create({
            ...event,
            id: crypto.randomUUID()
        });
    },

    updateEvent: (id: string | number, updates: Partial<AnniversaryEvent>) => {
        return calendarSync.update(id, updates);
    },

    removeEvent: (id: string | number) => calendarSync.delete(id),

    sync: () => calendarSync.sync(),

    // Store Compatibility
    subscribe: calendarSync.subscribe.bind(calendarSync)
};

// Derived store for upcoming events (next 30 days)
export const upcomingEvents = derived(calendarSync, ($sync) => {
    const items = $sync.items;
    const now = new Date();
    const currentYear = now.getFullYear();

    return items.map(event => {
        const dateParts = event.date.split('-');
        if (dateParts.length < 2) return { ...event, nextDate: new Date(8640000000000000) };

        const month = Number(dateParts[dateParts.length - 2]);
        const day = Number(dateParts[dateParts.length - 1]);

        const eventDate = new Date(currentYear, month - 1, day);

        // If date has passed this year, check next year
        if (eventDate < now && event.recurring) {
            eventDate.setFullYear(currentYear + 1);
        }

        return { ...event, nextDate: eventDate };
    }).sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
});
