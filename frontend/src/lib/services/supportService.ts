import { parseApiError } from './errorHandler';
import { apiFetch } from '../api/client';

export interface SearchResult {
    title: string;
    url: string;
    content: string;
    score: number;
}

export interface SearchResponse {
    results: SearchResult[];
    query: string;
}

export const supportService = {
    /** True when the server can run local search for this signed-in person. */
    async isDiscoveryAvailable(): Promise<boolean> {
        try {
            const response = await apiFetch('/api/support/discovery/available');
            return response.ok && (await response.json()).available === true;
        } catch {
            return false;
        }
    },

    async discoverLocalSupport(location: string, category: string = "grief counseling"): Promise<SearchResponse> {
        const response = await apiFetch(`/api/support/discovery?location=${encodeURIComponent(location)}&category=${encodeURIComponent(category)}`);
        if (!response.ok) {
            throw new Error((await parseApiError(response)).message);
        }
        return response.json();
    }
};
