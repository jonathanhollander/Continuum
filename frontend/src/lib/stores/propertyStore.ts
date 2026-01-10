import { createProfileStore } from './persistence';
import { get } from 'svelte/store';

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

const DEFAULT_PROPERTIES: PropertyItem[] = [];

// Migration / Initialization Logic
const getInitialData = (): PropertyItem[] => {
    if (typeof localStorage === 'undefined') return DEFAULT_PROPERTIES;

    // Unified check
    const unified = localStorage.getItem('continuum_owner_property_items');
    if (unified) return DEFAULT_PROPERTIES;

    // Legacy fallback
    const legacy = localStorage.getItem('continuum_property_items');
    if (legacy) {
        try {
            const parsed = JSON.parse(legacy);
            return Array.isArray(parsed) ? parsed : DEFAULT_PROPERTIES;
        } catch { /* ignore */ }
    }
    return DEFAULT_PROPERTIES;
};

function createReactivePropertyStore() {
    const store = createProfileStore<PropertyItem[]>('property_items', getInitialData());
    const { subscribe, update } = store;

    return {
        subscribe,
        addItem: (item: Omit<PropertyItem, 'id'>) => {
            const newItem: PropertyItem = {
                ...item,
                id: crypto.randomUUID(),
            };
            update(items => [...items, newItem]);
            return newItem;
        },
        updateItem: (id: string, updates: Partial<PropertyItem>) => {
            update(items => items.map(i => i.id === id ? { ...i, ...updates } : i));
        },
        deleteItem: (id: string) => {
            update(items => items.filter(i => i.id !== id));
        },
        // Getters - operate on current synchronous value
        getItem: (id: string): PropertyItem | undefined => {
            return get(store).find(i => i.id === id);
        },
        getTotalValuation: () => {
            return get(store).reduce((sum, item) => sum + item.valuation, 0);
        },
        getValuationByType: () => {
            const items = get(store);
            return items.reduce((acc, item) => {
                acc[item.type] = (acc[item.type] || 0) + item.valuation;
                return acc;
            }, {} as Record<string, number>);
        }
    };
}

export const propertyStore = createReactivePropertyStore();
