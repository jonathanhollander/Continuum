import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// The Pulse home lives at /modules/pulse; /pulse forwards there, query kept.
export const load: PageLoad = ({ url }) => {
    redirect(307, `/modules/pulse${url.search}`);
};
