<script lang="ts">
    import { onMount } from "svelte";
    import { Globe } from "lucide-svelte";
    import { mLanguage, mt } from "$lib/stores/marketing";
    import { auth } from "$lib/stores/auth";

    let { children } = $props();

    const languages = [
        { code: "en", label: "English", flag: "🇺🇸" },
        { code: "es", label: "Español", flag: "🇪🇸" },
        { code: "fr", label: "Français", flag: "🇫🇷" },
        { code: "de", label: "Deutsch", flag: "🇩🇪" },
        { code: "ru", label: "Русский", flag: "🇷🇺" },
        { code: "he", label: "עברית", flag: "🇮🇱" },
    ];

    let isRTL = $derived($mLanguage === "he");
</script>

<div
    class="surface-dark min-h-screen bg-[#0F1115] text-slate-200 font-sans antialiased selection:bg-gold/30 selection:text-white overflow-x-hidden {isRTL
        ? 'rtl'
        : ''}"
    dir={isRTL ? "rtl" : "ltr"}
>
    <!-- Marketing Header -->
    <header
        class="fixed top-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-between items-center mix-blend-difference text-white pointer-events-none backdrop-blur-[2px]"
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
                    aria-label="Language"
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
                href={$auth.token ? "/dashboard" : `/login?lang=${$mLanguage}`}
                class="px-6 py-2 border border-white/20 rounded-full hover:bg-white hover:text-black transition-all text-sm font-bold uppercase tracking-widest backdrop-blur-md"
            >
                {$auth.token ? $mt.openMyPlan : $mt.login}
            </a>
        </div>
    </header>

    {@render children?.()}

    <footer class="py-24 bg-black text-center text-muted-foreground text-sm">
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
