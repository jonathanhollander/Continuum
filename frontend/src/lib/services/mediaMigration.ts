import { browserStorage } from "./browserStorage";
/** Recover current account uploads only after their durable record links read back. */
import { API_BASE_URL } from '$lib/config';
import { mediaStorage, captureMediaOwner, requireMediaOwner, mediaMappingKey, type MediaOwner, type PendingMediaUpload } from './indexedDB';
import { uploadMediaDirect, verifyMediaRetrieval } from './mediaService';
import { SessionChangedError, sessionToken } from './sessionOwnership';
import { mediaReferences } from '$lib/utils/mediaStorage';
import type { Snapshot } from './exportService';

export interface MigrationProgress { total: number; completed: number; failed: number; current: string }
export interface MigrationResult { success: boolean; total: number; migrated: number; failed: number; errors: Array<{ id: string; error: string }> }
export interface PendingMediaSummary { id: string; filename: string; area: string; canRecover: boolean }

const areas: Record<string, string> = {
    heirlooms: 'heirlooms', properties: 'properties', visual_memories: 'visual-memories',
    time_capsules: 'time-capsule', documents: 'legal-documents', financial: 'financial-accounts',
    insurance: 'insurance', pets: 'pets', medical_directives: 'medical'
};
function fileInfo(id: string, blob: Blob) {
    const [, module, referenceId] = id.split(':');
    return { module: module || 'general', referenceId: referenceId || undefined,
        filename: blob instanceof File && blob.name ? blob.name : 'Browser copy',
        area: `/modules/${areas[module] || 'legal-documents'}` };
}
export async function listPendingMedia(owner = requireMediaOwner()): Promise<PendingMediaSummary[]> {
    const summaries: PendingMediaSummary[] = [];
    for (const id of await mediaStorage.keys(owner)) {
        const pending = await mediaStorage.getPending(id, owner);
        requireMediaOwner(owner);
        if (!pending) continue;
        const info = fileInfo(id, pending.blob);
        summaries.push({ id, filename: pending.uploads[0]?.filename || info.filename, area: info.area, canRecover: pending.uploads.length > 0 });
    }
    return summaries;
}
export async function savePendingCopy(id: string, owner = requireMediaOwner()): Promise<void> {
    const pending = await mediaStorage.getPending(id, owner);
    requireMediaOwner(owner);
    if (!pending) throw new Error('Please refresh the browser copy list.');
    const url = URL.createObjectURL(pending.blob);
    try {
        const link = document.createElement('a');
        link.href = url;
        link.download = pending.uploads[0]?.filename || fileInfo(id, pending.blob).filename;
        link.click();
    } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
async function request(path: string, owner: MediaOwner, body?: Record<string, unknown>): Promise<any> {
    requireMediaOwner(owner);
    const token = sessionToken(owner.session);
    const response = await fetch(`${API_BASE_URL}${path}`, { method: body ? 'PUT' : 'GET',
        headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}) });
    requireMediaOwner(owner);
    if (!response.ok) throw new Error('The browser original is kept. Try its saved record again when you are ready.');
    const value = await response.json();
    requireMediaOwner(owner);
    return value;
}
function collectionPath(section: string): string {
    const dedicated: Record<string, string> = { visual_memories: '/api/memories/visual', family_memories: '/api/memories/family',
        external_archives: '/api/memories/archives', contacts: '/api/contacts', medical_profiles: '/api/medical/profile' };
    return dedicated[section] || `/api/data/${section}`;
}
const rowId = (section: string, row: Record<string, unknown>) => section === 'medical_profiles' ? 'profile' : String(row.id);
const snapshot = (owner: MediaOwner): Promise<Snapshot> => request('/api/export/snapshot', owner);
async function exactCopy(id: number, original: Blob, owner: MediaOwner): Promise<boolean> {
    const verified = await verifyMediaRetrieval(id, original, owner.session);
    requireMediaOwner(owner);
    return verified;
}
async function recoverFile(id: string, owner: MediaOwner): Promise<void> {
    const pending = await mediaStorage.getPending(id, owner);
    requireMediaOwner(owner);
    if (!pending?.uploads.length) throw new Error('Save a copy, then add it to the record you choose.');
    const sourceIds = new Set(pending.uploads.map(u => u.id));
    const initial = await snapshot(owner);
    const parents = Object.entries(initial.sections).flatMap(([section, rows]) => rows
        .filter(row => [...mediaReferences(section, row).ids].some(mid => sourceIds.has(mid)))
        .map(row => ({ section, id: rowId(section, row) })));
    if (!parents.length) throw new Error('Save a copy, then add it to the record you choose.');

    let target: PendingMediaUpload | undefined;
    for (const upload of [...pending.uploads].reverse()) {
        if (await exactCopy(upload.id, pending.blob, owner)) { target = upload; break; }
    }
    if (!target) {
        const info = fileInfo(id, pending.blob);
        target = await uploadMediaDirect(new File([pending.blob], pending.uploads[0].filename, { type: pending.blob.type }),
            info.module, info.referenceId, undefined, undefined, owner.session);
        requireMediaOwner(owner);
        // Remember the returned identity before any parent write. A retry reuses it even
        // if a previous parent PUT committed but its response was interrupted.
        await mediaStorage.rememberUpload(id, target, owner);
        sourceIds.add(target.id);
        if (!(await exactCopy(target.id, pending.blob, owner))) throw new Error('The browser original is kept while its account copy waits to read back.');
    }
    for (const parent of parents) {
        const path = collectionPath(parent.section);
        const collection = await request(path, owner);
        const rows = Array.isArray(collection) ? collection : [collection];
        const fresh = rows.find(row => row && rowId(parent.section, row) === parent.id);
        if (!fresh || ![...mediaReferences(parent.section, fresh).ids].some(mid => sourceIds.has(mid))) {
            throw new Error('The saved record changed. Your browser copy is ready to save separately.');
        }
        const { updates } = mediaReferences(parent.section, fresh, { ids: sourceIds, target });
        if (Object.keys(updates).length) await request(parent.section === 'medical_profiles' ? path : `${path}/${encodeURIComponent(parent.id)}`, owner, updates);
    }
    const verified = await snapshot(owner);
    // A second record can acquire an old reference during this run. Keep the original
    // for another pass, including references in author text that we never rewrite.
    if ([...verified.attachments, ...verified.missing_attachments].some(a => sourceIds.has(a.media_id) && a.media_id !== target.id)) {
        throw new Error('The browser original is kept while its other saved record links are checked.');
    }
    for (const parent of parents) {
        const row = verified.sections[parent.section]?.find(row => rowId(parent.section, row) === parent.id);
        const refs = row && mediaReferences(parent.section, row).ids;
        if (!refs?.has(target.id) || [...refs].some(mid => sourceIds.has(mid) && mid !== target.id)
            || !verified.attachments.some(a => a.media_id === target!.id && a.records.some(r => r.section === parent.section && String(r.id) === parent.id))) {
            throw new Error('The browser original is kept while its saved record waits to read back.');
        }
    }
    if (!(await exactCopy(target.id, pending.blob, owner))) throw new Error('The browser original is kept while its account copy waits to read back.');
    requireMediaOwner(owner);
    saveMigrationMapping([{ oldId: id, newId: target.id, downloadUrl: target.download_url }], owner);
    await mediaStorage.delete(id, owner);
}
export async function migrateAllMedia(onProgress?: (progress: MigrationProgress) => void, owner = requireMediaOwner()): Promise<MigrationResult> {
    const errors: MigrationResult['errors'] = [];
    const ids = await mediaStorage.keys(owner);
    let migrated = 0;
    for (const id of ids) {
        requireMediaOwner(owner);
        onProgress?.({ total: ids.length, completed: migrated, failed: errors.length, current: id });
        try { await recoverFile(id, owner); migrated++; }
        catch (error) {
            if (error instanceof SessionChangedError) throw error;
            errors.push({ id, error: error instanceof Error ? error.message : 'The browser original is kept. Please try again.' });
        }
    }
    requireMediaOwner(owner);
    return { success: errors.length === 0, total: ids.length, migrated, failed: errors.length, errors };
}

