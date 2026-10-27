import { browserStorage } from "./browserStorage";
/** Account-owned local originals, retained until their server copy reads back. */
import {
    assertCurrentSession, captureSession, isCurrentSession, SessionChangedError,
    type SessionOwnership,
} from './sessionOwnership';

const DB_NAME = 'continuum_media_db';
const STORE_NAME = 'media_blobs';
let dbPromise: Promise<IDBDatabase> | null = null;

export interface MediaOwner {
    readonly account: string;
    readonly session: SessionOwnership;
}

/** The identities returned for this original, including an interrupted recovery upload. */
export interface PendingMediaUpload {
    id: number;
    filename: string;
    mime_type: string;
    file_size: number;
    download_url: string;
}
export interface PendingMediaFile {
    blob: Blob;
    uploads: PendingMediaUpload[];
}

function pendingFile(value: unknown): PendingMediaFile | undefined {
    if (value instanceof Blob) return { blob: value, uploads: [] };
    if (!value || typeof value !== 'object' || !('blob' in value) || !(value.blob instanceof Blob)) return undefined;
    const uploads = 'uploads' in value && Array.isArray(value.uploads) ? value.uploads : [];
    return { blob: value.blob, uploads };
}

export const MEDIA_STORAGE_CHANGED = 'continuum:media-storage-changed';
const activeUploads = new Set<string>();
const accountNow = () => (browserStorage.getItem('continuum_active_account') || '').trim();

export function captureMediaOwner(): MediaOwner | null {
    const session = captureSession();
    const account = accountNow();
    return account && session.token && isCurrentSession(session) ? { account, session } : null;
}

export function isCurrentMediaOwner(owner: MediaOwner): boolean {
    return owner.account === accountNow() && isCurrentSession(owner.session);
}

export function requireMediaOwner(owner: MediaOwner | null = captureMediaOwner()): MediaOwner {
    if (!owner) throw new SessionChangedError();
    assertCurrentSession(owner.session);
    if (owner.account !== accountNow()) throw new SessionChangedError();
    return owner;
}

const prefixFor = (owner: MediaOwner) => `account:${encodeURIComponent(owner.account)}:`;
const ownedKey = (id: string, owner: MediaOwner) => prefixFor(owner) + id;
export const mediaMappingKey = (owner: MediaOwner) => `media_migration_mapping:${encodeURIComponent(owner.account)}`;

function changed(owner: MediaOwner) {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(MEDIA_STORAGE_CHANGED, { detail: { account: owner.account } }));
    }
}

function openAt(version?: number): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = version ? indexedDB.open(DB_NAME, version) : indexedDB.open(DB_NAME);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
        };
        request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            db.onversionchange = () => { db.close(); dbPromise = null; };
            resolve(db);
        };
        request.onerror = () => reject(request.error);
    });
}

function getDB(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;
    dbPromise = (async () => {
        const db = await openAt();
        if (db.objectStoreNames.contains(STORE_NAME)) return db;
        const next = db.version + 1;
        db.close();
        return openAt(next);
    })();
    dbPromise.catch(() => { dbPromise = null; });
    return dbPromise;
}

async function requestFor<T>(owner: MediaOwner, mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T>,
    afterRead?: (value: T, store: IDBObjectStore) => void): Promise<T> {
    requireMediaOwner(owner);
    const db = await getDB();
    requireMediaOwner(owner);
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], mode);
        const store = transaction.objectStore(STORE_NAME);
        const request = action(store);
        let result: T;
        request.onsuccess = () => {
            try {
                requireMediaOwner(owner);
                result = request.result;
                afterRead?.(result, store);
            }
            catch (error) { transaction.abort(); reject(error); }
        };
        transaction.oncomplete = () => {
            try {
                requireMediaOwner(owner);
                if (mode === 'readwrite') changed(owner);
                resolve(result);
            } catch (error) { reject(error); }
        };
        transaction.onerror = () => reject(request.error || transaction.error);
        transaction.onabort = () => reject(request.error || transaction.error || new SessionChangedError());
    });
}

export const mediaStorage = {
    // Holds are page-local: interrupted uploads become recoverable after reload. They prevent
    // the recovery notice offering a backup while that file's original upload is still running.
    hold: (id: string, owner: MediaOwner) => { requireMediaOwner(owner); activeUploads.add(ownedKey(id, owner)); },
    release: (id: string, owner: MediaOwner) => { activeUploads.delete(ownedKey(id, owner)); changed(owner); },

    save: async (id: string, blob: Blob, owner = requireMediaOwner()): Promise<void> => {
        await requestFor(owner, 'readwrite', (store) => store.put({ blob, uploads: [] }, ownedKey(id, owner)));
        requireMediaOwner(owner);
    },

    keys: async (owner = requireMediaOwner()): Promise<string[]> => {
        const keys = await requestFor(owner, 'readonly', (store) => store.getAllKeys());
        requireMediaOwner(owner);
        const prefix = prefixFor(owner);
        // Unscoped historical bytes have no proven owner; preserve them without adopting them.
        return keys.filter((key): key is string => typeof key === 'string' && key.startsWith(prefix) && !activeUploads.has(key))
            .map((key) => key.slice(prefix.length));
    },

    getPending: async (id: string, owner = requireMediaOwner()): Promise<PendingMediaFile | undefined> => {
        const value: unknown = await requestFor(owner, 'readonly', (store) => store.get(ownedKey(id, owner)));
        requireMediaOwner(owner);
        return pendingFile(value);
    },

    get: async (id: string, owner = requireMediaOwner()): Promise<Blob | undefined> =>
        (await mediaStorage.getPending(id, owner))?.blob,

    rememberUpload: async (id: string, upload: PendingMediaUpload, owner = requireMediaOwner()): Promise<void> => {
        await requestFor(owner, 'readwrite', (store) => store.get(ownedKey(id, owner)), (value: unknown, store) => {
            const file = pendingFile(value);
            if (!file) throw new Error('The browser copy needs another look before its file details can be saved.');
            store.put({ blob: file.blob, uploads: [...file.uploads.filter((u) => u.id !== upload.id), {
                id: upload.id, filename: upload.filename, mime_type: upload.mime_type,
                file_size: upload.file_size, download_url: upload.download_url,
            }] }, ownedKey(id, owner));
        });
        requireMediaOwner(owner);
    },

    delete: async (id: string, owner = requireMediaOwner()): Promise<void> => {
        await requestFor(owner, 'readwrite', (store) => store.delete(ownedKey(id, owner)));
        requireMediaOwner(owner);
    },

    getUrl: async (id: string): Promise<string | null> => {
        const owner = captureMediaOwner();
        if (!owner) return null;
        try {
            const blob = await mediaStorage.get(id, owner);
            requireMediaOwner(owner);
            if (blob) return URL.createObjectURL(blob);
            const raw = browserStorage.getItem(mediaMappingKey(owner));
            const entry = raw ? (JSON.parse(raw) as Array<{ oldId: string; newId: number }>).find((m) => m.oldId === id) : undefined;
            if (entry) {
                const { getMediaBlobUrl } = await import('./mediaService');
                requireMediaOwner(owner);
                return await getMediaBlobUrl(entry.newId, owner.session);
            }
            return null;
        } catch (error) {
            if (!(error instanceof SessionChangedError)) console.error('Error generating URL for media:', error);
            return null;
        }
    },
};
