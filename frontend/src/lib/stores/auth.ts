import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { API_BASE_URL } from '$lib/config.ts';

export interface User {
    id: number;
    email: string;
    external_id: string;
    user_role?: 'planning' | 'executor' | 'family' | 'advisor';
    emotional_context?: 'healthy' | 'terminal' | 'grieving';
    overwhelm_muted?: boolean;
}

interface AuthState {
    token: string | null;
    user: User | null;
    loading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    token: browser ? localStorage.getItem('continuum_auth_token') : null,
    user: null,
    loading: false,
    error: null
};

function createAuthStore() {
    const { subscribe, set, update } = writable<AuthState>(initialState);

    return {
        subscribe,

        /**
         * Initialize auth state from stored token
         */
        init: async () => {
            const token = browser ? localStorage.getItem('continuum_auth_token') : null;
            if (!token) return;

            update(s => ({ ...s, loading: true, error: null }));
            try {
                const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const user = await res.json();
                    update(s => ({ ...s, token, user, loading: false }));
                } else {
                    // Token expired or invalid
                    if (browser) localStorage.removeItem('continuum_auth_token');
                    update(s => ({ ...s, token: null, user: null, loading: false }));
                }
            } catch (e) {
                console.error("Auth init failed", e);
                if (browser) localStorage.removeItem('continuum_auth_token');
                update(s => ({ ...s, token: null, user: null, loading: false, error: 'Failed to initialize authentication' }));
            }
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

                    if (browser) localStorage.setItem('continuum_auth_token', token);

                    // Fetch user info
                    const userRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const user = await userRes.json();

                    set({ token, user, loading: false, error: null });
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

                    if (browser) localStorage.setItem('continuum_auth_token', token);

                    // Fetch user info
                    const userRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const user = await userRes.json();

                    set({ token, user, loading: false, error: null });
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
            if (browser) localStorage.removeItem('continuum_auth_token');
            set({ token: null, user: null, loading: false, error: null });
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
