import { derived } from 'svelte/store';
import { createProfileStore } from './persistence';

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
    videoUrl?: string; // or local path
    audioUrl?: string;
    mediaId?: string; // ID for IndexedDB storage
    contentPreview: string; // Encouragement/Summary
    triggerType: ReleaseTrigger;
    triggerValue: string; // ISO date or milestone ID
    isReleased: boolean;
    createdAt: string;
}

// Migration Logic
const getInitialData = (): TimeCapsuleMessage[] => {
    if (typeof localStorage === 'undefined') return [];

    const unified = localStorage.getItem('continuum_owner_time_capsule');
    if (unified) return [];

    const legacy = localStorage.getItem('continuum_time_capsule');
    if (legacy) {
        try {
            return JSON.parse(legacy);
        } catch (e) {
            console.error('Failed to parse time capsule from localStorage', e);
        }
    }
    return [];
};

function createReactiveTimeCapsuleStore() {
    const store = createProfileStore<TimeCapsuleMessage[]>('time_capsule', getInitialData());
    const { subscribe, set, update } = store;

    return {
        subscribe,
        addMessage: (message: Omit<TimeCapsuleMessage, 'id' | 'isReleased' | 'createdAt'> & { mediaId?: string }) => {
            update(messages => [...messages, {
                ...message,
                id: crypto.randomUUID(),
                isReleased: false,
                createdAt: new Date().toISOString()
            }]);
        },
        removeMessage: (id: string) => {
            update(messages => messages.filter(m => m.id !== id));
        },
        releaseMessage: (id: string) => {
            update(messages => messages.map(m => m.id === id ? { ...m, isReleased: true } : m));
        }
    };
}

export const timeCapsuleStore = createReactiveTimeCapsuleStore();

// Derived store for locked vs unlocked messages
export const capsuleStatus = derived(timeCapsuleStore, ($messages) => {
    const unlocked = $messages.filter(m => m.isReleased);
    const locked = $messages.filter(m => !m.isReleased);
    return { unlocked, locked };
});
