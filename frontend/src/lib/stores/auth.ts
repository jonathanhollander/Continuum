import { browserStorage } from "$lib/services/browserStorage";
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { API_BASE_URL } from '$lib/config';
import { preferenceStore } from '$lib/stores/preferenceStore';
import { registerAccount } from '$lib/stores/keyringStore';
import {
    beginSession, captureSession, commitSessionToken, completeSession,
    isCurrentSession, sessionToken, type SessionOwnership,
} from '$lib/services/sessionOwnership';

export interface User {
    id: number;
    email: string;
    is_admin?: boolean;
    external_id: string;
    user_role?: 'planning' | 'executor' | 'family' | 'advisor';
    emotional_context?: 'healthy' | 'terminal' | 'grieving';
    deceased_name?: string | null;
    overwhelm_muted?: boolean;
    onboarding_completed?: boolean;
}

interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
    /** True when tokens exist but the server could not be reached */
    offline?: boolean;
}

const token = browser ? browserStorage.getItem('continuum_auth_token') : null;
const initialState: AuthState = {
    token,
    user: null,
    isAuthenticated: false,
    loading: !!token,
    error: null
};

const TOKEN_KEY = 'continuum_auth_token';
const REFRESH_KEY = 'continuum_refresh_token';

/** New sign-ins replace ownership; a refresh retains its initiating session. */
export function storeTokens(accessToken: string, refreshToken?: string | null, owner = beginSession(), refresh = false): boolean {
    if (!browser) return false;
    return commitSessionToken(owner, accessToken, () => {
        browserStorage.setItem(TOKEN_KEY, accessToken);
        if (refreshToken) browserStorage.setItem(REFRESH_KEY, refreshToken);
        else if (!refresh) browserStorage.removeItem(REFRESH_KEY);
    }, refresh);
}

function clearTokens(owner = beginSession()) {
    if (!browser) return;
    commitSessionToken(owner, null, () => {
        browserStorage.removeItem(TOKEN_KEY);
        browserStorage.removeItem(REFRESH_KEY);
    });
}

export type RefreshResult = { ok: true; token: string } | { ok: false; definite: boolean };

let refreshInFlight: { owner: SessionOwnership; run: Promise<RefreshResult> } | null = null;

/**
 * Exchange the stored refresh token for new tokens (the server rotates it, so a
 * refresh token is single-use). Parallel callers share one request.
 * `definite: false` means a network/server problem, so tokens are kept.
 */
export function refreshSession(owner = captureSession()): Promise<RefreshResult> {
    if (!browser || !isCurrentSession(owner, true)) return Promise.resolve({ ok: false, definite: false });
    if (refreshInFlight && refreshInFlight.owner.generation === owner.generation
        && isCurrentSession(refreshInFlight.owner, true)) return refreshInFlight.run;
    const refreshToken = browserStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return Promise.resolve({ ok: false, definite: true });

    const entry: { owner: SessionOwnership; run: Promise<RefreshResult> } = { owner, run: (async (): Promise<RefreshResult> => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken })
            });
            if (!isCurrentSession(owner, true)) return { ok: false, definite: false };
            if (res.ok) {
                const data = await res.json();
                if (!storeTokens(data.access_token, data.refresh_token, owner, true)) return { ok: false, definite: false };
                return { ok: true, token: data.access_token };
            }
            // Only the server refusing the token is definite; any other status (a proxy's 4xx, a 5xx) keeps the tokens
            return { ok: false, definite: res.status === 401 || res.status === 403 };
        } catch {
            return { ok: false, definite: false };
        }
    })().finally(() => {
        if (refreshInFlight === entry) refreshInFlight = null;
    }) };
    refreshInFlight = entry;
    return entry.run;
}

// The session init already done (or running) for a token: the layout's load and its onMount
// both call init on every page load, and they share one /api/auth/me.
let initRun: { token: string; owner: SessionOwnership; run: Promise<void> } | null = null;

