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
        oldValue: any;
        newValue: any;
    }[];
    userContext: string;
}

// --- Mapper ---

const mapper = (data: any): ActivityLogEntry => data;

// --- Sync Manager ---

const manager = registerSync<ActivityLogEntry>('activity_log', 'activity_log', mapper, '/api/data');

// --- Legacy Migration Logic ---

const migrateLegacyData = () => {
    if (typeof localStorage === 'undefined') return;

    const legacy = localStorage.getItem('continuum_activity_log');
    if (legacy) {
        try {
            const parsed = JSON.parse(legacy);
            if (Array.isArray(parsed) && parsed.length > 0) {
                console.log(`[ActivityLog] Migrating ${parsed.length} legacy entries...`);
                // We'll let SyncManager's migrateUp handle this if remote is empty
                // but since the schema is slightly different (snake_case), we'll help it
                return parsed.map(mapper);
            }
        } catch (e) {
            console.error('Failed to parse legacy activity log:', e);
        }
    }
    return [];
};

// --- Store Exports ---

export const activityLog = {
    subscribe: manager.subscribe.bind(manager),
    get items() { return manager.items; },

    /**
     * Log a new activity event
     */
    logEvent(entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>): void {
        // The server generates the id. Failures are bookkeeping only: console, never the user.
        const newEntry = {
            ...entry,
            entityId: String(entry.entityId ?? ''),
            timestamp: new Date().toISOString(),
        };
        manager.create(newEntry as any, false, true).catch((e) => {
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
     * Clear all activity entries
     */
    async clear() {
        // Since it's a collection, we'd need to delete individual items or have a bulk delete
        // For activity log, we usually don't want mass deletion via simple API
        // For now, we'll just log that clear was attempted locally.
        console.warn('Activity log clearing is restricted to per-item deletion in sync mode.');
    },

    /**
     * Sync with backend
     */
    sync: () => manager.sync()
};
