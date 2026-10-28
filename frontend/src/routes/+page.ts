import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// The home page lives at /marketing2; / forwards there, query kept.
export const load: PageLoad = ({ url }) => {
    redirect(301, `/marketing2${url.search}`);
};
