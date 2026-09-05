<script lang="ts">
    import { onMount } from "svelte";
    import { fade, fly, slide } from "svelte/transition";
    import { backOut, elasticOut } from "svelte/easing";
    import { spring, tweened } from "svelte/motion";
    import {
        m2Language,
        m2t,
        availableLanguages,
        isRTL,
    } from "$lib/stores/marketing2";
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
        X,
    } from "lucide-svelte";

    let langMenuOpen = $state(false);
    let mobileMenuOpen = $state(false);
    let scrollY = $state(0);
    let innerHeight = $state(0);
    let innerWidth = $state(0);
    let prefersReducedMotion = $state(false);

    // Spring physics for cursor glow
    const cursorGlow = spring({ x: 0, y: 0 }, { stiffness: 0.1, damping: 0.4 });
    const scrollProgress = tweened(0, { duration: 150 });

    // Parallax offsets
    const floatOffset1 = $derived(scrollY * 0.05);
    const floatOffset2 = $derived(scrollY * 0.07);

    // Connector line animation based on scroll
    const connectorProgress = $derived(
        Math.min(1, scrollY / (innerHeight * 2)),
    );

    function reveal(node: HTMLElement, options: { delay?: number } = {}) {
        if (prefersReducedMotion) {
            node.classList.add("revealed");
            return { destroy: () => {} };
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const delay = options.delay || 0;
                        setTimeout(() => {
                            node.classList.add("revealed");
                        }, delay);
                    }
                });
            },
            { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
        );
        observer.observe(node);
        return { destroy: () => observer.disconnect() };
    }

    // Icon animation on hover
    function iconAnimate(node: HTMLElement) {
        if (prefersReducedMotion) return { destroy: () => {} };

        const handleMouseEnter = () => {
            node.style.transform = "scale(1.15) rotate(10deg)";
        };

        const handleMouseLeave = () => {
            node.style.transform = "scale(1) rotate(0deg)";
        };

        node.addEventListener("mouseenter", handleMouseEnter);
        node.addEventListener("mouseleave", handleMouseLeave);

        return {
            destroy() {
                node.removeEventListener("mouseenter", handleMouseEnter);
                node.removeEventListener("mouseleave", handleMouseLeave);
            },
        };
    }

    function setLanguage(lang: Marketing2Language) {
        m2Language.set(lang);
        langMenuOpen = false;
    }

    onMount(() => {
        window.scrollTo(0, 0);
        prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;

        const updateScroll = () => {
            const docHeight =
                document.documentElement.scrollHeight - innerHeight;
            scrollProgress.set(docHeight > 0 ? scrollY / docHeight : 0);
        };

        const handleMouseMove = (e: MouseEvent) => {
            cursorGlow.set({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener("scroll", updateScroll);
        window.addEventListener("mousemove", handleMouseMove);

        return () => {
            window.removeEventListener("scroll", updateScroll);
            window.removeEventListener("mousemove", handleMouseMove);
        };
    });

    const beats = $derived([
        {
            num: "01",
            title: $m2t.howBeat1Title,
            desc: $m2t.howBeat1Desc,
            icon: Compass,
            color: "amber",
            iconClass: "text-amber-400/60",
        },
        {
            num: "02",
            title: $m2t.howBeat2Title,
            desc: $m2t.howBeat2Desc,
            icon: Layers,
            color: "teal",
            iconClass: "text-teal-400/60",
        },
        {
            num: "03",
            title: $m2t.howBeat3Title,
            desc: $m2t.howBeat3Desc,
            icon: Bell,
            color: "rose",
            iconClass: "text-rose-400/60",
        },
    ]);
    const grainBg = `background-image: url('data:image/svg+xml,%3Csvg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%" height="100%" filter="url(%23noise)"/%3E%3C/svg%3E');`;
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

<svelte:window bind:scrollY bind:innerHeight bind:innerWidth />

<div
    class="min-h-screen bg-[#0a0a0b] text-white overflow-x-hidden"
    dir={$isRTL ? "rtl" : "ltr"}
>
    <!-- Cursor Glow Effect (Desktop only) -->
    {#if innerWidth > 768 && !prefersReducedMotion}
        <div
            class="pointer-events-none fixed z-50 w-96 h-96 rounded-full opacity-20 blur-3xl"
            style="
                background: radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, transparent 70%);
                left: {$cursorGlow.x - 192}px;
                top: {$cursorGlow.y - 192}px;
            "
        ></div>
    {/if}

    <!-- Scroll Progress Indicator -->
    <div
        class="fixed top-0 left-0 h-[2px] bg-gradient-to-r from-amber-500 via-teal-500 to-rose-500 z-[100] origin-left"
        style="transform: scaleX({$scrollProgress})"
    ></div>

    <!-- Animated Background -->
    <div class="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div
            class="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-[100px] animate-float-slow"
            style="
                background: radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 70%);
                top: 10%;
                left: -15%;
                transform: translateY({floatOffset1}px);
            "
        ></div>
        <div
            class="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-[80px] animate-float-medium"
            style="
                background: radial-gradient(circle, rgba(20, 184, 166, 0.1) 0%, transparent 70%);
                bottom: 10%;
                right: -10%;
                transform: translateY({-floatOffset2}px);
            "
        ></div>

        <!-- Floating particles -->
        {#if !prefersReducedMotion}
            {#each Array(10) as _, i}
                <div
                    class="absolute w-1 h-1 rounded-full bg-white/10 animate-float-particle"
                    style="
                        left: {12 + i * 8}%;
                        top: {15 + ((i * 7) % 60)}%;
                        animation-delay: {i * 0.6}s;
                        animation-duration: {6 + (i % 4)}s;
                    "
                ></div>
            {/each}
        {/if}

        <div class="absolute inset-0 opacity-[0.03]" style={grainBg}></div>
    </div>

    <!-- Header -->
    <header
        class="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5"
    >
        <div
            class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between"
        >
            <a
                href="/marketing2"
                class="text-xl font-serif tracking-wide text-white/90 hover:text-white transition-all duration-300 hover:tracking-wider"
            >
                Continuum
            </a>

            <nav
                class="hidden md:flex items-center gap-8 text-sm text-white/60"
            >
                <a href="/marketing2/how" class="text-white">{$m2t.navHow}</a>
                <a href="/marketing2/features" class="nav-link"
                    >{$m2t.navFeatures}</a
                >
                <a href="/marketing2#security" class="nav-link"
                    >{$m2t.navSecurity}</a
                >
            </nav>

            <div class="flex items-center gap-4">
                <button
                    onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
                    class="md:hidden text-white/60 hover:text-white transition-colors p-2"
                    aria-label="Toggle menu"
                >
                    <div class="relative w-6 h-6">
                        {#if mobileMenuOpen}
                            <X
                                size={24}
                                class="absolute inset-0 animate-spin-in"
                            />
                        {:else}
                            <Menu size={24} class="absolute inset-0" />
                        {/if}
                    </div>
                </button>

                <div class="relative">
                    <button
                        onclick={() => (langMenuOpen = !langMenuOpen)}
                        class="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm group"
                    >
                        <Globe
                            size={16}
                            class="group-hover:animate-spin-slow"
                        />
                        <span class="hidden sm:inline"
                            >{availableLanguages.find(
                                (l) => l.code === $m2Language,
                            )?.native}</span
                        >
                        <ChevronDown
                            size={14}
                            class="transition-transform duration-300 {langMenuOpen
                                ? 'rotate-180'
                                : ''}"
                        />
                    </button>

                    {#if langMenuOpen}
                        <div
                            class="absolute top-full right-0 mt-2 bg-black/95 backdrop-blur-md border border-white/10 rounded-lg py-2 min-w-[140px] shadow-xl"
                            transition:fly={{ y: -10, duration: 200 }}
                        >
                            {#each availableLanguages as lang, i}
                                <button
                                    onclick={() =>
                                        setLanguage(
                                            lang.code as Marketing2Language,
                                        )}
                                    class="w-full px-4 py-2 text-left text-sm hover:bg-white/5 transition-all duration-200 {$m2Language ===
                                    lang.code
                                        ? 'text-amber-400'
                                        : 'text-white/70'}"
                                    style="animation: slideIn 0.2s ease {i *
                                        0.05}s both"
                                >
                                    {lang.native}
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>

                <a
                    href="/login"
                    class="text-sm px-4 py-2 rounded-full border border-white/20 text-white/80 hover:text-white hover:border-white/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.2)]"
                >
                    {$m2t.navLogin}
                </a>
            </div>
        </div>

        {#if mobileMenuOpen}
            <div
                class="md:hidden border-t border-white/5 bg-black/95 backdrop-blur-md overflow-hidden"
                transition:slide={{ duration: 300 }}
            >
                <nav class="flex flex-col px-6 py-4 space-y-2">
                    {#each [{ href: "/marketing2/how", label: $m2t.navHow, active: true }, { href: "/marketing2/features", label: $m2t.navFeatures, active: false }, { href: "/marketing2#security", label: $m2t.navSecurity, active: false }] as item, i}
                        <a
                            href={item.href}
                            class="transition-all duration-200 py-3 border-b border-white/5 last:border-0 {item.active
                                ? 'text-white'
                                : 'text-white/60'}"
                            onclick={() => (mobileMenuOpen = false)}
                            style="animation: slideIn 0.3s ease {i * 0.1}s both"
                        >
                            {item.label}
                        </a>
                    {/each}
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
                    class="inline-flex items-center gap-2 text-white/40 hover:text-white/60 transition-all duration-300 text-sm mb-8 group"
                    in:fade={{ duration: 300, delay: 100 }}
                >
                    {#if $isRTL}
                        <ArrowRight
                            size={16}
                            class="group-hover:translate-x-1 transition-transform"
                        />
                    {:else}
                        <ArrowLeft
                            size={16}
                            class="group-hover:-translate-x-1 transition-transform"
                        />
                    {/if}
                    Continuum
                </a>

                <h1
                    class="text-4xl md:text-5xl font-serif text-white/90 mb-6"
                    in:fly={{
                        y: 30,
                        duration: 600,
                        delay: 200,
                        easing: backOut,
                    }}
                >
                    {$m2t.howTitle}
                </h1>
                <p
                    class="text-lg text-white/50 leading-relaxed max-w-2xl mx-auto"
                    in:fly={{ y: 20, duration: 600, delay: 400 }}
                >
                    {$m2t.howIntro}
                </p>
            </div>
        </section>

        <!-- Timeline with beats -->
        <div class="relative">
            <!-- Animated vertical line connecting beats -->
            <div class="absolute left-1/2 top-0 bottom-0 w-px hidden md:block">
                <div
                    class="w-full bg-gradient-to-b from-amber-500/30 via-teal-500/30 to-rose-500/30 origin-top"
                    style="height: 100%; transform: scaleY({connectorProgress})"
                ></div>
            </div>

            {#each beats as beat, i}
                <!-- Beat Section -->
                <section class="py-24 px-6 relative">
                    <div class="max-w-4xl mx-auto">
                        <div
                            class="grid md:grid-cols-2 gap-12 items-center reveal-section"
                            use:reveal={{ delay: i * 100 }}
                        >
                            <!-- Text content -->
                            <div
                                class={i % 2 === 0 ? "order-2 md:order-1" : ""}
                            >
                                <div
                                    class="text-6xl font-serif text-white/10 mb-4 number-reveal"
                                    style="animation: numberPop 0.6s ease {i *
                                        0.2}s both"
                                >
                                    {beat.num}
                                </div>
                                <h2
                                    class="text-3xl font-serif text-white/90 mb-6"
                                >
                                    {beat.title}
                                </h2>
                                <p
                                    class="text-lg text-white/50 leading-relaxed"
                                >
                                    {beat.desc}
                                </p>
                            </div>

                            <!-- Icon -->
                            <div
                                class={i % 2 === 0
                                    ? "order-1 md:order-2 flex justify-center"
                                    : "flex justify-center"}
                            >
                                <div
                                    class="icon-orb w-32 h-32 rounded-full bg-{beat.color}-500/10 flex items-center justify-center relative"
                                    use:iconAnimate
                                >
                                    <!-- Animated rings -->
                                    <div
                                        class="icon-ring icon-ring-1 bg-{beat.color}-500/10"
                                    ></div>
                                    <div
                                        class="icon-ring icon-ring-2 bg-{beat.color}-500/5"
                                    ></div>
                                    <svelte:component
                                        this={beat.icon}
                                        size={48}
                                        class={beat.iconClass}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Connector dot (visible on mobile) -->
                {#if i < beats.length - 1}
                    <div class="flex justify-center py-4 md:hidden">
                        <div class="w-2 h-2 rounded-full bg-white/20"></div>
                    </div>
                {/if}
            {/each}
        </div>

        <!-- The Gift Quote -->
        <section
            class="py-24 px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent"
        >
            <div
                class="max-w-3xl mx-auto text-center reveal-section"
                use:reveal
            >
                <div class="quote-marks text-6xl text-white/5 font-serif mb-4">
                    "
                </div>
                <p
                    class="text-2xl font-serif text-white/70 leading-relaxed mb-8 italic"
                >
                    {$m2t.pulseGift}
                </p>
                <div
                    class="w-16 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent mx-auto animate-pulse-glow"
                ></div>
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
                    class="inline-flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full text-white/80 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(251,191,36,0.2)]"
                >
                    {$m2t.ctaPrimary}
                    <ArrowRight
                        size={18}
                        class="group-hover:translate-x-1 transition-transform duration-300"
                    />
                </a>
            </div>
        </section>
    </main>

    <!-- Footer -->
    <footer class="py-12 px-6 border-t border-white/5">
        <div class="max-w-4xl mx-auto">
            <nav class="flex justify-center gap-8 mb-8 text-sm text-white/40">
                <a href="/marketing2/how" class="text-white/60">{$m2t.navHow}</a
                >
                <a
                    href="/marketing2/features"
                    class="hover:text-white/60 transition-colors duration-300"
                    >{$m2t.navFeatures}</a
                >
                <a
                    href="/marketing2#security"
                    class="hover:text-white/60 transition-colors duration-300"
                    >{$m2t.navSecurity}</a
                >
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
        transition:
            opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .reveal-section.revealed {
        opacity: 1;
        transform: translateY(0);
    }

    .nav-link {
        position: relative;
        padding-bottom: 4px;
    }

    .nav-link::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        width: 0;
        height: 1px;
        background: linear-gradient(
            90deg,
            rgba(251, 191, 36, 0.5),
            rgba(20, 184, 166, 0.5)
        );
        transition: width 0.3s ease;
    }

    .nav-link:hover::after {
        width: 100%;
    }

    .nav-link:hover {
        color: white;
    }

    /* Icon orb with rings */
    .icon-orb {
        transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .icon-ring {
        position: absolute;
        border-radius: 50%;
        animation: iconRingPulse 4s ease-in-out infinite;
    }

    .icon-ring-1 {
        width: 150%;
        height: 150%;
        animation-delay: 0s;
    }

    .icon-ring-2 {
        width: 200%;
        height: 200%;
        animation-delay: 2s;
    }

    @keyframes iconRingPulse {
        0%,
        100% {
            transform: scale(1);
            opacity: 0.3;
        }
        50% {
            transform: scale(1.1);
            opacity: 0.1;
        }
    }

    /* Number pop animation */
    @keyframes numberPop {
        0% {
            transform: scale(0.5);
            opacity: 0;
        }
        50% {
            transform: scale(1.1);
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }

    /* Quote styling */
    .quote-marks {
        line-height: 1;
    }

    /* Pulse glow on divider */
    .animate-pulse-glow {
        animation: pulseGlow 3s ease-in-out infinite;
    }

    @keyframes pulseGlow {
        0%,
        100% {
            opacity: 0.3;
            box-shadow: 0 0 10px rgba(251, 191, 36, 0.1);
        }
        50% {
            opacity: 0.6;
            box-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
        }
    }

    /* Floating animations */
    @keyframes float-slow {
        0%,
        100% {
            transform: translateY(0) rotate(0deg);
        }
        50% {
            transform: translateY(-25px) rotate(2deg);
        }
    }

    @keyframes float-medium {
        0%,
        100% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(-20px);
        }
    }

    @keyframes float-particle {
        0%,
        100% {
            transform: translateY(0) translateX(0);
            opacity: 0.1;
        }
        25% {
            transform: translateY(-30px) translateX(10px);
            opacity: 0.25;
        }
        50% {
            transform: translateY(-45px) translateX(-5px);
            opacity: 0.15;
        }
        75% {
            transform: translateY(-30px) translateX(5px);
            opacity: 0.25;
        }
    }

    .animate-float-slow {
        animation: float-slow 18s ease-in-out infinite;
    }
    .animate-float-medium {
        animation: float-medium 14s ease-in-out infinite;
    }
    .animate-float-particle {
        animation: float-particle 8s ease-in-out infinite;
    }

    .animate-spin-in {
        animation: spinIn 0.3s ease;
    }

    @keyframes spinIn {
        from {
            transform: rotate(-90deg);
            opacity: 0;
        }
        to {
            transform: rotate(0deg);
            opacity: 1;
        }
    }

    .animate-spin-slow {
        animation: spinSlow 10s linear infinite;
    }

    @keyframes spinSlow {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(-10px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .reveal-section {
            opacity: 1;
            transform: none;
            transition: none;
        }

        .animate-float-slow,
        .animate-float-medium,
        .animate-float-particle,
        .icon-ring,
        .animate-pulse-glow {
            animation: none;
        }

        .number-reveal {
            animation: none !important;
            opacity: 1;
        }
    }

    :global(a:focus-visible),
    :global(button:focus-visible) {
        outline: 2px solid rgba(251, 191, 36, 0.5);
        outline-offset: 4px;
    }
</style>
