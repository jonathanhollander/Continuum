import { getStored, setStored } from "$lib/stores/persistence";
import { API_BASE_URL } from "$lib/config";

import { auth } from "../stores/auth.ts";
import { activeAccountId } from "$lib/stores/keyringStore";
import { currentProfileId } from "$lib/stores/profileContext";
import { get } from "svelte/store";
import { notifications } from "$lib/stores/notificationStore";

const toCamel = (str: string) => str.replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', ''));
const toSnake = (str: string) => str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

// Values of these keys are user data (JSON text or objects with user-chosen keys):
// never case-convert anything inside them.
// funeral_data and advanced_assets keep their maps/lists as JSON text, read back unconverted.
const VERBATIM_VALUE_KEYS = new Set([
    'custom_attributes', 'customAttributes', 'setupStatus', 'fireDrill',
    'wishes', 'budget', 'transactions', 'maintenance', 'claims',
]);

const convertKeys = (obj: any, converter: (s: string) => string): any => {
    if (obj === null || typeof obj !== 'object' || obj instanceof Date || obj instanceof Blob) return obj;
    if (Array.isArray(obj)) return obj.map(i => convertKeys(i, converter));

    const newObj: any = {};
    Object.keys(obj).forEach(key => {
        newObj[converter(key)] = VERBATIM_VALUE_KEYS.has(key) ? obj[key] : convertKeys(obj[key], converter);
    });
    return newObj;
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

const toWire = (obj: any): any => {
    const out = convertKeys(obj, toWireKey);
    for (const k of JSON_TEXT_WIRE_KEYS) {
        if (out && out[k] !== null && typeof out[k] === 'object') out[k] = JSON.stringify(out[k]);
    }
    return out;
};

// Use centralized config for API base URL (fixes dev mode sync issue)
const BASE_URL = API_BASE_URL;

// The account whose saved records a store currently holds (the getStored namespace).
const storageAccount = () => get(activeAccountId) || 'anonymous';

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

export class SyncManager<T extends { id: number | string }> {
    items = $state<T[]>([]);
    status = $state<SyncStatus>("idle");
    lastSync = $state<Date | null>(null);
    error = $state<string | null>(null);

    private key: string;
    private endpoint: string;
    private mapper?: (local: any) => T;
    private apiBase: string;
    private subscriptions = new Set<(value: T[]) => void>();
    private affirmationContext?: 'general' | 'documents' | 'wishes' | 'contacts' | 'medical' | 'pets' | 'insurance' | 'funeral' | 'subscriptions' | 'heirlooms' | 'timeline' | 'letters' | 'timeCapsule' | 'pulse';

    constructor(key: string, endpoint: string, mapper?: (local: any) => T, apiBase: string = "/api/data") {
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
    setAffirmationContext(context: 'general' | 'documents' | 'wishes' | 'contacts' | 'medical' | 'pets' | 'insurance' | 'funeral' | 'subscriptions' | 'heirlooms' | 'timeline' | 'letters' | 'timeCapsule' | 'pulse') {
        this.affirmationContext = context;
        return this;
    }

    subscribe(run: (value: T[]) => void) {
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
    /** The current local-to-server upload; reset() leaves it, so the next one waits for it to stop. */
    private uploading: Promise<unknown> = Promise.resolve();
    /** Account whose records are loaded; null after a logout clear. */
    loadedFor: string | null = null;

    /** Account change: drop this manager's in-memory records. clear=true (logout) leaves storage alone;
     *  otherwise reload the records saved for the now-active account. */
    reset(clear = false) {
        this.inflight = null; // a sync still running belongs to the previous account
        this.generation++;
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
        this.status = "syncing";
        this.error = null;

        // CRITICAL: Capture local state BEFORE any async operations
        // This prevents race conditions where reactive $state gets updated
        // before we can check for migration eligibility
        const localItemsSnapshot = [...this.items];
        const generation = this.generation;
        const account = storageAccount();
        const profile = get(currentProfileId) || 'owner';
        // Still the account (and the run) this sync started for.
        const current = () => this.generation === generation && storageAccount() === account && !!get(auth).token;

        try {
            // Fetch Remote
            const token = get(auth).token;
            if (!token) {
                console.warn(`[Sync:${this.key}] No auth token, skipping sync`);
                return;
            }

            const res = await fetch(`${BASE_URL}${this.apiBase}/${this.endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch remote data");

            const rawItems: any[] = await res.json();
            // The account changed while this was in flight: these records belong to someone else.
            if (get(auth).token !== token) return;
            const remoteItems = rawItems.map(item => {
                const camelItem = convertKeys(item, toCamel);
                return this.mapper ? this.mapper(camelItem) : camelItem;
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
                    if (get(auth).token !== token) return;
                    const wrapped2 = raw2.map((i: any) => {
                        const camel = convertKeys(i, toCamel);
                        return this.mapper ? this.mapper(camel) : camel;
                    });
                    this.updateLocal(wrapped2);
                }
            } else {
                // Standard Mirror (Down-Sync) - Server is Truth
                this.updateLocal(remoteItems);
            }

            this.status = "synced";
            this.lastSync = new Date();
        } catch (e: any) {
            console.error(`[Sync:${this.key}] Error:`, e);
            this.status = "error";
            this.error = e.message;
        }
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
        const save = () => setStored(this.uploadKey, left, profile, account);
        save();
        while (left.length > 0) {
            if (!sameAccount()) return false;
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
        const payloadRaw = this.mapper ? this.mapper(data as any) : data;
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
            const error = new Error("Failed to save") as any;
            error.technicalDetails = `${errorDetail}\n\nEndpoint: POST ${this.apiBase}/${this.endpoint}`;
            throw error;
        }

        const raw = await res.json();
        const newItemRaw = convertKeys(raw, toCamel);
        return this.mapper ? this.mapper(newItemRaw) : newItemRaw;
    }

    // CRUD
    // quiet: background bookkeeping (activity log). Failures are logged to the console only,
    // never shown to the user, and never change this manager's status.
    async create(data: Partial<T>, skipLocal = false, quiet = false, onRetry?: () => Promise<unknown>) {
        if (!quiet && !skipLocal) { this.status = "syncing"; this.error = null; }
        try {
            const newItem = await this.post(data, get(auth).token);

            if (!skipLocal) {
                this.items = [...this.items, newItem];
                setStored(this.key, this.items);
                const sentIds = getStored<string[] | null>(this.sentKey, null);
                if (sentIds) setStored(this.sentKey, [...sentIds, String(newItem.id)]);
                this.notify();

                // Affirm only a save the person made (quiet = background bookkeeping).
                if (this.affirmationContext && !quiet) {
                    notifications.showAffirmation(this.affirmationContext);
                }
            }
            if (!quiet && !skipLocal) { this.status = "synced"; this.lastSync = new Date(); }
            return newItem;
        } catch (e: any) {
            console.error("Create failed", e);
            if (quiet) throw e;
            if (!skipLocal) { this.status = "error"; this.error = e?.message || "Failed to save"; }
            // One gentle message. Nothing was added locally, so the caller's draft is untouched.
            notifications.showError({
                message: 'We couldn\'t save that just yet. Your words are still here \u2014 try again when you\'re ready.',
                code: 'DATABASE_ERROR',
                technicalDetails: e.technicalDetails || e.message || String(e)
            } as any, () => { (onRetry ? onRetry() : this.create(data, skipLocal)).catch(() => {}); });
            throw e;
        }
    }

    async update(idOrData: T | number | string, partialData?: Partial<T>) {
        let id: number | string;
        let updates: Partial<T>;

        if (typeof idOrData === 'object' && idOrData !== null) {
            id = idOrData.id;
            updates = idOrData;
        } else {
            id = idOrData;
            updates = partialData || {};
        }

        // Optimistic Update
        const original = [...this.items];
        const index = this.items.findIndex(i => String(i.id) === String(id));
        if (index === -1) {
            // Never report a save that did not happen.
            notifications.showError({
                message: 'We couldn\'t find that item to save. It may have been moved \u2014 please refresh and try again when you\'re ready.',
                code: 'NOT_FOUND',
                technicalDetails: `update: no item with id ${id} in ${this.key}`
            } as any);
            throw new Error(`Item ${id} not found`);
        }

        this.status = "syncing";
        this.error = null;
        const currentItem = this.items[index];
        const updatedItem = { ...currentItem, ...updates };
        this.items[index] = updatedItem;
        this.items = [...this.items]; // trigger reactivity
        setStored(this.key, this.items);
        this.notify();

        try {
            const token = get(auth).token;
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
                const error = new Error("Failed to update remote") as any;
                error.technicalDetails = `${errorDetail}\n\nEndpoint: PUT ${this.apiBase}/${this.endpoint}/${id}`;
                throw error;
            }
            const raw = await res.json();
            const remoteItemRaw = convertKeys(raw, toCamel);
            const remoteItem = this.mapper ? this.mapper(remoteItemRaw) : remoteItemRaw;

            // Sync again with server data
            this.items[index] = remoteItem;
            this.items = [...this.items];
            setStored(this.key, this.items);
            this.notify();
            this.status = "synced";
            this.lastSync = new Date();

            // Show affirmation if context is set
            if (this.affirmationContext) {
                notifications.showAffirmation(this.affirmationContext);
            }

            return remoteItem;
        } catch (e: any) {
            console.error("Update failed, rolling back", e);
            this.items = original;
            setStored(this.key, this.items);
            this.notify();
            this.status = "error";
            this.error = e?.message || "Failed to save";
            // Rollback restores the saved record; the caller's form still holds the typed draft,
            // and Try Again re-applies exactly those edits.
            notifications.showError({
                message: 'We couldn\'t save that just yet. Your words are still here \u2014 try again when you\'re ready.',
                code: 'DATABASE_ERROR',
                technicalDetails: e.technicalDetails || e.message || String(e)
            } as any, () => { this.update(id, updates).catch(() => {}); });
            throw e;
        }
    }

    async delete(id: number | string) {
        // Optimistic
        const original = this.items;
        this.status = "syncing";
        this.error = null;
        this.items = this.items.filter(i => String(i.id) !== String(id));
        setStored(this.key, this.items);
        this.notify();

        try {
            const token = get(auth).token;
            const res = await writeFetch(`${BASE_URL}${this.apiBase}/${this.endpoint}/${id}`, {
                method: "DELETE",
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                const errorBody = await res.text();
                let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
                try {
                    const errorJson = JSON.parse(errorBody);
                    errorDetail = errorJson.detail || errorJson.message || errorJson.error?.message || errorBody;
                } catch { errorDetail = errorBody || errorDetail; }
                const error = new Error("Delete failed remote") as any;
                error.technicalDetails = `${errorDetail}\n\nEndpoint: DELETE ${this.apiBase}/${this.endpoint}/${id}`;
                throw error;
            }
            this.status = "synced";
            this.lastSync = new Date();
        } catch (e: any) {
            // Rollback
            console.error("Delete failed, rolling back", e);
            this.items = original;
            setStored(this.key, this.items);
            this.notify();
            this.status = "error";
            this.error = e?.message || "Failed to remove";
            notifications.showError({
                message: 'We couldn\'t remove this just yet. It is still safely in your list \u2014 try again when you\'re ready.',
                code: 'DATABASE_ERROR',
                technicalDetails: e.technicalDetails || e.message || String(e)
            } as any, () => { this.delete(id).catch(() => {}); });
        }
    }

    async audit() {
        try {
            const token = get(auth).token;
            const res = await fetch(`${BASE_URL}${this.apiBase}/${this.endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Audit fetch failed");
            const rawItems: any[] = await res.json();
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
            console.error("Audit error", e);
            throw e;
        }
    }
}

// Singleton stores registered on the same endpoint share one GET per sync round, and their first-load
// uploads go out together as one POST (the server merges the posted keys). The estate profile's
// stores go further and share one manager (SharedRecord, below).
const _sharedGets = new Map<string, Promise<any>>();
const _pendingUploads = new Map<string, { payload: Record<string, any>; waiters: { resolve: (v: any) => void; reject: (e: any) => void }[] }>();

function sharedGet(url: string, token: string): Promise<any> {
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
function sharedUpload(url: string, token: string, payload: Record<string, any>): Promise<any> {
    const k = `${token}|${url}`;
    let batch = _pendingUploads.get(k);
    if (!batch) {
        const b = { payload: {} as Record<string, any>, waiters: [] as { resolve: (v: any) => void; reject: (e: any) => void }[] };
        batch = b;
        _pendingUploads.set(k, b);
        setTimeout(() => {
            _pendingUploads.delete(k);
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

const isEmptyRecord = (r: any) => !r || typeof r !== 'object' || Object.keys(r).length === 0;
const ACCOUNT_CHANGED = new Error("account changed before this save was sent");

type ProfileBatch = { token: string; payload: Record<string, any>; waiters: { resolve: () => void; reject: (e: any) => void }[] };

/** One server record that several singleton stores share, each owning its own keys (estate/profile:
 *  estate, scenario, tone, onboarding, concierge, complexity). It is the one manager of that record:
 *  one GET per account per page session (stores that register later read what it holds), and one
 *  POST in flight at a time; saves made meanwhile wait and go together in the next POST (the server
 *  merges posted keys), so no response or reload can undo another store's save. */
class SharedRecord {
    private slices = new Set<SingletonSyncManager<any>>();
    private server: Record<string, any> = {}; // the record as the server last returned it (camelCase)
    private queue: ProfileBatch[] = [];
    private sending: ProfileBatch | null = null;
    private inflight: Promise<void> | null = null;
    synced = false;
    epoch = 0;
    loadedFor: string | null = storageAccount();

    constructor(private url: string) {}

    attach(slice: SingletonSyncManager<any>) { this.slices.add(slice); }

    /** The server record with every save not yet confirmed laid over it. */
    get current(): Record<string, any> {
        const out = { ...this.server };
        for (const b of [this.sending, ...this.queue]) if (b) Object.assign(out, convertKeys(b.payload, toCamel));
        return out;
    }

    /** Account change (clear: logout). Saves not yet sent belong to the old account and are dropped. */
    reset(clear: boolean) {
        const account = clear ? null : storageAccount();
        if (!clear && this.loadedFor === account) return; // still this account: keep the record and any sync
        this.epoch++;
        this.synced = false;
        this.inflight = null;
        this.server = {};
        this.queue.splice(0).forEach(b => b.waiters.forEach(w => w.reject(ACCOUNT_CHANGED)));
        this.loadedFor = account;
    }

    /** Bring one store up to date: joins the session's single GET, or reads the record already held. */
    async syncSlice(slice: SingletonSyncManager<any>) {
        this.attach(slice);
        if (!this.synced) return this.sync();
        // A store that registers after the first load and holds this device's earlier data uploads it
        // only while the account's record is still empty (as its own first load would have).
        if (isEmptyRecord(this.current) && slice.hasLocalData()) {
            const epoch = this.epoch;
            try { await this.write(slice.wirePayload(slice.data)); } catch (e) { if (e !== ACCOUNT_CHANGED) slice.syncFailed(e); return; }
            if (epoch !== this.epoch) return;
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
        const token = get(auth).token;
        if (!token) { this.slices.forEach(s => { s.status = "idle"; }); return; }
        this.slices.forEach(s => { s.status = "syncing"; s.error = null; });
        try {
            const res = await fetch(this.url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error("Failed to fetch remote data");
            const raw = await res.json();
            if (epoch !== this.epoch || get(auth).token !== token) return; // account changed mid-flight
            this.server = convertKeys(raw, toCamel) || {};

            // First load of an empty account: every store's own device data goes up in one POST
            // (quietly; a store holding only its mapper's defaults sends nothing).
            if (isEmptyRecord(raw)) {
                const upload: Record<string, any> = {};
                this.slices.forEach(s => { if (s.hasLocalData()) Object.assign(upload, s.wirePayload(s.data)); });
                if (!isEmptyRecord(upload)) {
                    console.log(`[Sync:${this.url}] Migrating local profile to cloud...`);
                    await this.write(upload, token);
                    if (epoch !== this.epoch) return;
                }
            }
            this.synced = true;
            const current = this.current;
            this.slices.forEach(s => s.applyRemote(current));
        } catch (e: any) {
            if (e === ACCOUNT_CHANGED || epoch !== this.epoch) return;
            this.slices.forEach(s => s.syncFailed(e));
        }
    }

    /** Queue a save of some keys (snake_case). Resolves once the server holds them. */
    write(payload: Record<string, any>, token: string | null = get(auth).token): Promise<void> {
        const t = token || '';
        let b = this.queue[this.queue.length - 1];
        if (!b || b.token !== t) { b = { token: t, payload: {}, waiters: [] }; this.queue.push(b); }
        Object.assign(b.payload, payload); // later save of the same key wins
        const batch = b;
        const done = new Promise<void>((resolve, reject) => batch.waiters.push({ resolve, reject }));
        this.pump();
        return done;
    }

    private pump() {
        if (this.sending || this.queue.length === 0) return;
        const b = this.queue.shift()!;
        this.sending = b;
        const epoch = this.epoch;
        fetch(this.url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${b.token}` },
            body: JSON.stringify(b.payload)
        })
            .then(res => { if (!res.ok) throw new Error("Update failed"); return res.json(); })
            .then(raw => {
                if (epoch === this.epoch) this.server = convertKeys(raw, toCamel) || {};
                this.sending = null;
                b.waiters.forEach(w => w.resolve());
            }, e => {
                this.sending = null;
                b.waiters.forEach(w => w.reject(e));
            })
            .finally(() => this.pump());
    }
}

const _sharedRecords = new Map<string, SharedRecord>();
function sharedRecord(url: string) {
    let r = _sharedRecords.get(url);
    if (!r) { r = new SharedRecord(url); _sharedRecords.set(url, r); }
    return r;
}

export class SingletonSyncManager<T extends object> {
    data = $state<T | null>(null);
    status = $state<SyncStatus>("idle");
    lastSync = $state<Date | null>(null);
    error = $state<string | null>(null);
    private subscriptions = new Set<(value: T | null) => void>();
    private affirmationContext?: 'general' | 'documents' | 'wishes' | 'contacts' | 'medical' | 'pets' | 'insurance' | 'funeral' | 'subscriptions' | 'heirlooms' | 'timeline' | 'letters' | 'timeCapsule' | 'pulse';

    private key: string;
    private endpoint: string;
    private mapper?: (local: any) => T;
    private apiBase: string;
    /** Set when this store is one slice of a record other stores share (see SharedRecord). */
    private record?: SharedRecord;

    constructor(key: string, endpoint: string, mapper?: (local: any) => T, apiBase: string = "/api", shared = false) {
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
        this.data = mapper ? mapper(raw) : raw;
        this.loadedFor = storageAccount();
    }

    /**
     * Set the affirmation context for this sync manager.
     * When set, successful update operations will show affirmations.
     */
    setAffirmationContext(context: 'general' | 'documents' | 'wishes' | 'contacts' | 'medical' | 'pets' | 'insurance' | 'funeral' | 'subscriptions' | 'heirlooms' | 'timeline' | 'letters' | 'timeCapsule' | 'pulse') {
        this.affirmationContext = context;
        return this;
    }

    private inflight: Promise<void> | null = null;
    /** See SyncManager.loadedFor. */
    loadedFor: string | null = null;

    /** Account change: see SyncManager.reset. */
    reset(clear = false) {
        this.inflight = null;
        this.record?.reset(clear);
        this.loadedFor = clear ? null : storageAccount();
        const raw = clear ? ({} as T) : getStored<T>(this.key, {} as T);
        this.data = this.mapper ? this.mapper(raw) : raw;
        this.status = "idle";
        this.error = null;
        this.lastSync = null;
        this.notify();
    }

    async init() {
        await this.sync();
    }

    sync(): Promise<void> {
        if (this.record) return this.record.syncSlice(this);
        if (this.inflight) return this.inflight;
        const p: Promise<void> = this.runSync().finally(() => { if (this.inflight === p) this.inflight = null; });
        this.inflight = p;
        return p;
    }

    private async runSync() {
        this.status = "syncing";
        this.error = null;
        try {
            const token = get(auth).token;
            if (!token) { this.status = "idle"; return; }

            const url = `${BASE_URL}${this.apiBase}/${this.endpoint}`;
            const raw = await sharedGet(url, token);
            if (get(auth).token !== token) return; // account changed mid-flight
            const remoteDataRaw = convertKeys(raw, toCamel);
            const remoteData = this.mapper ? this.mapper(remoteDataRaw) : remoteDataRaw;

            // Simple migration: if remote is empty but this device holds real data, upload it
            // (quietly: background bookkeeping, no affirmation).
            const isRemoteEmpty = !remoteDataRaw || Object.keys(remoteDataRaw).length === 0; // raw: a mapper may add defaults

            if (isRemoteEmpty && this.hasLocalData()) {
                console.log(`[Sync:${this.key}] Migrating local singleton to cloud...`);
                const saved = convertKeys(await sharedUpload(url, token, this.wirePayload(this.data!)), toCamel);
                if (get(auth).token !== token) return;
                this.updateLocal(this.mapper ? this.mapper(saved) : saved);
            } else {
                this.updateLocal(remoteData);
            }

            this.status = "synced";
            this.lastSync = new Date();
        } catch (e: any) {
            console.error(`[Sync:${this.key}] Error:`, e);
            this.status = "error";
            this.error = e.message;
        }
    }

    /** True when the raw device copy (before mapping) holds more than the mapper's defaults:
     *  a mapper fills defaults, and defaults are never uploaded. */
    hasLocalData(): boolean {
        const stored = getStored<any>(this.key, null);
        if (!stored || typeof stored !== 'object' || Object.keys(stored).length === 0) return false;
        if (!this.mapper) return true;
        return JSON.stringify(this.mapper(stored)) !== JSON.stringify(this.mapper({}));
    }

    /** The record as sent: mapped, snake_case, without the fields the server owns. */
    wirePayload(data: T): any {
        const payload = convertKeys(this.mapper ? this.mapper(data) : data, toSnake);
        // Server-owned fields; the server rejects them (422) if sent back.
        if (payload && typeof payload === 'object') {
            for (const k of ['id', 'user_id', 'created_at', 'updated_at']) delete payload[k];
        }
        return payload;
    }

    /** Shared record: the server's copy arrived (or was already held); take this store's slice. */
    applyRemote(record: Record<string, any>) {
        this.updateLocal((this.mapper ? this.mapper(record) : record) as T);
        this.status = "synced";
        this.error = null;
        this.lastSync = new Date();
    }

    syncFailed(e: any) {
        console.error(`[Sync:${this.key}] Error:`, e);
        this.status = "error";
        this.error = e?.message || String(e);
    }

    // quiet: a background write — no affirmation, failures go to the console only.
    async update(newData: Partial<T>, quiet = false) {
        const original = this.data;
        this.status = "syncing";
        this.error = null;
        this.data = { ...(this.data || {} as T), ...newData } as T;
        setStored(this.key, this.data);
        this.notify();

        if (this.record) return this.updateShared(newData, original, quiet);

        try {
            const token = get(auth).token;
            const payload = this.wirePayload(this.data);

            const res = await writeFetch(`${BASE_URL}${this.apiBase}/${this.endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Update failed");
            const raw = await res.json();
            const savedRaw = convertKeys(raw, toCamel);
            const saved = this.mapper ? this.mapper(savedRaw) : savedRaw;

            this.updateLocal(saved);
            this.status = "synced";
            this.lastSync = new Date();

            // Affirm only a save the person made.
            if (this.affirmationContext && !quiet) {
                notifications.showAffirmation(this.affirmationContext);
            }

            return saved;
        } catch (e) {
            console.error(`[Sync:${this.key}] Update failed, rolling back`, e);
            this.data = original;
            setStored(this.key, original);
            this.notify();
            this.status = "error";
            this.error = (e as any)?.message || "Failed to save";
            if (quiet) throw e; // background upload: console only, like a quiet create
            notifications.showError({
                message: 'We couldn\'t save that just yet. Your words are still here \u2014 try again when you\'re ready.',
                code: 'DATABASE_ERROR',
                technicalDetails: (e as any)?.message || String(e)
            } as any, () => { this.update(newData).catch(() => {}); });
            throw e;
        }
    }

    /** A save into the shared record: only the keys this save changed are sent, so it never
     *  rewrites a key with a value this device read before another save. */
    private async updateShared(newData: Partial<T>, original: T | null, quiet: boolean) {
        const record = this.record!;
        const epoch = record.epoch;
        const full = this.wirePayload(this.data!);
        const changed = new Set(Object.keys(newData).map(toSnake));
        const payload: Record<string, any> = {};
        for (const k of Object.keys(full || {})) if (changed.has(k)) payload[k] = full[k];
        try {
            await record.write(isEmptyRecord(payload) ? full : payload);
            if (epoch !== record.epoch) return; // signed out or switched account meanwhile
            const saved = (this.mapper ? this.mapper(record.current) : record.current) as T;
            this.updateLocal(saved);
            this.status = "synced";
            this.lastSync = new Date();
            if (this.affirmationContext && !quiet) notifications.showAffirmation(this.affirmationContext);
            return saved;
        } catch (e) {
            if (e === ACCOUNT_CHANGED || epoch !== record.epoch) return;
            console.error(`[Sync:${this.key}] Update failed, rolling back`, e);
            // Back to what the server holds, keeping saves still waiting to be sent.
            const rolled = (this.mapper ? this.mapper(record.current) : { ...(original || {}), ...record.current }) as T;
            this.updateLocal(rolled);
            this.status = "error";
            this.error = (e as any)?.message || "Failed to save";
            if (quiet) throw e;
            notifications.showError({
                message: 'We couldn\'t save that just yet. Your words are still here \u2014 try again when you\'re ready.',
                code: 'DATABASE_ERROR',
                technicalDetails: (e as any)?.message || String(e)
            } as any, () => { this.update(newData).catch(() => {}); });
            throw e;
        }
    }

    /** Set the device copy only (no server call). */
    updateLocal(data: T) {
        this.data = data;
        setStored(this.key, data);
        this.notify();
    }

    subscribe(run: (value: T | null) => void) {
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
    data = $state<Record<string, SyncManager<any>>>({});
}

// Internal singleton reference
let _container: RegistryContainer | undefined;
let _plainRegistry: Record<string, SyncManager<any>> = {};

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
    const reg = getRegistry() as Record<string, any>;
    const existing = reg[key];
    if (existing) {
        // One owner per key: a second registration must describe the same endpoint.
        if (existing.endpoint !== endpoint || (apiBase !== undefined && existing.apiBase !== apiBase)) {
            console.warn(`[Sync] "${key}" is already registered for ${existing.apiBase}/${existing.endpoint}; ignoring ${apiBase ?? ''}/${endpoint}`);
        }
        return existing as M;
    }
    const manager = make();
    reg[key] = manager;
    if (browser && _sessionActive) manager.sync().catch(() => {});
    return manager;
}

export function registerSync<T extends { id: number | string }>(key: string, endpoint: string, mapper?: any, apiBase?: string) {
    return registerManager(key, endpoint, apiBase, () => new SyncManager<T>(key, endpoint, mapper, apiBase));
}

export function registerSingletonSync<T extends object>(key: string, endpoint: string, mapper?: any, apiBase?: string) {
    return registerManager(key, endpoint, apiBase, () => new SingletonSyncManager<T>(key, endpoint, mapper, apiBase)) as unknown as SingletonSyncManager<T>;
}

/** A store that owns some keys of the one estate profile record (/api/estate/profile). Every such
 *  store reads and writes its slice through that record's single manager (SharedRecord). */
export function registerProfileSlice<T extends object>(key: string, mapper: (data: any) => T) {
    return registerManager(key, 'estate/profile', '/api', () => new SingletonSyncManager<T>(key, 'estate/profile', mapper, '/api', true)) as unknown as SingletonSyncManager<T>;
}

/** Signed-in session start (or account switch): a store holding another account's records (or
 *  none, after logout) reloads from the active account's; then every store fetches from the server.
 *  A store already on this account keeps its records and any sync it is running: sync() joins that
 *  run, so a page's onMount sync and this call migrate local records up once, not twice. */
export async function syncAll() {
    _sessionActive = true;
    const account = storageAccount();
    const managers = Object.values(getRegistry()) as any[];
    managers.forEach(m => { if (m.loadedFor !== account) m.reset(false); });
    return Promise.allSettled(managers.map(m => m.sync()));
}

// The active account becoming known (or changing) points every store at that account's records
// before anything syncs. A store created before the account was known says 'anonymous'; left so,
// syncAll would take the account's arrival for a switch and reset the store under the page's
// running sync (a second fetch, and a first upload sent twice). A store cleared by logout (null)
// is left for syncAll.
if (browser) {
    activeAccountId.subscribe(id => {
        if (!id) return;
        (Object.values(getRegistry()) as any[]).forEach(m => {
            if (m.loadedFor !== null && m.loadedFor !== id) m.reset(false);
        });
    });
}

/** Logout: forget every in-memory record so the next account never sees them. */
export function clearAll() {
    _sessionActive = false;
    (Object.values(getRegistry()) as any[]).forEach(m => m.reset(true));
}
