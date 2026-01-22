import { auth } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ url }) => {
    const authState = get(auth);

    // Protect all module routes - redirect if no user
    if (!authState.user) {
        throw redirect(307, `/login?redirect=${url.pathname}`);
    }

    return {};
};