/** Merge new entries into the stored mapping (earlier runs are kept). */
function saveMigrationMapping(entries: Array<{ oldId: string; newId: number; downloadUrl: string }>, owner: MediaOwner): void {
    requireMediaOwner(owner);
    let existing: Array<{ oldId: string; newId: number; downloadUrl: string }> = [];
    try {
        existing = JSON.parse(browserStorage.getItem(mediaMappingKey(owner)) || '[]');
        if (!Array.isArray(existing)) existing = [];
    } catch {
        existing = [];
    }
    const byOld = new Map(existing.map((m) => [m.oldId, m]));
    for (const m of entries) byOld.set(m.oldId, m);
    requireMediaOwner(owner);
    browserStorage.setItem(mediaMappingKey(owner), JSON.stringify([...byOld.values()]));
}

/**
 * Get migration mapping from localStorage
 * Returns map of oldId -> { newId, downloadUrl }
 */
export function getMigrationMapping(owner = captureMediaOwner()): Record<string, { newId: number; downloadUrl: string }> {
    if (!owner) return {};
    requireMediaOwner(owner);
    const mapping = browserStorage.getItem(mediaMappingKey(owner));
    if (!mapping) return {};

    try {
        const migrations = JSON.parse(mapping);
        const map: Record<string, { newId: number; downloadUrl: string }> = {};

        for (const m of migrations) {
            map[m.oldId] = {
                newId: m.newId,
                downloadUrl: m.downloadUrl
            };
        }

        return map;
    } catch {
        return {};
    }
}

/**
 * Clear migration mapping after successful reference updates
 */
export function clearMigrationMapping(owner = requireMediaOwner()): void {
    requireMediaOwner(owner);
    browserStorage.removeItem(mediaMappingKey(owner));
}

export async function needsMigration(owner = captureMediaOwner()): Promise<boolean> {
    if (!owner) return false;
    try { return (await mediaStorage.keys(owner)).length > 0; } catch { return false; }
}
