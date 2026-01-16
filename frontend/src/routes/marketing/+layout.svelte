<script lang="ts">
    import "../../app.css";
    import { onMount } from "svelte";
    import { writable, derived } from "svelte/store";
    import { dictionary } from "$lib/stores/dictionary";
    import { Globe } from "lucide-svelte";
    import { page } from "$app/stores";
    import { setContext } from "svelte";

    // Marketing Language State (Independent of App Store for Landing)
    export const mLanguage = writable<string>("en");
    export const mt = derived(mLanguage, ($mLanguage) => {
        const lang = $mLanguage as keyof typeof dictionary;
        return (dictionary[lang] || dictionary.en).marketing;
    });

    setContext("marketingTranslations", { mLanguage, mt });

    const languages = [
        { code: "en", label: "English", flag: "🇺🇸" },
        { code: "es", label: "Español", flag: "🇪🇸" },
        { code: "fr", label: "Français", flag: "🇫🇷" },
        { code: "de", label: "Deutsch", flag: "🇩🇪" },
        { code: "ru", label: "Русский", flag: "🇷🇺" },
        { code: "he", label: "עברית", flag: "🇮🇱" },
    ];

    $: isRTL = $mLanguage === "he";
</script>

<div
    class="min-h-screen bg-[#0F1115] text-slate-200 font-sans antialiased selection:bg-amber-500/30 selection:text-amber-100 overflow-x-hidden {isRTL
        ? 'rtl'
        : ''}"
    dir={isRTL ? "rtl" : "ltr"}
>
    <!-- Marketing Header -->
    <header
        class="fixed top-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-between items-center mix-blend-difference text-white pointer-events-none"
    >
        <div
            class="font-serif font-black text-2xl tracking-tighter pointer-events-auto"
        >
            Continuum
        </div>

        <div class="flex items-center gap-4 pointer-events-auto">
            <!-- Language Selector -->
            <div
                class="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-3 py-1 border border-white/10 shrink-0"
            >
                <Globe size={14} class="text-white/60" />
                <select
                    bind:value={$mLanguage}
                    class="bg-transparent text-xs font-bold uppercase tracking-widest outline-none cursor-pointer text-white appearance-none"
                >
                    {#each languages as lang}
                        <option
                            value={lang.code}
                            class="bg-slate-900 text-white"
                        >
                            {lang.flag}
                            {lang.code.toUpperCase()}
                        </option>
                    {/each}
                </select>
            </div>

            <a
                href="/login?lang={$mLanguage}"
                class="px-6 py-2 border border-white/20 rounded-full hover:bg-white hover:text-black transition-all text-sm font-bold uppercase tracking-widest backdrop-blur-md"
            >
                {$mt.login}
            </a>
        </div>
    </header>

    <slot />

    <footer class="py-24 bg-black text-center text-slate-600 text-sm">
        <p>
            &copy; {new Date().getFullYear()} Continuum Legacy Systems. Forever.
        </p>
    </footer>
</div>

<style>
    /* Marketing specific overrides */
    :global(body) {
        background-color: #0f1115;
    }
</style>