function createAuthStore() {
    const { subscribe, set, update } = writable<AuthState>(initialState);

    /** Load the signed-in user for the stored token; returns the token it ended on when signed in. */
    const loadSession = async (owner = captureSession()): Promise<string | null> => {
            let token = sessionToken(owner, true);
            if (!token) return null;

            update(s => ({ ...s, token, user: s.token === token ? s.user : null, loading: true, error: null }));
            try {
                let res = await fetch(`${API_BASE_URL}/api/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!isCurrentSession(owner, true)) return null;

                if (res.status === 401) {
                    // Access token expired: try the refresh token once before giving up
                    const refreshed = await refreshSession(owner);
                    if (!isCurrentSession(owner, true)) return null;
                    if (refreshed.ok) {
                        token = refreshed.token;
                        res = await fetch(`${API_BASE_URL}/api/auth/me`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                    } else if (!refreshed.definite) {
                        // Could not reach the server: keep the tokens for the next try
                        update(s => ({ ...s, token, isAuthenticated: true, offline: true, loading: false, error: 'Could not reach the server' }));
                        return null;
                    }
                }

                if (!isCurrentSession(owner, true)) return null;
                if (res.ok) {
                    const user = await res.json();
                    if (!isCurrentSession(owner, true)) return null;

                    // Register account to namespace preferences
                    if (browser) registerAccount(user.email);

                    if (user.onboarding_completed) {
                        preferenceStore.setOnboardingComplete(true);
                    }
                    if (!completeSession(owner)) return null;
                    token = sessionToken(captureSession())!;
                    update(s => ({ ...s, token, user, isAuthenticated: true, offline: false, loading: false }));
                    return token;
                } else if (res.status === 401) {
                    // Definitely signed out (refresh also refused)
                    clearTokens(owner);
                    update(s => ({ ...s, token: null, user: null, isAuthenticated: false, offline: false, loading: false }));
                } else {
                    // Server trouble (5xx etc.): keep tokens
                    update(s => ({ ...s, token, isAuthenticated: true, offline: true, loading: false, error: 'Could not reach the server' }));
                }
            } catch (e) {
                if (!isCurrentSession(owner, true)) return null;
                // Network failure: keep the tokens so a reload once back online still works
                console.error("Auth init failed", e);
                update(s => ({ ...s, token, isAuthenticated: true, offline: true, loading: false, error: 'Failed to initialize authentication' }));
            }
            return null;
    };

    return {
        subscribe,

        /**
         * Initialize auth state from stored token. A second call for the same token joins the
         * first; a new token (sign-in) or an earlier failure (offline) loads again.
         */
        init: (): Promise<void> => {
            const token = browser ? browserStorage.getItem(TOKEN_KEY) : null;
            if (!token) return Promise.resolve();
            if (initRun?.token === token && isCurrentSession(initRun.owner, true)) return initRun.run;
            const owner = captureSession();
            const entry = {
                token, owner,
                run: loadSession(owner).then(signedIn => {
                    if (initRun !== entry) return;
                    if (signedIn) entry.token = signedIn; // a refresh swapped the token
                    else initRun = null;
                })
            };
            initRun = entry;
            return entry.run;
        },

        /**
         * Sign up a new user
         */
        signup: async (email: string, password: string): Promise<boolean> => {
            const previous = captureSession();
            const owner = beginSession();
            update(s => ({ ...s, loading: true, error: null }));
            try {
                const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (res.ok) {
                    const data = await res.json();
                    const token = data.access_token;
                    if (!storeTokens(token, data.refresh_token, owner)) return false;
                    return !!(await loadSession());
                } else {
                    const error = await res.json();
                    if (!isCurrentSession(owner, true)) return false;
                    if (previous.ready && previous.token === owner.token) completeSession(owner);
                    update(s => ({ ...s, loading: false, error: error.error?.message || error.detail || 'That pause was on our side. We can try again whenever you\'re ready.' }));
                    return false;
                }
            } catch (e) {
                if (!isCurrentSession(owner, true)) return false;
                if (previous.ready && previous.token === owner.token) completeSession(owner);
                console.error("Signup failed", e);
                update(s => ({ ...s, loading: false, error: 'That pause was on our side. We can try again whenever you\'re ready.' }));
                return false;
            }
        },

        /**
         * Login with email and password
         */
        login: async (email: string, password: string): Promise<boolean> => {
            const previous = captureSession();
            const owner = beginSession();
            update(s => ({ ...s, loading: true, error: null }));
            try {
                const formData = new FormData();
                formData.append('username', email);
                formData.append('password', password);

                const res = await fetch(`${API_BASE_URL}/api/auth/token`, {
                    method: 'POST',
                    body: formData
                });

                if (res.ok) {
                    const data = await res.json();
                    const token = data.access_token;
                    if (!storeTokens(token, data.refresh_token, owner)) return false;
                    return !!(await loadSession());
                } else {
                    const error = await res.json();
                    if (!isCurrentSession(owner, true)) return false;
                    if (previous.ready && previous.token === owner.token) completeSession(owner);
                    update(s => ({ ...s, loading: false, error: error.error?.message || error.detail || 'Sign-in paused for a moment. We can try again whenever you\'re ready.' }));
                    return false;
                }
            } catch (e) {
                if (!isCurrentSession(owner, true)) return false;
                if (previous.ready && previous.token === owner.token) completeSession(owner);
                console.error("Login failed", e);
                update(s => ({ ...s, loading: false, error: 'Sign-in paused for a moment. We can try again whenever you\'re ready.' }));
                return false;
            }
        },

        /**
         * Logout current user
         */
        logout: () => {
            initRun = null;
            clearTokens();
            set({ token: null, user: null, isAuthenticated: false, loading: false, error: null });
        },

        /**
         * Clear error message
         */
        clearError: () => {
            update(s => ({ ...s, error: null }));
        },

        /**
         * Check if passkeys are supported on this device
         */
        isPasskeySupported: async (): Promise<boolean> => {
            if (!browser) return false;

            try {
                // Check if WebAuthn is supported
                if (!window.PublicKeyCredential) {
                    return false;
                }

                // Check if platform authenticator is available
                const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                return available;
            } catch {
                return false;
            }
        }
    };
}

export const auth = createAuthStore();

if (browser) {
    window.addEventListener('storage', (event) => {
        if (event.key !== TOKEN_KEY && event.key !== null) return;
        initRun = null;
        if (browserStorage.getItem(TOKEN_KEY)) void auth.init();
        else auth.logout();
    });
}

import { derived } from 'svelte/store';
export const user = derived(auth, $auth => $auth.user);
export const isAuthenticated = derived(auth, $auth => $auth.isAuthenticated);
