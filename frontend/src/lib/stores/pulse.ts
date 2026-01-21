import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { auth } from './auth';
import { API_BASE_URL } from '../config';

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
        init: async () => {
            const { token } = get(auth);
            if (!token) return;
            // Fetch status from API
            try {
                const res = await fetch(`${API_BASE_URL}/api/pulse/status`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    update(s => ({ ...s, ...data }));
                }
            } catch (e) {
                console.error("Failed to load Pulse status", e);
            }
        },
        checkin: async (note?: string) => {
            const { token } = get(auth);
            if (!token) return false;
            try {
                // Correctly passing parameters as query params to match backend defaults
                const params = new URLSearchParams();
                if (note) params.append('note', note);

                const res = await fetch(`${API_BASE_URL}/api/pulse/checkin?${params.toString()}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
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
