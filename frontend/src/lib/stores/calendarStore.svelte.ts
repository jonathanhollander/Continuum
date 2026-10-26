import { derived } from 'svelte/store';
import { registerSync } from "$lib/services/sync.svelte";

export interface AnniversaryEvent {
    id: string | number;
    title: string;
    date: string; // "MM-DD"/"YYYY-MM-DD" (anniversary manager) or "MMDD"/"YYYYMMDD" (calendar page)
    type: 'birthday' | 'anniversary' | 'passing' | 'ritual'; // the calendar page also writes 'holiday' | 'other'
    description?: string;
    ritualInstructions?: string;
    recurring: boolean;
    tags?: string[];
    custom_attributes?: string; // JSON string of custom field values
    // Calendar page names for the same columns: isRecurring = recurring, wish = description,
    // emailTemplate = ritual_instructions holding a JSON {recipient, subject, body}.
    isRecurring?: boolean;
    wish?: string;
    emailTemplate?: { recipient: string; subject: string; body: string };
}

function parseTemplate(s: any) {
    if (typeof s !== 'string' || !s.trim().startsWith('{')) return undefined;
    try {
        const t = JSON.parse(s);
        return t && typeof t === 'object' && !Array.isArray(t) ? t : undefined;
    } catch { return undefined; }
}

// The one mapper for 'calendar_events' (calendar page and anniversary manager). Runs on records
// coming from the server and on records going to it; every field but tags is safe to apply twice.
const calendarMapper = (item: any) => {
    if (!item) return item;
    const out: any = { ...item };

    const recurring = 'isRecurring' in item ? item.isRecurring : item.recurring;
    out.isRecurring = !!recurring;
    out.recurring = !!recurring;

    const wish = 'wish' in item ? item.wish : item.description;
    out.wish = wish ?? '';
    out.description = wish ?? '';

    // ritual_instructions holds either the anniversary manager's free text or the calendar page's
    // email template as JSON. An explicit emailTemplate (even undefined: cleared) wins over the stored JSON.
    const stored = item.ritualInstructions ?? item.ritual_instructions ?? '';
    const tpl = 'emailTemplate' in item ? item.emailTemplate : parseTemplate(stored);
    out.emailTemplate = tpl && typeof tpl === 'object' ? tpl : undefined;
    out.ritualInstructions = out.emailTemplate
        ? JSON.stringify(out.emailTemplate)
        : (parseTemplate(stored) ? '' : stored);
    delete out.ritual_instructions;

    // tags: a comma-separated string on the server, an array in the UI, so this one field flips with
    // direction: a string (or null) is a server record coming in, an array is a UI record going out.
    if (Array.isArray(item.tags)) out.tags = item.tags.join(',');
    else if (typeof item.tags === 'string') out.tags = item.tags.split(',').filter(Boolean);
    else if (item.tags === null) out.tags = [];
    return out;
};

export const calendarSync = registerSync<AnniversaryEvent>('calendar_events', 'calendar_events', calendarMapper).setAffirmationContext('general');

// Stored records always hold both names of a pair with the same value, and the mapper only sees the
// merged record, so it cannot tell which name an update changed. Every update (store or calendar page)
// therefore copies the changed name onto its partner first: the field that changed wins.
const ALIAS_PAIRS: [keyof AnniversaryEvent, keyof AnniversaryEvent][] = [['wish', 'description'], ['isRecurring', 'recurring']];
function pairAliases(id: string | number, updates: Partial<AnniversaryEvent>): Partial<AnniversaryEvent> {
    const out: any = { ...updates };
    const current: any = calendarSync.items.find(i => String(i.id) === String(id)) ?? {};
    for (const [a, b] of ALIAS_PAIRS) {
        const hasA = a in out, hasB = b in out;
        if (hasA && !hasB) out[b] = out[a];
        else if (hasB && !hasA) out[a] = out[b];
        else if (hasA && hasB && out[a] !== out[b]) {
            // Both sent and different (a whole record with one stale name): keep the one that moved.
            if (out[a] === current[a] || out[a] === current[b]) out[a] = out[b];
            else out[b] = out[a];
        }
    }
    // Free-text ritual instructions sent alone replace the stored email template rather than lose to it.
    if ('ritualInstructions' in out && !('emailTemplate' in out)) out.emailTemplate = parseTemplate(out.ritualInstructions);
    return out;
}
const syncUpdate = calendarSync.update.bind(calendarSync);
calendarSync.update = ((idOrData: any, partialData?: Partial<AnniversaryEvent>) =>
    typeof idOrData === 'object' && idOrData !== null
        ? syncUpdate(pairAliases(idOrData.id, idOrData) as AnniversaryEvent)
        : syncUpdate(idOrData, pairAliases(idOrData, partialData || {}))) as typeof calendarSync.update;

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
// The manager's subscribe hands out the items array itself.
export const upcomingEvents = derived(calendarSync, (items: AnniversaryEvent[]) => {
    const now = new Date();
    const currentYear = now.getFullYear();

    return items.map(event => {
        // Accepts "MM-DD", "YYYY-MM-DD" and the calendar page's "MMDD" / "YYYYMMDD".
        const digits = (event.date || '').replace(/-/g, '');
        if (digits.length < 4) return { ...event, ritualInstructions: event.emailTemplate ? '' : event.ritualInstructions, nextDate: new Date(8640000000000000) };

        const month = Number(digits.slice(-4, -2));
        const day = Number(digits.slice(-2));

        const eventDate = new Date(currentYear, month - 1, day);

        // If date has passed this year, check next year
        if (eventDate < now && event.recurring) {
            eventDate.setFullYear(currentYear + 1);
        }

        // A calendar-page record keeps its email template (JSON) in ritualInstructions; it is not a ritual.
        const ritualInstructions = event.emailTemplate ? '' : event.ritualInstructions;
        return { ...event, ritualInstructions, nextDate: eventDate };
    }).sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
});
