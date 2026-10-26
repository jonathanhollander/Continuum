import { derived } from 'svelte/store';
import { registerSync } from "$lib/services/sync.svelte";
import { mediaIdFromRef, type MediaFile } from "$lib/services/mediaService";
import { oneSpelling } from "$lib/utils/oneSpelling";

export type ReleaseTrigger = 'date' | 'milestone';

export interface Milestone {
    id: string;
    label: string;
}

export const COMMON_MILESTONES: Milestone[] = [
    { id: 'grad', label: 'College Graduation' },
    { id: 'wedding', label: 'Wedding Day' },
    { id: 'parent', label: 'Becoming a Parent' },
    { id: 'home', label: 'Buying First Home' },
    { id: 'career', label: 'Major Career Achievement' },
    { id: 'anniv_10', label: '10th Marriage Anniversary' }
];

export interface TimeCapsuleMessage {
    id: string;
    title: string;
    recipient: string; // the owner's own words ("my boy")
    recipientContactId?: number | null; // contacts row (PulseContact.id) it is for
    videoUrl?: string;
    audioUrl?: string;
    mediaId?: string;
    contentPreview: string;
    triggerType: ReleaseTrigger;
    triggerValue: string;
    isReleased: boolean;
    createdAt: string;
    custom_attributes?: string; // JSON string of custom field values
}

/**
 * The uploaded video's media record, kept under this key in `custom_attributes`
 * (no column of its own), so the reader fetches the file with no metadata request.
 */
export const CAPSULE_MEDIA_KEY = '_media';

export type CapsuleMedia = Pick<MediaFile, 'id' | 'mime_type' | 'filename' | 'file_size'>;

/** The stored media record for this capsule's video, when it matches `videoUrl`. */
export function capsuleMedia(m: Pick<TimeCapsuleMessage, 'videoUrl' | 'custom_attributes'>): CapsuleMedia | undefined {
    const id = mediaIdFromRef(m.videoUrl);
    if (id === null || !m.custom_attributes) return undefined;
    try {
        const media = JSON.parse(m.custom_attributes)?.[CAPSULE_MEDIA_KEY];
        return media && media.id === id && media.mime_type ? media : undefined;
    } catch {
        return undefined;
    }
}

const timeCapsuleMapper = (item: any) => {
    if (!item) return item;
    // One spelling per field (the page's), so an edit or a cleared field (null) is never undone
    // by a stale copy. Server rows arrive camel-cased (customAttributes); the page and
    // capsuleMedia() read custom_attributes.
    const out = oneSpelling(item, {
        recipientContactId: 'recipient_contact_id',
        custom_attributes: 'customAttributes',
        videoUrl: 'video_url',
        audioUrl: 'audio_url',
        mediaId: 'media_id',
        contentPreview: 'content_preview',
        triggerType: 'trigger_type',
        triggerValue: 'trigger_value',
        isReleased: 'is_released',
        createdAt: 'created_at',
    });
    out.recipientContactId = out.recipientContactId ?? null;
    out.isReleased = out.isReleased ?? false;
    return out;
};

export const timeCapsuleSync = registerSync<TimeCapsuleMessage>('time_capsule', 'time_capsule', timeCapsuleMapper).setAffirmationContext('timeCapsule');

export const timeCapsuleStore = {
    get items() { return timeCapsuleSync.items; },
    get status() { return timeCapsuleSync.status; },

    // The server sets id and created_at (both protected in the API).
    addMessage: (message: Omit<TimeCapsuleMessage, 'id' | 'isReleased' | 'createdAt'>) => {
        return timeCapsuleSync.create({ ...message, isReleased: false } as TimeCapsuleMessage);
    },

    updateMessage: (id: string, changes: Partial<TimeCapsuleMessage>) => timeCapsuleSync.update(id, changes),

    removeMessage: (id: string) => timeCapsuleSync.delete(id),

    releaseMessage: (id: string) => {
        return timeCapsuleSync.update(id, { isReleased: true } as Partial<TimeCapsuleMessage>);
    },

    sync: () => timeCapsuleSync.sync(),

    // Store Compatibility
    subscribe: timeCapsuleSync.subscribe.bind(timeCapsuleSync)
};

/** Today as YYYY-MM-DD in the person's own time zone (the date input's format). */
const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Released: marked released, or a date capsule whose date has arrived. */
export const isCapsuleReleased = (m: TimeCapsuleMessage) =>
    !!m.isReleased || (m.triggerType === 'date' && !!m.triggerValue && m.triggerValue <= today());

// The sync store emits the item array itself.
export const capsuleStatus = derived(timeCapsuleSync, ($items) => {
    const items: TimeCapsuleMessage[] = $items ?? [];
    return {
        unlocked: items.filter(isCapsuleReleased),
        locked: items.filter(m => !isCapsuleReleased(m))
    };
});
