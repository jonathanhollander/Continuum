// One account-owned byte store, also used by the upload and recovery services.
export { mediaStorage } from '$lib/services/indexedDB';
import type { PendingMediaUpload } from '$lib/services/indexedDB';

type Row = Record<string, unknown>;
const mediaUrl = /^(?:https?:\/\/[^/]+)?\/api\/media\/(\d+)\/download(?:\?[^#]*)?$/;
const numeric = (v: unknown): number | null => typeof v === 'number' || typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : null;
const object = (v: unknown): v is Row => !!v && typeof v === 'object' && !Array.isArray(v);

/** Only attachment fields are changed; author text and custom keys stay verbatim. */
export function mediaReferences(section: string, row: Row, replace?: { ids: Set<number>; target: PendingMediaUpload }): { ids: Set<number>; updates: Row } {
    const ids = new Set<number>();
    const updates: Row = {};
    const match = (v: unknown) => {
        const id = numeric(v);
        if (id !== null) ids.add(id);
        return id !== null && replace?.ids.has(id) && id !== replace.target.id;
    };
    for (const [field, value] of Object.entries(row)) {
        if (field === 'media_id' || section === 'assets' && field === 'thumbnail') {
            if (match(value)) updates[field] = typeof value === 'string' ? String(replace!.target.id) : replace!.target.id;
        } else if (field === 'custom_attributes' || section === 'assets' && field === 'evidence') {
            let parsed: unknown;
            try { parsed = typeof value === 'string' ? JSON.parse(value) : value; } catch { continue; }
            let changed = false;
            if (field === 'evidence' && Array.isArray(parsed)) {
                parsed = parsed.map(item => {
                    if (!object(item) || !match(item.id)) return item;
                    changed = true;
                    return { ...item, id: replace!.target.id, filename: replace!.target.filename, mime: replace!.target.mime_type };
                });
            } else if (object(parsed) && object(parsed._media) && match(parsed._media.id)) {
                changed = true;
                parsed = { ...parsed, _media: { ...parsed._media, ...replace!.target } };
            }
            if (changed) updates[field] = typeof value === 'string' ? JSON.stringify(parsed) : parsed;
        } else if (typeof value === 'string') {
            const url = value.match(mediaUrl);
            if (url && match(url[1])) updates[field] = replace!.target.download_url;
        }
    }
    return { ids, updates };
}
