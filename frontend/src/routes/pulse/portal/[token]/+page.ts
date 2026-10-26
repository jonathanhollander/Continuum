import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// One guardian portal: every email links to /portal/[token], which now holds the shared notes
// too; this older address forwards there.
export const load: PageLoad = ({ params }) => {
    redirect(307, `/portal/${encodeURIComponent(params.token)}`);
};
