/**
 * User Preferences Store
 *
 * Manages user preferences that sync to the backend, including:
 * - View mode preferences (card/table) per module
 *
 * Uses Svelte 5 runes for reactive state management.
 * Preferences are persisted to the backend to sync across devices.
 */

import { browser } from '$app/environment';
import { apiGet } from '$lib/api/client';
import { API_BASE_URL } from '$lib/config';

export type ViewMode = 'card' | 'table';

interface ViewPreferences {
    [module: string]: ViewMode;
}

interface UserPreferencesState {
    view_preferences: ViewPreferences;
}

// Reactive state using Svelte 5 runes
let preferences = $state<ViewPreferences>({});
let isInitialized = $state(false);
let isLoading = $state(false);

/**
 * Get authentication headers for API requests
 */
function getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
        'Content-Type': 'application/json'
    };

    if (browser) {
        const token = localStorage.getItem('continuum_auth_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    return headers;
}

/**
 * Initialize preferences from backend
 */
async function init(): Promise<void> {
    if (!browser || isInitialized || isLoading) return;

    isLoading = true;

    try {
        const response = await apiGet<UserPreferencesState>('/api/auth/me/preferences');
        preferences = response.view_preferences || {};
        isInitialized = true;
    } catch (error) {
        // Log but don't throw - preferences are non-critical
        console.warn('Failed to load user preferences:', error);
        // Use empty defaults
        preferences = {};
        isInitialized = true;
    } finally {
        isLoading = false;
    }
}

/**
 * Get the view mode for a specific module
 */
function getViewMode(module: string): ViewMode {
    return preferences[module] || 'card'; // Default to card view
}

/**
 * Set the view mode for a specific module and sync to backend
 */
async function setViewMode(module: string, mode: ViewMode): Promise<void> {
    // Optimistic update
    preferences[module] = mode;

    if (!browser) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me/preferences`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ view_preferences: preferences })
        });

        if (!response.ok) {
            console.error('Failed to save preference:', response.statusText);
            // Could rollback here, but preferences are non-critical
        }
    } catch (error) {
        console.error('Failed to save preference:', error);
        // Don't rollback - local state is still valid
    }
}

/**
 * Reset all preferences (for logout/testing)
 */
function reset(): void {
    preferences = {};
    isInitialized = false;
}

// Export the store as an object with reactive getters
export const userPreferencesStore = {
    /**
     * Initialize the store - call this on app startup or when user logs in
     */
    init,

    /**
     * Get current view mode for a module
     */
    getViewMode,

    /**
     * Set view mode for a module (syncs to backend)
     */
    setViewMode,

    /**
     * Reset store state
     */
    reset,

    /**
     * Check if store has been initialized
     */
    get isInitialized() {
        return isInitialized;
    },

    /**
     * Check if store is currently loading
     */
    get isLoading() {
        return isLoading;
    },

    /**
     * Get all preferences (read-only)
     */
    get preferences() {
        return { ...preferences };
    }
};
