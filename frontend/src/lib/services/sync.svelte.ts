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
            const toUpload = pendingUpload.length > 0 ? pendingUpload
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

    private updateLocal(data: T[]) {
        this.items = data;
        setStored(this.key, data);
        this.notify();
    }

    private get uploadKey() { return `${this.key}__pending_upload`; }

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

        const res = await fetch(`${BASE_URL}${this.apiBase}/${this.endpoint}`, {
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

            const res = await fetch(`${BASE_URL}${this.apiBase}/${this.endpoint}/${id}`, {
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
            const res = await fetch(`${BASE_URL}${this.apiBase}/${this.endpoint}/${id}`, {
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

    constructor(key: string, endpoint: string, mapper?: (local: any) => T, apiBase: string = "/api") {
        this.key = key;
        this.endpoint = endpoint;
        this.mapper = mapper;
        this.apiBase = apiBase;

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

            const res = await fetch(`${BASE_URL}${this.apiBase}/${this.endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch remote data");

            const raw = await res.json();
            if (get(auth).token !== token) return; // account changed mid-flight
            const remoteDataRaw = convertKeys(raw, toCamel);
            const remoteData = this.mapper ? this.mapper(remoteDataRaw) : remoteDataRaw;

            // Simple migration: if remote is empty but local has data
            const isRemoteEmpty = !remoteDataRaw || Object.keys(remoteDataRaw).length === 0; // raw: a mapper may add defaults
            const isLocalPopulated = this.data && Object.keys(this.data).length > 0;

            if (isRemoteEmpty && isLocalPopulated) {
                console.log(`[Sync:${this.key}] Migrating local singleton to cloud...`);
                await this.update(this.data!, true); // background upload: no affirmation
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

    // quiet: a background write (the sync-time local-to-cloud upload) — no affirmation.
    async update(newData: Partial<T>, quiet = false) {
        const original = this.data;
        this.status = "syncing";
        this.error = null;
        this.data = { ...(this.data || {} as T), ...newData } as T;
        setStored(this.key, this.data);
        this.notify();

        try {
            const token = get(auth).token;
            const payloadRaw = this.mapper ? this.mapper(this.data) : this.data;
            const payload = convertKeys(payloadRaw, toSnake);
            // Server-owned fields; the server rejects them (422) if sent back.
            if (payload && typeof payload === 'object') {
                for (const k of ['id', 'user_id', 'created_at', 'updated_at']) delete payload[k];
            }

            const res = await fetch(`${BASE_URL}${this.apiBase}/${this.endpoint}`, {
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

/** Logout: forget every in-memory record so the next account never sees them. */
export function clearAll() {
    _sessionActive = false;
    (Object.values(getRegistry()) as any[]).forEach(m => m.reset(true));
}
