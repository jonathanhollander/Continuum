<script lang="ts">
    import { onMount } from "svelte";
    import { fade, fly, slide } from "svelte/transition";
    import { backOut } from "svelte/easing";
    import { spring, tweened } from "svelte/motion";
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
        Briefcase,
        Menu,
        X
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
    const floatOffset1 = $derived(scrollY * 0.04);
    const floatOffset2 = $derived(scrollY * 0.06);

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
            { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
        );
        observer.observe(node);
        return { destroy: () => observer.disconnect() };
    }

    // 3D card tilt effect
    function tilt3D(node: HTMLElement) {
        if (prefersReducedMotion) return { destroy: () => {} };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = node.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 25;
            const rotateY = (centerX - x) / 25;

            node.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;
            node.style.boxShadow = `${rotateY * 2}px ${rotateX * 2}px 40px rgba(0,0,0,0.3)`;
        };

        const handleMouseLeave = () => {
            node.style.transform = "perspective(1000px) rotateX(0) rotateY(0) translateY(0) scale(1)";
            node.style.boxShadow = "0 0 0 rgba(0,0,0,0)";
        };

        node.addEventListener("mousemove", handleMouseMove);
        node.addEventListener("mouseleave", handleMouseLeave);

        return {
            destroy() {
                node.removeEventListener("mousemove", handleMouseMove);
                node.removeEventListener("mouseleave", handleMouseLeave);
            }
        };
    }

    function setLanguage(lang: Marketing2Language) {
        m2Language.set(lang);
        langMenuOpen = false;
    }

    onMount(() => {
        window.scrollTo(0, 0);
        prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const updateScroll = () => {
            const docHeight = document.documentElement.scrollHeight - innerHeight;
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

    const featureCards = $derived([
        {
            icon: FileText,
            title: $m2t.featurePracticalTitle,
            desc: $m2t.featurePracticalDesc,
            items: [$m2t.practicalItem1, $m2t.practicalItem2, $m2t.practicalItem3, $m2t.practicalItem4],
            color: "amber",
            iconClass: "text-amber-400/70"
        },
        {
            icon: Heart,
            title: $m2t.featurePersonalTitle,
            desc: $m2t.featurePersonalDesc,
            items: [$m2t.personalItem1, $m2t.personalItem2, $m2t.personalItem3, $m2t.personalItem4],
            color: "rose",
            iconClass: "text-rose-400/70"
        },
        {
            icon: Shield,
            title: $m2t.featureProtectiveTitle,
            desc: $m2t.featureProtectiveDesc,
            items: [$m2t.protectiveItem1, $m2t.protectiveItem2, $m2t.protectiveItem3, $m2t.protectiveItem4],
            color: "teal",
            iconClass: "text-teal-400/70"
        },
        {
            icon: Briefcase,
            title: $m2t.featurePreparedTitle,
            desc: $m2t.featurePreparedDesc,
            items: [$m2t.preparedItem1, $m2t.preparedItem2, $m2t.preparedItem3, $m2t.preparedItem4],
            color: "indigo",
            iconClass: "text-indigo-400/70"
        }
    ]);
</script>

<svelte:head>
    <title>{$m2t.metaTitleFeatures}</title>
    <meta name="description" content={$m2t.metaDescFeatures} />
    <meta property="og:title" content={$m2t.metaTitleFeatures} />
    <meta property="og:description" content={$m2t.metaDescFeatures} />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={$m2t.metaTitleFeatures} />
    <meta name="twitter:description" content={$m2t.metaDescFeatures} />
</svelte:head>

<svelte:window bind:scrollY bind:innerHeight bind:innerWidth />

<div class="min-h-screen bg-[#0a0a0b] text-white overflow-x-hidden" dir={$isRTL ? "rtl" : "ltr"}>
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
            class="absolute w-[700px] h-[700px] rounded-full opacity-20 blur-[100px] animate-float-slow"
            style="
                background: radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 70%);
                top: -10%;
                right: -20%;
                transform: translateY({floatOffset1}px);
            "
        ></div>
        <div
            class="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-[80px] animate-float-medium"
            style="
                background: radial-gradient(circle, rgba(244, 63, 94, 0.1) 0%, transparent 70%);
                bottom: 20%;
                left: -10%;
                transform: translateY({-floatOffset2}px);
            "
        ></div>

        <!-- Floating particles -->
        {#if !prefersReducedMotion}
            {#each Array(8) as _, i}
                <div
                    class="absolute w-1 h-1 rounded-full bg-white/10 animate-float-particle"
                    style="
                        left: {15 + (i * 10)}%;
                        top: {25 + (i * 6) % 50}%;
                        animation-delay: {i * 0.7}s;
                        animation-duration: {7 + (i % 3)}s;
                    "
                ></div>
            {/each}
        {/if}

        <div
            class="absolute inset-0 opacity-[0.03]"
            style="background-image: url('data:image/svg+xml,%3Csvg viewBox=\"0 0 256 256\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noise\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"4\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noise)\"/%3E%3C/svg%3E');"
        ></div>
    </div>

    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
        <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <a href="/marketing2" class="text-xl font-serif tracking-wide text-white/90 hover:text-white transition-all duration-300 hover:tracking-wider">
                Continuum
            </a>

            <nav class="hidden md:flex items-center gap-8 text-sm text-white/60">
                <a href="/marketing2/how" class="nav-link">{$m2t.navHow}</a>
                <a href="/marketing2/features" class="text-white">{$m2t.navFeatures}</a>
                <a href="/marketing2#security" class="nav-link">{$m2t.navSecurity}</a>
            </nav>

            <div class="flex items-center gap-4">
                <button
                    onclick={() => mobileMenuOpen = !mobileMenuOpen}
                    class="md:hidden text-white/60 hover:text-white transition-colors p-2"
                    aria-label="Toggle menu"
                >
                    <div class="relative w-6 h-6">
                        {#if mobileMenuOpen}
                            <X size={24} class="absolute inset-0 animate-spin-in" />
                        {:else}
                            <Menu size={24} class="absolute inset-0" />
                        {/if}
                    </div>
                </button>

                <div class="relative">
                    <button
                        onclick={() => langMenuOpen = !langMenuOpen}
                        class="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm group"
                    >
                        <Globe size={16} class="group-hover:animate-spin-slow" />
                        <span class="hidden sm:inline">{availableLanguages.find(l => l.code === $m2Language)?.native}</span>
                        <ChevronDown size={14} class="transition-transform duration-300" class:rotate-180={langMenuOpen} />
                    </button>

                    {#if langMenuOpen}
                        <div
                            class="absolute top-full right-0 mt-2 bg-black/95 backdrop-blur-md border border-white/10 rounded-lg py-2 min-w-[140px] shadow-xl"
                            transition:fly={{ y: -10, duration: 200 }}
                        >
                            {#each availableLanguages as lang, i}
                                <button
                                    onclick={() => setLanguage(lang.code as Marketing2Language)}
                                    class="w-full px-4 py-2 text-left text-sm hover:bg-white/5 transition-all duration-200"
                                    class:text-amber-400={$m2Language === lang.code}
                                    class:text-white/70={$m2Language !== lang.code}
                                    style="animation: slideIn 0.2s ease {i * 0.05}s both"
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
                    {#each [
                        { href: "/marketing2/how", label: $m2t.navHow, active: false },
                        { href: "/marketing2/features", label: $m2t.navFeatures, active: true },
                        { href: "/marketing2#security", label: $m2t.navSecurity, active: false }
                    ] as item, i}
                        <a
                            href={item.href}
                            class="transition-all duration-200 py-3 border-b border-white/5 last:border-0"
                            class:text-white={item.active}
                            class:text-white/60={!item.active}
                            onclick={() => mobileMenuOpen = false}
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
                        <ArrowRight size={16} class="group-hover:translate-x-1 transition-transform" />
                    {:else}
                        <ArrowLeft size={16} class="group-hover:-translate-x-1 transition-transform" />
                    {/if}
                    Continuum
                </a>

                <h1
                    class="text-4xl md:text-5xl font-serif text-white/90 mb-6"
                    in:fly={{ y: 30, duration: 600, delay: 200, easing: backOut }}
                >
                    {$m2t.featuresTitle}
                </h1>
                <p
                    class="text-lg text-white/50 leading-relaxed max-w-2xl mx-auto"
                    in:fly={{ y: 20, duration: 600, delay: 400 }}
                >
                    {$m2t.featuresIntro}
                </p>
            </div>
        </section>

        <!-- The Four Cards -->
        <section class="py-16 px-6">
            <div class="max-w-5xl mx-auto">
                <div class="grid md:grid-cols-2 gap-8">
                    {#each featureCards as card, i}
                        <div
                            class="card-3d reveal-section p-10 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-{card.color}-500/20 transition-all duration-500"
                            use:reveal={{ delay: i * 100 }}
                            use:tilt3D
                        >
                            <div class="icon-container w-14 h-14 rounded-2xl bg-{card.color}-500/10 flex items-center justify-center mb-6">
                                <svelte:component this={card.icon} size={28} class={card.iconClass} />
                            </div>
                            <h2 class="text-2xl font-serif text-white/90 mb-4">{card.title}</h2>
                            <p class="text-white/50 leading-relaxed mb-6">{card.desc}</p>
                            <ul class="space-y-3 text-sm text-white/40">
                                {#each card.items as item, j}
                                    <li
                                        class="flex items-center gap-3 list-item-reveal"
                                        style="animation: listItemReveal 0.4s ease {(i * 0.1) + (j * 0.05)}s both"
                                    >
                                        <div class="w-1.5 h-1.5 rounded-full bg-{card.color}-500/50 animate-pulse-slow"></div>
                                        {item}
                                    </li>
                                {/each}
                            </ul>
                        </div>
                    {/each}
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
                    class="inline-flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full text-white/80 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(251,191,36,0.2)]"
                >
                    {$m2t.ctaPrimary}
                    <ArrowRight size={18} class="group-hover:translate-x-1 transition-transform duration-300" />
                </a>
            </div>
        </section>
    </main>

    <!-- Footer -->
    <footer class="py-12 px-6 border-t border-white/5">
        <div class="max-w-4xl mx-auto">
            <nav class="flex justify-center gap-8 mb-8 text-sm text-white/40">
                <a href="/marketing2/how" class="hover:text-white/60 transition-colors duration-300">{$m2t.navHow}</a>
                <a href="/marketing2/features" class="text-white/60">{$m2t.navFeatures}</a>
                <a href="/marketing2#security" class="hover:text-white/60 transition-colors duration-300">{$m2t.navSecurity}</a>
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
        transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .reveal-section.revealed {
        opacity: 1;
        transform: translateY(0);
    }

    .card-3d {
        transition: transform 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease;
        transform-style: preserve-3d;
    }

    .nav-link {
        position: relative;
        padding-bottom: 4px;
    }

    .nav-link::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 0;
        height: 1px;
        background: linear-gradient(90deg, rgba(251, 191, 36, 0.5), rgba(20, 184, 166, 0.5));
        transition: width 0.3s ease;
    }

    .nav-link:hover::after {
        width: 100%;
    }

    .nav-link:hover {
        color: white;
    }

    .icon-container {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .icon-container:hover {
        transform: scale(1.1) rotate(5deg);
    }

    @keyframes float-slow {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-25px) rotate(2deg); }
    }

    @keyframes float-medium {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-18px); }
    }

    @keyframes float-particle {
        0%, 100% { transform: translateY(0) translateX(0); opacity: 0.1; }
        25% { transform: translateY(-25px) translateX(8px); opacity: 0.25; }
        50% { transform: translateY(-40px) translateX(-4px); opacity: 0.15; }
        75% { transform: translateY(-25px) translateX(4px); opacity: 0.25; }
    }

    .animate-float-slow { animation: float-slow 18s ease-in-out infinite; }
    .animate-float-medium { animation: float-medium 14s ease-in-out infinite; }
    .animate-float-particle { animation: float-particle 8s ease-in-out infinite; }

    .animate-pulse-slow {
        animation: pulse-slow 3s ease-in-out infinite;
    }

    @keyframes pulse-slow {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
    }

    @keyframes listItemReveal {
        from { opacity: 0; transform: translateX(-10px); }
        to { opacity: 1; transform: translateX(0); }
    }

    .animate-spin-in {
        animation: spinIn 0.3s ease;
    }

    @keyframes spinIn {
        from { transform: rotate(-90deg); opacity: 0; }
        to { transform: rotate(0deg); opacity: 1; }
    }

    .animate-spin-slow {
        animation: spinSlow 10s linear infinite;
    }

    @keyframes spinSlow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    @keyframes slideIn {
        from { opacity: 0; transform: translateX(-10px); }
        to { opacity: 1; transform: translateX(0); }
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
        .animate-pulse-slow {
            animation: none;
        }

        .list-item-reveal {
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
