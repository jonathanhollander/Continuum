import { get } from 'svelte/store';
import { activeAccountId } from '../stores/keyringStore';
import { auth } from '../stores/auth';
import { API_URL } from '../config';

interface SyncPayload {
    transparent_data: string;
    encrypted_vault?: string;
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Debounced synchronization with the backend.
 * Only syncs if there's an active account (logged in).
 */
export async function syncWithBackend(data: any) {
    const email = get(activeAccountId);
    if (!email || email === 'anonymous') return;

    // Clear existing timeout to debounce
    if (syncTimeout) clearTimeout(syncTimeout);

    syncTimeout = setTimeout(async () => {
        try {
            console.log('🔄 Syncing with backend...', data);

            // In a real app, the backend user_id would be resolved from the email or session
            // For this implementation, we use a mock mapping or let the backend handle it
            const { token } = get(auth);
            if (!token) return;

            const response = await fetch(`${API_URL}/estate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    transparent_data: JSON.stringify(data),
                    // encrypted_vault is handled separately for zero-knowledge
                }),
            });

            if (!response.ok) {
                console.error('❌ Sync failed:', response.statusText);
            } else {
                console.log('✅ Sync successful');
            }
        } catch (error) {
            console.error('❌ Sync error:', error);
        }
    }, 2000); // 2 second debounce to prevent spamming the DB
}

/**
 * Load initial state from backend
 */
export async function loadFromBackend(): Promise<any | null> {
    const email = get(activeAccountId);
    if (!email || email === 'anonymous') return null;

    const { token } = get(auth);
    if (!token) return null;

    try {
        const response = await fetch(`${API_URL}/estate`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            const estate = await response.json();
            return JSON.parse(estate.transparent_data || '{}');
        }
    } catch (error) {
        console.error('❌ Failed to load from backend:', error);
    }
    return null;
}
