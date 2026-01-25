<script lang="ts">
    import { onMount } from "svelte";
    import { fade, fly, scale } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import { m2Language, m2t, availableLanguages, isRTL } from "$lib/stores/marketing2";
    import type { Marketing2Language } from "$lib/stores/marketing2Dictionary";
    import {
        ArrowRight,
        ChevronDown,
        Globe,
        Heart,
        Compass,
        Shield,
        BookOpen,
        Menu,
        X,
        Lock
    } from "lucide-svelte";
    import {
        keyringEmails,
        registerAccount,
        switchAccount,
    } from "$lib/stores/keyringStore";
    import { get } from "svelte/store";

    let scrollY = $state(0);
    let innerHeight = $state(0);
    let introVisible = $state(false);
    let langMenuOpen = $state(false);
    let mobileMenuOpen = $state(false);

    // Signup flow state
    let name = $state("");
    let email = $state("");
    let signupStep = $state(0); // 0: name, 1: email, 2: welcome

    // Intersection observer for reveal animations
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

    onMount(() => {
        // Scroll to top on mount
        window.scrollTo(0, 0);
        setTimeout(() => (introVisible = true), 300);
    });

    function handleNameSubmit() {
        if (name.trim().length > 1) {
            signupStep = 1;
        }
    }

    function handleEmailSubmit() {
        if (email.includes("@") && email.includes(".")) {
            const existingEmails = get(keyringEmails);
            if (existingEmails.includes(email)) {
                switchAccount(email);
                return;
            }
            registerAccount(email);
            import("$lib/stores/persistence").then((m) => {
                m.setStored("owner", { name: name.trim(), id: "owner" });
            });
            signupStep = 2;
        }
    }

    function setLanguage(lang: Marketing2Language) {
        m2Language.set(lang);
        langMenuOpen = false;
    }

    // Computed scroll progress for hero
    const heroOpacity = $derived(Math.max(0, 1 - scrollY / (innerHeight * 0.5)));
</script>

<svelte:head>
    <title>{$m2t.metaTitle}</title>
    <meta name="description" content={$m2t.metaDescription} />
    <meta property="og:title" content={$m2t.metaTitle} />
    <meta property="og:description" content={$m2t.metaDescription} />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={$m2t.metaTitle} />
    <meta name="twitter:description" content={$m2t.metaDescription} />
</svelte:head>

<svelte:window bind:scrollY bind:innerHeight />

