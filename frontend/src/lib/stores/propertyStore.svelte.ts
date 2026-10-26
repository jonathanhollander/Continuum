import { registerSync } from "$lib/services/sync.svelte";

export interface EvidenceItem {
    id: string;
    type: 'image' | 'video';
    url: string; // Blob URL or remote URL
    thumbnailUrl?: string; // Optional for videos
    name: string;
    dateAdded: number;
    size?: number;
}

export interface PropertyItem {
    id: string;
    name: string;
    type: 'Real Estate' | 'Vehicle' | 'Personal Property' | 'Valuable' | 'Other';
    location: string;
    valuation: number;
    purchaseDate?: string;
    status: 'Owned' | 'Leased' | 'Mortgaged' | 'Sold';
    ownershipDetails: string; // e.g. Joint, Sole, Business
    documents: string; // e.g. Deed, Title, Appraisals
    maintenanceSchedule?: string;
    notes: string;
    evidence?: EvidenceItem[];
    thumbnail?: string; // Cover image URL
    custom_attributes?: string; // JSON string of custom field values
}

// Asset.purchaseDate travels as a plain YYYY-MM-DD string; the server may return a full timestamp
function parseEvidence(v: any): EvidenceItem[] | undefined {
    if (Array.isArray(v) || v === undefined || v === null) return v ?? undefined;
    if (typeof v === 'string' && v) {
        try {
            const parsed = JSON.parse(v);
            if (Array.isArray(parsed)) return parsed;
        } catch { }
    }
    return [];
}

const propertyMapper = (item: any) => {
    if (!item) return item;
    return {
        ...item,
        purchaseDate: typeof item.purchaseDate === 'string' && item.purchaseDate
            ? item.purchaseDate.slice(0, 10)
            : item.purchaseDate,
        // Wire is JSON text (sync.svelte.ts stringifies on write); keep an array locally
        evidence: parseEvidence(item.evidence)
    };
};

// Initialize Sync Manager
export const propertySync = registerSync<PropertyItem>('properties', 'properties', propertyMapper).setAffirmationContext('general');

// Helper to calculate total valuation
function getTotalValuation() {
    return propertySync.items.reduce((sum, item) => sum + (item.valuation || 0), 0);
}

// Wrapper to maintain some compatibility with the old store pattern
// But updated for Runes (no subscribe)
export const propertyStore = {
    // items is a getter to access the reactive state
    get items() { return propertySync.items; },

    addItem: (item: Omit<PropertyItem, 'id'>, onRetry?: () => Promise<unknown>) => {
        // SyncManager.create expects a partial item and handles ID generation if not present
        // But for strict typing, we ensure it matches
        return propertySync.create({
            ...item,
            id: crypto.randomUUID()
        }, false, false, onRetry);
    },

    updateItem: (id: string, updates: Partial<PropertyItem>) => {
        return propertySync.update(id, updates);
    },

    deleteItem: (id: string) => {
        return propertySync.delete(id);
    },

    getItem: (id: string) => {
        return propertySync.items.find(i => i.id === id);
    },

    getTotalValuation,

    sync: () => propertySync.sync(),

    getValuationByType: () => {
        return propertySync.items.reduce((acc, item) => {
            acc[item.type] = (acc[item.type] || 0) + (item.valuation || 0);
            return acc;
        }, {} as Record<string, number>);
    },

    // Store Compatibility
    subscribe: propertySync.subscribe.bind(propertySync)
};
