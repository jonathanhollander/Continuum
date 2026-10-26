import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

// Every document vault reads the same /api/data/documents rows, so the one vault lives at
// /modules/legal-documents. Ids the page below would hand to another archetype stay here.
const OTHER = /financial|property|insurance|subscription|asset|vehicle|estate|contact|beneficiar|task|checklist|guide/;
const VAULT = /legal|letter|file|keepsake|document/;

export const load: PageLoad = ({ params }) => {
    if (VAULT.test(params.id) && !OTHER.test(params.id)) {
        redirect(307, "/modules/legal-documents");
    }
};
