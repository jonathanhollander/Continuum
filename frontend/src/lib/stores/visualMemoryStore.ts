import { registerSync } from '../services/sync.svelte';

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

const visualMapper = (local: any): VisualMemory => {
    // 1. Handle Tags (Frontend wants array, Backend gives string)
    let tags: string[] = [];
    if (typeof local.tags === 'string') {
        tags = local.tags.split(',').filter(Boolean);
    } else if (Array.isArray(local.tags)) {
        tags = local.tags;
    }

    return {
        ...local,
        id: typeof local.id === 'string' && local.id.length > 10 ? undefined : local.id,
        is_favorite: local.is_favorite ?? local.isFavorite ?? false,
        tags
    };
};

const archiveMapper = (local: any): ExternalArchive => ({
    ...local,
    id: typeof local.id === 'string' && local.id.length > 10 ? undefined : local.id,
    access_url: local.access_url ?? local.accessUrl,
    location_details: local.location_details ?? local.locationDetails
});

const familyMapper = (local: any): FamilyMemory => ({
    ...local,
    id: typeof local.id === 'string' && local.id.length > 10 ? undefined : local.id,
    is_favorite: local.is_favorite ?? local.isFavorite ?? false,
    author: local.author || 'Me'
});

// --- Sync Managers ---

const visualManager = registerSync<VisualMemory>('visual_memories', 'memories/visual', visualMapper, '/api').setAffirmationContext('heirlooms');
const archiveManager = registerSync<ExternalArchive>('external_archives', 'memories/archives', archiveMapper, '/api').setAffirmationContext('heirlooms');
const familyManager = registerSync<FamilyMemory>('family_memories', 'memories/family', familyMapper, '/api').setAffirmationContext('heirlooms');

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
    const payload = { ...memory, tags: Array.isArray(memory.tags) ? memory.tags.join(',') : memory.tags };
    return visualManager.create(payload as any);
};
export const removeMemory = (id: number) => visualManager.delete(id);
export const updateMemory = (id: number, updates: Partial<VisualMemory>) => {
    const item = visualManager.items.find(m => m.id === id);
    if (item) {
        const payload = { ...item, ...updates };
        if (Array.isArray(payload.tags)) {
            (payload as any).tags = payload.tags.join(',');
        }
        return visualManager.update(payload as any);
    }
};
export const toggleFavorite = (id: number) => {
    const item = visualManager.items.find(m => m.id === id);
    if (item) {
        const payload = { ...item, is_favorite: !item.is_favorite };
        if (Array.isArray(payload.tags)) {
            (payload as any).tags = payload.tags.join(',');
        }
        return visualManager.update(payload as any);
    }
};

// Archive Actions
export const addArchive = (archive: Omit<ExternalArchive, 'id'>) => archiveManager.create(archive as ExternalArchive);
export const removeArchive = (id: number) => archiveManager.delete(id);
export const updateArchive = (id: number, updates: Partial<ExternalArchive>) => {
    const item = archiveManager.items.find(a => a.id === id);
    if (item) return archiveManager.update({ ...item, ...updates });
};

// Family Actions
export const addFamilyMemory = (memory: Omit<FamilyMemory, 'id'>) => familyManager.create(memory as FamilyMemory);
export const removeFamilyMemory = (id: number) => familyManager.delete(id);
export const updateFamilyMemory = (id: number, updates: Partial<FamilyMemory>) => {
    const item = familyManager.items.find(m => m.id === id);
    if (item) return familyManager.update({ ...item, ...updates });
};
