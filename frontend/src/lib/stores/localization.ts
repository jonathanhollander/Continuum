import { writable, derived } from "svelte/store";
import { dictionary } from "$lib/stores/dictionary";

export const activeLanguage = writable("en");
// Alias for compatibility
export const language = activeLanguage;

function getNestedValue(obj: any, path: string): string {
    return path.split('.').reduce((prev, curr) => {
        return prev ? prev[curr] : null;
    }, obj) || path;
}

export const t = derived(activeLanguage, ($lang) => {
    return (key: string) => {
        const langDict = (dictionary as any)[$lang] || dictionary['en'];
        // Try direct access first (for flat keys)
        if (langDict[key]) return langDict[key];

        // Try nested access
        return getNestedValue(langDict, key);
    };
});
