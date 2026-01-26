import { getStored, setStored } from "$lib/stores/persistence";
import { API_BASE_URL } from "$lib/config";

import { auth } from "../stores/auth.ts";
import { get } from "svelte/store";
import { notifications } from "$lib/stores/notificationStore";

const toCamel = (str: string) => str.replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', ''));
const toSnake = (str: string) => str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

const convertKeys = (obj: any, converter: (s: string) => string): any => {
    if (obj === null || typeof obj !== 'object' || obj instanceof Date || obj instanceof Blob) return obj;
    if (Array.isArray(obj)) return obj.map(i => convertKeys(i, converter));

    const newObj: any = {};
    Object.keys(obj).forEach(key => {
        newObj[converter(key)] = convertKeys(obj[key], converter);
    });
    return newObj;
};

// Use centralized config for API base URL (fixes dev mode sync issue)
const BASE_URL = API_BASE_URL;

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

    async sync() {
        this.status = "syncing";
        this.error = null;

        // CRITICAL: Capture local state BEFORE any async operations
        // This prevents race conditions where reactive $state gets updated
        // before we can check for migration eligibility
        const localItemsSnapshot = [...this.items];

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
            const remoteItems = rawItems.map(item => {
                const camelItem = convertKeys(item, toCamel);
                return this.mapper ? this.mapper(camelItem) : camelItem;
            });

            // Logic: Up-Sync vs Down-Sync
            // If Remote is empty but Local has data -> Migration (Up-Sync)
            // Use captured snapshot to avoid race condition with reactive state
            if (remoteItems.length === 0 && localItemsSnapshot.length > 0) {
                console.log(`[Sync:${this.key}] Migrating ${localItemsSnapshot.length} local items to cloud...`);
                await this.migrateUp(localItemsSnapshot);
                // Re-fetch to get canon IDs
                const res2 = await fetch(`${BASE_URL}${this.apiBase}/${this.endpoint}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res2.ok) {
                    const raw2 = await res2.json();
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

    private async migrateUp(items: T[]) {
        for (const item of items) {
            await this.create(item, true); // True = skip local update (we do it descending)
        }
    }

    // CRUD
    async create(data: Partial<T>, skipLocal = false) {
        try {
            const payloadRaw = this.mapper ? this.mapper(data as any) : data;
            const payload = convertKeys(payloadRaw, toSnake);

            // Clean ID for creation
            if (payload.id && typeof payload.id === 'string' && payload.id.length > 10) {
                delete payload.id;
            }

            const token = get(auth).token;
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
            const newItem = this.mapper ? this.mapper(newItemRaw) : newItemRaw;

            if (!skipLocal) {
                this.items = [...this.items, newItem];
                setStored(this.key, this.items);
                this.notify();

                // Show affirmation if context is set
                if (this.affirmationContext) {
                    notifications.showAffirmation(this.affirmationContext);
                }
            }
            return newItem;
        } catch (e: any) {
            console.error("Create failed", e);
            // Show detailed error notification
            notifications.showError({
                message: 'We couldn\'t save your new item. Please try again.',
                technicalDetails: e.technicalDetails || e.message || String(e)
            });
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
        if (index === -1) return;

        const currentItem = this.items[index];
        const updatedItem = { ...currentItem, ...updates };
        this.items[index] = updatedItem;
        this.items = [...this.items]; // trigger reactivity
        setStored(this.key, this.items);
        this.notify();

        try {
            const token = get(auth).token;
            const payloadRaw = this.mapper ? this.mapper(updatedItem) : updatedItem;
            const payload = convertKeys(payloadRaw, toSnake);

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
            // Show detailed error notification
            notifications.showError({
                message: 'We couldn\'t save your changes. Please try again, or check your connection.',
                technicalDetails: e.technicalDetails || e.message || String(e)
            });
            throw e;
        }
    }

    async delete(id: number | string) {
        // Optimistic
        const original = this.items;
        this.items = this.items.filter(i => i.id !== id);
        setStored(this.key, this.items);

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
        } catch (e: any) {
            // Rollback
            console.error("Delete failed, rolling back", e);
            this.items = original;
            setStored(this.key, this.items);
            this.status = "error";
            // Show detailed error notification
            notifications.showError({
                message: 'We couldn\'t remove this item. Please try again.',
                technicalDetails: e.technicalDetails || e.message || String(e)
            });
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
    }

    /**
     * Set the affirmation context for this sync manager.
     * When set, successful update operations will show affirmations.
     */
    setAffirmationContext(context: 'general' | 'documents' | 'wishes' | 'contacts' | 'medical' | 'pets' | 'insurance' | 'funeral' | 'subscriptions' | 'heirlooms' | 'timeline' | 'letters' | 'timeCapsule' | 'pulse') {
        this.affirmationContext = context;
        return this;
    }

    async sync() {
        this.status = "syncing";
        this.error = null;
        try {
            const token = get(auth).token;
            if (!token) return;

            const res = await fetch(`${BASE_URL}${this.apiBase}/${this.endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch remote data");

            const raw = await res.json();
            const remoteDataRaw = convertKeys(raw, toCamel);
            const remoteData = this.mapper ? this.mapper(remoteDataRaw) : remoteDataRaw;

            // Simple migration: if remote is empty but local has data
            const isRemoteEmpty = !remoteData || Object.keys(remoteData).length === 0;
            const isLocalPopulated = this.data && Object.keys(this.data).length > 0;

            if (isRemoteEmpty && isLocalPopulated) {
                console.log(`[Sync:${this.key}] Migrating local singleton to cloud...`);
                await this.update(this.data!);
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

    async update(newData: Partial<T>) {
        const original = this.data;
        this.data = { ...(this.data || {} as T), ...newData } as T;
        setStored(this.key, this.data);
        this.notify();

        try {
            const token = get(auth).token;
            const payloadRaw = this.mapper ? this.mapper(this.data) : this.data;
            const payload = convertKeys(payloadRaw, toSnake);

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

            // Show affirmation if context is set
            if (this.affirmationContext) {
                notifications.showAffirmation(this.affirmationContext);
            }

            return saved;
        } catch (e) {
            console.error(`[Sync:${this.key}] Update failed, rolling back`, e);
            this.data = original;
            setStored(this.key, original);
            this.notify();
            throw e;
        }
    }

    private updateLocal(data: T) {
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

export function registerSync<T extends { id: number | string }>(key: string, endpoint: string, mapper?: any, apiBase?: string) {
    const reg = getRegistry();
    if (!reg[key]) {
        reg[key] = new SyncManager<T>(key, endpoint, mapper, apiBase);
    }
    return reg[key] as SyncManager<T>;
}

export function registerSingletonSync<T extends object>(key: string, endpoint: string, mapper?: any, apiBase?: string) {
    const reg = getRegistry();
    if (!reg[key]) {
        reg[key] = new SingletonSyncManager<T>(key, endpoint, mapper, apiBase) as any;
    }
    return reg[key] as unknown as SingletonSyncManager<T>;
}

export async function syncAll() {
    const reg = getRegistry();
    const promises = Object.values(reg).map(manager => manager.sync());
    return Promise.allSettled(promises);
}
