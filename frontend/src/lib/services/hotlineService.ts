import hotlinesData from '$lib/data/hotlines.json';

export interface Hotline {
    label: string;
    number: string;
}

/**
 * Fetches crisis hotlines based on the provided country code.
 * Reverts to US if country code is not found, or DEFAULT if all fails.
 */
export function getHotlinesByCountry(countryCode: string | null): Hotline[] {
    const code = countryCode?.toUpperCase() || 'US';

    if (hotlinesData[code as keyof typeof hotlinesData]) {
        return hotlinesData[code as keyof typeof hotlinesData];
    }

    // Fallback logic
    return hotlinesData.DEFAULT;
}
