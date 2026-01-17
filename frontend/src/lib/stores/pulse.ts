import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Types
export interface PulseState {
    enabled: boolean;
    status: 'active' | 'grace_period' | 'alert' | 'snoozed' | 'disabled';
    lastCheckin: string | null; // ISO Date
    nextExpected: string | null; // ISO Date
    tier: number; // Current alert tier (0 = none)
}

const initialState: PulseState = {
    enabled: false,
    status: 'disabled',
    lastCheckin: null,
    nextExpected: null,
    tier: 0
};

// Store
function createPulseStore() {
    const { subscribe, set, update } = writable<PulseState>(initialState);

    return {
        subscribe,
        init: async (userId: number) => {
            // Fetch status from API
            try {
                const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/api/pulse/status?user_id=${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    update(s => ({ ...s, ...data }));
                }
            } catch (e) {
                console.error("Failed to load Pulse status", e);
            }
        },
        checkin: async (userId: number, note?: string) => {
            try {
                // Correctly passing parameters as query params to match backend defaults
                const params = new URLSearchParams({ user_id: userId.toString() });
                if (note) params.append('note', note);

                const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/api/pulse/checkin?${params.toString()}`, {
                    method: 'POST',
                    alias: 'checkin', // For identifying calls
                });

                if (res.ok) {
                    // Optimistic update
                    const now = new Date().toISOString();
                    update(s => ({
                        ...s,
                        status: 'active',
                        lastCheckin: now,
                        tier: 0
                    }));
                    return true;
                }
            } catch (e) {
                console.error("Checkin failed", e);
                return false;
            }
        }
    };
}

export const pulse = createPulseStore();
