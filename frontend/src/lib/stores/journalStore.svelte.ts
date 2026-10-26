import { registerSync } from "$lib/services/sync.svelte";
import { getStored, removeStored } from "$lib/stores/persistence";
import { activeAccountId } from "$lib/stores/keyringStore";
import { currentProfileId } from "$lib/stores/profileContext";
import { auth } from "$lib/stores/auth";
import { get } from "svelte/store";

export interface JournalEntry {
    id?: number;
    user_id?: number;
    type: string;
    title?: string;
    content: string;
    tags?: string;
    custom_attributes?: string; // JSON text: the reflection form's Custom Fields
    created_at?: string;
}

// The server list arrives camelCased; keep custom_attributes under its wire name only, so an
// update never carries a stale customAttributes copy alongside it.
const mapper = (data: any): JournalEntry => {
    const { customAttributes, ...rest } = data;
    return {
        ...rest,
        id: typeof rest.id === 'string' && rest.id.length > 10 ? undefined : Number(rest.id) || rest.id,
        created_at: rest.created_at ?? rest.createdAt,
        custom_attributes: rest.custom_attributes ?? customAttributes,
    };
};

const manager = registerSync<JournalEntry & { id: number }>('journal_entries', 'journal_entries', mapper, '/api/data')
    .setAffirmationContext('general');

// --- One-time adoption of the pre-C4 device keys -------------------------------------------
// Before C4 the ethical will ({id:"main", text, values[]}) and life lessons ({title, category,
// preview}) lived in their own account-namespaced device keys, which nothing reads now. They are
// brought into journal_entries once for the signed-in account, then the keys are removed.
// Only that account's namespaced keys are read (getStored); un-namespaced keys are never touched.

// The sample letter and values the old page saved by itself on first open: never adopted.
const OLD_SAMPLE_LETTER_START = "To my dearest family,\n\nMore than my possessions, I want to leave you with the beliefs that have guided my life.";
const OLD_SAMPLE_VALUES = new Set([
    "Integrity|Doing the right thing, even when no one is watching.",
    "Curiosity|Never stop learning and asking questions.",
    "Kindness|Everyone is fighting a battle you know nothing about.",
    "Resilience|It's not about how hard you fall, but how you get up.",
]);
const isOldSampleLetter = (t: string) => t.trim().startsWith(OLD_SAMPLE_LETTER_START) && t.trim().endsWith("[Your Name]");

const asList = (v: unknown): any[] => (Array.isArray(v) ? v.filter((i) => i && typeof i === 'object') : []);
const str = (v: unknown) => (typeof v === 'string' ? v : '');

function entriesFromDeviceKeys(willItems: any[], lessonItems: any[]): Omit<JournalEntry, 'id'>[] {
    const out: Omit<JournalEntry, 'id'>[] = [];
    const hasLetter = manager.items.some((e) => e.type === 'ethical_will');
    for (const will of willItems) {
        const text = str(will.text ?? will.content);
        if (text.trim() && !isOldSampleLetter(text)) {
            // The letter tab shows one letter; an earlier draft beside a saved letter becomes a reflection.
            out.push(hasLetter
                ? { type: 'reflection', title: 'Ethical Will (earlier draft)', content: text }
                : { type: 'ethical_will', title: 'Ethical Will', content: text });
        }
        for (const v of asList(will.values)) {
            const title = str(v.title).trim();
            const desc = str(v.desc ?? v.content);
            if (!title || OLD_SAMPLE_VALUES.has(`${title}|${desc}`)) continue;
            out.push({ type: 'core_value', title, content: desc, tags: str(v.iconName ?? v.tags) || 'Sun' });
        }
    }
    for (const l of lessonItems) {
        const title = str(l.title).trim();
        if (!title) continue;
        const category = str(l.category) || (Array.isArray(l.tags) ? str(l.tags[0]) : str(l.tags)) || 'Life';
        out.push({ type: 'life_lesson', title, content: str(l.preview ?? l.content), tags: category });
    }
    return out;
}

const sameEntry = (a: Partial<JournalEntry>, b: Partial<JournalEntry>) =>
    a.type === b.type && (a.title ?? '') === (b.title ?? '') && (a.content ?? '') === (b.content ?? '');

let adopting: Promise<void> | null = null;

/** Call after journalStore.sync(). Adopts the signed-in account's old device keys once; on any
 *  failure the keys stay and the next visit tries again (entries already on the server are skipped). */
function adoptDeviceKeys(): Promise<void> {
    if (!adopting) adopting = runAdoption().finally(() => { adopting = null; });
    return adopting;
}

async function runAdoption() {
    const account = get(activeAccountId);
    if (!account || !get(auth).token || manager.status !== 'synced') return;
    const profile = get(currentProfileId) || 'owner';
    const willItems = asList(getStored<unknown>('ethical_will', null, profile));
    const lessonItems = asList(getStored<unknown>('life_lessons', null, profile));
    const hadKeys = getStored<unknown>('ethical_will', null, profile) !== null
        || getStored<unknown>('life_lessons', null, profile) !== null;
    if (!hadKeys) return;
    try {
        for (const entry of entriesFromDeviceKeys(willItems, lessonItems)) {
            // Another account became active: its keys and entries are not this run's.
            if (get(activeAccountId) !== account || !get(auth).token) return;
            if (manager.items.some((e) => sameEntry(e, entry))) continue;
            await manager.create(entry as JournalEntry & { id: number }, false, true);
        }
        if (get(activeAccountId) !== account) return;
        removeStored('ethical_will', profile, account);
        removeStored('life_lessons', profile, account);
    } catch (e) {
        console.error('[journal] Adopting earlier device entries paused; it continues on the next visit', e);
    }
}

export const journalStore = {
    subscribe: manager.subscribe.bind(manager),
    get items() { return manager.items; },
    get status() { return manager.status; },
    create: (item: Omit<JournalEntry, 'id'>) => manager.create(item as JournalEntry),
    update: (id: number, updates: Partial<JournalEntry>) => manager.update(id, updates as JournalEntry),
    delete: (id: number) => manager.delete(id),
    sync: () => manager.sync(),
    adoptDeviceKeys,
};
