import { writable, derived } from "svelte/store";
import { dictionary } from "$lib/stores/dictionary";

// Marketing Language State (Shared Store)
export const mLanguage = writable<string>("en");

export const mt = derived(mLanguage, ($mLanguage) => {
    const lang = $mLanguage as keyof typeof dictionary;
    return (dictionary[lang] || dictionary.en).marketing;
});
