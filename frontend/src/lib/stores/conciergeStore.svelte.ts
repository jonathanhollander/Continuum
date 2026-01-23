import { registerSingletonSync } from '$lib/services/sync.svelte';
import { derived } from 'svelte/store';
import { dictionary } from './dictionary';
import { logger } from '../utils/logger';

export type EncouragementMode = 'Full' | 'Soft' | 'Hidden';
export type UserRole = 'Owner' | 'Executor' | 'Family';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'ru' | 'he';

interface ConciergeSettings {
    encouragementMode: EncouragementMode;
    userRole: UserRole;
    language: Language;
}

const manager = registerSingletonSync<ConciergeSettings>('concierge_settings', 'estate/profile', (data: any) => ({
    encouragementMode: data.encouragementMode || data.encouragement || 'Full',
    userRole: data.userRole || 'Owner',
    language: data.language || 'en'
}), '/api');

export const conciergeStore = {
    subscribe: manager.subscribe.bind(manager),
    get settings() { return manager.data || { encouragementMode: 'Full', userRole: 'Owner', language: 'en' }; },
    update: (updates: Partial<ConciergeSettings>) => manager.update(updates),
    sync: () => manager.sync()
};

// Compatibility individual stores
export const encouragementMode = {
    subscribe: (fn: any) => manager.subscribe(val => fn(val?.encouragementMode || 'Full')),
    set: (val: EncouragementMode) => manager.update({ encouragementMode: val })
};

export const userRole = {
    subscribe: (fn: any) => manager.subscribe(val => fn(val?.userRole || 'Owner')),
    set: (val: UserRole) => manager.update({ userRole: val })
};

export const language = {
    subscribe: (fn: any) => manager.subscribe(val => fn(val?.language || 'en')),
    set: (val: Language) => manager.update({ language: val })
};

export const t = derived(language as any, ($language: Language) => {
    return (dictionary as Record<Language, any>)[$language] || dictionary.en;
});

// Engagement Logger (Analytics - Kept Local for now unless asked to sync)
import { writable } from 'svelte/store';
export const engagementLog = writable<{ timestamp: number, action: string, details: string }[]>([]);

export function logInteraction(action: string, details: string = '') {
    engagementLog.update(log => [
        ...log,
        { timestamp: Date.now(), action, details }
    ]);
    logger.info(`[Concierge Log] ${action}`, { details });
}

export function shouldShowPrompt(mode: EncouragementMode, sensitivity: 'Low' | 'High' = 'Low'): boolean {
    if (mode === 'Hidden') return false;
    if (mode === 'Soft' && sensitivity === 'High') return false;
    return true;
}
