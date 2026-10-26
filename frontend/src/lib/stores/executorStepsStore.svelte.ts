/**
 * Executor Toolkit progress (CU-015): which checklist steps are done, and a note per step.
 * Server-backed through /api/data/executor_steps (one row per step the person has touched).
 * Each sub-step (a checkbox inside a step's detail) is its own row too, keyed
 * `${stepId}:${n}` where n is the checkbox's position in that step, so the table needs no new column.
 */
import { registerSync } from "$lib/services/sync.svelte";
import { get } from 'svelte/store';
import { auth } from './auth';
import { activeAccountId } from './keyringStore';
import { currentProfileId } from './profileContext';
import { getStored, setStored } from './persistence';
import { notifications } from './notificationStore';
import { captureSession, isCurrentSession, SessionChangedError, type SessionOwnership } from '$lib/services/sessionOwnership';

export interface ExecutorStepRecord {
    id: number | string;
    stepId: string;
    done: boolean;
    note: string;
}

const mapper = (d: Record<string, unknown>): ExecutorStepRecord => ({
    id: d.id as number | string,
    stepId: String(d.stepId ?? d.step_id ?? ''),
    done: !!d.done,
    note: (d.note ?? '') as string,
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

type StepChanges = Partial<Pick<ExecutorStepRecord, 'done' | 'note'>>;
type Owner = { session: SessionOwnership; account: string; profile: string };
type PendingStep = { key: string; changes: StepChanges; recoveryIds: string[] };
const PENDING_KEY = 'executor_steps_pending';
const captureOwner = (): Owner => ({ session: captureSession(), account: get(activeAccountId) || 'anonymous', profile: get(currentProfileId) || 'owner' });
const namespace = (owner: Owner) => `continuum_acc_${owner.account}_prof_${owner.profile}`;
const currentOwner = (owner: Owner) => isCurrentSession(owner.session)
    && owner.account === get(activeAccountId) && owner.profile === (get(currentProfileId) || 'owner');
const pendingScopes = new Map<string, Record<string, PendingStep>>();
const recoveryNotices = new Map<string, { id: string; owner: Owner }>();

function pendingFor(owner: Owner) {
    const scope = namespace(owner);
    let pending = pendingScopes.get(scope);
    if (!pending) {
        pending = getStored<Record<string, PendingStep>>(PENDING_KEY, {}, owner.profile, owner.account);
        if (!pending || typeof pending !== 'object' || Array.isArray(pending)) pending = {};
        pendingScopes.set(scope, pending);
    }
    return pending;
}

function keepPending(owner: Owner) {
    // Memory remains available if this device's cache is full.
    try { setStored(PENDING_KEY, pendingFor(owner), owner.profile, owner.account); }
    catch (e) { console.warn('[executor] Keeping the queued draft in memory', e); }
}

function release(owner: Owner, ids: string[]) {
    if (!currentOwner(owner)) return;
    ids.forEach(id => stepSync.releaseRecovery(id, owner.session));
}

function offerRecovered(owner: Owner, message = 'Your earlier draft is kept. Review your saved list, then choose Try Again to apply that change.') {
    if (!currentOwner(owner)) return;
    for (const [stepId, draft] of Object.entries(pendingFor(owner))) {
        const key = `${namespace(owner)}:${stepId}`;
        if (chains.has(key) || recoveryNotices.has(key)) continue;
        release(owner, draft.recoveryIds);
        const id = notifications.showError({
            message,
            code: 'DATABASE_ERROR'
        }, () => { void retryStep(owner, stepId).catch(() => {}); });
        recoveryNotices.set(key, { id, owner });
    }
}

async function retryStep(owner: Owner, stepId: string) {
    if (!currentOwner(owner)) return;
    const pending = pendingFor(owner)[stepId];
    if (!pending) return;
    release(owner, pending.recoveryIds);
    const key = `${namespace(owner)}:${stepId}`;
    const notice = recoveryNotices.get(key);
    if (notice) notifications.dismiss(notice.id);
    recoveryNotices.delete(key);
    // A prior create may have reached the server before its reply was interrupted.
    await stepSync.sync();
    if (!currentOwner(owner)) throw new SessionChangedError();
    // sync() retains the device copy and resolves on a failed GET. It is not permission
    // to create another row while the result of an earlier create is still unknown.
    if (stepSync.status !== 'synced' || !stepSync.lastSync) {
        offerRecovered(owner, "Your draft is kept. We couldn't load your saved list, so no changes were sent. Choose Try Again when you're connected.");
        return;
    }
    return save(stepId, pending.changes);
}

// One write per account/profile/step. Drafts are retained before a queued closure starts.
const chains = new Map<string, Promise<unknown>>();
function queue(owner: Owner, stepId: string, write: () => Promise<unknown>) {
    const key = `${namespace(owner)}:${stepId}`;
    const next = (chains.get(key) ?? Promise.resolve()).catch(() => {}).then(write);
    chains.set(key, next);
    const settled = () => {
        if (chains.get(key) !== next) return;
        chains.delete(key);
        const current = captureOwner();
        if (namespace(current) === namespace(owner) && currentOwner(current)) offerRecovered(current);
    };
    next.then(settled, settled);
    return next;
}

function save(stepId: string, changes: StepChanges) {
    const owner = captureOwner();
    if (!currentOwner(owner)) return Promise.reject(new SessionChangedError());
    const pending = pendingFor(owner);
    const key = crypto.randomUUID();
    const draft: PendingStep = { key, changes: { ...pending[stepId]?.changes, ...changes }, recoveryIds: [...(pending[stepId]?.recoveryIds || []), key] };
    pending[stepId] = draft;
    keepPending(owner);
    return queue(owner, stepId, async () => {
        if (!currentOwner(owner)) throw new SessionChangedError();
        const row = latest(stepId);
        const retry = () => retryStep(owner, stepId);
        const saved = row
            ? await stepSync.update(row.id, draft.changes, true, retry, key)
            : await stepSync.create({ id: crypto.randomUUID(), stepId, done: false, note: '', ...draft.changes }, false, false, retry, key);
        if (!currentOwner(owner)) throw new SessionChangedError();
        const latestDraft = pendingFor(owner)[stepId];
        if (latestDraft?.key === key) {
            release(owner, latestDraft.recoveryIds);
            delete pendingFor(owner)[stepId];
            const noticeKey = `${namespace(owner)}:${stepId}`;
            const notice = recoveryNotices.get(noticeKey);
            if (notice) notifications.dismiss(notice.id);
            recoveryNotices.delete(noticeKey);
        } else if (latestDraft) latestDraft.recoveryIds = latestDraft.recoveryIds.filter(id => id !== key);
        keepPending(owner);
        return saved;
    });
}

function recoverCurrentOwner() {
    for (const [key, notice] of recoveryNotices) {
        if (!currentOwner(notice.owner)) { notifications.dismiss(notice.id); recoveryNotices.delete(key); }
    }
    const owner = captureOwner();
    if (currentOwner(owner) && Object.keys(pendingFor(owner)).length) {
        queueMicrotask(() => { if (currentOwner(owner)) void stepSync.sync().then(() => offerRecovered(owner)); });
    }
}
auth.subscribe(recoverCurrentOwner);
activeAccountId.subscribe(recoverCurrentOwner);
currentProfileId.subscribe(recoverCurrentOwner);

/** Row key for the n-th checkbox inside a step's detail. */
const subKey = (stepId: string, n: number) => `${stepId}:${n}`;

export const executorSteps = {
    get items() { return stepSync.items; },
    get status() { return stepSync.status; },
    sync: async () => { const owner = captureOwner(); await stepSync.sync(); offerRecovered(owner); },
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
