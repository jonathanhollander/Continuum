import { registerSingletonSync } from "$lib/services/sync.svelte";
import { apiGet, apiPost } from '$lib/api/client';

// SyncManager stores keys camelCased (convertKeys in sync.svelte.ts): /api/pulse/status's
// next_nudge arrives here as nextNudge. Times are UTC ISO with "Z".
export interface PulseStatus {
    status: 'active' | 'grace' | 'not_configured' | 'disabled';
    lastCheckin: string | null;
    nextNudge: string | null;
    // A guardian's "they're OK" since the owner's own last check-in
    guardianCheckin?: { at: string; by: string } | null;
    escalationTier?: number | null;
    alertsPausedUntil?: string | null;
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

// Compatibility export with store interface for derived() compatibility
export const pulse = {
    get status() { return statusSync.data?.status || 'disabled'; },
    get next_nudge() { return statusSync.data?.nextNudge || null; },
    get lastCheckin() { return statusSync.data?.lastCheckin || null; },
    get guardianCheckin() { return statusSync.data?.guardianCheckin || null; },
    get enabled() { return settingsSync.data?.enabled ?? false; },
    get contacts() { return []; }, // Contacts are managed separately via PulseContact API
    init: () => statusSync.sync(),
    /** Show the server's on/off on this device only (no save): the settings page has just
     *  read or saved it, so writing it back would be a second save the person never made. */
    showEnabled(enabled: boolean) {
        settingsSync.updateLocal({ ...(settingsSync.data || {}), enabled } as PulseSettings);
    },
    checkin: (note?: string) => pulseStore.checkin(note),
    // Store compatibility for derived()
    subscribe(run: (value: { enabled: boolean; contacts: any[]; status: string }) => void) {
        const getValue = () => ({
            enabled: settingsSync.data?.enabled ?? false,
            contacts: [],
            status: statusSync.data?.status || 'disabled'
        });
        run(getValue());
        // Subscribe to both syncs and notify on changes
        const unsub1 = settingsSync.subscribe(() => run(getValue()));
        const unsub2 = statusSync.subscribe(() => run(getValue()));
        return () => { unsub1(); unsub2(); };
    }
};
