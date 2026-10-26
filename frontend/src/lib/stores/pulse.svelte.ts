import { registerSingletonSync } from "$lib/services/sync.svelte";
import { apiPost } from '$lib/api/client';
import { captureSession, isCurrentSession, type SessionOwnership } from '$lib/services/sessionOwnership';

// SyncManager stores keys camelCased (convertKeys in sync.svelte.ts): /api/pulse/status's
// next_nudge arrives here as nextNudge. Times are UTC ISO with "Z".
export interface PulseStatus {
    status: 'active' | 'grace' | 'not_configured' | 'disabled';
    lastCheckin: string | null;
    nextNudge: string | null;
    // A guardian's "they're OK" since the owner's own last check-in
    guardianCheckin?: { at: string; by: string } | null;
    escalationTier?: number | null;
    // Stage progression, independently of email acceptance (UTC ISO).
    escalationAt?: string | null;
    tierActivity?: PulseTierActivity[];
    alertsPausedUntil?: string | null;
}

export type PulseAlertState = 'provider_accepted' | 'saved_local' | 'failed' | 'awaiting_attempt' | 'recorded';
export interface PulseTierActivity {
    tierNumber: number;
    reachedAt: string | null;
    outcomes: { state: PulseAlertState; count: number; contactIds: number[] }[];
    contacts: {
        contactId: number; contactName: string; state: PulseAlertState; attempts: number;
        failedAttempts: number; retryAvailable: boolean;
        sourceMessages: { id: number; message: string; sentAt: string; state: PulseAlertState }[];
    }[];
}

/** The six settings edited by the settings page, in the API's spelling. */
export interface PulseSettingsChanges {
    enabled: boolean;
    frequency_days: number;
    grace_period_hours: number;
    ghost_mode_until: string | null;
    biometric_extension_enabled: boolean;
    location_vault_enabled: boolean;
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
    /** The settings page's copy, snake_case as the server sends it, from the store's own fetch:
     *  sync() joins the one the layout's syncAll starts, so the page adds no second GET.
     *  null when the server could not be reached. */
    async loadSettings(): Promise<Record<string, unknown> | null> {
        await settingsSync.sync();
        return settingsSync.status === 'error' ? null : settingsSync.wirePayloadOfData();
    },
    /** Show the server's on/off on this device only (no save): the settings page has just
     *  read or saved it, so writing it back would be a second save the person never made. */
    showEnabled(enabled: boolean) {
        settingsSync.updateLocal({ ...(settingsSync.data || {}), enabled } as PulseSettings);
    },
    /** Mirror this owner's explicit settings intent/confirmation without posting a second save.
     * The cache uses camelCase; fields this page does not edit stay as they were. */
    showSettings(fields: PulseSettingsChanges, owner: SessionOwnership = captureSession()) {
        if (!isCurrentSession(owner)) return;
        settingsSync.updateLocal({
            ...(settingsSync.data || {}),
            enabled: fields.enabled,
            frequencyDays: fields.frequency_days,
            gracePeriodHours: fields.grace_period_hours,
            ghostModeUntil: fields.ghost_mode_until,
            biometricExtensionEnabled: fields.biometric_extension_enabled,
            locationVaultEnabled: fields.location_vault_enabled,
        } as PulseSettings);
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
