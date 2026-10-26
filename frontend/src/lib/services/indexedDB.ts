/**
 * DEPRECATED: This IndexedDB-based media storage is being replaced with backend storage.
 * Use mediaService.ts for new implementations.
 * This file is kept for backward compatibility and migration purposes only.
 */

const DB_NAME = 'continuum_media_db';
const STORE_NAME = 'media_blobs';
let dbPromise: Promise<IDBDatabase> | null = null;

function openAt(version?: number): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = version ? indexedDB.open(DB_NAME, version) : indexedDB.open(DB_NAME);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            // Another tab upgrading the database: let it, and reopen on next use
            db.onversionchange = () => {
                db.close();
                dbPromise = null;
            };
            resolve(db);
        };
        request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
    });
}

/**
 * Open at whatever version exists. A database created without the store (an
 * earlier open with no version made an empty v1) is upgraded once to add it.
 */
function getDB(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;
    dbPromise = (async () => {
        const db = await openAt();
        if (db.objectStoreNames.contains(STORE_NAME)) return db;
        const next = db.version + 1;
        db.close();
        return openAt(next);
    })();
    dbPromise.catch(() => {
        dbPromise = null;
    });
    return dbPromise;
}

/** Server media id for a local id that mediaMigration has moved (localStorage `media_migration_mapping`). */
function migratedServerId(id: string): number | null {
    try {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('media_migration_mapping') : null;
        if (!raw) return null;
        const entry = (JSON.parse(raw) as Array<{ oldId: string; newId: number }>).find((m) => m.oldId === id);
        return entry ? entry.newId : null;
    } catch {
        return null;
    }
}

export const mediaStorage = {
    save: async (id: string, blob: Blob): Promise<void> => {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(blob, id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    keys: async (): Promise<string[]> => {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const request = db.transaction([STORE_NAME], 'readonly').objectStore(STORE_NAME).getAllKeys();
            request.onsuccess = () => resolve(request.result as string[]);
            request.onerror = () => reject(request.error);
        });
    },

    get: async (id: string): Promise<Blob | undefined> => {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    delete: async (id: string): Promise<void> => {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    getUrl: async (id: string): Promise<string | null> => {
        try {
            const blob = await mediaStorage.get(id);
            if (blob) {
                return URL.createObjectURL(blob);
            }
            // Moved to the server by mediaMigration: records still hold the old id,
            // so follow the migration mapping to the server copy.
            const serverId = migratedServerId(id);
            if (serverId !== null) {
                const { getMediaBlobUrl } = await import('./mediaService');
                return await getMediaBlobUrl(serverId);
            }
            return null;
        } catch (error) {
            console.error("Error generating URL for media:", error);
            return null;
        }
    }
};
