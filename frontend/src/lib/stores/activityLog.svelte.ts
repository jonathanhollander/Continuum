import { registerSync } from "$lib/services/sync.svelte";

export interface ActivityLogEntry {
    id: string; // UUID from frontend
    timestamp: string;
    module: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'SETTINGS_CHANGE' | 'GENERATE' | 'PRINT' | 'SCAN';
    entityType: string;
    entityId: string;
    entityName: string;
    changes?: {
        field: string;
        oldValue: unknown;
        newValue: unknown;
    }[];
    userContext: string;
}

// --- Mapper ---

const mapper = (data: Record<string, unknown>): ActivityLogEntry => data as unknown as ActivityLogEntry;

// --- Sync Manager ---

const manager = registerSync<ActivityLogEntry>('activity_log', 'activity_log', mapper, '/api/data');

// --- Store Exports ---

export const activityLog = {
    subscribe: manager.subscribe.bind(manager),
    get items() { return manager.items; },

    /**
     * Log a new activity event
     */
    logEvent(entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>): void {
        // The server generates the id. Failures are bookkeeping only: console, never the user.
        // entity_type, entity_id, entity_name and module are required columns: a caller that has
        // no value for one still sends a string, so the row saves instead of returning 422.
        const newEntry = {
            ...entry,
            module: String(entry.module ?? ''),
            entityType: String(entry.entityType ?? ''),
            entityId: String(entry.entityId ?? ''),
            entityName: String(entry.entityName ?? ''),
            timestamp: new Date().toISOString(),
        };
        manager.create(newEntry as ActivityLogEntry, false, true).catch((e) => {
            console.warn('[ActivityLog] Could not record this activity (the save itself is unaffected):', e);
        });
    },

    /** All entries, newest first. */
    getAll(): ActivityLogEntry[] {
        return [...manager.items].sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
    },

    /** Search entries by entity name or change details */
    search(query: string): ActivityLogEntry[] {
        const q = query.toLowerCase();
        return activityLog.getAll().filter((entry) =>
            String(entry.entityName ?? '').toLowerCase().includes(q) ||
            (entry.changes ?? []).some((c) =>
                String(c.field).toLowerCase().includes(q) ||
                String(c.oldValue).toLowerCase().includes(q) ||
                String(c.newValue).toLowerCase().includes(q)
            )
        );
    },

    getTodayCount(): number {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        return manager.items.filter((e) => new Date(e.timestamp) >= start).length;
    },

    exportAsJSON(): string {
        return JSON.stringify(activityLog.getAll(), null, 2);
    },

    exportAsCSV(): string {
        const entries = activityLog.getAll();
        if (entries.length === 0) return '';
        const headers = ['Timestamp', 'Module', 'Action', 'Entity Type', 'Entity Name', 'User', 'Changes'];
        const rows = entries.map((e) => [
            e.timestamp, e.module, e.action, e.entityType, e.entityName, e.userContext,
            e.changes ? e.changes.map((c) => `${c.field}: ${c.oldValue} -> ${c.newValue}`).join('; ') : '',
        ]);
        return [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    },

    /**
     * Get entries filtered by module
     */
    getByModule(module: string): ActivityLogEntry[] {
        return manager.items.filter((entry) => entry.module === module);
    },

    /**
     * Get entries filtered by action type
     */
    getByAction(action: ActivityLogEntry['action']): ActivityLogEntry[] {
        return manager.items.filter((entry) => entry.action === action);
    },

    /**
     * Remove every entry of this person's log from the server, one DELETE each through the
     * manager. Deletes run one at a time (a delete's rollback restores the list as it stood when
     * that delete began) and stay within the server's 600 writes/minute: after 500 in a minute the
     * next waits for that minute to end. The first one that fails stops the run; the manager has
     * rolled it back and shown its one gentle message, so the list still holds exactly what the
     * server holds. Returns how many were removed and how many are still there.
     */
    async clear(): Promise<{ removed: number; remaining: number }> {
        const PER_MINUTE = 500;
        const ids = manager.items.map((e) => e.id);
        let removed = 0;
        let windowStart = Date.now();
        let inWindow = 0;
        for (const id of ids) {
            if (inWindow >= PER_MINUTE) {
                const wait = 60_000 - (Date.now() - windowStart);
                if (wait > 0) await new Promise((r) => setTimeout(r, wait));
                windowStart = Date.now();
                inWindow = 0;
            }
            inWindow++;
            await manager.delete(id);
            // manager.delete catches its own failure: rolled back, status "error", message shown.
            if (manager.items.some((e) => String(e.id) === String(id))) break;
            removed++;
        }
        return { removed, remaining: manager.items.length };
    },

    /**
     * Sync with backend
     */
    sync: () => manager.sync()
};
