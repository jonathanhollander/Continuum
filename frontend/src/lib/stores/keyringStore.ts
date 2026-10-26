import { writable, get } from 'svelte/store';

// Account choices remembered in this browser. Marketing intent stays outside this list.
const STORAGE_KEY = 'continuum_keyring_emails';
const ACTIVE_ACC_KEY = 'continuum_active_account';

function getStored(key: string, def: any) {
    if (typeof localStorage === 'undefined') return def;
    const stored = localStorage.getItem(key);
    if (!stored) return def;
    try {
        return JSON.parse(stored);
    } catch {
        return stored;
    }
}

// Accounts remembered by this browser
export const keyringEmails = writable<string[]>(getStored(STORAGE_KEY, []));

// Currently active account (email)
export const activeAccountId = writable<string | null>(getStored(ACTIVE_ACC_KEY, null));

if (typeof localStorage !== 'undefined') {
    keyringEmails.subscribe(emails => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(emails));
    });

    activeAccountId.subscribe(id => {
        if (id) {
            localStorage.setItem(ACTIVE_ACC_KEY, id);
        } else {
            localStorage.removeItem(ACTIVE_ACC_KEY);
        }
    });
}

/**
 * After authentication identifies an account, remember it and select its namespace.
 */
export function registerAccount(email: string) {
    keyringEmails.update(emails => {
        if (!emails.includes(email)) {
            return [...emails, email];
        }
        return emails;
    });
    activeAccountId.set(email);
}

/**
 * Resolve a remembered address without registering or selecting it.
 */
export function knownAccountEmail(email: string): string | null {
    const emails = get(keyringEmails);
    const normalized = email.trim().toLowerCase();
    return Array.isArray(emails)
        ? emails.find(known => typeof known === 'string' && known.trim().toLowerCase() === normalized) ?? null
        : null;
}

/** Choose another remembered account by signing in; auth selects its namespace afterwards. */
export function switchAccount(email: string) {
    const known = knownAccountEmail(email);
    if (known) {
        window.location.href = `/login?email=${encodeURIComponent(known)}`;
    }
}

/**
 * Logout - clear active account and redirect to picker
 */
export function logout() {
    // auth.logout(); // Handled by UI to avoid circular dependency
    activeAccountId.set(null);
    if (typeof window !== 'undefined') {
        localStorage.removeItem('continuum_auth_token');
        localStorage.removeItem('continuum_refresh_token');
        window.location.href = '/login';
    }
}
