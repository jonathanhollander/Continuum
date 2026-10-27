import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// Important Dates now live on the Event Calendar (same 'calendar_events' records).
export const load: PageLoad = () => {
    throw redirect(301, '/modules/calendar');
};
