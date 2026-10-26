import { auth } from '$lib/stores/auth';
import { browser } from '$app/environment';

export const ssr = false;

export function load() {
    if (browser) {
        // Start checking the stored token without waiting on it (card X245): the layout
        // renders at once and shows its loading screen while $auth.loading is true.
        // The layout's onMount init joins this same /api/auth/me request.
        void auth.init();
    }

    return {};
}
