/**
 * Executor Toolkit progress (CU-015): which checklist steps are done, and a note per step.
 * Server-backed through /api/data/executor_steps (one row per step the person has touched).
 * Each sub-step (a checkbox inside a step's detail) is its own row too, keyed
 * `${stepId}:${n}` where n is the checkbox's position in that step, so the table needs no new column.
 */
import { registerSync } from "$lib/services/sync.svelte";

export interface ExecutorStepRecord {
    id: number | string;
    stepId: string;
    done: boolean;
    note: string;
}

const mapper = (d: any): ExecutorStepRecord => ({
    id: d.id,
    stepId: String(d.stepId ?? d.step_id ?? ''),
    done: !!d.done,
    note: d.note ?? '',
});

const stepSync = registerSync<ExecutorStepRecord>('executor_steps', 'executor_steps', mapper);

/** The record page each step leans on. */
const LEGAL = { href: '/modules/legal-documents', label: 'Legal documents' };
const MONEY = { href: '/modules/financial-accounts', label: 'Financial accounts' };
const PEOPLE = { href: '/modules/contacts', label: 'Contacts' };
const PROPERTY = { href: '/modules/property', label: 'Property' };
const INSURANCE = { href: '/modules/insurance', label: 'Insurance' };
const KEEPSAKES = { href: '/modules/heirlooms', label: 'Heirlooms' };

export const STEP_RECORDS: Record<string, { href: string; label: string }> = {
    'task-01': LEGAL, 'task-02': LEGAL, 'task-03': PROPERTY,
    'task-04': { href: '/modules/pets', label: 'Pets' },
    'task-05': PEOPLE,
    'task-06': { href: '/modules/funeral', label: 'Funeral wishes' },
    'task-07': MONEY, 'task-08': MONEY, 'task-09': PEOPLE, 'task-10': PEOPLE,
    'task-11': LEGAL, 'task-12': LEGAL, 'task-13': PEOPLE, 'task-14': MONEY,
    'task-15': MONEY, 'task-16': LEGAL, 'task-17': LEGAL, 'task-18': MONEY,
    'task-19': MONEY, 'task-20': LEGAL, 'task-21': MONEY, 'task-22': MONEY,
    'task-23': MONEY, 'task-24': INSURANCE, 'task-25': MONEY, 'task-26': MONEY,
    'task-27': { href: '/modules/digital-guardian', label: 'Digital accounts' },
    'task-28': { href: '/modules/subscriptions', label: 'Subscriptions' },
    'task-29': { href: '/modules/home-manual', label: 'Home manual' },
    'task-30': MONEY, 'task-31': PROPERTY, 'task-32': MONEY, 'task-33': INSURANCE,
    'task-34': PROPERTY, 'task-35': KEEPSAKES, 'task-36': MONEY, 'task-37': MONEY,
    'task-38': MONEY, 'task-39': LEGAL, 'task-40': MONEY, 'task-41': PEOPLE,
    'task-42': MONEY, 'task-43': KEEPSAKES, 'task-44': LEGAL, 'task-45': PROPERTY,
    'task-46': MONEY, 'task-47': LEGAL, 'task-48': MONEY, 'task-49': LEGAL,
    'task-50': PROPERTY,
};

/** Newest row per step (two devices can each add a row for the same step). */
function latest(stepId: string): ExecutorStepRecord | undefined {
    let found: ExecutorStepRecord | undefined;
    for (const r of stepSync.items) {
        if (r.stepId === stepId && (!found || Number(r.id) > Number(found.id))) found = r;
    }
    return found;
}

// One write at a time per step: a quick second tick waits for the first row to exist.
const chains = new Map<string, Promise<unknown>>();
function queue(stepId: string, write: () => Promise<unknown>) {
    const next = (chains.get(stepId) ?? Promise.resolve()).catch(() => {}).then(write);
    chains.set(stepId, next);
    return next;
}

function save(stepId: string, changes: Partial<Pick<ExecutorStepRecord, 'done' | 'note'>>) {
    return queue(stepId, () => {
        const row = latest(stepId);
        if (row) return stepSync.update(row.id, changes);
        return stepSync.create({ id: crypto.randomUUID(), stepId, done: false, note: '', ...changes });
    });
}

/** Row key for the n-th checkbox inside a step's detail. */
const subKey = (stepId: string, n: number) => `${stepId}:${n}`;

export const executorSteps = {
    get items() { return stepSync.items; },
    get status() { return stepSync.status; },
    sync: () => stepSync.sync(),
    isDone: (stepId: string) => !!latest(stepId)?.done,
    noteFor: (stepId: string) => latest(stepId)?.note ?? '',
    toggle: (stepId: string) => save(stepId, { done: !latest(stepId)?.done }),
    saveNote: (stepId: string, note: string) => save(stepId, { note }),
    isSubDone: (stepId: string, n: number) => !!latest(subKey(stepId, n))?.done,
    toggleSub: (stepId: string, n: number) => {
        const key = subKey(stepId, n);
        return save(key, { done: !latest(key)?.done });
    },
};
