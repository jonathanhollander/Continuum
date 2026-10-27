import { redirect } from "@sveltejs/kit";
import registry from "$lib/data/registry.json";
import type { PageLoad } from "./$types";

// Every document vault reads the same /api/data/documents rows, so the one vault lives at
// /modules/legal-documents.
const VAULT = /legal|letter|file|keepsake|document/;

export const load: PageLoad = ({ params }) => {
    if (VAULT.test(params.id)) {
        redirect(307, "/modules/legal-documents");
    }
    // Breadcrumb title (the layout reads page.data.title).
    return { title: (registry as { id: string; title: string }[]).find((m) => m.id === params.id)?.title ?? "Page Moved" };
};
