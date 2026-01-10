import { writable } from 'svelte/store';

// Types
export type EncouragementMode = 'Full' | 'Soft' | 'Hidden';
export type UserRole = 'Owner' | 'Executor' | 'Family';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'ru' | 'he';

// Stores with LocalStorage Persistence
import { currentProfileId, profiles, type Profile } from './profileContext';
import { createProfileStore } from './persistence';

// Profile-Specific State (These will load initial values based on current profile)
export const encouragementMode = createProfileStore<EncouragementMode>('encouragement', 'Full');
export const userRole = createProfileStore<UserRole>('userRole', 'Owner');
export const language = createProfileStore<Language>('language', 'en');

import { derived } from 'svelte/store';
import { dictionary } from './dictionary';

export const t = derived(language, ($language) => {
    return (dictionary as Record<Language, any>)[$language] || dictionary.en;
});

// Engagement Logger (Hidden Analytics)
export const engagementLog = writable<{ timestamp: number, action: string, details: string }[]>([]);

export function logInteraction(action: string, details: string = '') {
    engagementLog.update(log => [
        ...log,
        { timestamp: Date.now(), action, details }
    ]);
    console.log(`[Concierge Log] ${action}: ${details}`);
}

// Helper to check if prompts should be shown
export function shouldShowPrompt(mode: EncouragementMode, sensitivity: 'Low' | 'High' = 'Low'): boolean {
    if (mode === 'Hidden') return false;
    if (mode === 'Soft' && sensitivity === 'High') return false;
    return true;
}
