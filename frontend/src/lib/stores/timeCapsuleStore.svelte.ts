import { derived } from 'svelte/store';
import { registerSync } from '$lib/services/sync.svelte';

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

    addMessage: (message: Omit<TimeCapsuleMessage, 'id' | 'isReleased' | 'createdAt'> & { mediaId?: string }) => {
        return timeCapsuleSync.create({
            ...message,
            id: crypto.randomUUID(),
            isReleased: false,
            createdAt: new Date().toISOString()
        } as TimeCapsuleMessage);
    },

    removeMessage: (id: string) => timeCapsuleSync.delete(id),

    releaseMessage: (id: string) => {
        return timeCapsuleSync.update(id, { isReleased: true } as Partial<TimeCapsuleMessage>);
    },

    sync: () => timeCapsuleSync.sync(),

    // Store Compatibility
    subscribe: timeCapsuleSync.subscribe.bind(timeCapsuleSync)
};

export const capsuleStatus = derived(timeCapsuleSync, ($sync) => {
    const items = $sync.items;
    return {
        unlocked: items.filter(m => m.isReleased),
        locked: items.filter(m => !m.isReleased)
    };
});
