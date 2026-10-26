import { derived } from 'svelte/store';
import { registerSync } from "$lib/services/sync.svelte";

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
    recipient: string;
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

const timeCapsuleMapper = (item: any) => {
    if (!item) return item;
    return {
        ...item,
        // Remote -> Local
        videoUrl: item.video_url ?? item.videoUrl,
        audioUrl: item.audio_url ?? item.audioUrl,
        mediaId: item.media_id ?? item.mediaId,
        contentPreview: item.content_preview ?? item.contentPreview,
        triggerType: item.trigger_type ?? item.triggerType,
        triggerValue: item.trigger_value ?? item.triggerValue,
        isReleased: item.is_released ?? item.isReleased ?? false,
        createdAt: item.created_at ?? item.createdAt,
        // Local -> Remote
        video_url: item.videoUrl ?? item.video_url,
        audio_url: item.audioUrl ?? item.audio_url,
        media_id: item.mediaId ?? item.media_id,
        content_preview: item.contentPreview ?? item.content_preview,
        trigger_type: item.triggerType ?? item.trigger_type,
        trigger_value: item.triggerValue ?? item.trigger_value,
        is_released: item.isReleased ?? item.is_released,
        created_at: item.createdAt ?? item.created_at
    };
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
