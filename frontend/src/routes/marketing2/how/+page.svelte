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
        Compass,
        Layers,
        Bell,
        Menu,
        X
    } from "lucide-svelte";

    let langMenuOpen = $state(false);
    let mobileMenuOpen = $state(false);

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

<svelte:head>
    <title>{$m2t.metaTitleHow}</title>
    <meta name="description" content={$m2t.metaDescHow} />
    <meta property="og:title" content={$m2t.metaTitleHow} />
    <meta property="og:description" content={$m2t.metaDescHow} />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={$m2t.metaTitleHow} />
    <meta name="twitter:description" content={$m2t.metaDescHow} />
</svelte:head>

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
                <a href="/marketing2/how" class="text-white">{$m2t.navHow}</a>
                <a href="/marketing2/features" class="hover:text-white transition-colors">{$m2t.navFeatures}</a>
                <a href="/marketing2#security" class="hover:text-white transition-colors">{$m2t.navSecurity}</a>
            </nav>

            <div class="flex items-center gap-4">
                <!-- Mobile menu button -->
                <button
                    onclick={() => mobileMenuOpen = !mobileMenuOpen}
                    class="md:hidden text-white/60 hover:text-white transition-colors p-2"
                    aria-label="Toggle menu"
                >
                    {#if mobileMenuOpen}
                        <X size={24} />
                    {:else}
                        <Menu size={24} />
                    {/if}
                </button>

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

        <!-- Mobile menu -->
        {#if mobileMenuOpen}
            <div
                class="md:hidden border-t border-white/5 bg-black/95 backdrop-blur-md"
                transition:fade={{ duration: 150 }}
            >
                <nav class="flex flex-col px-6 py-4 space-y-4">
                    <a
                        href="/marketing2/how"
                        class="text-white py-2"
                        onclick={() => mobileMenuOpen = false}
                    >
                        {$m2t.navHow}
                    </a>
                    <a
                        href="/marketing2/features"
                        class="text-white/60 hover:text-white transition-colors py-2"
                        onclick={() => mobileMenuOpen = false}
                    >
                        {$m2t.navFeatures}
                    </a>
                    <a
                        href="/marketing2#security"
                        class="text-white/60 hover:text-white transition-colors py-2"
                        onclick={() => mobileMenuOpen = false}
                    >
                        {$m2t.navSecurity}
                    </a>
                </nav>
            </div>
        {/if}
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
                    {$m2t.howTitle}
                </h1>
                <p class="text-lg text-white/50 leading-relaxed max-w-2xl mx-auto">
                    {$m2t.howIntro}
                </p>
            </div>
        </section>

        <!-- Beat 1: You Start -->
        <section class="py-24 px-6">
            <div class="max-w-4xl mx-auto">
                <div class="grid md:grid-cols-2 gap-12 items-center reveal-section" use:reveal>
                    <div class="order-2 md:order-1">
                        <div class="text-6xl font-serif text-white/10 mb-4">01</div>
                        <h2 class="text-3xl font-serif text-white/90 mb-6">{$m2t.howBeat1Title}</h2>
                        <p class="text-lg text-white/50 leading-relaxed">
                            {$m2t.howBeat1Desc}
                        </p>
                    </div>
                    <div class="order-1 md:order-2 flex justify-center">
                        <div class="w-32 h-32 rounded-full bg-amber-500/10 flex items-center justify-center">
                            <Compass size={48} class="text-amber-400/60" />
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Connector -->
        <div class="flex justify-center py-8">
            <div class="w-px h-24 bg-gradient-to-b from-white/10 to-transparent"></div>
        </div>

        <!-- Beat 2: You Build -->
        <section class="py-24 px-6">
            <div class="max-w-4xl mx-auto">
                <div class="grid md:grid-cols-2 gap-12 items-center reveal-section" use:reveal>
                    <div class="flex justify-center">
                        <div class="w-32 h-32 rounded-full bg-teal-500/10 flex items-center justify-center">
                            <Layers size={48} class="text-teal-400/60" />
                        </div>
                    </div>
                    <div>
                        <div class="text-6xl font-serif text-white/10 mb-4">02</div>
                        <h2 class="text-3xl font-serif text-white/90 mb-6">{$m2t.howBeat2Title}</h2>
                        <p class="text-lg text-white/50 leading-relaxed">
                            {$m2t.howBeat2Desc}
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Connector -->
        <div class="flex justify-center py-8">
            <div class="w-px h-24 bg-gradient-to-b from-white/10 to-transparent"></div>
        </div>

        <!-- Beat 3: It Opens -->
        <section class="py-24 px-6">
            <div class="max-w-4xl mx-auto">
                <div class="grid md:grid-cols-2 gap-12 items-center reveal-section" use:reveal>
                    <div class="order-2 md:order-1">
                        <div class="text-6xl font-serif text-white/10 mb-4">03</div>
                        <h2 class="text-3xl font-serif text-white/90 mb-6">{$m2t.howBeat3Title}</h2>
                        <p class="text-lg text-white/50 leading-relaxed">
                            {$m2t.howBeat3Desc}
                        </p>
                    </div>
                    <div class="order-1 md:order-2 flex justify-center">
                        <div class="w-32 h-32 rounded-full bg-rose-500/10 flex items-center justify-center">
                            <Bell size={48} class="text-rose-400/60" />
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- The Gift -->
        <section class="py-24 px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
            <div class="max-w-3xl mx-auto text-center reveal-section" use:reveal>
                <p class="text-2xl font-serif text-white/70 leading-relaxed mb-8">
                    "{$m2t.pulseGift}"
                </p>
                <div class="w-16 h-px bg-amber-500/30 mx-auto"></div>
            </div>
        </section>

        <!-- CTA -->
        <section class="py-20 px-6">
            <div class="max-w-xl mx-auto text-center reveal-section" use:reveal>
                <p class="text-lg text-white/40 mb-8">
                    {$m2t.invitationDesc}
                </p>
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
        <div class="max-w-4xl mx-auto">
            <nav class="flex justify-center gap-8 mb-8 text-sm text-white/40">
                <a href="/marketing2/how" class="text-white/60">{$m2t.navHow}</a>
                <a href="/marketing2/features" class="hover:text-white/60 transition-colors">{$m2t.navFeatures}</a>
                <a href="/marketing2#security" class="hover:text-white/60 transition-colors">{$m2t.navSecurity}</a>
            </nav>
            <div class="text-center space-y-4">
                <p class="text-xs text-white/30">
                    {$m2t.footerDisclaimer}
                </p>
                <p class="text-sm text-white/20 font-serif italic">
                    {$m2t.footerTagline}
                </p>
            </div>
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