<div class="min-h-screen bg-[#0a0a0b] text-white" dir={$isRTL ? "rtl" : "ltr"}>
    <!-- Subtle Background -->
    <div class="fixed inset-0 z-0 pointer-events-none">
        <!-- Gradient overlay -->
        <div class="absolute inset-0 bg-gradient-to-b from-amber-950/10 via-transparent to-transparent"></div>
        <!-- Subtle grain -->
        <div
            class="absolute inset-0 opacity-[0.03]"
            style="background-image: url('data:image/svg+xml,%3Csvg viewBox=\"0 0 256 256\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noise\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"4\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noise)\"/%3E%3C/svg%3E');"
        ></div>
    </div>

    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 z-50 transition-all duration-500" class:bg-black/80={scrollY > 100} class:backdrop-blur-md={scrollY > 100}>
        <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <!-- Logo -->
            <a href="/marketing2" class="text-xl font-serif tracking-wide text-white/90 hover:text-white transition-colors">
                Continuum
            </a>

            <!-- Nav -->
            <nav class="hidden md:flex items-center gap-8 text-sm text-white/60">
                <a href="/marketing2/how" class="hover:text-white transition-colors">{$m2t.navHow}</a>
                <a href="/marketing2/features" class="hover:text-white transition-colors">{$m2t.navFeatures}</a>
                <a href="#security" class="hover:text-white transition-colors">{$m2t.navSecurity}</a>
            </nav>

            <!-- Right side -->
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

                <!-- Language selector -->
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

                <!-- Login -->
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
                        class="text-white/60 hover:text-white transition-colors py-2"
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
                        href="#security"
                        class="text-white/60 hover:text-white transition-colors py-2"
                        onclick={() => mobileMenuOpen = false}
                    >
                        {$m2t.navSecurity}
                    </a>
                </nav>
            </div>
        {/if}
    </header>

    <main class="relative z-10">
        <!-- Section 1: The Shoebox (Hero) -->
        <section class="min-h-screen flex items-center justify-center px-6 relative">
            <div
                class="text-center max-w-3xl mx-auto"
                style="opacity: {heroOpacity}; transform: translateY({scrollY * 0.1}px);"
            >
                {#if introVisible}
                    <div class="space-y-4 mb-8" in:fade={{ duration: 800, delay: 200 }}>
                        <h1 class="text-4xl md:text-6xl lg:text-7xl font-serif font-light text-white/90 leading-tight">
                            {$m2t.heroLine1}
                        </h1>
                        <h1 class="text-4xl md:text-6xl lg:text-7xl font-serif font-light text-white/60 leading-tight">
                            {$m2t.heroLine2}
                        </h1>
                    </div>

                    <div in:fade={{ duration: 800, delay: 600 }}>
                        <p class="text-2xl md:text-3xl font-serif text-amber-400/90 mb-8">
                            {$m2t.heroLine3}
                        </p>
                        <p class="text-lg text-white/50 max-w-xl mx-auto mb-10">
                            {$m2t.heroDesc}
                        </p>
                        <a
                            href="/marketing2/features"
                            class="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors"
                        >
                            {$m2t.ctaExplore}
                            <ArrowRight size={16} />
                        </a>
                    </div>
                {/if}
            </div>

            <!-- Scroll indicator -->
            <div class="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-white/30" style="opacity: {heroOpacity};">
                <div class="w-px h-12 bg-gradient-to-b from-white/20 to-transparent"></div>
            </div>
        </section>

        <!-- Section 1.5: The Kitchen Story -->
        <section class="py-24 px-6 bg-gradient-to-b from-transparent via-rose-950/5 to-transparent">
            <div class="max-w-2xl mx-auto reveal-section" use:reveal>
                <h2 class="text-2xl md:text-3xl font-serif text-white/80 text-center mb-10">
                    {$m2t.kitchenTitle}
                </h2>
                <p class="text-lg text-white/40 leading-relaxed mb-10 italic">
                    {$m2t.kitchenDesc}
                </p>
                <p class="text-xl text-rose-400/70 font-serif text-center">
                    {$m2t.kitchenPunchline}
                </p>
            </div>
        </section>

        <!-- Section 2: The Weight -->
        <section class="py-32 px-6">
            <div class="max-w-3xl mx-auto text-center reveal-section" use:reveal>
                <h2 class="text-3xl md:text-4xl font-serif text-white/90 mb-8 leading-relaxed">
                    {$m2t.weightTitle}
                </h2>
                <p class="text-lg text-white/50 leading-relaxed mb-12">
                    {$m2t.weightDesc}
                </p>
                <p class="text-xl text-amber-400/80 font-serif italic">
                    {$m2t.weightBridge}
                </p>
            </div>
        </section>

        <!-- Section 3: The Guide -->
        <section class="py-32 px-6 bg-gradient-to-b from-transparent via-amber-950/5 to-transparent">
            <div class="max-w-3xl mx-auto text-center reveal-section" use:reveal>
                <div class="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-8">
                    <Compass size={24} class="text-amber-400/70" />
                </div>
                <h2 class="text-3xl md:text-4xl font-serif text-white/90 mb-8">
                    {$m2t.guideTitle}
                </h2>
                <p class="text-lg text-white/50 leading-relaxed mb-8">
                    {$m2t.guideDesc}
                </p>
                <p class="text-base text-white/40 italic">
                    {$m2t.guideReassurance}
                </p>
            </div>
        </section>

        <!-- Section 4: The Pulse -->
        <section class="py-32 px-6" id="how">
            <div class="max-w-3xl mx-auto reveal-section" use:reveal>
                <div class="text-center mb-16">
                    <div class="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center mx-auto mb-8">
                        <Heart size={24} class="text-teal-400/70" />
                    </div>
                    <h2 class="text-3xl md:text-4xl font-serif text-white/90 mb-8">
                        {$m2t.pulseTitle}
                    </h2>
                    <p class="text-lg text-white/50 leading-relaxed">
                        {$m2t.pulseDesc}
                    </p>
                </div>

                <div class="space-y-8 text-center">
                    <p class="text-lg text-white/50 leading-relaxed">
                        {$m2t.pulseHow}
                    </p>
                    <p class="text-base text-white/40 leading-relaxed">
                        {$m2t.pulseTiers}
                    </p>
                    <p class="text-xl text-teal-400/80 font-serif italic">
                        {$m2t.pulseGift}
                    </p>
                </div>
            </div>
        </section>

        <!-- Section 5: The Distinction -->
        <section class="py-32 px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
            <div class="max-w-3xl mx-auto text-center reveal-section" use:reveal>
                <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-8">
                    <Shield size={24} class="text-white/50" />
                </div>
                <h2 class="text-2xl md:text-3xl font-serif text-white/80 mb-6">
                    {$m2t.distinctionTitle}
                </h2>
                <p class="text-base text-white/40 leading-relaxed mb-4">
                    {$m2t.distinctionDesc}
                </p>
                <p class="text-base text-white/50 leading-relaxed mb-8">
                    {$m2t.distinctionRole}
                </p>
                <p class="text-lg text-white/60 font-serif italic">
                    {$m2t.distinctionTagline}
                </p>
            </div>
        </section>

        <!-- Section 5.5: Security -->
        <section class="py-32 px-6" id="security">
            <div class="max-w-4xl mx-auto reveal-section" use:reveal>
                <div class="text-center mb-16">
                    <div class="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-8">
                        <Lock size={24} class="text-emerald-400/70" />
                    </div>
                    <h2 class="text-3xl md:text-4xl font-serif text-white/90 mb-6">
                        {$m2t.securityTitle}
                    </h2>
                    <p class="text-lg text-white/50 leading-relaxed max-w-2xl mx-auto">
                        {$m2t.securityDesc}
                    </p>
                </div>

                <div class="grid md:grid-cols-3 gap-8">
                    <div class="text-center p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                        <h3 class="text-lg font-serif text-emerald-400/90 mb-3">{$m2t.securityEncryption}</h3>
                        <p class="text-sm text-white/40">{$m2t.securityEncryptionDesc}</p>
                    </div>
                    <div class="text-center p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                        <h3 class="text-lg font-serif text-emerald-400/90 mb-3">{$m2t.securityPrivacy}</h3>
                        <p class="text-sm text-white/40">{$m2t.securityPrivacyDesc}</p>
                    </div>
                    <div class="text-center p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                        <h3 class="text-lg font-serif text-emerald-400/90 mb-3">{$m2t.securityControl}</h3>
                        <p class="text-sm text-white/40">{$m2t.securityControlDesc}</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Section 6: The Gift -->
        <section class="py-32 px-6" id="features">
            <div class="max-w-4xl mx-auto reveal-section" use:reveal>
                <h2 class="text-3xl md:text-4xl font-serif text-white/90 text-center mb-16">
                    {$m2t.giftTitle}
                </h2>

                <div class="grid md:grid-cols-3 gap-8">
                    <!-- Clarity -->
                    <div class="text-center p-8 rounded-2xl bg-white/[0.02] border border-white/5">
                        <h3 class="text-xl font-serif text-amber-400/90 mb-3">{$m2t.giftClarity}</h3>
                        <p class="text-sm text-white/40">{$m2t.giftClarityDesc}</p>
                    </div>

                    <!-- Guidance -->
                    <div class="text-center p-8 rounded-2xl bg-white/[0.02] border border-white/5">
                        <h3 class="text-xl font-serif text-amber-400/90 mb-3">{$m2t.giftGuidance}</h3>
                        <p class="text-sm text-white/40">{$m2t.giftGuidanceDesc}</p>
                    </div>

                    <!-- Voice -->
                    <div class="text-center p-8 rounded-2xl bg-white/[0.02] border border-white/5">
                        <h3 class="text-xl font-serif text-amber-400/90 mb-3">{$m2t.giftVoice}</h3>
                        <p class="text-sm text-white/40">{$m2t.giftVoiceDesc}</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Section 7: The Invitation & Signup -->
        <section class="py-32 px-6 min-h-[80vh] flex items-center">
            <div class="max-w-2xl mx-auto w-full reveal-section" use:reveal>
                {#if signupStep === 0}
                    <!-- Name step -->
                    <div class="text-center" in:fade={{ duration: 400 }}>
                        <h2 class="text-3xl md:text-4xl font-serif text-white/90 mb-4">
                            {$m2t.invitationTitle}
                        </h2>
                        <p class="text-lg text-white/50 mb-12">
                            {$m2t.invitationDesc}
                        </p>

                        <div class="max-w-md mx-auto space-y-6">
                            <p class="text-sm text-white/40">{$m2t.signupNamePrompt}</p>
                            <input
                                type="text"
                                bind:value={name}
                                placeholder={$m2t.signupNamePlaceholder}
                                onkeydown={(e) => e.key === "Enter" && handleNameSubmit()}
                                class="w-full bg-transparent border-b border-white/20 focus:border-amber-500/50 py-4 text-2xl font-serif text-center text-white/90 outline-none transition-colors placeholder:text-white/20"
                            />

                            {#if name.trim().length > 1}
                                <button
                                    onclick={handleNameSubmit}
                                    class="mt-8 inline-flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full text-white/80 transition-all group"
                                    in:fade
                                >
                                    {$m2t.signupButton}
                                    <ArrowRight size={18} class="group-hover:translate-x-1 transition-transform" />
                                </button>
                            {/if}
                        </div>
                    </div>
                {:else if signupStep === 1}
                    <!-- Email step -->
                    <div class="text-center" in:fade={{ duration: 400 }}>
                        <p class="text-sm text-white/40 mb-8">{$m2t.signupEmailPrompt}</p>
                        <input
                            type="email"
                            bind:value={email}
                            placeholder={$m2t.signupEmailPlaceholder}
                            onkeydown={(e) => e.key === "Enter" && handleEmailSubmit()}
                            class="w-full max-w-md mx-auto block bg-transparent border-b border-white/20 focus:border-amber-500/50 py-4 text-xl text-center text-white/90 outline-none transition-colors placeholder:text-white/20"
                        />

                        {#if email.includes("@") && email.includes(".")}
                            <button
                                onclick={handleEmailSubmit}
                                class="mt-8 inline-flex items-center gap-3 px-8 py-4 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-full text-amber-200 transition-all group"
                                in:fade
                            >
                                {$m2t.signupButton}
                                <ArrowRight size={18} class="group-hover:translate-x-1 transition-transform" />
                            </button>
                        {/if}

                        <button
                            onclick={() => signupStep = 0}
                            class="mt-6 block mx-auto text-sm text-white/30 hover:text-white/50 transition-colors"
                        >
                            {$m2t.signupBack}
                        </button>
                    </div>
                {:else}
                    <!-- Welcome step -->
                    <div class="text-center" in:scale={{ duration: 500, start: 0.95 }}>
                        <div class="w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mx-auto mb-8">
                            <Heart size={28} class="text-teal-400" />
                        </div>
                        <h2 class="text-3xl font-serif text-white/90 mb-2">
                            {$m2t.signupWelcome} {name}.
                        </h2>
                        <p class="text-lg text-white/50 mb-8">
                            {$m2t.signupNext}
                        </p>
                        <a
                            href="/start?email={encodeURIComponent(email)}"
                            class="inline-flex items-center gap-3 px-8 py-4 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/30 rounded-full text-teal-200 transition-all group"
                        >
                            {$m2t.signupEnter}
                            <ArrowRight size={18} class="group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                {/if}
            </div>
        </section>
    </main>

    <!-- Footer -->
    <footer class="py-12 px-6 border-t border-white/5">
        <div class="max-w-4xl mx-auto">
            <nav class="flex justify-center gap-8 mb-8 text-sm text-white/40">
                <a href="/marketing2/how" class="hover:text-white/60 transition-colors">{$m2t.navHow}</a>
                <a href="/marketing2/features" class="hover:text-white/60 transition-colors">{$m2t.navFeatures}</a>
                <a href="#security" class="hover:text-white/60 transition-colors">{$m2t.navSecurity}</a>
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
    /* Reveal animation */
    .reveal-section {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.8s ease-out, transform 0.8s ease-out;
    }

    .reveal-section.revealed {
        opacity: 1;
        transform: translateY(0);
    }

    /* Smooth scroll */
    :global(html) {
        scroll-behavior: smooth;
    }
</style>
