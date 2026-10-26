import { registerProfileSlice } from "$lib/services/sync.svelte";
import { derived, toStore } from 'svelte/store';
import { contextStore, type UserRole as AccountRole } from './contextStore.svelte';
import { dictionary } from './dictionary';
import { logger } from '../utils/logger';

export type EncouragementMode = 'Full' | 'Soft' | 'Hidden';
export type UserRole = 'Owner' | 'Executor' | 'Family';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'ru' | 'he';

interface ConciergeSettings {
    encouragementMode: EncouragementMode;
    language: Language;
}

const manager = registerProfileSlice<ConciergeSettings>('concierge_settings', (data: Record<string, unknown>) => ({
    encouragementMode: (data.encouragementMode || data.encouragement || 'Full') as EncouragementMode,
    language: (data.language || 'en') as Language
}));

export const conciergeStore = {
    subscribe: manager.subscribe.bind(manager),
    get settings() { return manager.data || { encouragementMode: 'Full', language: 'en' }; },
    update: (updates: Partial<ConciergeSettings>) => manager.update(updates),
    sync: () => manager.sync()
};

// Compatibility individual stores
export const encouragementMode = {
    subscribe: (fn: (value: EncouragementMode) => void) => manager.subscribe(val => fn(val?.encouragementMode || 'Full')),
    set: (val: EncouragementMode) => manager.update({ encouragementMode: val }),
    update: (fn: (current: EncouragementMode) => EncouragementMode) => {
        const current = manager.data?.encouragementMode || 'Full';
        manager.update({ encouragementMode: fn(current) });
    }
};

// The account role (users.user_role, kept by contextStore) in the nav's terms;
// an advisor sees the planning nav
const NAV_ROLE: Record<AccountRole, UserRole> = {
    planning: 'Owner',
    executor: 'Executor',
    family: 'Family',
    advisor: 'Owner'
};
const ACCOUNT_ROLE: Record<UserRole, AccountRole> = {
    Owner: 'planning',
    Executor: 'executor',
    Family: 'family'
};
const navRole = toStore(() => NAV_ROLE[contextStore.role]);

export const userRole = {
    subscribe: navRole.subscribe,
    set: (val: UserRole) => contextStore.setRole(ACCOUNT_ROLE[val] ?? 'planning')
};

export const language = {
    subscribe: (fn: (value: Language) => void) => manager.subscribe(val => fn(val?.language || 'en')),
    set: (val: Language) => manager.update({ language: val })
};

// Infer dictionary type from English fallback; the index signature lets callers look up
// keys computed at runtime (`$dict[item.key]`).
type Dictionary = typeof dictionary.en & Record<string, any>;

// The active language's dictionary, read as an object (`$dict.wizTitle`).
// The callable translator (`$t("wizard.start")`) is `t` in `$lib/stores/localization`.
export const dict = derived(language, ($language: Language) => {
    const all = dictionary as unknown as Record<string, Dictionary>;
    return all[$language] || all.en;
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
