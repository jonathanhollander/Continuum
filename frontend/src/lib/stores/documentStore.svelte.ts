import { registerSync } from "$lib/services/sync.svelte";
import { mediaIdFromRef } from "$lib/services/mediaService";

export type DocType = "Will" | "Trust" | "Deed" | "Insurance" | "Tax" | "ID" | "Other";

// UI shape of a Document row (backend/estate_models.py). The Document Vault page, the dashboard,
// Settings › Data and the test factory all read it from this one store.
export interface Document {
    id: string;
    name: string;
    type: DocType;
    location: string; // where the original is kept
    witnesses?: string;
    signedDate?: string;
    nextReviewDate?: string;
    status: "verified" | "pending" | "needs_review";
    notes?: string;
    filePath?: string; // stored copy: "/api/media/12/download" (or an older data URL)
    mediaId?: number | null;
    customAttributes?: Record<string, any>;
    // Column twins, kept in step by the mapper
    title?: string;
    category?: string;
    locationPhysical?: string;
    isDigitized?: boolean;
}

/**
 * Document <-> Document row, used both ways by SyncManager.
 * UI fields win over their column twins, so an edit to `name` beats a stale `title`.
 */
function docMapper(d: any): any {
    const name = d.name || d.title || "";
    const type = d.type || d.category || "Other";
    const location = d.location ?? d.locationPhysical ?? "";
    const filePath = d.filePath || d.fileData || ""; // fileData: older device-only copies
    let custom = d.customAttributes;
    if (typeof custom === "string") {
        try { custom = JSON.parse(custom); } catch { custom = {}; }
    }
    return {
        id: d.id,
        name,
        title: name,
        type,
        category: type,
        location,
        locationPhysical: location,
        witnesses: d.witnesses ?? "",
        signedDate: d.signedDate ?? "",
        nextReviewDate: d.nextReviewDate ?? "",
        status: d.status || "verified",
        notes: d.notes ?? "",
        filePath,
        mediaId: d.mediaId ?? mediaIdFromRef(filePath),
        isDigitized: !!filePath,
        customAttributes: custom && typeof custom === "object" ? custom : {},
    };
}

/** The one manager for /api/data/documents. */
export const documentSync = registerSync<Document>('documents', 'documents', docMapper, '/api/data')
    .setAffirmationContext('documents');

export const documentStore = {
    subscribe: documentSync.subscribe.bind(documentSync),
    get items() { return documentSync.items; },
    get status() { return documentSync.status; },
    create: (item: Omit<Document, 'id'>) => documentSync.create(item as Document),
    update: (id: string | number, updates: Partial<Document>) => documentSync.update(id as any, updates as Document),
    delete: (id: string | number) => documentSync.delete(id as any),
    sync: () => documentSync.sync()
};
