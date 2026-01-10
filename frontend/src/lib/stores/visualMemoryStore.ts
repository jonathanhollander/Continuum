import { createProfileStore } from './persistence';
import { writable } from 'svelte/store';

// --- Types ---

export type MemoryType = 'photo' | 'video';

export interface InternalMemory {
    id: string;
    url: string; // Base64 data or Blob URL
    name: string;
    date?: string;
    type: MemoryType;
    tags: string[];
    isFavorite: boolean;
    description?: string;
    size?: number; // Size in bytes for quota management
}

export interface ExternalArchive {
    id: string;
    platform: string; // e.g., 'Google Photos', 'iCloud', 'Dropbox', 'External Drive'
    accessUrl?: string; // Optional URL
    locationDetails: string; // "In the safe", "Login details in Vault"
    icon?: string; // Optional icon identifier or brand name
}

// --- Initial Data ---

const DEFAULT_MEMORIES: InternalMemory[] = [];
const DEFAULT_ARCHIVES: ExternalArchive[] = [];

// --- Stores ---

export const visualMemories = createProfileStore<InternalMemory[]>('visual_memories', DEFAULT_MEMORIES);
export const externalArchives = createProfileStore<ExternalArchive[]>('external_archives', DEFAULT_ARCHIVES);

// --- Actions ---

export const addMemory = (memory: Omit<InternalMemory, 'id'>) => {
    visualMemories.update(current => [
        { ...memory, id: crypto.randomUUID() },
        ...current
    ]);
};

export const removeMemory = (id: string) => {
    visualMemories.update(current => current.filter(m => m.id !== id));
};

export const updateMemory = (id: string, updates: Partial<InternalMemory>) => {
    visualMemories.update(current =>
        current.map(m => m.id === id ? { ...m, ...updates } : m)
    );
};

export const toggleFavorite = (id: string) => {
    visualMemories.update(current =>
        current.map(m => m.id === id ? { ...m, isFavorite: !m.isFavorite } : m)
    );
};

export const addArchive = (archive: Omit<ExternalArchive, 'id'>) => {
    externalArchives.update(current => [
        ...current,
        { ...archive, id: crypto.randomUUID() }
    ]);
};

export const removeArchive = (id: string) => {
    externalArchives.update(current => current.filter(a => a.id !== id));
};

export const updateArchive = (id: string, updates: Partial<ExternalArchive>) => {
    externalArchives.update(current =>
        current.map(a => a.id === id ? { ...a, ...updates } : a)
    );
};

// --- Mass Actions ---

export const deleteMemories = (ids: string[]) => {
    visualMemories.update(current => current.filter(m => !ids.includes(m.id)));
};

export const tagMemories = (ids: string[], tag: string) => {
    visualMemories.update(current =>
        current.map(m => {
            if (ids.includes(m.id) && !m.tags.includes(tag)) {
                return { ...m, tags: [...m.tags, tag] };
            }
            return m;
        })
    );
};
