import { culturalTraditions } from "$lib/data/culturalTraditions";
import { FUNERAL_TRADITIONS } from "$lib/data/funeralTraditions";
import type { PageLoad } from "./$types";

// Breadcrumb title (the layout reads page.data.title), named as the page heading names it.
export const load: PageLoad = ({ params }) => {
    const long = (culturalTraditions as Record<string, { title: string }>)[params.type];
    const short = FUNERAL_TRADITIONS[params.type];
    return { title: long?.title ?? (short ? `${short.name} Traditions` : "Funeral Traditions") };
};
