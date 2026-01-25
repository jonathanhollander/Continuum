<script lang="ts">
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import { m2Language, m2t, availableLanguages, isRTL } from "$lib/stores/marketing2";
    import type { Marketing2Language } from "$lib/stores/marketing2Dictionary";
    import {
        ArrowRight,
        ArrowLeft,
        ChevronDown,
        Globe,
        FileText,
        Heart,
        Shield,
        Briefcase
    } from "lucide-svelte";

    let langMenuOpen = $state(false);

    function reveal(node: HTMLElement) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        node.classList.add("revealed");
                    }
                });
            },
            { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
        );
        observer.observe(node);
        return { destroy: () => observer.disconnect() };
    }

    function setLanguage(lang: Marketing2Language) {
        m2Language.set(lang);
        langMenuOpen = false;
    }

    onMount(() => {
        window.scrollTo(0, 0);
    });
</script>

<div class="min-h-screen bg-[#0a0a0b] text-white" dir={$isRTL ? "rtl" : "ltr"}>
    <!-- Subtle Background -->
    <div class="fixed inset-0 z-0 pointer-events-none">
        <div class="absolute inset-0 bg-gradient-to-b from-amber-950/10 via-transparent to-transparent"></div>
        <div
            class="absolute inset-0 opacity-[0.03]"
            style="background-image: url('data:image/svg+xml,%3Csvg viewBox=\"0 0 256 256\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noise\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"4\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noise)\"/%3E%3C/svg%3E');"
        ></div>
    </div>

    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
        <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <a href="/marketing2" class="text-xl font-serif tracking-wide text-white/90 hover:text-white transition-colors">
                Continuum
            </a>

            <nav class="hidden md:flex items-center gap-8 text-sm text-white/60">
                <a href="/marketing2/how" class="hover:text-white transition-colors">{$m2t.navHow}</a>
                <a href="/marketing2/features" class="text-white">{$m2t.navFeatures}</a>
                <a href="/marketing2#security" class="hover:text-white transition-colors">{$m2t.navSecurity}</a>
            </nav>

            <div class="flex items-center gap-4">
                <div class="relative">
                    <button
                        onclick={() => langMenuOpen = !langMenuOpen}
                        class="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
                    >
                        <Globe size={16} />
                        <span class="hidden sm:inline">{availableLanguages.find(l => l.code === $m2Language)?.native}</span>
                        <ChevronDown size={14} class="transition-transform" class:rotate-180={langMenuOpen} />
                    </button>

                    {#if langMenuOpen}
                        <div
                            class="absolute top-full right-0 mt-2 bg-black/95 backdrop-blur-md border border-white/10 rounded-lg py-2 min-w-[140px] shadow-xl"
                            transition:fade={{ duration: 150 }}
                        >
                            {#each availableLanguages as lang}
                                <button
                                    onclick={() => setLanguage(lang.code as Marketing2Language)}
                                    class="w-full px-4 py-2 text-left text-sm hover:bg-white/5 transition-colors"
                                    class:text-amber-400={$m2Language === lang.code}
                                    class:text-white/70={$m2Language !== lang.code}
                                >
                                    {lang.native}
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>

                <a
                    href="/login"
                    class="text-sm px-4 py-2 rounded-full border border-white/20 text-white/80 hover:text-white hover:border-white/40 transition-all"
                >
                    {$m2t.navLogin}
                </a>
            </div>
        </div>
    </header>

    <main class="relative z-10 pt-24">
        <!-- Hero -->
        <section class="py-20 px-6">
            <div class="max-w-3xl mx-auto text-center">
                <a
                    href="/marketing2"
                    class="inline-flex items-center gap-2 text-white/40 hover:text-white/60 transition-colors text-sm mb-8"
                >
                    {#if $isRTL}
                        <ArrowRight size={16} />
                    {:else}
                        <ArrowLeft size={16} />
                    {/if}
                    Continuum
                </a>

                <h1 class="text-4xl md:text-5xl font-serif text-white/90 mb-6">
                    {$m2t.featuresTitle}
                </h1>
                <p class="text-lg text-white/50 leading-relaxed max-w-2xl mx-auto">
                    {$m2t.featuresIntro}
                </p>
            </div>
        </section>

        <!-- The Four Cards -->
        <section class="py-16 px-6">
            <div class="max-w-5xl mx-auto">
                <div class="grid md:grid-cols-2 gap-8">
                    <!-- The Practical -->
                    <div class="reveal-section p-10 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors" use:reveal>
                        <div class="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
                            <FileText size={28} class="text-amber-400/70" />
                        </div>
                        <h2 class="text-2xl font-serif text-white/90 mb-4">{$m2t.featurePracticalTitle}</h2>
                        <p class="text-white/50 leading-relaxed mb-6">{$m2t.featurePracticalDesc}</p>
                        <ul class="space-y-3 text-sm text-white/40">
                            <li class="flex items-center gap-3">
                                <div class="w-1.5 h-1.5 rounded-full bg-amber-500/50"></div>
                                {$m2t.practicalItem1}
                            </li>
                            <li class="flex items-center gap-3">
                                <div class="w-1.5 h-1.5 rounded-full bg-amber-500/50"></div>
                                {$m2t.practicalItem2}
                            </li>
                            <li class="flex items-center gap-3">
                                <div class="w-1.5 h-1.5 rounded-full bg-amber-500/50"></div>
                                {$m2t.practicalItem3}
                            </li>
                            <li class="flex items-center gap-3">
                                <div class="w-1.5 h-1.5 rounded-full bg-amber-500/50"></div>
                                {$m2t.practicalItem4}
                            </li>
                        </ul>
                    </div>

                    <!-- The Personal -->
                    <div class="reveal-section p-10 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors" use:reveal>
                        <div class="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-6">
                            <Heart size={28} class="text-rose-400/70" />
                        </div>
                        <h2 class="text-2xl font-serif text-white/90 mb-4">{$m2t.featurePersonalTitle}</h2>
                        <p class="text-white/50 leading-relaxed mb-6">{$m2t.featurePersonalDesc}</p>
                        <ul class="space-y-3 text-sm text-white/40">
                            <li class="flex items-center gap-3">
                                <div class="w-1.5 h-1.5 rounded-full bg-rose-500/50"></div>
                                {$m2t.personalItem1}
                            </li>
                            <li class="flex items-center gap-3">
                                <div class="w-1.5 h-1.5 rounded-full bg-rose-500/50"></div>
                                {$m2t.personalItem2}
                            </li>
                            <li class="flex items-center gap-3">
                                <div class="w-1.5 h-1.5 rounded-full bg-rose-500/50"></div>
                                {$m2t.personalItem3}
                            </li>
                            <li class="flex items-center gap-3">
                                <div class="w-1.5 h-1.5 rounded-full bg-rose-500/50"></div>
                                {$m2t.personalItem4}
                            </li>
                        </ul>
                    </div>

                    <!-- The Protective -->
                    <div class="reveal-section p-10 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors" use:reveal>
                        <div class="w-14 h-14 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-6">
                            <Shield size={28} class="text-teal-400/70" />
                        </div>
                        <h2 class="text-2xl font-serif text-white/90 mb-4">{$m2t.featureProtectiveTitle}</h2>
                        <p class="text-white/50 leading-relaxed mb-6">{$m2t.featureProtectiveDesc}</p>
                        <ul class="space-y-3 text-sm text-white/40">
                            <li class="flex items-center gap-3">
                                <div class="w-1.5 h-1.5 rounded-full bg-teal-500/50"></div>
                                {$m2t.protectiveItem1}
                            </li>
                            <li class="flex items-center gap-3">
                                <div class="w-1.5 h-1.5 rounded-full bg-teal-500/50"></div>
                                {$m2t.protectiveItem2}
                            </li>
                            <li class="flex items-center gap-3">
                                <div class="w-1.5 h-1.5 rounded-full bg-teal-500/50"></div>
                                {$m2t.protectiveItem3}
                            </li>
                            <li class="flex items-center gap-3">
                                <div class="w-1.5 h-1.5 rounded-full bg-teal-500/50"></div>
                                {$m2t.protectiveItem4}
                            </li>
                        </ul>
                    </div>

                    <!-- The Prepared -->
                    <div class="reveal-section p-10 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors" use:reveal>
                        <div class="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6">
                            <Briefcase size={28} class="text-indigo-400/70" />
                        </div>
                        <h2 class="text-2xl font-serif text-white/90 mb-4">{$m2t.featurePreparedTitle}</h2>
                        <p class="text-white/50 leading-relaxed mb-6">{$m2t.featurePreparedDesc}</p>
                        <ul class="space-y-3 text-sm text-white/40">
                            <li class="flex items-center gap-3">
                                <div class="w-1.5 h-1.5 rounded-full bg-indigo-500/50"></div>
                                {$m2t.preparedItem1}
                            </li>
                            <li class="flex items-center gap-3">
                                <div class="w-1.5 h-1.5 rounded-full bg-indigo-500/50"></div>
                                {$m2t.preparedItem2}
                            </li>
                            <li class="flex items-center gap-3">
                                <div class="w-1.5 h-1.5 rounded-full bg-indigo-500/50"></div>
                                {$m2t.preparedItem3}
                            </li>
                            <li class="flex items-center gap-3">
                                <div class="w-1.5 h-1.5 rounded-full bg-indigo-500/50"></div>
                                {$m2t.preparedItem4}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        <!-- And More -->
        <section class="py-20 px-6">
            <div class="max-w-2xl mx-auto text-center reveal-section" use:reveal>
                <p class="text-lg text-white/40 leading-relaxed mb-8">
                    {$m2t.featuresMore}
                </p>
                <p class="text-base text-white/30 italic">
                    {$m2t.featuresMoreSub}
                </p>
            </div>
        </section>

        <!-- CTA -->
        <section class="py-20 px-6">
            <div class="max-w-xl mx-auto text-center reveal-section" use:reveal>
                <a
                    href="/marketing2"
                    class="inline-flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full text-white/80 transition-all group"
                >
                    {$m2t.ctaPrimary}
                    <ArrowRight size={18} class="group-hover:translate-x-1 transition-transform" />
                </a>
            </div>
        </section>
    </main>

    <!-- Footer -->
    <footer class="py-12 px-6 border-t border-white/5">
        <div class="max-w-4xl mx-auto text-center space-y-4">
            <p class="text-xs text-white/30">
                {$m2t.footerDisclaimer}
            </p>
            <p class="text-sm text-white/20 font-serif italic">
                {$m2t.footerTagline}
            </p>
        </div>
    </footer>
</div>

<style>
    .reveal-section {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.8s ease-out, transform 0.8s ease-out;
    }

    .reveal-section.revealed {
        opacity: 1;
        transform: translateY(0);
    }
</style>
