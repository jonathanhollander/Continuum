import { auth } from '$lib/stores/auth';
import { browser } from '$app/environment';

export const ssr = false;

export async function load() {
    if (browser) {
        // Initialize authentication state from stored token
        await auth.init();
    }

    return {};
}
