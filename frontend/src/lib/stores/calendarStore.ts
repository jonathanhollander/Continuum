import { derived } from 'svelte/store';
import { registerSync } from '../services/sync.svelte';
import { getLegacy } from './persistence';

export interface AnniversaryEvent {
    id: string | number;
    title: string;
    date: string; // ISO date or "MM-DD" for recurring
    type: 'birthday' | 'anniversary' | 'passing' | 'ritual';
    description?: string;
    ritual_instructions?: string;
    recurring: boolean;
    tags?: string | string[];
}

const DEFAULT_EVENTS: AnniversaryEvent[] = [
    {
        id: 'ritual-1',
        title: 'Morning Remembrance',
        date: '10-24',
        type: 'ritual',
        description: 'A quiet 10-minute moment with their favorite music.',
        ritual_instructions: 'Light a small candle, play "Weightless" by Marconi Union, and allow memories to surface without judgment.',
        recurring: true,
        tags: ['Daily', 'Morning']
    },
    {
        id: 'ritual-2',
        title: 'The Annual Walk',
        date: '05-12',
        type: 'ritual',
        description: 'Visiting their favorite local park or trail.',
        ritual_instructions: 'Walk the loop at sunset. Bring a thermos of tea. Sit on the third bench for five minutes of silence.',
        recurring: true,
        tags: ['Annual', 'Active']
    }
];

const calendarMapper = (local: any): AnniversaryEvent => {
    let tags: string[] = [];
    if (typeof local.tags === 'string') {
        tags = local.tags.split(',').filter(Boolean);
    } else if (Array.isArray(local.tags)) {
        tags = local.tags;
    }

    return {
        ...local,
        ritual_instructions: local.ritual_instructions ?? local.ritualInstructions ?? '',
        tags
    };
};

export const calendarSync = registerSync<AnniversaryEvent>('calendar_events', 'calendar_events', calendarMapper);

// Migration Logic
if (typeof window !== 'undefined') {
    const legacy = getLegacy('continuum_calendar_events');
    if (legacy && calendarSync.items.length === 0) {
        try {
            const parsed = JSON.parse(legacy);
            if (Array.isArray(parsed) && parsed.length > 0) {
                console.log("Migrating calendar events...", parsed);
                calendarSync.items = parsed.map(e => ({
                    ...e,
                    id: String(e.id)
                }));
            }
        } catch (e) {
            console.error("Calendar migration failed", e);
        }
    }
}

export const calendarStore = {
    subscribe: calendarSync.subscribe.bind(calendarSync),
    get items() { return calendarSync.items; },

    addEvent: (event: Omit<AnniversaryEvent, 'id'>) => {
        const payload = {
            ...event,
            tags: Array.isArray(event.tags) ? event.tags.join(',') : event.tags
        };
        return calendarSync.create(payload as any);
    },
    removeEvent: (id: string | number) => calendarSync.delete(id),
    updateEvent: (id: string | number, data: Partial<AnniversaryEvent>) => {
        const item = calendarSync.items.find(e => e.id === id);
        if (item) {
            const merged = { ...item, ...data };
            const payload = {
                ...merged,
                tags: Array.isArray(merged.tags) ? merged.tags.join(',') : merged.tags
            };
            return calendarSync.update(payload as any);
        }
    },
    reset: async () => {
        // Clear all items loop
        // In a real app we'd want a bulk delete API
        const items = [...calendarSync.items];
        for (const item of items) {
            await calendarSync.delete(item.id);
        }
        // Force reset to defaults if desired
        calendarSync.items = [];
    }
};

// Derived store for upcoming events (next 30 days)
export const upcomingEvents = derived(calendarStore, ($events) => {
    const now = new Date();
    const currentYear = now.getFullYear();

    return $events.map(event => {
        const [month, day] = event.date.split('-').map(Number);
        const eventDate = new Date(currentYear, month - 1, day);

        // If date has passed this year, check next year
        if (eventDate < now && event.recurring) {
            eventDate.setFullYear(currentYear + 1);
        }

        return { ...event, nextDate: eventDate };
    }).sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
});
