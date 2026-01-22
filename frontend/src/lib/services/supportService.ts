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
    async discoverLocalSupport(location: string, category: string = "grief counseling"): Promise<SearchResponse> {
        const response = await fetch(`/api/support/discovery?location=${encodeURIComponent(location)}&category=${encodeURIComponent(category)}`);
        if (!response.ok) {
            throw new Error('Discovery service failed');
        }
        return response.json();
    }
};
