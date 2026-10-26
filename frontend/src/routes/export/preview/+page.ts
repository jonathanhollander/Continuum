import type { PageLoad } from './$types';

// The breadcrumb reads this title (routes/+layout.svelte); it is the page's own heading.
export const load: PageLoad = async () => {
    return { title: 'Packet preview' };
};
