import { openDB } from 'idb';

const DB_NAME = 'continuum-media';
const STORE_NAME = 'files';

async function getDB() {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            db.createObjectStore(STORE_NAME);
        },
    });
}

export const mediaStorage = {
    async save(id: string, file: Blob | File) {
        const db = await getDB();
        await db.put(STORE_NAME, file, id);
        return id;
    },

    async get(id: string): Promise<Blob | undefined> {
        const db = await getDB();
        return db.get(STORE_NAME, id);
    },

    async delete(id: string) {
        const db = await getDB();
        await db.delete(STORE_NAME, id);
    },

    // Helper to generic object URL
    async getUrl(id: string): Promise<string | null> {
        const blob = await this.get(id);
        if (blob) {
            return URL.createObjectURL(blob);
        }
        return null;
    }
};
