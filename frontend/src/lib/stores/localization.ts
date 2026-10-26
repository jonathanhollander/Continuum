import { derived } from "svelte/store";
import { dictionary } from "$lib/stores/dictionary";
import { language } from "$lib/stores/conciergeStore.svelte";

// One language source: the concierge setting (saved with the estate profile and changed by
// the header and settings switchers). These names are kept for existing importers.
export { language };

function lookup(dict: any, key: string): string | undefined {
    if (!dict || !key) return undefined;
    // Flat keys first, then dotted paths ("wizard.start").
    if (typeof dict[key] === "string") return dict[key];
    const value = key.split(".").reduce((prev: any, part) => (prev ? prev[part] : undefined), dict);
    return typeof value === "string" ? value : undefined;
}

// Callable translator: `$t("wizard.start")`. Falls back to English, then to the key itself.
export const t = derived(language, ($lang) => {
    return (key: string): string => {
        const langDict = (dictionary as any)[$lang] || dictionary.en;
        return lookup(langDict, key) ?? lookup(dictionary.en, key) ?? key;
    };
});
