import { getStored, setStored } from "$lib/stores/persistence";

const BASE_URL = import.meta.env.VITE_API_BASE || "";
const USER_ID = 1; // TODO: Connect to real auth store

export type SyncStatus = "idle" | "syncing" | "error" | "synced";

export class SyncManager<T extends { id: number | string }> {
    items = $state<T[]>([]);
    status = $state<SyncStatus>("idle");
    lastSync = $state<Date | null>(null);
    error = $state<string | null>(null);

    private key: string;
    private endpoint: string;
    private mapper?: (local: any) => any;

    private subscriptions = new Set<(value: T[]) => void>();

    constructor(key: string, endpoint: string, mapper?: (local: any) => any) {
        this.key = key;
        this.endpoint = endpoint;
        this.mapper = mapper;

        // 1. Instant Load
        this.items = getStored<T[]>(key, []);
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
        try {
            // Fetch Remote
            const res = await fetch(`${BASE_URL}/api/data/${this.endpoint}?user_id=${USER_ID}`);
            if (!res.ok) throw new Error("Failed to fetch remote data");

            const remoteItems: T[] = await res.json();

            // Logic: Up-Sync vs Down-Sync
            // If Remote is empty but Local has data -> Migration (Up-Sync)
            if (remoteItems.length === 0 && this.items.length > 0) {
                console.log(`[Sync:${this.key}] Migrating ${this.items.length} items to cloud...`);
                await this.migrateUp(this.items);
                // Re-fetch to get canon IDs
                const res2 = await fetch(`${BASE_URL}/api/data/${this.endpoint}?user_id=${USER_ID}`);
                if (res2.ok) {
                    this.updateLocal(await res2.json());
                }
            } else {
                // Standard Mirror (Down-Sync) - Server is Truth
                // TODO: Smart Merge? For now, Server Overwrites Local to ensure consistency.
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
        // Optimistic Update (if not skipping)
        // Actually, for creation, we need the DB ID. 
        // So we can't fully optimistically render unless we use temp IDs.
        // For simplicity: We await API, then update local.

        try {
            const payload = this.mapper ? this.mapper(data) : data;
            // Clean ID for creation
            if (payload.id && typeof payload.id === 'string' && payload.id.length > 10) {
                delete payload.id; // Remove UUID string, let DB assign int
            } else if (payload.id === undefined) {
                // ok
            }

            const res = await fetch(`${BASE_URL}/api/data/${this.endpoint}?user_id=${USER_ID}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to save");

            const newItem = await res.json();

            if (!skipLocal) {
                this.items = [...this.items, newItem];
                setStored(this.key, this.items);
            }
            return newItem;
        } catch (e) {
            console.error("Create failed", e);
            throw e;
        }
    }

    async delete(id: number | string) {
        // Optimistic
        const original = this.items;
        this.items = this.items.filter(i => i.id !== id);
        setStored(this.key, this.items);

        try {
            const res = await fetch(`${BASE_URL}/api/data/${this.endpoint}/${id}?user_id=${USER_ID}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Delete failed remote");
        } catch (e) {
            // Rollback
            console.error("Delete failed, rolling back", e);
            this.items = original;
            setStored(this.key, this.items);
            this.status = "error";
        }
    }

    async audit() {
        try {
            const res = await fetch(`${BASE_URL}/api/data/${this.endpoint}?user_id=${USER_ID}`);
            if (!res.ok) throw new Error("Audit fetch failed");
            const remoteItems: T[] = await res.json();

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

export function registerSync<T>(key: string, endpoint: string, mapper?: any) {

    const reg = getRegistry();
    if (!reg[key]) {
        console.log(`[Sync] Registering NEW manager for ${key}`);
        reg[key] = new SyncManager<T>(key, endpoint, mapper);
    } else {
        console.log(`[Sync] Returning existing manager for ${key}`);
    }
    return reg[key] as SyncManager<T>;
}
