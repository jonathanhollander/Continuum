/**
 * Media Migration Utility
 * Helps migrate media from IndexedDB to backend storage
 */

import { mediaStorage } from './indexedDB';
import { uploadMediaDirect, verifyMediaRetrieval } from './mediaService';

export interface MigrationProgress {
    total: number;
    completed: number;
    failed: number;
    current: string;
}

export interface MigrationResult {
    success: boolean;
    total: number;
    migrated: number;
    failed: number;
    errors: Array<{ id: string; error: string }>;
}

/**
 * Get all media IDs from IndexedDB
 */
async function getAllMediaIds(): Promise<string[]> {
    // Through indexedDB.ts, so the store is created with the database (a bare
    // open here used to create an empty database that never got its store)
    try {
        return await mediaStorage.keys();
    } catch {
        return [];
    }
}

/**
 * Parse media ID to extract module and reference info
 * Expected format: "heirlooms_<id>_image" or "properties_<id>_photo_<index>"
 */
const EXTENSION_BY_TYPE: Record<string, string> = {
    'application/pdf': 'pdf', 'text/plain': 'txt', 'text/csv': 'csv',
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp', 'image/heic': 'heic',
    'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov',
    'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a'
};

function parseMediaId(id: string, blob?: Blob): { module: string; referenceId?: string; filename: string } {
    // Uploads that mediaService kept locally: "pending:<module>:<referenceId>:<time>"
    if (id.startsWith('pending:')) {
        const [, module, referenceId] = id.split(':');
        const name = blob instanceof File && blob.name ? blob.name : `${id.replace(/:/g, '_')}`;
        return { module: module || 'general', referenceId: referenceId || undefined, filename: name };
    }
    const typed = blob?.type ? EXTENSION_BY_TYPE[blob.type.split(';')[0].trim().toLowerCase()] : undefined;
    const parsed = parseLegacyId(id);
    if (blob instanceof File && blob.name) parsed.filename = blob.name;
    else if (typed) parsed.filename = parsed.filename.replace(/\.[a-z0-9]+$/, `.${typed}`);
    return parsed;
}

function parseLegacyId(id: string): { module: string; referenceId?: string; filename: string } {
    const parts = id.split('_');

    // Default values
    let module = 'general';
    let referenceId: string | undefined;
    let filename = `${id}.jpg`; // Default extension

    if (parts.length >= 2) {
        // First part is usually the module
        const moduleMap: Record<string, string> = {
            'heirlooms': 'heirlooms',
            'heirloom': 'heirlooms',
            'properties': 'properties',
            'property': 'properties',
            'visual': 'visual_memories',
            'visualmemory': 'visual_memories',
            'timecapsule': 'time_capsules',
            'capsule': 'time_capsules'
        };

        const detectedModule = moduleMap[parts[0].toLowerCase()];
        if (detectedModule) {
            module = detectedModule;
            referenceId = parts[1];

            // Try to determine file type from the ID
            const idLower = id.toLowerCase();
            if (idLower.includes('video')) {
                filename = `${id}.mp4`;
            } else if (idLower.includes('audio')) {
                filename = `${id}.mp3`;
            } else {
                filename = `${id}.jpg`;
            }
        }
    }

    return { module, referenceId, filename };
}

/**
 * Migrate a single media file from IndexedDB to backend
 */
async function migrateSingleMedia(
    id: string,
    onProgress?: (id: string) => void
): Promise<{ id: string; mediaId: number; downloadUrl: string }> {
    if (onProgress) onProgress(id);

    // Get blob from IndexedDB
    const blob = await mediaStorage.get(id);
    if (!blob) {
        throw new Error('Media not found in IndexedDB');
    }

    // Parse ID to get module info
    const { module, referenceId, filename } = parseMediaId(id, blob);

    // Convert blob to File
    const file = new File([blob], filename, { type: blob.type });

    // Upload to backend (the original stays in IndexedDB until it reads back)
    const response = await uploadMediaDirect(file, module, referenceId, `Migrated from IndexedDB: ${id}`);

    if (!(await verifyMediaRetrieval(response.id, file.size))) {
        throw new Error(`Server copy ${response.id} did not read back yet; the local original is kept`);
    }

    return {
        id,
        mediaId: response.id,
        downloadUrl: response.download_url
    };
}

/**
 * Migrate all media from IndexedDB to backend
 */
export async function migrateAllMedia(
    onProgress?: (progress: MigrationProgress) => void
): Promise<MigrationResult> {
    const errors: Array<{ id: string; error: string }> = [];
    const migrations: Array<{ oldId: string; newId: number; downloadUrl: string }> = [];

    try {
        // Get all media IDs from IndexedDB
        const mediaIds = await getAllMediaIds();
        const total = mediaIds.length;

        if (total === 0) {
            return {
                success: true,
                total: 0,
                migrated: 0,
                failed: 0,
                errors: []
            };
        }

        let completed = 0;
        let failed = 0;

        // Migrate each file
        for (const id of mediaIds) {
            try {
                const result = await migrateSingleMedia(id, (currentId) => {
                    if (onProgress) {
                        onProgress({
                            total,
                            completed,
                            failed,
                            current: currentId
                        });
                    }
                });

                migrations.push({
                    oldId: result.id,
                    newId: result.mediaId,
                    downloadUrl: result.downloadUrl
                });
                // Record the mapping before removing the original, so records that
                // still hold the old id resolve to the server copy (indexedDB.ts getUrl)
                saveMigrationMapping(migrations);

                completed++;

                // The server copy read back with the same size, so the local original can go
                await mediaStorage.delete(id);

            } catch (error: any) {
                console.error(`Failed to migrate ${id}:`, error);
                errors.push({
                    id,
                    error: error.message || 'Unknown error'
                });
                failed++;
            }

            // Update progress
            if (onProgress) {
                onProgress({
                    total,
                    completed,
                    failed,
                    current: id
                });
            }
        }


        return {
            success: failed === 0,
            total,
            migrated: completed,
            failed,
            errors
        };

    } catch (error: any) {
        console.error('Migration failed:', error);
        return {
            success: false,
            total: 0,
            migrated: 0,
            failed: 0,
            errors: [{ id: 'migration', error: error.message }]
        };
    }
}

/** Merge new entries into the stored mapping (earlier runs are kept). */
function saveMigrationMapping(entries: Array<{ oldId: string; newId: number; downloadUrl: string }>): void {
    let existing: Array<{ oldId: string; newId: number; downloadUrl: string }> = [];
    try {
        existing = JSON.parse(localStorage.getItem('media_migration_mapping') || '[]');
        if (!Array.isArray(existing)) existing = [];
    } catch {
        existing = [];
    }
    const byOld = new Map(existing.map((m) => [m.oldId, m]));
    for (const m of entries) byOld.set(m.oldId, m);
    localStorage.setItem('media_migration_mapping', JSON.stringify([...byOld.values()]));
}

/**
 * Get migration mapping from localStorage
 * Returns map of oldId -> { newId, downloadUrl }
 */
export function getMigrationMapping(): Record<string, { newId: number; downloadUrl: string }> {
    const mapping = localStorage.getItem('media_migration_mapping');
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
export function clearMigrationMapping(): void {
    localStorage.removeItem('media_migration_mapping');
}

/**
 * Check if migration is needed (IndexedDB has media)
 */
export async function needsMigration(): Promise<boolean> {
    try {
        const mediaIds = await getAllMediaIds();
        return mediaIds.length > 0;
    } catch {
        return false;
    }
}
