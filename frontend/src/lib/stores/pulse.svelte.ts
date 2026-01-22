import { registerSingletonSync } from '$lib/services/sync.svelte';
import { apiGet, apiPost } from '$lib/api/client';

export interface PulseStatus {
    status: 'active' | 'grace' | 'not_configured' | 'disabled';
    last_checkin: string | null;
    next_nudge: string | null;
}

export interface PulseSettings {
    enabled: boolean;
    frequency_days: number;
    grace_period_hours: number;
    custom_message?: string;
    elderly_mode: boolean;
    notify_contacts_on_checkin: boolean;
    pet_protocol_enabled: boolean;
    medical_safe_pass_enabled: boolean;
}

const statusSync = registerSingletonSync<PulseStatus>('pulse_status', 'pulse/status', undefined, '/api');
const settingsSync = registerSingletonSync<PulseSettings>('pulse_settings', 'pulse/settings', undefined, '/api');

export const pulseStatus = {
    get current() { return statusSync.data; },
    get loading() { return statusSync.status === 'syncing'; },
    sync: () => statusSync.sync()
};

export const pulseSettings = {
    get data() { return settingsSync.data; },
    update: (updates: Partial<PulseSettings>) => settingsSync.update(updates as PulseSettings),
    sync: () => settingsSync.sync()
};

export const pulseStore = {
    checkin: async (note?: string) => {
        try {
            const params = new URLSearchParams();
            if (note) params.append('note', note);
            await apiPost(`/api/pulse/checkin?${params.toString()}`);
            // Force refresh status
            await statusSync.sync();
            return true;
        } catch (e) {
            console.error("Checkin failed", e);
            return false;
        }
    }
};

// Compatibility export
export const pulse = {
    get status() { return statusSync.data?.status || 'disabled'; },
    get next_nudge() { return statusSync.data?.next_nudge || null; },
    get lastCheckin() { return statusSync.data?.last_checkin || null; },
    init: () => statusSync.sync(),
    checkin: (note?: string) => pulseStore.checkin(note)
};
