import { writable, get } from 'svelte/store';

// Keyring tracks all "Standalone Accounts" (emails) registered in this browser
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

// All emails seen by this browser
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
 * Register a new email into the keyring and make it active
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
 * Switch to an existing account
 */
export function switchAccount(email: string) {
    const emails = get(keyringEmails);
    if (emails.includes(email)) {
        activeAccountId.set(email);
        // Redirect to dashboard to ensure all stores reload with new namespace
        window.location.href = '/dashboard';
    }
}

/**
 * Logout - clear active account and redirect to picker
 */
export function logout() {
    activeAccountId.set(null);
    window.location.href = '/login';
}
