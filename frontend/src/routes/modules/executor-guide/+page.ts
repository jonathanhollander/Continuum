import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/**
 * Redirect executor-guide to executor-toolkit.
 * This consolidates the executor guidance features into a single location.
 */
export const load: PageServerLoad = () => {
    throw redirect(301, '/modules/executor-toolkit');
};
