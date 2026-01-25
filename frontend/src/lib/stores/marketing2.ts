/**
 * Marketing2 Store
 *
 * Handles language selection and provides translations for the
 * calm, restrained marketing site.
 */

import { writable, derived } from "svelte/store";
import { marketing2Dictionary, type Marketing2Language } from "./marketing2Dictionary";

// Language state - defaults to English, persists choice
function createLanguageStore() {
    // Try to get saved language from localStorage (browser only)
    const getInitialLanguage = (): Marketing2Language => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("continuum_marketing_lang");
            if (saved && saved in marketing2Dictionary) {
                return saved as Marketing2Language;
            }
            // Try to detect from browser
            const browserLang = navigator.language?.split("-")[0];
            if (browserLang && browserLang in marketing2Dictionary) {
                return browserLang as Marketing2Language;
            }
        }
        return "en";
    };

    const { subscribe, set, update } = writable<Marketing2Language>(getInitialLanguage());

    return {
        subscribe,
        set: (lang: Marketing2Language) => {
            if (typeof window !== "undefined") {
                localStorage.setItem("continuum_marketing_lang", lang);
            }
            set(lang);
        },
        update
    };
}

export const m2Language = createLanguageStore();

// Derived store that returns the translations for the current language
export const m2t = derived(m2Language, ($lang) => {
    return marketing2Dictionary[$lang] || marketing2Dictionary.en;
});

// Available languages for the language selector
export const availableLanguages = [
    { code: "en", name: "English", native: "English" },
    { code: "es", name: "Spanish", native: "Español" },
    { code: "fr", name: "French", native: "Français" },
    { code: "de", name: "German", native: "Deutsch" },
    { code: "ru", name: "Russian", native: "Русский" },
    { code: "he", name: "Hebrew", native: "עברית", rtl: true }
] as const;

// Helper to check if current language is RTL
export const isRTL = derived(m2Language, ($lang) => $lang === "he");
