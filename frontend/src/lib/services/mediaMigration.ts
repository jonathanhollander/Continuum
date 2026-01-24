/**
 * Media Migration Utility
 * Helps migrate media from IndexedDB to backend storage
 */

import { mediaStorage } from './indexedDB';
import { uploadMedia } from './mediaService';

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
    const DB_NAME = 'continuum_media_db';
    const STORE_NAME = 'media_blobs';

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME);

        request.onsuccess = () => {
            const db = request.result;

            // Check if the object store exists before trying to access it
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.close();
                resolve([]); // No store = no media to migrate
                return;
            }

            try {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const getAllKeysRequest = store.getAllKeys();

                getAllKeysRequest.onsuccess = () => {
                    db.close();
                    resolve(getAllKeysRequest.result as string[]);
                };

                getAllKeysRequest.onerror = () => {
                    db.close();
                    reject(getAllKeysRequest.error);
                };
            } catch (e) {
                db.close();
                resolve([]); // Store access failed = treat as empty
            }
        };

        request.onerror = () => {
            // Database doesn't exist or can't be opened - no media to migrate
            resolve([]);
        };
    });
}

/**
 * Parse media ID to extract module and reference info
 * Expected format: "heirlooms_<id>_image" or "properties_<id>_photo_<index>"
 */
function parseMediaId(id: string): { module: string; referenceId?: string; filename: string } {
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
    const { module, referenceId, filename } = parseMediaId(id);

    // Convert blob to File
    const file = new File([blob], filename, { type: blob.type });

    // Upload to backend
    const response = await uploadMedia(file, module, referenceId, `Migrated from IndexedDB: ${id}`);

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

                completed++;

                // Delete from IndexedDB after successful migration
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

        // Store migration mapping in localStorage for reference updates
        localStorage.setItem('media_migration_mapping', JSON.stringify(migrations));

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
