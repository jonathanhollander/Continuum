import type { LayoutLoad } from './$types';

// Auth protection is handled by the root +layout.svelte
// which redirects to login if user is not authenticated
export const load: LayoutLoad = async () => {
    return {};
};
