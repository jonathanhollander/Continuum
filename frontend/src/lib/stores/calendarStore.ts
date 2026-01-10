import { derived } from 'svelte/store';
import { createProfileStore, getLegacy } from './persistence';

export interface AnniversaryEvent {
    id: string;
    title: string;
    date: string; // ISO date or "MM-DD" for recurring
    type: 'birthday' | 'anniversary' | 'passing' | 'ritual';
    description: string;
    ritualInstructions?: string;
    recurring: boolean;
    tags: string[];
}

const DEFAULT_EVENTS: AnniversaryEvent[] = [
    {
        id: 'ritual-1',
        title: 'Morning Remembrance',
        date: '10-24',
        type: 'ritual',
        description: 'A quiet 10-minute moment with their favorite music.',
        ritualInstructions: 'Light a small candle, play "Weightless" by Marconi Union, and allow memories to surface without judgment.',
        recurring: true,
        tags: ['Daily', 'Morning']
    },
    {
        id: 'ritual-2',
        title: 'The Annual Walk',
        date: '05-12',
        type: 'ritual',
        description: 'Visiting their favorite local park or trail.',
        ritualInstructions: 'Walk the loop at sunset. Bring a thermos of tea. Sit on the third bench for five minutes of silence.',
        recurring: true,
        tags: ['Annual', 'Active']
    }
];

// Migration Logic
const getInitialData = (): AnniversaryEvent[] => {
    const unified = getLegacy('continuum_owner_anniversary_events');
    if (unified) return DEFAULT_EVENTS;

    const legacy = getLegacy('continuum_anniversary_events');
    if (legacy) {
        try {
            return JSON.parse(legacy);
        } catch (e) {
            console.error('Failed to parse anniversary events from localStorage', e);
        }
    }
    return DEFAULT_EVENTS;
};

function createReactiveCalendarStore() {
    const store = createProfileStore<AnniversaryEvent[]>('anniversary_events', getInitialData());
    const { subscribe, set, update } = store;

    return {
        subscribe,
        addEvent: (event: Omit<AnniversaryEvent, 'id'>) => {
            update(events => [...events, { ...event, id: crypto.randomUUID() }]);
        },
        removeEvent: (id: string) => {
            update(events => events.filter(e => e.id !== id));
        },
        updateEvent: (id: string, data: Partial<AnniversaryEvent>) => {
            update(events => events.map(e => e.id === id ? { ...e, ...data } : e));
        },
        reset: () => set(DEFAULT_EVENTS)
    };
}

export const calendarStore = createReactiveCalendarStore();

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
