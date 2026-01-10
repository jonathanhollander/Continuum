import { get } from 'svelte/store';
import { createProfileStore } from './persistence';

export interface ActivityLogEntry {
    id: string;
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

// Migration Logic
const getInitialData = (): ActivityLogEntry[] => {
    if (typeof localStorage === 'undefined') return [];

    const unified = localStorage.getItem('continuum_owner_activity_log');
    if (unified) return [];

    const legacy = localStorage.getItem('continuum_activity_log');
    if (legacy) {
        try {
            return JSON.parse(legacy);
        } catch (e) {
            console.error('Failed to load activity log:', e);
        }
    }
    return [];
};

// Create the reactive, account-aware store
const activityLogStore = createProfileStore<ActivityLogEntry[]>('activity_log', getInitialData());

// Public API
export const activityLog = {
    subscribe: activityLogStore.subscribe,

    /**
     * Log a new activity event
     */
    logEvent(entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>): void {
        const newEntry: ActivityLogEntry = {
            ...entry,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
        };

        activityLogStore.update((entries) => [newEntry, ...entries]);
    },

    /**
     * Get all activity entries
     */
    getAll(): ActivityLogEntry[] {
        return get(activityLogStore);
    },

    /**
     * Get entries filtered by module
     */
    getByModule(module: string): ActivityLogEntry[] {
        return get(activityLogStore).filter((entry) => entry.module === module);
    },

    /**
     * Get entries filtered by action type
     */
    getByAction(action: ActivityLogEntry['action']): ActivityLogEntry[] {
        return get(activityLogStore).filter((entry) => entry.action === action);
    },

    /**
     * Get entries within a date range
     */
    getByDateRange(start: Date, end: Date): ActivityLogEntry[] {
        return get(activityLogStore).filter((entry) => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= start && entryDate <= end;
        });
    },

    /**
     * Search entries by entity name or change details
     */
    search(query: string): ActivityLogEntry[] {
        const lowerQuery = query.toLowerCase();
        return get(activityLogStore).filter((entry) => {
            // Search in entity name
            if (entry.entityName.toLowerCase().includes(lowerQuery)) {
                return true;
            }
            // Search in change fields
            if (entry.changes) {
                return entry.changes.some(
                    (change) =>
                        change.field.toLowerCase().includes(lowerQuery) ||
                        String(change.oldValue).toLowerCase().includes(lowerQuery) ||
                        String(change.newValue).toLowerCase().includes(lowerQuery)
                );
            }
            return false;
        });
    },

    /**
     * Export activity log as JSON string
     */
    exportAsJSON(): string {
        return JSON.stringify(get(activityLogStore), null, 2);
    },

    /**
     * Export activity log as CSV string
     */
    exportAsCSV(): string {
        const entries = get(activityLogStore);
        if (entries.length === 0) return '';

        const headers = ['Timestamp', 'Module', 'Action', 'Entity Type', 'Entity Name', 'User', 'Changes'];
        const rows = entries.map((entry) => [
            entry.timestamp,
            entry.module,
            entry.action,
            entry.entityType,
            entry.entityName,
            entry.userContext,
            entry.changes
                ? entry.changes.map((c) => `${c.field}: ${c.oldValue} → ${c.newValue}`).join('; ')
                : '',
        ]);

        return [
            headers.join(','),
            ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
        ].join('\n');
    },

    /**
     * Clear all activity entries (with confirmation)
     */
    clear(): void {
        activityLogStore.set([]);
    },

    /**
     * Get count of entries from today
     */
    getTodayCount(): number {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return get(activityLogStore).filter((entry) => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= today && entryDate < tomorrow;
        }).length;
    },

    /**
     * Get storage size in bytes
     */
    getStorageSize(): number {
        if (typeof window === 'undefined') return 0;
        const accId = localStorage.getItem('continuum_active_account_id') || 'anonymous';
        const stored = localStorage.getItem(`continuum_acc_${accId}_activity_log`);
        return stored ? new Blob([stored]).size : 0;
    },
};
