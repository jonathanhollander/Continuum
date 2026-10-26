import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { API_BASE_URL } from '$lib/config';
import { preferenceStore } from '$lib/stores/preferenceStore';
import { registerAccount } from '$lib/stores/keyringStore';

export interface User {
    id: number;
    email: string;
    external_id: string;
    user_role?: 'planning' | 'executor' | 'family' | 'advisor';
    emotional_context?: 'healthy' | 'terminal' | 'grieving';
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

const token = browser ? localStorage.getItem('continuum_auth_token') : null;
const initialState: AuthState = {
    token,
    user: null,
    isAuthenticated: false,
    loading: !!token,
    error: null
};

const TOKEN_KEY = 'continuum_auth_token';
const REFRESH_KEY = 'continuum_refresh_token';

/** Store the access token and, when the server sent one, the refresh token. */
export function storeTokens(accessToken: string, refreshToken?: string | null) {
    if (!browser) return;
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

function clearTokens() {
    if (!browser) return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
}

export type RefreshResult = { ok: true; token: string } | { ok: false; definite: boolean };

let refreshInFlight: Promise<RefreshResult> | null = null;

/**
 * Exchange the stored refresh token for new tokens (the server rotates it, so a
 * refresh token is single-use). Parallel callers share one request.
 * `definite: false` means a network/server problem, so tokens are kept.
 */
export function refreshSession(): Promise<RefreshResult> {
    if (!browser) return Promise.resolve({ ok: false, definite: false });
    if (refreshInFlight) return refreshInFlight;
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return Promise.resolve({ ok: false, definite: true });

    refreshInFlight = (async (): Promise<RefreshResult> => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken })
            });
            if (res.ok) {
                const data = await res.json();
                storeTokens(data.access_token, data.refresh_token);
                return { ok: true, token: data.access_token };
            }
            // Only the server refusing the token is definite; any other status (a proxy's 4xx, a 5xx) keeps the tokens
            return { ok: false, definite: res.status === 401 || res.status === 403 };
        } catch {
            return { ok: false, definite: false };
        }
    })().finally(() => {
        refreshInFlight = null;
    });
    return refreshInFlight;
}

// The session init already done (or running) for a token: the layout's load and its onMount
// both call init on every page load, and they share one /api/auth/me.
let initRun: { token: string; run: Promise<void> } | null = null;

function createAuthStore() {
    const { subscribe, set, update } = writable<AuthState>(initialState);

    /** Load the signed-in user for the stored token; returns the token it ended on when signed in. */
    const loadSession = async (): Promise<string | null> => {
            let token = browser ? localStorage.getItem(TOKEN_KEY) : null;
            if (!token) return null;

            update(s => ({ ...s, loading: true, error: null }));
            try {
                let res = await fetch(`${API_BASE_URL}/api/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.status === 401) {
                    // Access token expired: try the refresh token once before giving up
                    const refreshed = await refreshSession();
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

                if (res.ok) {
                    const user = await res.json();

                    // Register account to namespace preferences
                    if (browser) registerAccount(user.email);

                    if (user.onboarding_completed) {
                        preferenceStore.setOnboardingComplete(true);
                    }
                    update(s => ({ ...s, token, user, isAuthenticated: true, offline: false, loading: false }));
                    return token;
                } else if (res.status === 401) {
                    // Definitely signed out (refresh also refused)
                    clearTokens();
                    update(s => ({ ...s, token: null, user: null, isAuthenticated: false, offline: false, loading: false }));
                } else {
                    // Server trouble (5xx etc.): keep tokens
                    update(s => ({ ...s, token, isAuthenticated: true, offline: true, loading: false, error: 'Could not reach the server' }));
                }
            } catch (e) {
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
            const token = browser ? localStorage.getItem(TOKEN_KEY) : null;
            if (!token) return Promise.resolve();
            if (initRun?.token === token) return initRun.run;
            const entry = {
                token,
                run: loadSession().then(signedIn => {
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

                    storeTokens(token, data.refresh_token);

                    // Fetch user info
                    const userRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const user = await userRes.json();

                    // Register account to namespace preferences
                    if (browser) registerAccount(user.email);

                    if (user.onboarding_completed) {
                        preferenceStore.setOnboardingComplete(true);
                    }

                    set({ token, user, isAuthenticated: true, loading: false, error: null });
                    return true;
                } else {
                    const error = await res.json();
                    update(s => ({ ...s, loading: false, error: error.detail || 'Signup failed' }));
                    return false;
                }
            } catch (e) {
                console.error("Signup failed", e);
                update(s => ({ ...s, loading: false, error: 'Signup failed. Please try again.' }));
                return false;
            }
        },

        /**
         * Login with email and password
         */
        login: async (email: string, password: string): Promise<boolean> => {
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

                    storeTokens(token, data.refresh_token);

                    // Fetch user info
                    const userRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const user = await userRes.json();

                    // Register account to namespace preferences
                    if (browser) registerAccount(user.email);

                    if (user.onboarding_completed) {
                        preferenceStore.setOnboardingComplete(true);
                    }

                    set({ token, user, isAuthenticated: true, loading: false, error: null });
                    return true;
                } else {
                    const error = await res.json();
                    update(s => ({ ...s, loading: false, error: error.detail || 'Login failed' }));
                    return false;
                }
            } catch (e) {
                console.error("Login failed", e);
                update(s => ({ ...s, loading: false, error: 'Login failed. Please try again.' }));
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

import { derived } from 'svelte/store';
export const user = derived(auth, $auth => $auth.user);
export const isAuthenticated = derived(auth, $auth => $auth.isAuthenticated);
