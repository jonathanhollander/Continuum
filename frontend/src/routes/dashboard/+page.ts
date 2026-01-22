import { auth } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
    const authState = get(auth);

    // Redirect to login if no user (even if token exists, user must be loaded)
    if (!authState.user) {
        throw redirect(307, '/login?redirect=/dashboard');
    }

    return {};
};
