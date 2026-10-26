import { getStored, setStored } from "$lib/stores/persistence";
import { API_BASE_URL } from "$lib/config";

import { auth } from "../stores/auth.ts";
import { activeAccountId } from "$lib/stores/keyringStore";
import { currentProfileId } from "$lib/stores/profileContext";
import { get } from "svelte/store";
import { untrack } from "svelte";
import { notifications, type AffirmationContext } from "$lib/stores/notificationStore";
import { captureSession, isCurrentSession, sessionToken, SessionChangedError, type SessionOwnership } from "$lib/services/sessionOwnership";

const toCamel = (str: string) => str.replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', ''));
const toSnake = (str: string) => str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

// Values of these keys are user data (JSON text or objects with user-chosen keys):
// never case-convert anything inside them.
// funeral_data and advanced_assets keep their maps/lists as JSON text, read back unconverted.
const VERBATIM_VALUE_KEYS = new Set([
    'custom_attributes', 'customAttributes', 'setupStatus', 'fireDrill',
    'wishes', 'budget', 'transactions', 'maintenance', 'claims',
]);

/** The message of a caught value, when it carries one. */
const errMessage = (e: unknown): string | undefined =>
    e instanceof Error ? e.message : (typeof e === 'object' && e !== null && typeof (e as { message?: unknown }).message === 'string' ? (e as { message: string }).message : undefined);
const errTechnical = (e: unknown): string => {
    const t = typeof e === 'object' && e !== null ? (e as { technicalDetails?: unknown }).technicalDetails : undefined;
    return (typeof t === 'string' && t) || errMessage(e) || String(e);
};

// R is what the caller knows the input to be (a record by default; a row type or a list where it says so).
const convertKeys = <R = Record<string, unknown>>(obj: unknown, converter: (s: string) => string): R => {
    if (obj === null || typeof obj !== 'object' || obj instanceof Date || obj instanceof Blob) return obj as R;
    if (Array.isArray(obj)) return obj.map(i => convertKeys(i, converter)) as R;

    const newObj: Record<string, unknown> = {};
    Object.keys(obj as object).forEach(key => {
        newObj[converter(key)] = VERBATIM_VALUE_KEYS.has(key) ? (obj as Record<string, unknown>)[key] : convertKeys((obj as Record<string, unknown>)[key], converter);
    });
    return newObj as R;
};

// Wire contract: these SQLModel fields (Asset, FinancialAccount, Subscription, Letter) are camelCase
// columns. They go over the wire exactly as named; every other key is sent as snake_case.
const CAMEL_WIRE_KEYS = new Set([
    'ownershipDetails', 'purchaseDate', 'maintenanceSchedule',
    'accountNumber', 'ownershipPercentage', 'loginUrl', 'beneficiaryEmail',
    'valueHistory', 'closureNotes',
    'paymentMethod', 'cancellationInstructions', 'nextBilling',
    'triggerDate', 'triggerMilestone', 'isLocked',
]);
// Text columns that hold JSON; the UI keeps them as arrays/objects.
const JSON_TEXT_WIRE_KEYS = ['valueHistory', 'maintenanceSchedule', 'evidence'];

const toWireKey = (s: string) => (CAMEL_WIRE_KEYS.has(s) ? s : toSnake(s));

const toWire = (obj: unknown): Record<string, unknown> => {
    const out = convertKeys<Record<string, unknown>>(obj, toWireKey);
    for (const k of JSON_TEXT_WIRE_KEYS) {
        if (out && out[k] !== null && typeof out[k] === 'object') out[k] = JSON.stringify(out[k]);
    }
    return out;
};

// Use centralized config for API base URL (fixes dev mode sync issue)
const BASE_URL = API_BASE_URL;

// The account whose saved records a store currently holds (the getStored namespace).
const storageAccount = () => get(activeAccountId) || 'anonymous';

type OperationOwner = { session: SessionOwnership; account: string; profile: string };
const captureOwner = (): OperationOwner => ({
    session: captureSession(), account: storageAccount(), profile: get(currentProfileId) || 'owner'
});
const sameNamespace = (owner: OperationOwner) =>
    storageAccount() === owner.account && (get(currentProfileId) || 'owner') === owner.profile;
const currentOwner = (owner: OperationOwner) => sameNamespace(owner) && isCurrentSession(owner.session);
const cloneData = <V>(value: V): V => JSON.parse(JSON.stringify(value)) as V;
/** Recovery and ordinary cache reads share one namespace-aware fallback boundary. */
const storedFor = <V>(key: string, fallback: V, owner: OperationOwner): V =>
    getStored(key, fallback, owner.profile, owner.account);
const saveFor = <V>(key: string, value: V, owner: OperationOwner) =>
    setStored(key, value, owner.profile, owner.account);
const ACCOUNT_CHANGED = new SessionChangedError();
type RecoveredWrite<V> = {
    key: string; kind: 'create' | 'update' | 'delete'; id?: string | number; data?: Partial<V>;
    skipLocal?: boolean; quiet?: boolean; affirm?: boolean; requiresFollowUp?: boolean;
};
/** Opaque request identity lets an editor retry/release its own draft without content deduplication. */
export type SaveFailure = Error & { recoveryId?: string };
const identifiedFailure = (error: unknown, recoveryId: string): SaveFailure =>
    Object.assign(error === ACCOUNT_CHANGED ? new SessionChangedError() : error instanceof Error ? error : new Error(errMessage(error) || 'Failed to save'), { recoveryId });

export type SyncStatus = "idle" | "syncing" | "error" | "synced";

// Writes go out with keepalive, so one sent as the page unloads still reaches the server. The
// browser allows 64 KiB of keepalive bodies in flight in all; a write that would pass that goes
// out as a plain fetch.
const KEEPALIVE_BUDGET = 60 * 1024;
let keepaliveBytes = 0;
function writeFetch(url: string, init: RequestInit): Promise<Response> {
    const size = typeof init.body === 'string' ? new TextEncoder().encode(init.body).length : 0;
    if (keepaliveBytes + size > KEEPALIVE_BUDGET) return fetch(url, init);
    keepaliveBytes += size;
    return fetch(url, { ...init, keepalive: true }).finally(() => { keepaliveBytes -= size; });
}

/** One notice for every list whose first read failed (an outage fails them all at once): Try Again
 *  re-reads each of them; it closes when the last one answers. Key → that store's re-read. */
const loadRetries = new Map<string, () => void>();
let loadNoticeId: string | null = null;
function loadFailed(key: string, retry: () => void, technicalDetails?: string) {
    loadRetries.set(key, retry);
    if (loadNoticeId) return;
    loadNoticeId = notifications.showError({
        message: 'Your saved records are still on your account. Let\'s try loading them again.',
        code: 'SERVICE_UNAVAILABLE',
        technicalDetails
    }, () => {
        loadNoticeId = null;
        const all = [...loadRetries.values()];
        loadRetries.clear();
        all.forEach((r) => r());
    });
}
function loadAnswered(key: string) {
    if (!loadRetries.delete(key) || loadRetries.size || !loadNoticeId) return;
    notifications.dismiss(loadNoticeId);
    loadNoticeId = null;
}

