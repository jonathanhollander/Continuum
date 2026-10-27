import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { auth } from '$lib/stores/auth';
import { API_BASE_URL } from '$lib/config';
import { captureSession, isCurrentSession, sessionToken, type SessionOwnership } from './sessionOwnership';

interface AccessStatus {
    private_mode: boolean;
    signup_enabled: boolean;
    access_allowed: boolean;
}
interface AccessState {
    phase: 'loading' | 'ready' | 'error';
    status: AccessStatus | null;
}
const state = writable<AccessState>({ phase: 'loading', status: null });
let current: SessionOwnership | null = null;
let controller: AbortController | null = null;
let revision = 0;

/** Public bootstrap request: never waits for /me or redirects through the API client. */
export async function refreshAccessStatus(force = true): Promise<void> {
    if (!browser) return;
    const owner = captureSession();
    const token = sessionToken(owner, true);
    if (!force && current?.generation === owner.generation && current.token === token) return;
    current = owner;
    controller?.abort();
    const requestController = new AbortController();
    controller = requestController;
    const requestRevision = ++revision;
    state.set({ phase: 'loading', status: null });
    const owns = () => requestRevision === revision && isCurrentSession(owner, true) && sessionToken(owner, true) === token;
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/access-status`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            signal: requestController.signal,
            cache: 'no-store',
        });
        if (!owns()) return;
        if (!response.ok) throw new Error('Access status unavailable');
        const status: AccessStatus = await response.json();
        if (!owns()) return;
        if (typeof status.private_mode !== 'boolean' || typeof status.signup_enabled !== 'boolean' || typeof status.access_allowed !== 'boolean') throw new Error('Access status unavailable');
        state.set({ phase: 'ready', status });
    } catch {
        if (owns()) state.set({ phase: 'error', status: null });
    }
}

export const accessStatus = {
    subscribe: (run: (value: AccessState) => void) => state.subscribe(run),
};

if (browser) {
    auth.subscribe(() => { void refreshAccessStatus(false); });
    window.addEventListener('storage', event => {
        if (event.key === 'continuum_auth_token' || event.key === null) void refreshAccessStatus(false);
    });
}
