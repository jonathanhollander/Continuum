/**
 * Authenticated API Client
 *
 * Provides fetch wrappers that automatically include JWT authentication headers.
 * All API requests should use these utilities to ensure proper authentication.
 */

import { get } from 'svelte/store';
import { auth } from '$lib/stores/auth';
import { API_BASE_URL, DEFAULT_TIMEOUT } from '$lib/config';
import { browser } from '$app/environment';
import { parseApiError } from '$lib/services/errorHandler';

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
 * Authenticated GET request
 */
export async function apiGet<T = any>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (response.status === 401) {
        // Token expired or invalid - logout user
        auth.logout();
        if (browser) {
            window.location.href = '/login';
        }
        throw new Error('Authentication required');
    }

    if (!response.ok) {
        const errorDetails = await parseApiError(response);
        const error = new Error(errorDetails.message);
        (error as any).code = errorDetails.code;
        (error as any).details = errorDetails.details;
        throw error;
    }

    return response.json();
}

/**
 * Authenticated POST request
 */
export async function apiPost<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined
    });

    if (response.status === 401) {
        auth.logout();
        if (browser) {
            window.location.href = '/login';
        }
        throw new Error('Authentication required');
    }

    if (!response.ok) {
        const errorDetails = await parseApiError(response);
        const error = new Error(errorDetails.message);
        (error as any).code = errorDetails.code;
        (error as any).details = errorDetails.details;
        throw error;
    }

    return response.json();
}

/**
 * Authenticated PUT request
 */
export async function apiPut<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined
    });

    if (response.status === 401) {
        auth.logout();
        if (browser) {
            window.location.href = '/login';
        }
        throw new Error('Authentication required');
    }

    if (!response.ok) {
        const errorDetails = await parseApiError(response);
        const error = new Error(errorDetails.message);
        (error as any).code = errorDetails.code;
        (error as any).details = errorDetails.details;
        throw error;
    }

    return response.json();
}

/**
 * Authenticated DELETE request
 */
export async function apiDelete<T = any>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });

    if (response.status === 401) {
        auth.logout();
        if (browser) {
            window.location.href = '/login';
        }
        throw new Error('Authentication required');
    }

    if (!response.ok) {
        const errorDetails = await parseApiError(response);
        const error = new Error(errorDetails.message);
        (error as any).code = errorDetails.code;
        (error as any).details = errorDetails.details;
        throw error;
    }

    return response.json();
}

/**
 * Raw fetch with authentication (for custom requests)
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
        ...getAuthHeaders(),
        ...(options.headers || {})
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
            signal: controller.signal
        });

        if (response.status === 401) {
            auth.logout();
            if (browser) {
                window.location.href = '/login';
            }
            throw new Error('Authentication required');
        }

        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}
