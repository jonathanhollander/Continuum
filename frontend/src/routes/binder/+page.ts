import { auth } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
    const authState = get(auth);

    // Protect binder - redirect if no user
    if (!authState.user) {
        throw redirect(307, '/login?redirect=/binder');
    }

    return {};
};
