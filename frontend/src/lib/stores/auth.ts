import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface User {
    id: number;
    email: string;
    external_id: string;
}

interface AuthState {
    token: string | null;
    user: User | null;
    loading: boolean;
}

const initialState: AuthState = {
    token: browser ? localStorage.getItem('continuum_auth_token') : null,
    user: null,
    loading: false
};

function createAuthStore() {
    const { subscribe, set, update } = writable<AuthState>(initialState);

    return {
        subscribe,
        init: async () => {
            const token = browser ? localStorage.getItem('continuum_auth_token') : null;
            if (!token) return;

            update(s => ({ ...s, loading: true }));
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
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
                update(s => ({ ...s, loading: false }));
            }
        },
        login: async (email: string) => {
            update(s => ({ ...s, loading: true }));
            try {
                const formData = new FormData();
                formData.append('username', email);
                formData.append('password', 'dev-pass'); // Dummy password for dev bootstrapping

                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/token`, {
                    method: 'POST',
                    body: formData
                });

                if (res.ok) {
                    const data = await res.json();
                    const token = data.access_token;
                    if (browser) localStorage.setItem('continuum_auth_token', token);

                    const userRes = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const user = await userRes.json();

                    set({ token, user, loading: false });
                    return true;
                }
            } catch (e) {
                console.error("Login failed", e);
            }
            update(s => ({ ...s, loading: false }));
            return false;
        },
        logout: () => {
            if (browser) localStorage.removeItem('continuum_auth_token');
            set({ token: null, user: null, loading: false });
        }
    };
}

export const auth = createAuthStore();
