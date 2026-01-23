import { registerSync } from "$lib/services/sync.svelte.ts";

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
        const newEntry: ActivityLogEntry = {
            ...entry,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
        };

        // SyncManager create will handle the API call
        manager.create(newEntry);
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
