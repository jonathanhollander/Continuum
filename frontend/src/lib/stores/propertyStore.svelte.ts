import { registerSync } from '$lib/services/sync.svelte';

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
}

// Initialize Sync Manager
export const propertySync = registerSync<PropertyItem>('properties', 'properties');

// Helper to calculate total valuation
function getTotalValuation() {
    return propertySync.items.reduce((sum, item) => sum + (item.valuation || 0), 0);
}

// Wrapper to maintain some compatibility with the old store pattern
// But updated for Runes (no subscribe)
export const propertyStore = {
    // items is a getter to access the reactive state
    get items() { return propertySync.items; },

    addItem: (item: Omit<PropertyItem, 'id'>) => {
        // SyncManager.create expects a partial item and handles ID generation if not present
        // But for strict typing, we ensure it matches
        return propertySync.create({
            ...item,
            id: crypto.randomUUID()
        });
    },

    updateItem: (id: string, updates: Partial<PropertyItem>) => {
        propertySync.update(id, updates);
    },

    deleteItem: (id: string) => {
        propertySync.delete(id);
    },

    getItem: (id: string) => {
        return propertySync.items.find(i => i.id === id);
    },

    getTotalValuation,

    getValuationByType: () => {
        return propertySync.items.reduce((acc, item) => {
            acc[item.type] = (acc[item.type] || 0) + (item.valuation || 0);
            return acc;
        }, {} as Record<string, number>);
    },

    // Store Compatibility
    subscribe: propertySync.subscribe.bind(propertySync)
};
