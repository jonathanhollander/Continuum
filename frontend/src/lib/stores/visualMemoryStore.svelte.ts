import { registerSync } from "$lib/services/sync.svelte.ts";

// --- Types ---

export type MemoryType = 'photo' | 'video' | 'recipe' | 'quote';

export interface VisualMemory {
    id?: number;
    user_id?: number;
    url: string;
    name: string;
    date?: string;
    type: 'photo' | 'video';
    tags: string[]; // Frontend wants array
    is_favorite: boolean;
    description?: string;
    size?: number;
}

export interface ExternalArchive {
    id?: number;
    user_id?: number;
    platform: string;
    access_url?: string;
    location_details: string;
    icon?: string;
}

export interface FamilyMemory {
    id?: number;
    user_id?: number;
    type: 'photo' | 'recipe' | 'quote';
    title: string;
    date?: string;
    image?: string;
    desc?: string;
    text?: string;
    author?: string;
    is_favorite: boolean;
}

// --- Mappers ---

/**
 * Normalizes bidirectional data flow between Frontend (camelCase + Arrays)
 * and Backend (snake_case + Strings/Booleans).
 */
const visualMapper = (data: any): VisualMemory => {
    if (!data) return data;

    // 1. Handle Tags (Backend gives string, Frontend gives array)
    let tags: string[] = [];
    if (typeof data.tags === 'string') {
        tags = data.tags.split(',').filter(Boolean);
    } else if (Array.isArray(data.tags)) {
        tags = data.tags;
    }

    return {
        ...data,
        tags
    };
};

const archiveMapper = (data: any): ExternalArchive => data;

const familyMapper = (data: any): FamilyMemory => ({
    ...data,
    author: data.author || 'Me'
});

// --- Sync Managers ---

const visualManager = registerSync<VisualMemory>('visual_memories', 'visual', visualMapper, '/api/memories').setAffirmationContext('heirlooms');
const archiveManager = registerSync<ExternalArchive>('external_archives', 'archives', archiveMapper, '/api/memories').setAffirmationContext('heirlooms');
const familyManager = registerSync<FamilyMemory>('family_memories', 'family', familyMapper, '/api/memories').setAffirmationContext('heirlooms');

// --- Stores & Actions ---

export const visualMemories = {
    subscribe: visualManager.subscribe.bind(visualManager),
    get items() { return visualManager.items; }
};

export const externalArchives = {
    subscribe: archiveManager.subscribe.bind(archiveManager),
    get items() { return archiveManager.items; }
};

export const familyMemories = {
    subscribe: familyManager.subscribe.bind(familyManager),
    get items() { return familyManager.items; }
};

// --- Helper Actions ---

export const syncAllMemories = () => Promise.all([
    visualManager.sync(),
    archiveManager.sync(),
    familyManager.sync()
]);

// Visual Actions
export const addMemory = (memory: Omit<VisualMemory, 'id'>) => {
    // Backend expects comma-separated string for tags
    const payload = {
        ...memory,
        tags: Array.isArray(memory.tags) ? memory.tags.join(',') : memory.tags,
        is_favorite: memory.is_favorite ?? false
    };
    return visualManager.create(payload as any);
};

export const removeMemory = (id: number) => visualManager.delete(id);

export const updateMemory = (id: number, updates: Partial<VisualMemory>) => {
    const item = visualManager.items.find(m => m.id === id);
    if (!item) return;

    const payload = { ...item, ...updates };
    // Convention: Always send tags as string to backend
    if (Array.isArray(payload.tags)) {
        (payload as any).tags = payload.tags.join(',');
    }
    return visualManager.update(id, payload as any);
};

export const toggleFavorite = (id: number) => {
    const item = visualManager.items.find(m => m.id === id);
    if (!item) return;

    return updateMemory(id, { is_favorite: !item.is_favorite });
};

// Archive Actions
export const addArchive = (archive: Omit<ExternalArchive, 'id'>) => archiveManager.create(archive as ExternalArchive);
export const removeArchive = (id: number) => archiveManager.delete(id);
export const updateArchive = (id: number, updates: Partial<ExternalArchive>) => {
    const item = archiveManager.items.find(a => a.id === id);
    if (item) return archiveManager.update(id, { ...item, ...updates });
};

// Family Actions
export const addFamilyMemory = (memory: Omit<FamilyMemory, 'id'>) => familyManager.create(memory as FamilyMemory);
export const removeFamilyMemory = (id: number) => familyManager.delete(id);
export const updateFamilyMemory = (id: number, updates: Partial<FamilyMemory>) => {
    const item = familyManager.items.find(m => m.id === id);
    if (item) return familyManager.update(id, { ...item, ...updates });
};
