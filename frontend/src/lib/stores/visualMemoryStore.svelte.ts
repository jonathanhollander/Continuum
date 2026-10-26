import { registerSync } from "$lib/services/sync.svelte";
import { notifications } from "$lib/stores/notificationStore";
import { deleteMedia, mediaIdFromRef } from "$lib/services/mediaService";
import { oneSpelling } from "$lib/utils/oneSpelling";

// --- Types ---

export type MemoryType = 'photo' | 'video' | 'recipe' | 'quote';

export interface VisualMemory {
    id: number;
    user_id?: number;
    url: string;
    name: string;
    date?: string;
    type: 'photo' | 'video';
    tags: string; // comma-separated, as the server keeps it (tagList() splits it)
    is_favorite: boolean;
    description?: string;
    size?: number;
}

export interface ExternalArchive {
    id: number;
    user_id?: number;
    platform: string;
    access_url?: string;
    location_details: string;
    icon?: string;
}

export interface FamilyMemory {
    id: number;
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
 * The mapper runs on the way out (POST/PUT body) as well as on the way in, so it keeps
 * the server's shape: tags stay one comma-separated string (the column is a string; an
 * array in the body made every create and update fail). Split them for display with tagList().
 */
const visualMapper = (data: Record<string, unknown>): VisualMemory => {
    if (!data) return data as unknown as VisualMemory;
    const tags = Array.isArray(data.tags) ? data.tags.join(',') : (data.tags ?? '');
    // Server rows arrive camel-cased (isFavorite); the store and pages read is_favorite.
    return oneSpelling({ ...data, tags }, { is_favorite: 'isFavorite' }) as unknown as VisualMemory;
};

export const tagList = (tags: string | string[] | null | undefined): string[] =>
    Array.isArray(tags) ? tags : (tags || '').split(',').map((t) => t.trim()).filter(Boolean);

const archiveMapper = (data: Record<string, unknown>): ExternalArchive => data as unknown as ExternalArchive;

const familyMapper = (data: Record<string, unknown>): FamilyMemory => ({
    ...data,
    author: data.author || 'Me'
} as FamilyMemory);

// --- Sync Managers ---

const MEMORIES = 'memories' as const;

// Visual memories affirm themselves (affirmMemories): one message per upload batch or bulk tag.
const visualManager = registerSync<VisualMemory>('visual_memories', 'visual', visualMapper, '/api/memories');
const archiveManager = registerSync<ExternalArchive>('external_archives', 'archives', archiveMapper, '/api/memories').setAffirmationContext(MEMORIES);
const familyManager = registerSync<FamilyMemory>('family_memories', 'family', familyMapper, '/api/memories').setAffirmationContext(MEMORIES);

/** One memories affirmation (after a batch of saves, or a single save the person made). */
export const affirmMemories = () => notifications.showAffirmation(MEMORIES);

// --- Stores & Actions ---

export const visualMemories = {
    subscribe: visualManager.subscribe.bind(visualManager),
    get items() { return visualManager.items; },
    sync: () => visualManager.sync()
};

export const externalArchives = {
    subscribe: archiveManager.subscribe.bind(archiveManager),
    get items() { return archiveManager.items; },
    sync: () => archiveManager.sync()
};

export const familyMemories = {
    subscribe: familyManager.subscribe.bind(familyManager),
    get items() { return familyManager.items; },
    sync: () => familyManager.sync()
};

// --- Helper Actions ---

export const syncAllMemories = () => Promise.all([
    visualManager.sync(),
    archiveManager.sync(),
    familyManager.sync()
]);

// Visual Actions
export const addMemory = (
    memory: Omit<VisualMemory, 'id' | 'tags'> & { tags: string | string[] },
    onRetry?: () => Promise<unknown>
) => {
    // Backend expects comma-separated string for tags
    const payload = {
        ...memory,
        tags: Array.isArray(memory.tags) ? memory.tags.join(',') : memory.tags,
        is_favorite: memory.is_favorite ?? false
    };
    return visualManager.create(payload, false, false, onRetry);
};

/** The media id behind a record's url; null for old `data:` records and other urls. */
export const memoryMediaId = (url: string | null | undefined): number | null =>
    !url || url.startsWith('data:') ? null : mediaIdFromRef(url);

/** Remove the record, then the stored file behind it (only once the record is gone). */
export const removeMemory = async (id: number) => {
    const item = visualManager.items.find(m => String(m.id) === String(id));
    const mediaId = memoryMediaId(item?.url);
    // The media goes once the record is really gone, including after Try Again on a failed remove.
    await visualManager.delete(id, mediaId === null ? undefined : async () => {
        await deleteMedia(mediaId).catch((e) => console.warn('[visual-memories] media removal paused', mediaId, e));
    });
};

/** Save changes to one memory; affirm = false when the caller affirms once for a batch. */
export const updateMemory = async (id: number, updates: Partial<VisualMemory>, affirm = true) => {
    const item = visualManager.items.find(m => String(m.id) === String(id));
    if (!item) return;

    const payload = { ...item, ...updates };
    // Convention: Always send tags as string to backend
    if (Array.isArray(payload.tags)) {
        (payload as { tags: string }).tags = payload.tags.join(',');
    }
    const saved = await visualManager.update(id, payload as VisualMemory);
    if (affirm) affirmMemories();
    return saved;
};

/** Add one tag to each memory, leaving any memory that already has it (any case) as it is. */
export const addTagToMemories = async (ids: number[], tag: string) => {
    const clean = tag.trim().replace(/,/g, ' ').trim();
    if (!clean) return;
    let saved = 0;
    for (const id of ids) {
        const item = visualManager.items.find(m => String(m.id) === String(id));
        if (!item) continue;
        const tags = tagList(item.tags);
        if (tags.some(t => t.toLowerCase() === clean.toLowerCase())) continue;
        await updateMemory(item.id!, { tags: [...tags, clean].join(',') }, false).then(() => saved++, () => {});
    }
    if (saved > 0) affirmMemories();
};

export const toggleFavorite = (id: number) => {
    const item = visualManager.items.find(m => m.id === id);
    if (!item) return;

    return updateMemory(id, { is_favorite: !item.is_favorite });
};

// Archive Actions
export const addArchive = (archive: Omit<ExternalArchive, 'id'>, onRetry?: () => Promise<unknown>, recoveryId?: string) => archiveManager.create(archive as ExternalArchive, false, false, onRetry, recoveryId);
export const removeArchive = (id: number) => archiveManager.delete(id);
export const updateArchive = (id: number, updates: Partial<ExternalArchive>, onRetry?: () => Promise<unknown>, recoveryId?: string) =>
    archiveManager.update(id, updates, true, onRetry, recoveryId);

// Family Actions
export const addFamilyMemory = (memory: Omit<FamilyMemory, 'id'>, onRetry?: () => Promise<unknown>, recoveryId?: string) => familyManager.create(memory as FamilyMemory, false, false, onRetry, recoveryId);
export const removeFamilyMemory = (id: number) => familyManager.delete(id);
export const updateFamilyMemory = (id: number, updates: Partial<FamilyMemory>, onRetry?: () => Promise<unknown>, recoveryId?: string) => {
    const item = familyManager.items.find(m => m.id === id);
    if (item) return familyManager.update(id, { ...item, ...updates }, true, onRetry, recoveryId);
    notifications.showError({
        message: 'That memory has moved. Refresh whenever you\'re ready and it will be here to save.',
        code: 'NOT_FOUND',
        technicalDetails: `updateFamilyMemory: no item with id ${id}`
    });
    throw new Error(`Memory ${id} not found`);
};
