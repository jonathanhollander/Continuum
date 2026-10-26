import { registerSync } from "$lib/services/sync.svelte";
import { deleteMedia, mediaIdFromRef } from "$lib/services/mediaService";

/** A stored evidence file: the media id plus what the gallery needs to show it.
 *  One-word keys, so the wire's snake-casing leaves them as they are. */
export interface EvidenceItem {
    id: number; // media id
    filename: string;
    mime: string;
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
    thumbnail?: string; // Cover: the media id of one evidence image
    custom_attributes?: string; // JSON string of custom field values
}

// Asset.purchaseDate travels as a plain YYYY-MM-DD string; the server may return a full timestamp
// Only entries that point at a stored media file are kept; older entries held
// page-local `blob:` URLs that no longer open, so they are left out.
function parseEvidence(v: any): EvidenceItem[] | undefined {
    if (v === undefined) return undefined;
    let list: any = v;
    if (typeof v === 'string') {
        try {
            list = v ? JSON.parse(v) : [];
        } catch {
            list = [];
        }
    }
    if (!Array.isArray(list)) return [];
    return list.flatMap((e: any) => {
        const id = mediaIdFromRef(e?.id);
        return id === null ? [] : [{ id, filename: String(e.filename ?? ''), mime: String(e.mime ?? '') }];
    });
}

function parseCover(v: any): string | undefined {
    if (v === undefined) return undefined;
    const id = mediaIdFromRef(v);
    return id === null ? '' : String(id);
}

/** Every media id a property holds (evidence and cover). */
function propertyMediaIds(item: PropertyItem | undefined): number[] {
    if (!item) return [];
    const ids = new Set((item.evidence ?? []).map((e) => e.id));
    const cover = mediaIdFromRef(item.thumbnail);
    if (cover !== null) ids.add(cover);
    return [...ids];
}

const propertyMapper = (item: any) => {
    if (!item) return item;
    return {
        ...item,
        purchaseDate: typeof item.purchaseDate === 'string' && item.purchaseDate
            ? item.purchaseDate.slice(0, 10)
            : item.purchaseDate,
        // Wire is JSON text (sync.svelte.ts stringifies on write); keep an array locally
        evidence: parseEvidence(item.evidence),
        thumbnail: parseCover(item.thumbnail)
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
        const mediaIds = propertyMediaIds(propertySync.items.find((i) => String(i.id) === String(id)));
        // The files go once the record is really gone, including after Try Again on a failed remove.
        return propertySync.delete(id, mediaIds.length === 0 ? undefined : async () => {
            const results = await Promise.allSettled(mediaIds.map((m) => deleteMedia(m)));
            results.forEach((r, i) => {
                if (r.status === 'rejected') console.warn('[property] evidence removal paused', mediaIds[i], r.reason);
            });
        });
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