export class SyncManager<T extends { id: number | string }> {
    #items = $state<T[]>([]);
    /** The records; a page, derived value or effect reading them marks this store as one the page shows (syncAll). */
    get items(): T[] { shownBy(this); return this.#items; }
    set items(value: T[]) { this.#items = value; }
    #status = $state<SyncStatus>("idle");
    /** See lastSync: a shown sync status marks the store shown too. */
    get status(): SyncStatus { shownBy(this); return this.#status; }
    set status(value: SyncStatus) { this.#status = value; }
    #lastSync = $state<Date | null>(null);
    /** When the server last answered; reading it (a "loaded yet?" cue) also marks the store shown. */
    get lastSync(): Date | null { shownBy(this); return this.#lastSync; }
    set lastSync(value: Date | null) { this.#lastSync = value; }
    error = $state<string | null>(null);

    private key: string;
    private endpoint: string;
    private mapper?: (local: Record<string, unknown>) => T;
    private apiBase: string;
    private subscriptions = new Set<(value: T[]) => void>();
    private affirmationContext?: AffirmationContext;

    constructor(key: string, endpoint: string, mapper?: (local: Record<string, unknown>) => T, apiBase: string = "/api/data") {
        this.key = key;
        this.endpoint = endpoint;
        this.mapper = mapper;
        this.apiBase = apiBase;

        // 1. Instant Load
        this.items = getStored<T[]>(key, []);
        this.loadedFor = storageAccount();
    }

    /**
     * Set the affirmation context for this sync manager.
     * When set, successful create/update operations will show affirmations.
     */
    setAffirmationContext(context: AffirmationContext) {
        this.affirmationContext = context;
        return this;
    }

    /** Large stores (letters): syncAll leaves this one alone until something shows it
     *  (or the page shows every module); until then the device copy stands. */
    onDemand = false;
    syncOnDemand() {
        this.onDemand = true;
        return this;
    }

    subscribe(run: (value: T[]) => void) {
        shownBy(this, true);
        run(this.items);
        this.subscriptions.add(run);
        return () => this.subscriptions.delete(run);
    }

    private notify() {
        this.subscriptions.forEach(run => run(this.items));
    }

    async init() {
        await this.sync();
    }

    private inflight: Promise<void> | null = null;
    /** Bumped by reset(): a sync started before it belongs to the previous account. */
    private generation = 0;
    private readEpoch = 0;
    /** The current local-to-server upload; reset() leaves it, so the next one waits for it to stop. */
    private uploading: Promise<unknown> = Promise.resolve();
    /** Account whose records are loaded; null after a logout clear. */
    loadedFor: string | null = null;
    /** Per record id with updates in flight: the row as the server last returned it (or as it was
     *  before the first of them), each open update's fields by sequence, every field they touched,
     *  and the last request, which the next update to that row waits for (the server applies them
     *  in order). */
    private rowWrites = new Map<string, { generation: number; base: T; baseSeq: number; open: Map<number, Partial<T>>; keys: Set<string>; last: Promise<unknown> }>();
    private updateCounter = 0;
    /** Bumped each time an update's answer becomes a row's server copy (its `baseSeq`): a sync that
     *  started before that answer leaves the newer copy alone. */
    private baseCounter = 0;
    /** Rows whose delete is in flight: an update to the row that settles meanwhile lands here, so a
     *  failed delete restores the row as it now is. */
    private removing = new Map<string, { generation: number; row: T }>();
    /** Confirmed backend removals also filter reads that started before the removal. */
    private confirmedRemoved = new Set<string>();
    private activeWrites = new Map<string, { owner: OperationOwner; write: RecoveredWrite<T> }>();
    private operationNotices = new Set<string>();
    private recoveryNotices = new Set<string>();
    private releasedRecoveries = new Set<string>();
    private writeNotices = new Map<string, string>();
    private trackNotice(key: string, id: string) {
        const old = this.writeNotices.get(key);
        if (old) { notifications.dismiss(old); this.operationNotices.delete(old); }
        this.writeNotices.set(key, id);
        this.operationNotices.add(id);
    }

    private get recoveryKey() { return `${this.key}__account_recovery`; }
    private remember(owner: OperationOwner, write: RecoveredWrite<T>) {
        const pending = storedFor<RecoveredWrite<T>[]>(this.recoveryKey, [], owner);
        saveFor(this.recoveryKey, [...pending.filter(p => p.key !== write.key), write], owner);
    }
    private forget(owner: OperationOwner, key: string) {
        this.activeWrites.delete(key);
        this.releasedRecoveries.add(key);
        const notice = this.writeNotices.get(key);
        if (notice) { notifications.dismiss(notice); this.operationNotices.delete(notice); this.writeNotices.delete(key); }
        const pending = storedFor<RecoveredWrite<T>[]>(this.recoveryKey, [], owner);
        if (pending.some(p => p.key === key)) saveFor(this.recoveryKey, pending.filter(p => p.key !== key), owner);
    }
    /** A caller may release only a draft it explicitly completed or abandoned in this session. */
    releaseRecovery(recoveryId: string, owner: SessionOwnership = captureSession()): void {
        if (!isCurrentSession(owner)) return;
        this.forget(captureOwner(), recoveryId);
    }
    private keepCreated(owner: OperationOwner, item: T) {
        const items = storedFor<T[]>(this.key, [], owner);
        saveFor(this.key, [...items.filter(i => String(i.id) !== String(item.id)), item], owner);
        const sent = storedFor<string[]>(this.sentKey, [], owner);
        saveFor(this.sentKey, [...new Set([...sent, String(item.id)])], owner);
    }
    private keepRemoved(owner: OperationOwner, id: string | number) {
        const key = String(id);
        saveFor(this.key, storedFor<T[]>(this.key, [], owner).filter(i => String(i.id) !== key), owner);
        const sent = storedFor<string[] | null>(this.sentKey, null, owner);
        if (sent) saveFor(this.sentKey, sent.filter(i => String(i) !== key), owner);
        saveFor(this.uploadKey, storedFor<T[]>(this.uploadKey, [], owner).filter(i => String(i.id) !== key), owner);
        saveFor(this.recoveryKey, storedFor<RecoveredWrite<T>[]>(this.recoveryKey, [], owner).filter(w => String(w.id) !== key), owner);
    }
    private resumeRecovered(owner: OperationOwner): Promise<void> {
        // A sent write whose answer was lost may already exist on the server. Recovery
        // is an explicit action after a fresh read, never a blind replay on account return.
        for (const write of storedFor<RecoveredWrite<T>[]>(this.recoveryKey, [], owner)) {
            if (!currentOwner(owner)) break;
            if (this.recoveryNotices.has(write.key)) continue;
            this.recoveryNotices.add(write.key);
            const fromRecord = write.kind === 'delete' && write.requiresFollowUp;
            this.trackNotice(write.key, notifications.showError({
                message: fromRecord
                    ? 'Your earlier removal is ready to review. You can continue from the item in your list.'
                    : 'Your earlier draft is kept. Review your saved list, then choose Try Again to apply that change.',
                code: 'DATABASE_ERROR'
            }, fromRecord ? undefined : () => {
                if (!currentOwner(owner) || this.releasedRecoveries.has(write.key)) return;
                const attempt = write.kind === 'create'
                    ? this.create(write.data || {}, !!write.skipLocal, !!write.quiet, undefined, write.key)
                    : write.kind === 'update' ? this.update(write.id!, write.data, write.affirm, undefined, write.key)
                    : this.delete(write.id!, undefined, write.key);
                attempt.catch(() => {});
            }));
        }
        return Promise.resolve();
    }

    /** Reconcile rows removed by an atomic backend operation; sends no DELETE requests.
     *  Pass the parent's captured session so a late completion cannot change another account. */
    confirmRemoved(ids: (string | number)[], owner: SessionOwnership = captureSession()): void {
        if (!isCurrentSession(owner)) return;
        this.readEpoch++;
        this.inflight = null; // A fresh graph read must not join a pre-removal GET.
        const keys = new Set(ids.map(String));
        for (const key of keys) {
            this.confirmedRemoved.add(key);
            this.rowWrites.delete(key);
            this.removing.delete(key);
        }
        this.items = this.items.filter(i => !keys.has(String(i.id)));
        setStored(this.key, this.items);
        const sent = getStored<string[] | null>(this.sentKey, null);
        if (sent) setStored(this.sentKey, sent.filter(id => !keys.has(String(id))));
        const pending = getStored<T[]>(this.uploadKey, []);
        if (pending.length) setStored(this.uploadKey, pending.filter(i => !keys.has(String(i.id))));
        const recovery = getStored<RecoveredWrite<T>[]>(this.recoveryKey, []);
        const context = captureOwner();
        for (const write of recovery) if (write.id != null && keys.has(String(write.id))) this.forget(context, write.key);
        for (const [key, active] of this.activeWrites) if (active.write.id != null && keys.has(String(active.write.id))) this.forget(context, key);
        this.status = 'synced';
        this.error = null;
        this.lastSync = new Date();
        this.notify();
    }

    /** Replace a row (in the list, or held by its in-flight delete); nothing after an account switch. */
    private setRow(id: number | string, generation: number, next: (row: T) => T) {
        if (generation !== this.generation) return;
        const at = this.items.findIndex(i => String(i.id) === String(id));
        if (at !== -1) {
            this.items[at] = next(this.items[at]);
            this.items = [...this.items];
            setStored(this.key, this.items);
            this.notify();
            return;
        }
        const held = this.removing.get(String(id));
        if (held && held.generation === generation) held.row = next(held.row);
    }

    /** Account change: drop this manager's in-memory records. clear=true (logout) leaves storage alone;
     *  otherwise reload the records saved for the now-active account. */
    reset(clear = false) {
        this.inflight = null; // a sync still running belongs to the previous account
        this.generation++;
        this.rowWrites.clear();
        this.removing.clear();
        this.confirmedRemoved.clear();
        this.activeWrites.forEach(({ owner, write }) => this.remember(owner, write));
        this.activeWrites.clear();
        this.operationNotices.forEach(id => notifications.dismiss(id));
        this.operationNotices.clear();
        this.recoveryNotices.clear();
        this.releasedRecoveries.clear();
        this.writeNotices.clear();
        loadAnswered(this.key);
        this.loadedFor = clear ? null : storageAccount();
        this.items = clear ? [] : getStored<T[]>(this.key, []);
        this.status = "idle";
        this.error = null;
        this.lastSync = null;
        this.notify();
    }

    // One fetch at a time per store: a second caller waits on the first instead of racing it
    // (two racing syncs of an empty server would both migrate the local copy up).
    sync(): Promise<void> {
        if (this.inflight) return this.inflight;
        const p: Promise<void> = this.runSync().finally(() => { if (this.inflight === p) this.inflight = null; });
        this.inflight = p;
        return p;
    }

    private async runSync() {
        const owner = captureOwner();
        if (!currentOwner(owner)) return;
        this.status = "syncing";
        this.error = null;

        // CRITICAL: Capture local state BEFORE any async operations
        // This prevents race conditions where reactive $state gets updated
        // before we can check for migration eligibility
        const localItemsSnapshot = [...this.items];
        const generation = this.generation;
        const readEpoch = this.readEpoch;
        const baseMark = this.baseCounter;
        const { account, profile } = owner;
        // Still the account (and the run) this sync started for.
        const current = () => this.generation === generation && this.readEpoch === readEpoch && currentOwner(owner);
        let answered = false; // the server returned the list (a later failure is an upload's)

        try {
            // Fetch Remote
            const token = sessionToken(owner.session);
            if (!token) {
                console.warn(`[Sync:${this.key}] No auth token, skipping sync`);
                this.status = "idle";
                return;
            }

            const res = await fetch(`${BASE_URL}${this.apiBase}/${this.endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch remote data");

            const rawItems: unknown[] = await res.json();
            // The account changed while this was in flight: these records belong to someone else.
            if (!current()) return;
            answered = true;
            loadAnswered(this.key);
            const remoteItems = rawItems.map(item => {
                const camelItem = convertKeys(item, toCamel);
                return this.mapper ? this.mapper(camelItem) : camelItem as unknown as T;
            });

            // Logic: Up-Sync vs Down-Sync
            // If Remote is empty but Local has data -> Migration (Up-Sync)
            // Use captured snapshot to avoid race condition with reactive state
            // A stopped upload's last POST settles (and saves what is left) before this one reads it.
            await this.uploading;
            if (!current()) return;
            // An upload an account switch interrupted resumes, though the server now holds its first items.
            const pendingUpload = getStored<T[]>(this.uploadKey, []);
            // Only records the server never had go up: a device record whose id the server once
            // returned and now lacks was removed there (another device, a direct delete) and leaves
            // this device with the mirror below. A device that has not yet kept that id list
            // (its first sync since it was added) uploads its copy only to an empty server, as before.
            const sentIds = getStored<string[] | null>(this.sentKey, null);
            const sent = sentIds ? new Set(sentIds) : null;
            const toUpload = pendingUpload.length > 0 ? pendingUpload
                : sent ? localItemsSnapshot.filter(i => !sent.has(String(i.id)))
                : remoteItems.length === 0 ? localItemsSnapshot : [];
            if (toUpload.length > 0) {
                console.log(`[Sync:${this.key}] Migrating ${toUpload.length} local items to cloud...`);
                // Stopped by an account switch: the rest waits on this device for this account.
                const upload = this.migrateUp(toUpload, token, account, profile, current);
                this.uploading = upload.catch(() => {});
                if (!(await upload)) return;
                // Re-fetch to get canon IDs
                const res2 = await fetch(`${BASE_URL}${this.apiBase}/${this.endpoint}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res2.ok) {
                    const raw2 = await res2.json();
                    if (!current()) return;
                    const wrapped2 = raw2.map((i: unknown) => {
                        const camel = convertKeys(i, toCamel);
                        return this.mapper ? this.mapper(camel) : camel as unknown as T;
                    });
                    this.updateLocal(this.withOpenUpdates(wrapped2, generation, baseMark));
                }
            } else {
                // Standard Mirror (Down-Sync) - Server is Truth
                this.updateLocal(this.withOpenUpdates(remoteItems, generation, baseMark));
            }

            this.status = "synced";
            this.lastSync = new Date();
            await this.resumeRecovered(owner);
        } catch (e: unknown) {
            if (!current()) return;
            console.error(`[Sync:${this.key}] Error:`, e);
            this.status = "error";
            this.error = errMessage(e) ?? null;
            // The first read of the list did not answer: the device copy stays on screen, and the
            // shared notice offers to load it again (repeat failures and other lists add none).
            if (!answered && !this.#lastSync && current()) {
                loadFailed(this.key, () => { this.sync().catch(() => {}); }, errTechnical(e) ?? undefined);
            }
        }
    }

    /** A synced list meeting rows with updates in flight: the synced row becomes each such row's
     *  server copy (so a failure reverts to it), unless an update's answer arrived after this sync
     *  started; the open updates' fields stay laid over it on screen until their answers come back. */
    private withOpenUpdates(data: T[], generation: number, baseMark: number): T[] {
        data = data.filter(i => !this.confirmedRemoved.has(String(i.id)));
        if (generation !== this.generation || this.rowWrites.size === 0) return data;
        return data.map(item => {
            const entry = this.rowWrites.get(String(item.id));
            if (!entry || entry.generation !== generation || entry.open.size === 0) return item;
            if (entry.baseSeq <= baseMark) entry.base = { ...item };
            const next: T = { ...entry.base };
            for (const s of [...entry.open.keys()].sort((a, b) => a - b)) Object.assign(next, entry.open.get(s));
            return next;
        });
    }

    /** Mirror the server's list (server truth): the device keeps it and the ids the server holds. */
    private updateLocal(data: T[]) {
        this.items = data;
        setStored(this.key, data);
        setStored(this.sentKey, data.map(i => String(i.id)));
        this.notify();
    }

    private get uploadKey() { return `${this.key}__pending_upload`; }
    /** Ids of this account's records the server has returned to this device. */
    private get sentKey() { return `${this.key}__server_ids`; }

    /** Upload local items one by one into `account`, always with that account's token. Stops as soon as
     *  the person signs out, another account becomes active or the store is reset (false); the items not yet sent stay in
     *  `account`'s saved upload list and are sent on its next sync. */
    private async migrateUp(items: T[], token: string, account: string, profile: string,
                            sameAccount: () => boolean): Promise<boolean> {
        const left = [...items];
        const save = () => setStored(this.uploadKey, left.filter(i => !this.confirmedRemoved.has(String(i.id))), profile, account);
        save();
        while (left.length > 0) {
            if (!sameAccount()) return false;
            if (this.confirmedRemoved.has(String(left[0].id))) { left.shift(); save(); continue; }
            try {
                await this.post(left[0], token); // local copy is replaced by the server list afterwards
            } catch (e) {
                if (!sameAccount()) return false;
                throw e;
            }
            left.shift();
            save();
        }
        return true;
    }

    /** POST one new item with the given token; returns it as the server stored it. */
    private async post(data: Partial<T>, token: string | null) {
        const payloadRaw = this.mapper ? this.mapper(data) : data;
        const payload = toWire(payloadRaw);

        // The server assigns these on every create (every model's id is a server default or autoincrement;
        // /api/data rejects them as protected). The caller keeps the returned record, with the server's id.
        delete payload.id;
        delete payload.user_id;
        delete payload.created_at;
        delete payload.updated_at;

        const res = await writeFetch(`${BASE_URL}${this.apiBase}/${this.endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorBody = await res.text();
            let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
            try {
                const errorJson = JSON.parse(errorBody);
                errorDetail = errorJson.detail || errorJson.message || errorJson.error?.message || errorBody;
            } catch { errorDetail = errorBody || errorDetail; }
            const error = new Error("Failed to save") as Error & { technicalDetails?: string };
            error.technicalDetails = `${errorDetail}\n\nEndpoint: POST ${this.apiBase}/${this.endpoint}`;
            throw error;
        }

        const raw = await res.json();
        const newItemRaw = convertKeys(raw, toCamel);
        return this.mapper ? this.mapper(newItemRaw) : newItemRaw as unknown as T;
    }

    // CRUD
    // quiet: background bookkeeping (activity log). Failures are logged to the console only,
    // never shown to the user, and never change this manager's status.
    async create(data: Partial<T>, skipLocal = false, quiet = false, onRetry?: () => Promise<unknown>, recoveryId?: string) {
        const owner = captureOwner();
        const generation = this.generation;
        const current = () => generation === this.generation && currentOwner(owner);
        if (!current()) throw ACCOUNT_CHANGED;
        const draft = cloneData(data);
        const operation: RecoveredWrite<T> = { key: recoveryId || crypto.randomUUID(), kind: 'create', data: draft, skipLocal, quiet };
        if (!quiet) this.activeWrites.set(operation.key, { owner, write: operation });
        let confirmed: T | undefined;
        if (!quiet && !skipLocal) { this.status = "syncing"; this.error = null; }
        try {
            confirmed = await this.post(draft, sessionToken(owner.session));
            if (!current()) {
                if (!skipLocal) this.keepCreated(owner, confirmed);
                this.forget(owner, operation.key);
                throw ACCOUNT_CHANGED;
            }
            const newItem = confirmed;
            if (!skipLocal) {
                this.items = [...this.items, newItem];
                setStored(this.key, this.items);
                const sentIds = getStored<string[] | null>(this.sentKey, null);
                if (sentIds) setStored(this.sentKey, [...sentIds, String(newItem.id)]);
                this.notify();
                if (this.affirmationContext && !quiet) notifications.showAffirmation(this.affirmationContext, 'create');
            }
            this.forget(owner, operation.key);
            if (!quiet && !skipLocal) { this.status = "synced"; this.lastSync = new Date(); }
            return newItem;
        } catch (e: unknown) {
            if (!current()) {
                if (!confirmed) this.remember(owner, operation);
                throw ACCOUNT_CHANGED;
            }
            console.error("Create failed", e);
            if (quiet) throw e;
            if (!skipLocal) { this.status = "error"; this.error = errMessage(e) || "Failed to save"; }
            this.trackNotice(operation.key, notifications.showError({
                message: 'Your draft is kept. We can save it again whenever you\'re ready.',
                code: 'DATABASE_ERROR', technicalDetails: errTechnical(e)
            }, () => {
                if (!current() || this.releasedRecoveries.has(operation.key)) return;
                this.activeWrites.delete(operation.key);
                (onRetry ? onRetry() : this.create(draft, skipLocal, quiet, undefined, operation.key)).catch(() => {});
            }));
            throw identifiedFailure(e, operation.key);
        }
    }

    // affirm=false: a small setting saved in place (no affirmation); failures still show the gentle error.
    async update(idOrData: T | number | string, partialData?: Partial<T>, affirm = true, onRetry?: () => Promise<unknown>, recoveryId?: string) {
        const owner = captureOwner();
        const generation = this.generation;
        const owned = () => generation === this.generation && currentOwner(owner);
        if (!owned()) throw ACCOUNT_CHANGED;
        let id: number | string;
        let updates: Partial<T>;

        if (typeof idOrData === 'object' && idOrData !== null) {
            id = idOrData.id;
            updates = idOrData;
        } else {
            id = idOrData;
            updates = partialData || {};
        }

        updates = cloneData(updates);
        const operation: RecoveredWrite<T> = { key: recoveryId || crypto.randomUUID(), kind: 'update', id, data: updates, affirm };
        const current = () => owned() && !this.confirmedRemoved.has(String(id));
        let confirmed: T | undefined;
        // Optimistic Update
        const index = this.items.findIndex(i => String(i.id) === String(id));
        if (index === -1) {
            // Never report a save that did not happen.
            notifications.showError({
                message: 'Refreshing the page shows your latest list.',
                code: 'NOT_FOUND',
                technicalDetails: `update: no item with id ${id} in ${this.key}`
            });
            throw new Error(`Item ${id} not found`);
        }

        this.activeWrites.set(operation.key, { owner, write: operation });
        this.status = "syncing";
        this.error = null;
        const currentItem = this.items[index];
        const updatedItem = { ...currentItem, ...updates };
        const seq = ++this.updateCounter;
        const key = String(id);
        let row = this.rowWrites.get(key);
        if (!row || row.generation !== generation) {
            row = { generation, base: { ...currentItem }, baseSeq: 0, open: new Map(), keys: new Set(), last: Promise.resolve() };
            this.rowWrites.set(key, row);
        }
        const entry = row;
        entry.open.set(seq, updates);
        for (const k of Object.keys(updates)) entry.keys.add(k);
        const before = entry.last;
        let settled!: () => void;
        entry.last = new Promise<void>(r => { settled = r; });
        this.items[index] = updatedItem;
        this.items = [...this.items]; // trigger reactivity
        setStored(this.key, this.items);
        this.notify();
        // This update's outcome is in: the row loses it from its open set (and its record when none is left).
        const close = () => {
            entry.open.delete(seq);
            if (entry.open.size === 0 && this.rowWrites.get(key) === entry) this.rowWrites.delete(key);
            settled();
        };

        try {
            // The previous update to this row reaches the server first, so the newest one is kept there.
            await before;
            if (!current()) throw ACCOUNT_CHANGED;
            const token = sessionToken(owner.session);
            const payloadRaw = this.mapper ? this.mapper(updatedItem) : updatedItem;
            const payload = toWire(payloadRaw);

            // Remove protected fields that backend won't accept
            delete payload.id;
            delete payload.user_id;
            delete payload.created_at;
            delete payload.updated_at;

            const res = await writeFetch(`${BASE_URL}${this.apiBase}/${this.endpoint}/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorBody = await res.text();
                let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
                try {
                    const errorJson = JSON.parse(errorBody);
                    errorDetail = errorJson.detail || errorJson.message || errorJson.error?.message || errorBody;
                } catch { errorDetail = errorBody || errorDetail; }
                const error = new Error("Failed to update remote") as Error & { technicalDetails?: string };
                error.technicalDetails = `${errorDetail}\n\nEndpoint: PUT ${this.apiBase}/${this.endpoint}/${id}`;
                throw error;
            }
            const raw = await res.json();
            const remoteItemRaw = convertKeys(raw, toCamel);
            const remoteItem = this.mapper ? this.mapper(remoteItemRaw) : remoteItemRaw as unknown as T;
            confirmed = remoteItem;
            if (!current()) {
                if (!(generation === this.generation && this.confirmedRemoved.has(key))) this.keepCreated(owner, remoteItem);
                this.forget(owner, operation.key);
                throw ACCOUNT_CHANGED;
            }

            // The server's row, with any newer update still in flight laid over it (those values
            // stay on screen until their own answer comes back).
            entry.base = remoteItem;
            entry.baseSeq = ++this.baseCounter;
            close();
            if (entry.open.size === 0) entry.keys.clear();
            this.setRow(id, generation, () => {
                const next: T = { ...remoteItem };
                for (const s of [...entry.open.keys()].sort((a, b) => a - b)) Object.assign(next, entry.open.get(s));
                return next;
            });
            this.status = "synced";
            this.lastSync = new Date();

            // Show affirmation if context is set (update wording: never "added")
            if (this.affirmationContext && affirm) {
                notifications.showAffirmation(this.affirmationContext, 'update');
            }

            this.forget(owner, operation.key);
            return remoteItem;
        } catch (e: unknown) {
            if (!current()) {
                close();
                if (!confirmed && !(generation === this.generation && this.confirmedRemoved.has(key))) this.remember(owner, operation);
                throw ACCOUNT_CHANGED;
            }
            console.error("Update failed, rolling back", e);
            // A newer update to this row is still open: it carries the whole row, so its answer
            // decides. Otherwise every field these updates touched goes back to the server's
            // latest row (an earlier update's answer, or the row before them); other fields stay.
            close();
            if (entry.open.size === 0) {
                const keys = [...entry.keys];
                entry.keys.clear();
                this.setRow(id, generation, (r) => {
                    const reverted = { ...r } as Record<string, unknown>;
                    for (const k of keys) {
                        if (k in entry.base) reverted[k] = (entry.base as Record<string, unknown>)[k];
                        else delete reverted[k];
                    }
                    return reverted as T;
                });
            }
            this.status = "error";
            this.error = errMessage(e) || "Failed to save";
            // Rollback restores the saved record; the caller's form still holds the typed draft,
            // and Try Again re-applies exactly those edits.
            this.trackNotice(operation.key, notifications.showError({
                message: 'Your draft is kept. We can save it again whenever you\'re ready.',
                code: 'DATABASE_ERROR',
                technicalDetails: errTechnical(e)
            }, () => {
                if (!current() || this.releasedRecoveries.has(operation.key)) return;
                this.activeWrites.delete(operation.key);
                (onRetry ? onRetry() : this.update(id, updates, affirm, undefined, operation.key)).catch(() => {});
            }));
            throw identifiedFailure(e, operation.key);
        }
    }

    // onRemoved: runs once the server no longer has the record (first try, a 404, or Try Again).
    async delete(id: number | string, onRemoved?: () => Promise<unknown> | void, recoveryId?: string) {
        const owner = captureOwner();
        const generation = this.generation;
        const current = () => generation === this.generation && currentOwner(owner);
        if (!current()) return;
        const operation: RecoveredWrite<T> = { key: recoveryId || crypto.randomUUID(), kind: 'delete', id, requiresFollowUp: !!onRemoved };
        this.activeWrites.set(operation.key, { owner, write: operation });
        // Optimistic
        const index = this.items.findIndex(i => String(i.id) === String(id));
        const removed = index === -1 ? null : this.items[index];
        const key = String(id);
        // An update to this row that settles while the delete is in flight changes this copy.
        const held = removed ? { generation, row: removed } : null;
        if (held) this.removing.set(key, held);
        const release = () => { if (this.removing.get(key) === held) this.removing.delete(key); };
        this.status = "syncing";
        this.error = null;
        this.items = this.items.filter(i => String(i.id) !== String(id));
        setStored(this.key, this.items);
        this.notify();

        try {
            const token = sessionToken(owner.session);
            const res = await writeFetch(`${BASE_URL}${this.apiBase}/${this.endpoint}/${id}`, {
                method: "DELETE",
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // 404: the row is already gone on the server (removed on another device), so it is removed.
            if (!res.ok && res.status !== 404) {
                const errorBody = await res.text();
                let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
                try {
                    const errorJson = JSON.parse(errorBody);
                    errorDetail = errorJson.detail || errorJson.message || errorJson.error?.message || errorBody;
                } catch { errorDetail = errorBody || errorDetail; }
                const error = new Error("Delete failed remote") as Error & { technicalDetails?: string };
                error.technicalDetails = `${errorDetail}\n\nEndpoint: DELETE ${this.apiBase}/${this.endpoint}/${id}`;
                throw error;
            }
            release();
            if (!current()) {
                this.keepRemoved(owner, id);
                this.forget(owner, operation.key);
                return;
            }
            this.confirmRemoved([id], owner.session);
            this.forget(owner, operation.key);
            this.status = "synced";
            this.lastSync = new Date();
        } catch (e: unknown) {
            if (!current()) {
                release();
                this.remember(owner, operation);
                return;
            }
            // Rollback
            console.error("Delete failed, rolling back", e);
            // Put back only the removed record, at its place (the end if the list is now shorter),
            // as any update that settled meanwhile left it; records added or changed meanwhile stay.
            // Skipped after an account switch, or if a sync already brought it back.
            release();
            if (held && generation === this.generation && !this.items.some(i => String(i.id) === String(id))) {
                const next = [...this.items];
                next.splice(Math.min(index, next.length), 0, held.row);
                this.items = next;
                setStored(this.key, this.items);
                this.notify();
            }
            this.status = "error";
            this.error = errMessage(e) || "Failed to remove";
            this.trackNotice(operation.key, notifications.showError({
                message: 'It is still in your list. We can remove it again whenever you\'re ready.',
                code: 'DATABASE_ERROR',
                technicalDetails: errTechnical(e)
            }, () => {
                if (!current() || this.releasedRecoveries.has(operation.key)) return;
                this.activeWrites.delete(operation.key);
                this.delete(id, onRemoved, operation.key).catch(() => {});
            }));
            return;
        }
        // Outside the try: a failing follow-up must never roll back a record the server removed.
        if (onRemoved && current()) {
            try { await onRemoved(); } catch (e) { console.warn('[sync] follow-up after remove paused', id, e); }
        }
    }

    async audit() {
        const owner = captureOwner();
        const generation = this.generation;
        const current = () => generation === this.generation && currentOwner(owner);
        if (!current()) throw ACCOUNT_CHANGED;
        try {
            const token = sessionToken(owner.session);
            const res = await fetch(`${BASE_URL}${this.apiBase}/${this.endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Audit fetch failed");
            const rawItems: unknown[] = await res.json();
            if (!current()) throw ACCOUNT_CHANGED;
            const remoteItems = rawItems.map(i => {
                const camel = convertKeys(i, toCamel);
                return this.mapper ? this.mapper(camel) : camel;
            });

            // Comparison Logic
            const localIds = new Set(this.items.map(i => String(i.id)));
            const remoteIds = new Set(remoteItems.map(i => String(i.id)));

            const matchCount = this.items.filter(i => remoteIds.has(String(i.id))).length;
            const onlyLocal = this.items.filter(i => !remoteIds.has(String(i.id)));
            const onlyRemote = remoteItems.filter(i => !localIds.has(String(i.id)));

            return {
                localCount: this.items.length,
                remoteCount: remoteItems.length,
                matches: matchCount === this.items.length && this.items.length === remoteItems.length,
                details: {
                    onlyLocal,
                    onlyRemote,
                    remoteItems // Return full remote list for inspection
                }
            };
        } catch (e) {
            if (!current()) throw ACCOUNT_CHANGED;
            console.error("Audit error", e);
            throw e;
        }
    }
}

// Singleton stores registered on the same endpoint share one GET per sync round, and their first-load
// uploads go out together as one POST (the server merges the posted keys). The estate profile's
// stores go further and share one manager (SharedRecord, below).
const _sharedGets = new Map<string, Promise<unknown>>();
const _pendingUploads = new Map<string, { payload: Record<string, unknown>; waiters: { resolve: (v: unknown) => void; reject: (e: unknown) => void }[] }>();

function sharedGet(url: string, token: string): Promise<unknown> {
    const k = `${token}|${url}`;
    let p = _sharedGets.get(k);
    if (!p) {
        p = fetch(url, { headers: { 'Authorization': `Bearer ${token}` } }).then(res => {
            if (!res.ok) throw new Error("Failed to fetch remote data");
            return res.json();
        });
        _sharedGets.set(k, p);
        p.catch(() => {}).finally(() => _sharedGets.delete(k));
    }
    return p;
}

// Every store that read the same GET reaches this in the same microtask run, so a 0 ms timer
// collects all of them before the one POST is sent.
function sharedUpload(url: string, token: string, payload: Record<string, unknown>, owner: OperationOwner): Promise<unknown> {
    const k = `${owner.session.generation}|${owner.account}|${owner.profile}|${url}`;
    let batch = _pendingUploads.get(k);
    if (!batch) {
        const b = { payload: {} as Record<string, unknown>, waiters: [] as { resolve: (v: unknown) => void; reject: (e: unknown) => void }[] };
        batch = b;
        _pendingUploads.set(k, b);
        setTimeout(() => {
            _pendingUploads.delete(k);
            if (!currentOwner(owner)) { b.waiters.forEach(w => w.reject(ACCOUNT_CHANGED)); return; }
            token = sessionToken(owner.session)!;
            fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(b.payload)
            })
                .then(res => { if (!res.ok) throw new Error("Update failed"); return res.json(); })
                .then(raw => b.waiters.forEach(w => w.resolve(raw)), e => b.waiters.forEach(w => w.reject(e)));
        }, 0);
    }
    Object.assign(batch.payload, payload);
    const target = batch;
    return new Promise((resolve, reject) => target.waiters.push({ resolve, reject }));
}

const isEmptyRecord = (r: unknown) => !r || typeof r !== 'object' || Object.keys(r).length === 0;

type ProfileBatch = { key: string; sequence: number; owner: OperationOwner; payload: Record<string, unknown>; waiters: { resolve: () => void; reject: (e: unknown) => void }[] };
type RecoveredProfile = { key: string; sequence: number; payload: Record<string, unknown> };

/** What the shared record needs from each store that owns a slice of it. */
interface ProfileSlice {
    status: SyncStatus;
    error: string | null;
    hasLocalData(): boolean;
    wirePayloadOfData(): Record<string, unknown>;
    applyRemote(record: Record<string, unknown>): void;
    cacheRemoteFor(record: Record<string, unknown>, owner: OperationOwner): void;
    syncFailed(e: unknown): void;
}

/** One server record that several singleton stores share, each owning its own keys (estate/profile:
 *  estate, scenario, tone, onboarding, concierge, complexity). It is the one manager of that record:
 *  one GET per account per page session (stores that register later read what it holds), and one
 *  POST in flight at a time; saves made meanwhile wait and go together in the next POST (the server
 *  merges posted keys), so no response or reload can undo another store's save. */
class SharedRecord {
    private slices = new Set<ProfileSlice>();
    private server: Record<string, unknown> = {}; // the record as the server last returned it (camelCase)
    private queue: ProfileBatch[] = [];
    private sending: ProfileBatch | null = null;
    private inflight: Promise<void> | null = null;
    synced = false;
    epoch = 0;
    loadedFor: string | null = storageAccount();
    private loadedSession = captureSession().generation;
    private loadedProfile = get(currentProfileId) || 'owner';

    constructor(private url: string) {}

    private recoveryNotices = new Map<string, string>();
    private noticeIds = new Set<string>();
    private writeSequence = 0;
    private get recoveryKey() { return `record:${this.url}__account_recovery`; }
    /** A newer edit replaces only the fields it names, across every slice of this record. */
    private retained(owner: OperationOwner): RecoveredProfile[] {
        const pending = storedFor<RecoveredProfile[]>(this.recoveryKey, [], owner);
        const confirmed = storedFor<Record<string, number>>(this.recoveryKey + '__confirmed_fields', {}, owner);
        const latest = { ...confirmed };
        const note = (batch: Pick<ProfileBatch, 'sequence' | 'payload'>) => {
            for (const key of Object.keys(batch.payload)) latest[key] = Math.max(latest[key] || 0, batch.sequence);
        };
        pending.forEach(note);
        for (const batch of [this.sending, ...this.queue]) {
            if (batch && batch.owner.account === owner.account && batch.owner.profile === owner.profile) note(batch);
        }
        const left = pending.flatMap(p => {
            const payload = Object.fromEntries(Object.entries(p.payload).filter(([key]) =>
                (confirmed[key] || 0) < p.sequence && (latest[key] || 0) <= p.sequence));
            return Object.keys(payload).length ? [{ ...p, payload }] : [];
        });
        if (JSON.stringify(left) !== JSON.stringify(pending)) saveFor(this.recoveryKey, left, owner);
        if (currentOwner(owner)) {
            const keys = new Set(left.map(p => p.key));
            for (const [key, id] of this.recoveryNotices) if (!keys.has(key)) {
                notifications.dismiss(id);
                this.noticeIds.delete(id);
                this.recoveryNotices.delete(key);
            }
        }
        return left;
    }
    private remember(batch: ProfileBatch) {
        const pending = storedFor<RecoveredProfile[]>(this.recoveryKey, [], batch.owner);
        const confirmed = storedFor<Record<string, number>>(this.recoveryKey + '__confirmed_fields', {}, batch.owner);
        const payload = Object.fromEntries(Object.entries(batch.payload).filter(([k]) => (confirmed[k] || 0) < batch.sequence));
        if (Object.keys(payload).length) saveFor(this.recoveryKey, [...pending.filter(p => p.key !== batch.key), { key: batch.key, sequence: batch.sequence, payload }], batch.owner);
        this.retained(batch.owner);
    }
    private forget(batch: ProfileBatch) {
        const confirmed = storedFor<Record<string, number>>(this.recoveryKey + '__confirmed_fields', {}, batch.owner);
        for (const k of Object.keys(batch.payload)) confirmed[k] = Math.max(confirmed[k] || 0, batch.sequence);
        saveFor(this.recoveryKey + '__confirmed_fields', confirmed, batch.owner);
        this.retained(batch.owner);
    }
    offerRecovery(owner: OperationOwner, failedKey?: string, failure?: unknown) {
        const epoch = this.epoch;
        for (const pending of this.retained(owner)) {
            if (failedKey && pending.key !== failedKey) continue;
            if (this.recoveryNotices.has(pending.key)) continue;
            const id = notifications.showError({
                message: failedKey ? 'Your draft is kept. We can save it again whenever you\'re ready.'
                    : 'Your earlier profile changes are kept. Review your saved details, then choose Try Again to apply them.',
                code: 'DATABASE_ERROR',
                technicalDetails: failure ? errMessage(failure) || String(failure) : undefined
            }, () => {
                if (epoch !== this.epoch || !currentOwner(owner)) return;
                const remaining = this.retained(owner).find(p => p.key === pending.key);
                if (!remaining) return;
                this.write(remaining.payload, owner, pending.key).then(() => {
                    if (epoch === this.epoch && currentOwner(owner)) this.slices.forEach(s => s.applyRemote(this.current));
                }).catch(e => {
                    if (epoch === this.epoch && currentOwner(owner)) this.offerRecovery(owner, pending.key, e);
                });
            });
            this.recoveryNotices.set(pending.key, id);
            this.noticeIds.add(id);
        }
    }

    /** This record's place in the shared load notice. */
    private get noticeKey() { return `record:${this.url}`; }

    attach(slice: ProfileSlice) { this.slices.add(slice); }

    /** The server record with every save not yet confirmed laid over it. */
    get current(): Record<string, unknown> {
        const out = { ...this.server };
        for (const b of [this.sending, ...this.queue]) if (b) Object.assign(out, convertKeys(b.payload, toCamel));
        return out;
    }

    /** Account change (clear: logout). Retain earlier writes for explicit same-owner recovery. */
    reset(clear: boolean) {
        const account = clear ? null : storageAccount();
        const session = captureSession().generation;
        const profile = get(currentProfileId) || 'owner';
        if (!clear && this.loadedFor === account && this.loadedSession === session && this.loadedProfile === profile) return;
        for (const batch of [this.sending, ...this.queue]) if (batch) this.remember(batch);
        this.sending?.waiters.forEach(w => w.reject(ACCOUNT_CHANGED));
        this.sending = null;
        this.noticeIds.forEach(id => notifications.dismiss(id));
        this.noticeIds.clear();
        this.recoveryNotices.clear();
        this.epoch++;
        this.synced = false;
        this.inflight = null;
        loadAnswered(this.noticeKey);
        this.server = {};
        this.queue.splice(0).forEach(b => b.waiters.forEach(w => w.reject(ACCOUNT_CHANGED)));
        this.loadedFor = account;
        this.loadedSession = session;
        this.loadedProfile = profile;
    }

    /** Bring one store up to date: joins the session's single GET, or reads the record already held. */
    async syncSlice(slice: ProfileSlice) {
        if (this.loadedSession !== captureSession().generation) this.reset(false);
        this.attach(slice);
        if (!this.synced) return this.sync();
        // A store that registers after the first load and holds this device's earlier data uploads it
        // only while the account's record is still empty (as its own first load would have).
        if (isEmptyRecord(this.current) && slice.hasLocalData()) {
            const epoch = this.epoch;
            const owner = captureOwner();
            try { await this.write(slice.wirePayloadOfData(), owner); } catch (e) { if (e !== ACCOUNT_CHANGED && currentOwner(owner)) slice.syncFailed(e); return; }
            if (epoch !== this.epoch || !currentOwner(owner)) return;
        }
        slice.applyRemote(this.current);
    }

    private sync(): Promise<void> {
        if (this.inflight) return this.inflight;
        const p: Promise<void> = this.run(this.epoch).finally(() => { if (this.inflight === p) this.inflight = null; });
        this.inflight = p;
        return p;
    }

    private async run(epoch: number) {
        const owner = captureOwner();
        const token = sessionToken(owner.session);
        if (!token) { this.slices.forEach(s => { s.status = "idle"; }); return; }
        this.slices.forEach(s => { s.status = "syncing"; s.error = null; });
        let answered = false; // the server returned the record (a later failure is an upload's)
        try {
            const res = await fetch(this.url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error("Failed to fetch remote data");
            const raw = await res.json();
            if (epoch !== this.epoch || !currentOwner(owner)) return; // account changed mid-flight
            answered = true;
            loadAnswered(this.noticeKey);
            this.server = convertKeys(raw, toCamel) || {};

            // First load of an empty account: every store's own device data goes up in one POST
            // (quietly; a store holding only its mapper's defaults sends nothing).
            if (isEmptyRecord(raw)) {
                const upload: Record<string, unknown> = {};
                this.slices.forEach(s => { if (s.hasLocalData()) Object.assign(upload, s.wirePayloadOfData()); });
                if (!isEmptyRecord(upload)) {
                    console.log(`[Sync:${this.url}] Migrating local profile to cloud...`);
                    await this.write(upload, owner);
                    if (epoch !== this.epoch || !currentOwner(owner)) return;
                }
            }
            this.synced = true;
            const current = this.current;
            this.slices.forEach(s => s.applyRemote(current));
            this.offerRecovery(owner);
        } catch (e: unknown) {
            if (e === ACCOUNT_CHANGED || epoch !== this.epoch || !currentOwner(owner)) return;
            this.slices.forEach(s => s.syncFailed(e));
            // The first read of the record did not answer: each store keeps its device copy, and the
            // shared notice (one for every store) offers to load it again.
            if (!answered && currentOwner(owner)) {
                loadFailed(this.noticeKey, () => { if (currentOwner(owner)) this.sync().catch(() => {}); }, errTechnical(e));
            }
        }
    }

    /** Queue only within the session/account that initiated these profile changes. */
    write(payload: Record<string, unknown>, owner: OperationOwner = captureOwner(), recoveryId?: string): Promise<void> {
        if (!currentOwner(owner)) return Promise.reject(ACCOUNT_CHANGED);
        const recovered = storedFor<RecoveredProfile[]>(this.recoveryKey, [], owner);
        const confirmed = storedFor<Record<string, number>>(this.recoveryKey + '__confirmed_fields', {}, owner);
        this.writeSequence = Math.max(this.writeSequence, ...recovered.map(p => p.sequence), ...Object.values(confirmed)) + 1;
        let b = this.queue[this.queue.length - 1];
        if (!b || b.owner.session.generation !== owner.session.generation || !sameNamespace(b.owner) || recoveryId) {
            b = { key: recoveryId || crypto.randomUUID(), sequence: this.writeSequence, owner, payload: {}, waiters: [] };
            this.queue.push(b);
        }
        b.sequence = this.writeSequence;
        Object.assign(b.payload, cloneData(payload));
        this.retained(owner);
        const batch = b;
        const done = new Promise<void>((resolve, reject) => batch.waiters.push({ resolve, reject }));
        this.pump();
        return done;
    }

    private pump() {
        if (this.sending || this.queue.length === 0) return;
        const b = this.queue.shift()!;
        if (!currentOwner(b.owner)) {
            this.remember(b);
            b.waiters.forEach(w => w.reject(ACCOUNT_CHANGED));
            this.pump();
            return;
        }
        this.sending = b;
        const epoch = this.epoch;
        fetch(this.url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sessionToken(b.owner.session)}` },
            body: JSON.stringify(b.payload)
        })
            .then(res => { if (!res.ok) throw new Error("Update failed"); return res.json(); })
            .then(raw => {
                const saved = convertKeys<Record<string, unknown>>(raw, toCamel) || {};
                this.forget(b);
                if (epoch !== this.epoch || !currentOwner(b.owner)) {
                    this.slices.forEach(s => s.cacheRemoteFor(saved, b.owner));
                    b.waiters.forEach(w => w.reject(ACCOUNT_CHANGED));
                } else {
                    this.server = saved;
                    b.waiters.forEach(w => w.resolve());
                }
            }, e => {
                this.remember(b);
                const failure = epoch === this.epoch && currentOwner(b.owner) ? identifiedFailure(e, b.key) : ACCOUNT_CHANGED;
                b.waiters.forEach(w => w.reject(failure));
            })
            .finally(() => {
                if (this.sending === b) this.sending = null;
                this.pump();
            });
    }

}

/** Singleton stores whose page reports its own failed load (pulse settings: a page notice with its
 *  own Try Again), so the shared notice leaves them out and that page shows one notice. */
const OWN_LOAD_NOTICE = new Set(['pulse_settings']);

const _sharedRecords = new Map<string, SharedRecord>();
function sharedRecord(url: string) {
    let r = _sharedRecords.get(url);
    if (!r) { r = new SharedRecord(url); _sharedRecords.set(url, r); }
    return r;
}

export class SingletonSyncManager<T extends object> {
    #data = $state<T | null>(null);
    /** See SyncManager.items. */
    get data(): T | null { shownBy(this); return this.#data; }
    set data(value: T | null) { this.#data = value; }
    #status = $state<SyncStatus>("idle");
    /** See lastSync: a shown sync status marks the store shown too. */
    get status(): SyncStatus { shownBy(this); return this.#status; }
    set status(value: SyncStatus) { this.#status = value; }
    #lastSync = $state<Date | null>(null);
    /** When the server last answered; reading it (a "loaded yet?" cue) also marks the store shown. */
    get lastSync(): Date | null { shownBy(this); return this.#lastSync; }
    set lastSync(value: Date | null) { this.#lastSync = value; }
    error = $state<string | null>(null);
    private subscriptions = new Set<(value: T | null) => void>();
    private affirmationContext?: AffirmationContext;

    private key: string;
    private endpoint: string;
    private mapper?: (local: Record<string, unknown>) => T;
    private apiBase: string;
    /** Set when this store is one slice of a record other stores share (see SharedRecord). */
    private record?: SharedRecord;

    constructor(key: string, endpoint: string, mapper?: (local: Record<string, unknown>) => T, apiBase: string = "/api", shared = false) {
        this.key = key;
        this.endpoint = endpoint;
        this.mapper = mapper;
        this.apiBase = apiBase;
        if (shared) {
            this.record = sharedRecord(`${BASE_URL}${apiBase}/${endpoint}`);
            this.record.attach(this);
        }

        // Load Initial & Map legacy local data if needed
        const raw = getStored<T>(key, {} as T);
        this.data = mapper ? mapper(raw as Record<string, unknown>) : raw;
        this.loadedFor = storageAccount();
        this.standaloneBase = this.data;
    }

    /**
     * Set the affirmation context for this sync manager.
     * When set, successful update operations will show affirmations.
     */
    setAffirmationContext(context: AffirmationContext) {
        this.affirmationContext = context;
        return this;
    }

    private inflight: Promise<void> | null = null;
    /** See SyncManager.loadedFor. */
    loadedFor: string | null = null;

    private generation = 0;
    // Standalone APIs scope the record by account (profiles only namespace cache).
    // Another account proceeds independently; returning accounts wait on their own request.
    private writeTails = new Map<string, Promise<void>>();
    private confirmedBases = new Map<string, T>();
    private pendingWrites = new Map<number, Partial<T>>();
    private writeSequence = 0;
    private baseRevision = 0;
    private standaloneBase: T | null = null;
    private applyStandalone() {
        let visible = { ...(this.standaloneBase || {}) } as T;
        for (const patch of this.pendingWrites.values()) visible = { ...visible, ...patch };
        this.data = visible;
        setStored(this.key, visible);
        this.notify();
    }
    private activeWrites = new Map<string, { owner: OperationOwner; key: string; data: Partial<T>; quiet: boolean }>();
    private operationNotices = new Set<string>();
    private recoveryNotices = new Set<string>();
    // Preserve namespace-scoped releases across reset so a late failed request
    // cannot restore an explicitly superseded draft.
    private releasedRecoveries = new Set<string>();
    private writeNotices = new Map<string, string>();
    private recoveryIdentity(owner: OperationOwner, key: string) { return JSON.stringify([owner.account, owner.profile, key]); }
    private released(owner: OperationOwner, key: string) { return this.releasedRecoveries.has(this.recoveryIdentity(owner, key)); }
    private trackNotice(key: string, id: string) {
        const old = this.writeNotices.get(key);
        if (old) { notifications.dismiss(old); this.operationNotices.delete(old); }
        this.writeNotices.set(key, id);
        this.operationNotices.add(id);
    }
    private get recoveryKey() { return `${this.key}__account_recovery`; }
    private remember(write: { owner: OperationOwner; key: string; data: Partial<T>; quiet: boolean }) {
        if (this.released(write.owner, write.key)) return;
        const saved = storedFor<{ key: string; data: Partial<T>; quiet: boolean }[]>(this.recoveryKey, [], write.owner);
        saveFor(this.recoveryKey, [...saved.filter(p => p.key !== write.key), { key: write.key, data: write.data, quiet: write.quiet }], write.owner);
    }
    private forget(owner: OperationOwner, key: string) {
        this.activeWrites.delete(key);
        this.releasedRecoveries.add(this.recoveryIdentity(owner, key));
        const notice = this.writeNotices.get(key);
        if (notice) { notifications.dismiss(notice); this.operationNotices.delete(notice); this.writeNotices.delete(key); }
        const saved = storedFor<{ key: string; data: Partial<T>; quiet: boolean }[]>(this.recoveryKey, [], owner);
        if (saved.some(p => p.key === key)) saveFor(this.recoveryKey, saved.filter(p => p.key !== key), owner);
    }
    /** Release only the caller's exact completed or superseded standalone draft. */
    releaseRecovery(recoveryId: string, owner: SessionOwnership = captureSession()): void {
        if (!isCurrentSession(owner) || this.record) return;
        this.forget(captureOwner(), recoveryId);
    }
    private offerRecovery(owner: OperationOwner) {
        for (const saved of storedFor<{ key: string; data: Partial<T>; quiet: boolean }[]>(this.recoveryKey, [], owner)) {
            if (this.recoveryNotices.has(saved.key) || this.released(owner, saved.key)) continue;
            this.recoveryNotices.add(saved.key);
            this.trackNotice(saved.key, notifications.showError({
                message: 'Your earlier changes are kept. Review your saved details, then choose Try Again to apply them.',
                code: 'DATABASE_ERROR'
            }, () => { if (currentOwner(owner) && !this.released(owner, saved.key)) this.update(saved.data, saved.quiet, saved.key).catch(() => {}); }));
        }
    }

    /** Account change: see SyncManager.reset. */
    reset(clear = false) {
        this.activeWrites.forEach(write => this.remember(write));
        this.activeWrites.clear();
        this.pendingWrites.clear();
        this.baseRevision++;
        this.operationNotices.forEach(id => notifications.dismiss(id));
        this.operationNotices.clear();
        this.recoveryNotices.clear();
        this.writeNotices.clear();
        this.generation++;
        this.inflight = null;
        loadAnswered(this.noticeKey);
        this.record?.reset(clear);
        this.loadedFor = clear ? null : storageAccount();
        const raw = clear ? ({} as T) : getStored<T>(this.key, {} as T);
        this.data = this.mapper ? this.mapper(raw as Record<string, unknown>) : raw;
        this.standaloneBase = this.data;
        this.status = "idle";
        this.error = null;
        this.lastSync = null;
        this.notify();
    }

    async init() {
        await this.sync();
    }

    /** This store's place in the shared load notice (prefixed: list stores use their bare key). */
    private get noticeKey() { return `one:${this.key}`; }

    sync(): Promise<void> {
        if (this.record) return this.record.syncSlice(this);
        if (this.inflight) return this.inflight;
        const p: Promise<void> = this.runSync().finally(() => { if (this.inflight === p) this.inflight = null; });
        this.inflight = p;
        return p;
    }

    private async runSync() {
        const owner = captureOwner();
        const generation = this.generation;
        const current = () => generation === this.generation && currentOwner(owner);
        if (!current()) return;
        this.status = "syncing";
        this.error = null;
        const token = sessionToken(owner.session);
        const revision = this.baseRevision;
        let answered = false; // the server returned the record (a later failure is an upload's)
        try {
            if (!token) { this.status = "idle"; return; }

            const url = `${BASE_URL}${this.apiBase}/${this.endpoint}`;
            const raw = await sharedGet(url, token);
            if (!current()) return; // account changed mid-flight
            answered = true;
            loadAnswered(this.noticeKey);
            const remoteDataRaw = convertKeys(raw, toCamel);
            const remoteData = this.mapper ? this.mapper(remoteDataRaw) : remoteDataRaw as unknown as T;

            // Simple migration: if remote is empty but this device holds real data, upload it
            // (quietly: background bookkeeping, no affirmation).
            const isRemoteEmpty = !remoteDataRaw || Object.keys(remoteDataRaw).length === 0; // raw: a mapper may add defaults

            if (revision !== this.baseRevision) {
                // A write answered after this read began; its newer confirmed base wins.
                this.offerRecovery(owner);
                return;
            }
            const namespace = owner.account;
            const retained = storedFor<unknown[]>(this.recoveryKey, [], owner).length > 0;
            if (isRemoteEmpty && this.hasLocalData() && this.pendingWrites.size === 0 && !this.writeTails.has(namespace) && !retained) {
                console.log(`[Sync:${this.key}] Migrating local singleton to cloud...`);
                await this.update(this.data!, true);
                if (!current()) return;
            } else {
                this.confirmedBases.set(owner.account, remoteData);
                this.standaloneBase = remoteData;
                this.baseRevision++;
                this.applyStandalone();
            }

            this.status = this.pendingWrites.size ? "syncing" : "synced";
            this.lastSync = new Date();
            this.offerRecovery(owner);
        } catch (e: unknown) {
            if (!current() || revision !== this.baseRevision) return;
            console.error(`[Sync:${this.key}] Error:`, e);
            this.status = "error";
            this.error = errMessage(e) ?? null;
            // First read failed: the shared notice offers to load it again (see SyncManager.runSync),
            // unless this store's page shows its own notice for it.
            if (!answered && !this.#lastSync && token && current() && !OWN_LOAD_NOTICE.has(this.key)) {
                loadFailed(this.noticeKey, () => { if (current()) this.sync().catch(() => {}); }, errTechnical(e));
            }
        }
    }

    /** True when the raw device copy (before mapping) holds more than the mapper's defaults:
     *  a mapper fills defaults, and defaults are never uploaded. */
    hasLocalData(): boolean {
        const stored = getStored<Record<string, unknown> | null>(this.key, null);
        if (!stored || typeof stored !== 'object' || Object.keys(stored).length === 0) return false;
        if (!this.mapper) return true;
        return JSON.stringify(this.mapper(stored)) !== JSON.stringify(this.mapper({}));
    }

    /** wirePayload of the data this store holds now. */
    wirePayloadOfData(): Record<string, unknown> { return this.wirePayload(this.data as T); }

    /** The record as sent: mapped, snake_case, without the fields the server owns. */
    wirePayload(data: T): Record<string, unknown> {
        const payload = convertKeys(this.mapper ? this.mapper(data as Record<string, unknown>) : data, toSnake);
        // Server-owned fields; the server rejects them (422) if sent back.
        if (payload && typeof payload === 'object') {
            for (const k of ['id', 'user_id', 'created_at', 'updated_at']) delete payload[k];
        }
        return payload;
    }

    /** Shared record: the server's copy arrived (or was already held); take this store's slice. */
    applyRemote(record: Record<string, unknown>) {
        this.updateLocal((this.mapper ? this.mapper(record) : record) as T);
        this.status = "synced";
        this.error = null;
        this.lastSync = new Date();
    }

    /** Keep an earlier account's confirmed profile response out of the active store. */
    cacheRemoteFor(record: Record<string, unknown>, owner: OperationOwner) {
        const saved = (this.mapper ? this.mapper(record) : record) as T;
        saveFor(this.key, saved, owner);
    }

    syncFailed(e: unknown) {
        console.error(`[Sync:${this.key}] Error:`, e);
        this.status = "error";
        this.error = errMessage(e) || String(e);
    }

    // quiet: a background write — no affirmation, failures go to the console only.
    async update(newData: Partial<T>, quiet = false, recoveryId?: string) {
        const owner = captureOwner();
        const generation = this.generation;
        const current = () => generation === this.generation && currentOwner(owner);
        if (!current()) throw ACCOUNT_CHANGED;
        newData = cloneData(newData);
        const operation = { owner, key: recoveryId || crypto.randomUUID(), data: newData, quiet };
        const original = this.data;
        if (this.record) {
            this.status = "syncing";
            this.error = null;
            this.data = { ...(this.data || {} as T), ...newData } as T;
            setStored(this.key, this.data);
            this.notify();
            return this.updateShared(newData, original, quiet, owner, generation);
        }
        if (this.released(owner, operation.key)) throw identifiedFailure(new Error('This earlier draft was superseded'), operation.key);
        this.activeWrites.set(operation.key, operation);
        const sequence = ++this.writeSequence;
        this.pendingWrites.set(sequence, newData);
        this.status = "syncing";
        this.error = null;
        this.applyStandalone();

        const namespace = owner.account;
        const before = this.writeTails.get(namespace) || Promise.resolve();
        let settled!: () => void;
        const tail = new Promise<void>(resolve => { settled = resolve; });
        this.writeTails.set(namespace, tail);
        let confirmed: T | undefined;
        try {
            await before;
            if (!current()) throw ACCOUNT_CHANGED;
            if (this.released(owner, operation.key)) throw identifiedFailure(new Error('This earlier draft was superseded'), operation.key);
            const token = sessionToken(owner.session);
            // Earlier responses and later optimistic patches never become this save's
            // input accidentally. Only the confirmed base plus this explicit patch goes out.
            const payload = this.wirePayload({ ...(this.confirmedBases.get(owner.account) || this.standaloneBase || {}), ...newData } as T);
            const res = await writeFetch(`${BASE_URL}${this.apiBase}/${this.endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Update failed");
            const savedRaw = convertKeys(await res.json(), toCamel);
            const saved = this.mapper ? this.mapper(savedRaw) : savedRaw as unknown as T;
            confirmed = saved;
            this.confirmedBases.set(owner.account, saved);
            if (!current()) {
                if (sameNamespace(owner) && isCurrentSession(captureSession())) {
                    // The same account returned while its old request was settling.
                    // Its new writes wait on this tail and retain their optimistic fields.
                    this.standaloneBase = saved;
                    this.baseRevision++;
                    this.applyStandalone();
                } else saveFor(this.key, saved, owner);
                this.forget(owner, operation.key);
                throw ACCOUNT_CHANGED;
            }
            this.pendingWrites.delete(sequence);
            this.standaloneBase = saved;
            this.baseRevision++;
            this.applyStandalone();
            this.status = this.pendingWrites.size ? "syncing" : "synced";
            this.error = null;
            this.lastSync = new Date();
            if (this.affirmationContext && !quiet && !this.released(owner, operation.key)) {
                notifications.showAffirmation(this.affirmationContext, 'update');
            }
            this.forget(owner, operation.key);
            return saved;
        } catch (e) {
            if (!current()) {
                if (!confirmed) this.remember(operation);
                throw identifiedFailure(ACCOUNT_CHANGED, operation.key);
            }
            this.pendingWrites.delete(sequence);
            this.applyStandalone();
            this.status = this.pendingWrites.size ? "syncing" : this.released(owner, operation.key) ? "idle" : "error";
            this.error = this.pendingWrites.size || this.released(owner, operation.key) ? null : errMessage(e) || "Failed to save";
            if (this.released(owner, operation.key)) throw identifiedFailure(e, operation.key);
            console.error(`[Sync:${this.key}] Update failed, retaining newer changes`, e);
            if (quiet) { this.activeWrites.delete(operation.key); throw identifiedFailure(e, operation.key); }
            this.trackNotice(operation.key, notifications.showError({
                message: 'Your draft is kept. We can save it again whenever you\'re ready.',
                code: 'DATABASE_ERROR',
                technicalDetails: errMessage(e) || String(e)
            }, () => { if (current() && !this.released(owner, operation.key)) this.update(newData, quiet, operation.key).catch(() => {}); }));
            throw identifiedFailure(e, operation.key);
        } finally {
            settled();
            if (this.writeTails.get(namespace) === tail) this.writeTails.delete(namespace);
        }
    }

    /** A save into the shared record: only the keys this save changed are sent, so it never
     *  rewrites a key with a value this device read before another save. */
    private async updateShared(newData: Partial<T>, original: T | null, quiet: boolean, owner: OperationOwner, generation: number) {
        const record = this.record!;
        const epoch = record.epoch;
        const full = this.wirePayload(this.data!);
        const changed = new Set(Object.keys(newData).map(toSnake));
        const payload: Record<string, unknown> = {};
        for (const k of Object.keys(full || {})) if (changed.has(k)) payload[k] = full[k];
        try {
            await record.write(isEmptyRecord(payload) ? full : payload, owner);
            if (epoch !== record.epoch || generation !== this.generation || !currentOwner(owner)) throw ACCOUNT_CHANGED; // signed out or switched account meanwhile
            const saved = (this.mapper ? this.mapper(record.current) : record.current) as T;
            this.updateLocal(saved);
            this.status = "synced";
            this.lastSync = new Date();
            if (this.affirmationContext && !quiet) notifications.showAffirmation(this.affirmationContext, 'update');
            return saved;
        } catch (e) {
            if (e === ACCOUNT_CHANGED || epoch !== record.epoch || generation !== this.generation || !currentOwner(owner)) throw ACCOUNT_CHANGED;
            console.error(`[Sync:${this.key}] Update failed, rolling back`, e);
            // Back to what the server holds, keeping saves still waiting to be sent.
            const rolled = (this.mapper ? this.mapper(record.current) : { ...(original || {}), ...record.current }) as T;
            this.updateLocal(rolled);
            this.status = "error";
            this.error = (e as { message?: string } | null)?.message || "Failed to save";
            if (quiet) throw e;
            // The shared batch owns its notice. A retry reads its remaining fields at click
            // time instead of replaying this slice's older captured patch over newer saves.
            const failedKey = (e as SaveFailure).recoveryId;
            if (failedKey) record.offerRecovery(owner, failedKey, e);
            throw e;
        }
    }

    /** Set the device copy only (no server call). */
    updateLocal(data: T) {
        if (!this.record) { this.standaloneBase = data; this.baseRevision++; }
        this.data = data;
        setStored(this.key, data);
        this.notify();
    }

    subscribe(run: (value: T | null) => void) {
        shownBy(this, true);
        run(this.data);
        this.subscriptions.add(run);
        return () => this.subscriptions.delete(run);
    }

    private notify() {
        this.subscriptions.forEach(run => run(this.data));
    }
}

import { browser } from '$app/environment';

// Helper Class to validly use Runes
class RegistryContainer {
    data = $state<Record<string, SyncManager<{ id: number | string }>>>({});
}

// Internal singleton reference
let _container: RegistryContainer | undefined;
let _plainRegistry: Record<string, SyncManager<{ id: number | string }>> = {};

// True once a signed-in session has started syncing. Stores registered after that point
// (lazily loaded modules) fetch themselves as soon as they are created.
let _sessionActive = false;

export function getRegistry() {
    if (browser) {
        if (!_container) {
            _container = new RegistryContainer();
        }
        return _container.data;
    }
    // SSR Fallback
    return _plainRegistry;
}

function registerManager<M extends { sync(): Promise<void> }>(key: string, endpoint: string, apiBase: string | undefined, make: () => M): M {
    const reg = getRegistry() as unknown as Record<string, (M & { endpoint?: string; apiBase?: string }) | undefined>;
    const existing = reg[key];
    if (existing) {
        // One owner per key: a second registration must describe the same endpoint.
        if (existing.endpoint !== endpoint || (apiBase !== undefined && existing.apiBase !== apiBase)) {
            console.warn(`[Sync] "${key}" is already registered for ${existing.apiBase}/${existing.endpoint}; ignoring ${apiBase ?? ''}/${endpoint}`);
        }
        return existing;
    }
    const manager = make();
    reg[key] = manager;
    if (browser && _sessionActive) manager.sync().catch(() => {});
    return manager;
}

export function registerSync<T extends { id: number | string }>(key: string, endpoint: string, mapper?: (local: Record<string, unknown>) => NoInfer<T>, apiBase?: string) {
    return registerManager(key, endpoint, apiBase, () => new SyncManager<T>(key, endpoint, mapper, apiBase));
}

export function registerSingletonSync<T extends object>(key: string, endpoint: string, mapper?: (local: Record<string, unknown>) => NoInfer<T>, apiBase?: string) {
    return registerManager(key, endpoint, apiBase, () => new SingletonSyncManager<T>(key, endpoint, mapper, apiBase)) as unknown as SingletonSyncManager<T>;
}

/** A store that owns some keys of the one estate profile record (/api/estate/profile). Every such
 *  store reads and writes its slice through that record's single manager (SharedRecord). */
export function registerProfileSlice<T extends object>(key: string, mapper: (data: Record<string, unknown>) => T) {
    return registerManager(key, 'estate/profile', '/api', () => new SingletonSyncManager<T>(key, 'estate/profile', mapper, '/api', true)) as unknown as SingletonSyncManager<T>;
}

// Stores something on screen has read (a template, derived value or effect), and the stores
// syncAll left for later. At session start a store the page shows is fetched at once; the rest
// follow a moment after those have answered, one at a time while the browser is idle, and any of
// them is fetched at once when something starts showing it.
const _shown = new WeakSet<object>();
const _later = new Set<{ sync(): Promise<void>; lastSync?: Date | null }>();
// Stores marked onDemand: fetched only when something starts showing them (or `everything`).
const _onDemand = new Set<{ sync(): Promise<void> }>();
let _sessionRun = 0;
/** How long the page's own stores have the network to themselves before the rest begin. */
const REST_AFTER_MS = 2000;

function shownBy(m: { sync(): Promise<void> }, subscribed = false) {
    // A `$store` subscription is made untracked by Svelte, so a subscriber counts without the tracking check.
    if (!browser || (!subscribed && !$effect.tracking())) return;
    _shown.add(m);
    // Out of the read: a sync sets state, which a template or derived value may not do.
    if (_later.delete(m) || _onDemand.delete(m)) queueMicrotask(() => { m.sync().catch(() => {}); });
}

const whenIdle = () => new Promise<void>(resolve => {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(() => resolve(), { timeout: 2000 });
    else setTimeout(resolve, 50);
});

/** Signed-in session start (or account switch): a store holding another account's records (or
 *  none, after logout) reloads from the active account's; then every store fetches from the server,
 *  the ones the page shows first (see shownBy). A store already on this account keeps its records
 *  and any sync it is running: sync() joins that run, so a page's onMount sync and this call
 *  migrate local records up once, not twice. `everything`: a page that shows every module (the
 *  dashboard, whose cards appear only once its first stores answer) fetches them all at once. */
export function syncAll({ everything = false }: { everything?: boolean } = {}) {
    return untrack(() => {
        _sessionActive = true;
        _later.clear();
        _onDemand.clear();
        const run = ++_sessionRun;
        const started = Date.now();
        const account = storageAccount();
        const managers = Object.values(getRegistry());
        managers.forEach(m => { if (m.loadedFor !== account) m.reset(false); });
        const now = managers.filter(m => everything || _shown.has(m) || m.status === 'syncing');
        managers.forEach(m => {
            if (now.includes(m)) return;
            if ((m as { onDemand?: boolean }).onDemand) _onDemand.add(m); else _later.add(m);
        });
        const first = Promise.allSettled(now.map(m => m.sync()));
        // The rest; one that answered since this call began (a page synced it) is done.
        const rest = first.then(async () => {
            await new Promise(r => setTimeout(r, REST_AFTER_MS));
            while (run === _sessionRun && _later.size > 0) {
                await whenIdle();
                if (run !== _sessionRun) break;
                const m = _later.values().next().value;
                if (!m) break;
                _later.delete(m);
                if (!(m.lastSync && m.lastSync.getTime() >= started)) await m.sync().catch(() => {});
            }
        });
        return Promise.allSettled([first, rest]);
    });
}

// The active account becoming known (or changing) points every store at that account's records
// before anything syncs. A store created before the account was known says 'anonymous'; left so,
// syncAll would take the account's arrival for a switch and reset the store under the page's
// running sync (a second fetch, and a first upload sent twice). A store cleared by logout (null)
// is left for syncAll.
if (browser) {
    activeAccountId.subscribe(id => {
        if (!id) return;
        Object.values(getRegistry()).forEach(m => {
            if (m.loadedFor !== null && m.loadedFor !== id) m.reset(false);
        });
    });
    let profile = get(currentProfileId) || 'owner';
    currentProfileId.subscribe(id => {
        const next = id || 'owner';
        if (next === profile) return;
        profile = next;
        Object.values(getRegistry()).forEach(m => m.reset(false));
        // Profiles still use this user's server estate; only the device namespace changes.
        if (_sessionActive && isCurrentSession(captureSession())) void syncAll();
    });
}

/** Logout: forget every in-memory record so the next account never sees them. */
export function clearAll() {
    _sessionActive = false;
    _sessionRun++;
    _later.clear();
    _onDemand.clear();
    Object.values(getRegistry()).forEach(m => m.reset(true));
}
