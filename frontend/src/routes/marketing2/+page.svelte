<script lang="ts">
    import { onMount } from "svelte";
    import { fade, fly, scale, slide } from "svelte/transition";
    import { cubicOut, backOut, elasticOut } from "svelte/easing";
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
        ChevronDown,
        Globe,
        Heart,
        Compass,
        Shield,
        BookOpen,
        Menu,
        X,
        Lock,
    } from "lucide-svelte";
    import {
        keyringEmails,
        registerAccount,
        switchAccount,
    } from "$lib/stores/keyringStore";
    import { get } from "svelte/store";
    import { auth } from "$lib/stores/auth";
    import { dictionary } from "$lib/stores/dictionary";

    // Core state
    let scrollY = $state(0);
    let innerHeight = $state(0);
    let innerWidth = $state(0);
    let introVisible = $state(false);
    let langMenuOpen = $state(false);
    let mobileMenuOpen = $state(false);
    let mouseX = $state(0);
    let mouseY = $state(0);
    let prefersReducedMotion = $state(false);

    // Signup flow state
    let name = $state("");
    let email = $state("");
    let signupStep = $state(0);

    // Easter egg state
    let easterEggActive = $state(false);
    let konamiIndex = $state(0);
    const konamiCode = [
        "ArrowUp",
        "ArrowUp",
        "ArrowDown",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "ArrowLeft",
        "ArrowRight",
        "b",
        "a",
    ];

    // Touch gesture state
    let touchStartY = $state(0);
    let touchStartX = $state(0);

    // Spring physics for smooth animations
    const cursorGlow = spring({ x: 0, y: 0 }, { stiffness: 0.1, damping: 0.4 });
    const scrollProgress = tweened(0, { duration: 150 });

    // Floating elements positions (parallax)
    const floatOffset1 = $derived(scrollY * 0.05);
    const floatOffset2 = $derived(scrollY * 0.08);
    const floatOffset3 = $derived(scrollY * 0.03);

    // Section visibility tracking for scroll-linked animations
    let heroRef: HTMLElement | null = $state(null);
    let kitchenRef: HTMLElement | null = $state(null);
    let weightRef: HTMLElement | null = $state(null);
    let guideRef: HTMLElement | null = $state(null);
    let pulseRef: HTMLElement | null = $state(null);
    let currentSection = $state(0);

    // Intersection observer for staggered reveals
    function reveal(
        node: HTMLElement,
        options: { delay?: number; stagger?: boolean } = {},
    ) {
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

    // 3D card tilt effect
    function tilt3D(node: HTMLElement) {
        if (prefersReducedMotion) return { destroy: () => {} };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = node.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            node.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
            node.style.boxShadow = `${rotateY}px ${rotateX}px 30px rgba(0,0,0,0.3)`;
        };

        const handleMouseLeave = () => {
            node.style.transform =
                "perspective(1000px) rotateX(0) rotateY(0) scale(1)";
            node.style.boxShadow = "0 0 0 rgba(0,0,0,0)";
        };

        node.addEventListener("mousemove", handleMouseMove);
        node.addEventListener("mouseleave", handleMouseLeave);

        return {
            destroy() {
                node.removeEventListener("mousemove", handleMouseMove);
                node.removeEventListener("mouseleave", handleMouseLeave);
            },
        };
    }

    // Text reveal animation - word by word.
    // The heading text comes in as a parameter so a language switch rebuilds
    // the words (the action replaces the node's children, so Svelte's own
    // text node is detached). Each word is an inline-block span; the space
    // between words stays a plain text node so it renders.
    function textReveal(
        node: HTMLElement,
        options: { text?: string; delay?: number } = {},
    ) {
        if (prefersReducedMotion) return { destroy: () => {} };

        let shown = false;
        node.style.opacity = "1";

        function build(opts: { text?: string; delay?: number }) {
            const text = (opts.text ?? node.textContent ?? "").trim();
            const words = text.split(/\s+/).filter(Boolean);
            node.replaceChildren();
            words.forEach((word, i) => {
                if (i > 0) node.appendChild(document.createTextNode(" "));
                const span = document.createElement("span");
                span.textContent = word;
                span.style.display = "inline-block";
                span.style.transition = `opacity 0.5s ease ${(opts.delay || 0) + i * 0.05}s, transform 0.5s ease ${(opts.delay || 0) + i * 0.05}s`;
                span.style.opacity = shown ? "1" : "0";
                span.style.transform = shown ? "translateY(0)" : "translateY(20px)";
                node.appendChild(span);
            });
        }
        build(options);

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        shown = true;
                        node.querySelectorAll("span").forEach((span) => {
                            (span as HTMLElement).style.opacity = "1";
                            (span as HTMLElement).style.transform =
                                "translateY(0)";
                        });
                    }
                });
            },
            { threshold: 0.5 },
        );
        observer.observe(node);
        return {
            update: (opts: { text?: string; delay?: number }) => build(opts),
            destroy: () => observer.disconnect(),
        };
    }

    onMount(() => {
        window.scrollTo(0, 0);
        setTimeout(() => (introVisible = true), 300);

        // Check for reduced motion preference
        prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;

        // Update scroll progress
        const updateScroll = () => {
            const docHeight =
                document.documentElement.scrollHeight - innerHeight;
            scrollProgress.set(scrollY / docHeight);
        };

        // Track mouse for cursor glow
        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorGlow.set({ x: e.clientX, y: e.clientY });
        };

        // Easter egg: Konami code
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === konamiCode[konamiIndex]) {
                konamiIndex++;
                if (konamiIndex === konamiCode.length) {
                    easterEggActive = true;
                    konamiIndex = 0;
                    // Reset after animation
                    setTimeout(() => {
                        easterEggActive = false;
                    }, 5000);
                }
            } else {
                konamiIndex = 0;
            }
        };

        // Touch gesture support for swipe navigation
        const handleTouchStart = (e: TouchEvent) => {
            touchStartY = e.touches[0].clientY;
            touchStartX = e.touches[0].clientX;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchStartX - touchEndX;
            const diffY = touchStartY - touchEndY;

            // Horizontal swipe (navigate between pages)
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 100) {
                if (diffX > 0) {
                    // Swipe left - go to features
                    window.location.href = "/marketing2/features";
                } else {
                    // Swipe right - go to how
                    window.location.href = "/marketing2/how";
                }
            }
        };

        window.addEventListener("scroll", updateScroll);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("keydown", handleKeyDown);
        document.addEventListener("touchstart", handleTouchStart, {
            passive: true,
        });
        document.addEventListener("touchend", handleTouchEnd, {
            passive: true,
        });

        return () => {
            window.removeEventListener("scroll", updateScroll);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("touchstart", handleTouchStart);
            document.removeEventListener("touchend", handleTouchEnd);
        };
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

    // Computed values
    const heroOpacity = $derived(
        Math.max(0, 1 - scrollY / (innerHeight * 0.5)),
    );
    const heroScale = $derived(1 - scrollY / (innerHeight * 3));
    const grainBg = `background-image: url('data:image/svg+xml,%3Csvg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%" height="100%" filter="url(%23noise)"/%3E%3C/svg%3E');`;
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

<svelte:window bind:scrollY bind:innerHeight bind:innerWidth />

<div
    class="surface-dark min-h-screen bg-[#0a0a0b] text-white overflow-x-hidden"
    dir={$isRTL ? "rtl" : "ltr"}
>
    <!-- Easter Egg Animation (Konami Code: ↑↑↓↓←→←→BA) -->
    {#if easterEggActive}
        <div
            class="fixed inset-0 z-[200] pointer-events-none overflow-hidden easter-egg-container"
        >
            {#each Array(30) as _, i}
                <div
                    class="absolute text-4xl easter-heart"
                    style="
                        left: {Math.random() * 100}%;
                        animation-delay: {Math.random() * 2}s;
                    "
                >
                    💛
                </div>
            {/each}
            <div
                class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center easter-message"
            >
                <p class="text-2xl font-serif text-gold-text">
                    Thank you for caring.
                </p>
                <p class="text-sm text-white/50 mt-2">
                    Your loved ones are lucky to have you.
                </p>
            </div>
        </div>
    {/if}

    <!-- Cursor Glow Effect (Desktop only) -->
    {#if innerWidth > 768 && !prefersReducedMotion}
        <div
            class="pointer-events-none fixed z-50 w-96 h-96 rounded-full opacity-20 blur-3xl"
            style="
                background: radial-gradient(circle, color-mix(in srgb, var(--color-gold) 15%, transparent) 0%, transparent 70%);
                left: {$cursorGlow.x - 192}px;
                top: {$cursorGlow.y - 192}px;
                transition: opacity 0.3s;
            "
        ></div>
    {/if}

    <!-- Scroll Progress Indicator -->
    <div
        class="fixed top-0 left-0 h-[2px] bg-primary z-[100] origin-left"
        style="transform: scaleX({$scrollProgress})"
    ></div>

    <!-- Animated Background -->
    <div class="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <!-- Animated gradient orbs -->
        <div
            class="absolute w-[800px] h-[800px] rounded-full opacity-30 blur-[120px] animate-float-slow"
            style="
                background: radial-gradient(circle, color-mix(in srgb, var(--color-gold) 10%, transparent) 0%, transparent 70%);
                top: -20%;
                left: -10%;
                transform: translateY({floatOffset1}px);
            "
        ></div>
        <div
            class="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-[100px] animate-float-medium"
            style="
                background: radial-gradient(circle, color-mix(in srgb, var(--color-primary) 10%, transparent) 0%, transparent 70%);
                top: 40%;
                right: -15%;
                transform: translateY({-floatOffset2}px);
            "
        ></div>
        <div
            class="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[80px] animate-float-fast"
            style="
                background: radial-gradient(circle, color-mix(in srgb, var(--color-primary) 8%, transparent) 0%, transparent 70%);
                bottom: 10%;
                left: 20%;
                transform: translateY({floatOffset3}px);
            "
        ></div>

        <!-- Floating particles -->
        {#if !prefersReducedMotion}
            {#each Array(12) as _, i}
                <div
                    class="absolute w-1 h-1 rounded-full bg-white/10 animate-float-particle"
                    style="
                        left: {10 + i * 7}%;
                        top: {20 + ((i * 5) % 60)}%;
                        animation-delay: {i * 0.5}s;
                        animation-duration: {8 + (i % 4)}s;
                    "
                ></div>
            {/each}
        {/if}

        <!-- Subtle grain -->
        <div class="absolute inset-0 opacity-[0.03]" style={grainBg}></div>
    </div>

    <!-- Header -->
    <header
        class="fixed top-0 left-0 right-0 z-50 transition-all duration-500 {scrollY >
        100
            ? 'bg-black/80 backdrop-blur-md'
            : ''}"
    >
        <div
            class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between"
        >
            <!-- Logo with hover animation -->
            <a
                href="/marketing2"
                class="text-xl font-serif tracking-wide text-white/90 hover:text-white transition-all duration-300 hover:tracking-wider"
            >
                Continuum
            </a>

            <!-- Nav with hover underlines -->
            <nav
                class="hidden md:flex items-center gap-8 text-sm text-white/60"
            >
                <a href="/marketing2/how" class="nav-link">{$m2t.navHow}</a>
                <a href="/marketing2/features" class="nav-link"
                    >{$m2t.navFeatures}</a
                >
                <a href="#security" class="nav-link">{$m2t.navSecurity}</a>
            </nav>

            <!-- Right side -->
            <div class="flex items-center gap-4">
                <!-- Mobile menu button -->
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

                <!-- Language selector -->
                <div class="relative">
                    <button
                        aria-label="Language"
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
                                        ? 'text-gold-text'
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

                <!-- Login button with glow; Open my plan when signed in -->
                <a
                    href={$auth.token ? "/dashboard" : "/login"}
                    class="text-sm px-4 py-2 rounded-full border border-white/20 text-white/80 hover:text-white hover:border-white/40 transition-all duration-300 hover:shadow-[0_0_20px_color-mix(in_srgb,var(--color-gold)_20%,transparent)]"
                >
                    {$auth.token
                        ? dictionary[$m2Language].marketing.openMyPlan
                        : $m2t.navLogin}
                </a>
            </div>
        </div>

        <!-- Mobile menu with slide animation -->
        {#if mobileMenuOpen}
            <div
                class="md:hidden border-t border-white/5 bg-black/95 backdrop-blur-md overflow-hidden"
                transition:slide={{ duration: 300 }}
            >
                <nav class="flex flex-col px-6 py-4 space-y-2">
                    {#each [{ href: "/marketing2/how", label: $m2t.navHow }, { href: "/marketing2/features", label: $m2t.navFeatures }, { href: "#security", label: $m2t.navSecurity }] as item, i}
                        <a
                            href={item.href}
                            class="text-white/60 hover:text-white transition-all duration-200 py-3 border-b border-white/5 last:border-0"
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

    <main class="relative z-10">
        <!-- Section 1: The Shoebox (Hero) -->
        <section
            class="min-h-screen flex items-center justify-center px-6 relative"
            bind:this={heroRef}
        >
            <div
                class="text-center max-w-3xl mx-auto"
                style="
                    opacity: {heroOpacity};
                    transform: translateY({scrollY * 0.15}px) scale({Math.max(
                    0.9,
                    heroScale,
                )});
                "
            >
                {#if introVisible}
                    <div class="space-y-4 mb-8">
                        <h1
                            class="text-4xl md:text-6xl lg:text-7xl font-serif font-light text-white/90 leading-tight"
                            in:fly={{
                                y: 30,
                                duration: 800,
                                delay: 200,
                                easing: backOut,
                            }}
                        >
                            {$m2t.heroLine1}
                        </h1>
                        <h1
                            class="text-4xl md:text-6xl lg:text-7xl font-serif font-light text-white/60 leading-tight"
                            in:fly={{
                                y: 30,
                                duration: 800,
                                delay: 400,
                                easing: backOut,
                            }}
                        >
                            {$m2t.heroLine2}
                        </h1>
                    </div>

                    <div in:fade={{ duration: 800, delay: 600 }}>
                        <p
                            class="text-2xl md:text-3xl font-serif text-gold-text/90 mb-8"
                            in:fly={{
                                y: 20,
                                duration: 800,
                                delay: 800,
                                easing: backOut,
                            }}
                        >
                            {$m2t.heroLine3}
                        </p>
                        <p
                            class="text-lg text-white/50 max-w-xl mx-auto mb-10"
                            in:fly={{ y: 20, duration: 800, delay: 1000 }}
                        >
                            {$m2t.heroDesc}
                        </p>
                        <a
                            href="/marketing2/features"
                            class="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-all duration-300 group"
                            in:fade={{ duration: 500, delay: 1200 }}
                        >
                            {$m2t.ctaExplore}
                            <ArrowRight
                                size={16}
                                class="group-hover:translate-x-1 transition-transform duration-300"
                            />
                        </a>
                    </div>
                {/if}
            </div>

            <!-- Animated scroll indicator -->
            <div
                class="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
                style="opacity: {heroOpacity};"
            >
                <div class="scroll-indicator">
                    <div class="scroll-dot"></div>
                </div>
            </div>
        </section>

        <!-- Section 1.5: The Kitchen Story -->
        <section
            class="py-24 px-6 bg-gradient-to-b from-transparent via-rose-950/5 to-transparent"
            bind:this={kitchenRef}
        >
            <div class="max-w-2xl mx-auto reveal-section" use:reveal>
                <h2
                    class="text-2xl md:text-3xl font-serif text-white/80 text-center mb-10"
                    use:textReveal={{ text: $m2t.kitchenTitle }}
                >
                    {$m2t.kitchenTitle}
                </h2>
                <p
                    class="text-lg text-white/70 leading-relaxed mb-10 italic reveal-section"
                    use:reveal={{ delay: 200 }}
                >
                    {$m2t.kitchenDesc}
                </p>
                <p
                    class="text-xl text-primary/70 font-serif text-center reveal-section"
                    use:reveal={{ delay: 400 }}
                >
                    {$m2t.kitchenPunchline}
                </p>
            </div>
        </section>

        <!-- Section 2: The Weight -->
        <section class="py-32 px-6" bind:this={weightRef}>
            <div
                class="max-w-3xl mx-auto text-center reveal-section"
                use:reveal
            >
                <h2
                    class="text-3xl md:text-4xl font-serif text-white/90 mb-8 leading-relaxed"
                    use:textReveal={{ text: $m2t.weightTitle }}
                >
                    {$m2t.weightTitle}
                </h2>
                <p
                    class="text-lg text-white/50 leading-relaxed mb-12 reveal-section"
                    use:reveal={{ delay: 200 }}
                >
                    {$m2t.weightDesc}
                </p>
                <p
                    class="text-xl text-gold-text/80 font-serif italic reveal-section"
                    use:reveal={{ delay: 400 }}
                >
                    {$m2t.weightBridge}
                </p>
            </div>
        </section>

        <!-- Section 3: The Guide -->
        <section
            class="py-32 px-6 bg-gradient-to-b from-transparent via-amber-950/5 to-transparent"
            bind:this={guideRef}
        >
            <div
                class="max-w-3xl mx-auto text-center reveal-section"
                use:reveal
            >
                <div
                    class="icon-container w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-8"
                >
                    <Compass size={24} class="text-gold-text/70 icon-spin" />
                </div>
                <h2
                    class="text-3xl md:text-4xl font-serif text-white/90 mb-8"
                    use:textReveal={{ text: $m2t.guideTitle }}
                >
                    {$m2t.guideTitle}
                </h2>
                <p
                    class="text-lg text-white/50 leading-relaxed mb-8 reveal-section"
                    use:reveal={{ delay: 200 }}
                >
                    {$m2t.guideDesc}
                </p>
                <p
                    class="text-base text-white/70 italic reveal-section"
                    use:reveal={{ delay: 400 }}
                >
                    {$m2t.guideReassurance}
                </p>
            </div>
        </section>

        <!-- Section 4: The Pulse -->
        <section class="py-32 px-6" id="how" bind:this={pulseRef}>
            <div class="max-w-3xl mx-auto reveal-section" use:reveal>
                <div class="text-center mb-16">
                    <!-- Animated Pulse Visualization -->
                    <div class="relative w-24 h-24 mx-auto mb-8">
                        <div class="pulse-ring pulse-ring-1"></div>
                        <div class="pulse-ring pulse-ring-2"></div>
                        <div class="pulse-ring pulse-ring-3"></div>
                        <div
                            class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                        >
                            <Heart size={24} class="text-primary heart-beat" />
                        </div>
                    </div>
                    <h2
                        class="text-3xl md:text-4xl font-serif text-white/90 mb-8"
                        use:textReveal={{ text: $m2t.pulseTitle }}
                    >
                        {$m2t.pulseTitle}
                    </h2>
                    <p class="text-lg text-white/50 leading-relaxed">
                        {$m2t.pulseDesc}
                    </p>
                </div>

                <div class="space-y-8 text-center">
                    <p
                        class="text-lg text-white/50 leading-relaxed reveal-section"
                        use:reveal={{ delay: 200 }}
                    >
                        {$m2t.pulseHow}
                    </p>
                    <p
                        class="text-base text-white/70 leading-relaxed reveal-section"
                        use:reveal={{ delay: 400 }}
                    >
                        {$m2t.pulseTiers}
                    </p>
                    <p
                        class="text-xl text-primary/80 font-serif italic reveal-section"
                        use:reveal={{ delay: 600 }}
                    >
                        {$m2t.pulseGift}
                    </p>
                </div>
            </div>
        </section>

        <!-- Section 5: The Distinction -->
        <section
            class="py-32 px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent"
        >
            <div
                class="max-w-3xl mx-auto text-center reveal-section"
                use:reveal
            >
                <div
                    class="icon-container w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-8"
                >
                    <Shield size={24} class="text-white/50 icon-pulse" />
                </div>
                <h2 class="text-2xl md:text-3xl font-serif text-white/80 mb-6">
                    {$m2t.distinctionTitle}
                </h2>
                <p class="text-base text-white/70 leading-relaxed mb-4">
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
                    <div
                        class="icon-container w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8"
                    >
                        <Lock
                            size={24}
                            class="text-primary/70 icon-shimmer"
                        />
                    </div>
                    <h2
                        class="text-3xl md:text-4xl font-serif text-white/90 mb-6"
                    >
                        {$m2t.securityTitle}
                    </h2>
                    <p
                        class="text-lg text-white/50 leading-relaxed max-w-2xl mx-auto"
                    >
                        {$m2t.securityDesc}
                    </p>
                </div>

                <div class="grid md:grid-cols-3 gap-8">
                    {#each [{ title: $m2t.securityEncryption, desc: $m2t.securityEncryptionDesc }, { title: $m2t.securityPrivacy, desc: $m2t.securityPrivacyDesc }, { title: $m2t.securityControl, desc: $m2t.securityControlDesc }] as card, i}
                        <div
                            class="card-3d text-center p-6 rounded-2xl bg-white/[0.02] border border-white/5 reveal-section transition-all duration-500"
                            use:reveal={{ delay: i * 150 }}
                            use:tilt3D
                        >
                            <h3
                                class="text-lg font-serif text-primary/90 mb-3"
                            >
                                {card.title}
                            </h3>
                            <p class="text-sm text-white/70">{card.desc}</p>
                        </div>
                    {/each}
                </div>
            </div>
        </section>

        <!-- Section 6: The Gift -->
        <section class="py-32 px-6" id="features">
            <div class="max-w-4xl mx-auto reveal-section" use:reveal>
                <h2
                    class="text-3xl md:text-4xl font-serif text-white/90 text-center mb-16"
                >
                    {$m2t.giftTitle}
                </h2>

                <div class="grid md:grid-cols-3 gap-8">
                    {#each [{ title: $m2t.giftClarity, desc: $m2t.giftClarityDesc }, { title: $m2t.giftGuidance, desc: $m2t.giftGuidanceDesc }, { title: $m2t.giftVoice, desc: $m2t.giftVoiceDesc }] as card, i}
                        <div
                            class="card-3d text-center p-8 rounded-2xl bg-white/[0.02] border border-white/5 reveal-section transition-all duration-500"
                            use:reveal={{ delay: i * 150 }}
                            use:tilt3D
                        >
                            <h3
                                class="text-xl font-serif text-gold-text/90 mb-3"
                            >
                                {card.title}
                            </h3>
                            <p class="text-sm text-white/70">{card.desc}</p>
                        </div>
                    {/each}
                </div>
            </div>
        </section>

        <!-- Section 7: The Invitation & Signup -->
        <section class="pt-16 pb-32 px-6">
            <div class="max-w-2xl mx-auto w-full reveal-section" use:reveal>
                {#if signupStep === 0}
                    <div class="text-center" in:fade={{ duration: 400 }}>
                        <h2
                            class="text-3xl md:text-4xl font-serif text-white/90 mb-4"
                        >
                            {$m2t.invitationTitle}
                        </h2>
                        <p class="text-lg text-white/50 mb-12">
                            {$m2t.invitationDesc}
                        </p>

                        <div class="max-w-md mx-auto space-y-6">
                            <p class="text-sm text-white/70">
                                {$m2t.signupNamePrompt}
                            </p>
                            <input
                                type="text"
                                bind:value={name}
                                aria-label="First name"
                                placeholder={$m2t.signupNamePlaceholder}
                                onkeydown={(e) =>
                                    e.key === "Enter" && handleNameSubmit()}
                                class="w-full bg-transparent border-b border-white/20 focus:border-gold/50 py-4 text-2xl font-serif text-center text-white/90 outline-none transition-all duration-300 placeholder:text-white/60 focus:shadow-[0_4px_20px_-4px_color-mix(in_srgb,var(--color-gold)_30%,transparent)]"
                            />

                            {#if name.trim().length > 1}
                                <button
                                    onclick={handleNameSubmit}
                                    class="mt-8 inline-flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full text-white/80 transition-all duration-300 group hover:shadow-[0_0_30px_color-mix(in_srgb,var(--color-gold)_20%,transparent)]"
                                    in:scale={{
                                        duration: 300,
                                        start: 0.9,
                                        easing: backOut,
                                    }}
                                >
                                    {$m2t.signupButton}
                                    <ArrowRight
                                        size={18}
                                        class="group-hover:translate-x-1 transition-transform"
                                    />
                                </button>
                            {/if}
                        </div>
                    </div>
                {:else if signupStep === 1}
                    <div class="text-center" in:fly={{ x: 50, duration: 400 }}>
                        <p class="text-sm text-white/70 mb-8">
                            {$m2t.signupEmailPrompt}
                        </p>
                        <input
                            type="email"
                            bind:value={email}
                            aria-label="Email address"
                            placeholder={$m2t.signupEmailPlaceholder}
                            onkeydown={(e) =>
                                e.key === "Enter" && handleEmailSubmit()}
                            class="w-full max-w-md mx-auto block bg-transparent border-b border-white/20 focus:border-gold/50 py-4 text-xl text-center text-white/90 outline-none transition-all duration-300 placeholder:text-white/60 focus:shadow-[0_4px_20px_-4px_color-mix(in_srgb,var(--color-gold)_30%,transparent)]"
                        />

                        {#if email.includes("@") && email.includes(".")}
                            <button
                                onclick={handleEmailSubmit}
                                class="mt-8 inline-flex items-center gap-3 px-8 py-4 bg-gold/20 hover:bg-gold/30 border border-gold/30 rounded-full text-gold-text transition-all duration-300 group hover:shadow-[0_0_30px_color-mix(in_srgb,var(--color-gold)_30%,transparent)]"
                                in:scale={{
                                    duration: 300,
                                    start: 0.9,
                                    easing: backOut,
                                }}
                            >
                                {$m2t.signupButton}
                                <ArrowRight
                                    size={18}
                                    class="group-hover:translate-x-1 transition-transform"
                                />
                            </button>
                        {/if}

                        <button
                            onclick={() => (signupStep = 0)}
                            class="mt-6 block mx-auto text-sm text-white/70 hover:text-white/90 transition-colors"
                        >
                            {$m2t.signupBack}
                        </button>
                    </div>
                {:else}
                    <div
                        class="text-center"
                        in:scale={{
                            duration: 500,
                            start: 0.9,
                            easing: elasticOut,
                        }}
                    >
                        <div class="relative w-20 h-20 mx-auto mb-8">
                            <div class="success-ring"></div>
                            <div
                                class="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                            >
                                <Heart size={28} class="text-primary" />
                            </div>
                        </div>
                        <h2 class="text-3xl font-serif text-white/90 mb-2">
                            {$m2t.signupWelcome}
                            {name}.
                        </h2>
                        <p class="text-lg text-white/50 mb-8">
                            {$m2t.signupNext}
                        </p>
                        <a
                            href="/start?email={encodeURIComponent(email)}"
                            class="inline-flex items-center gap-3 px-8 py-4 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-full text-primary-hover transition-all duration-300 group hover:shadow-[0_0_30px_color-mix(in_srgb,var(--color-primary)_30%,transparent)]"
                        >
                            {$m2t.signupEnter}
                            <ArrowRight
                                size={18}
                                class="group-hover:translate-x-1 transition-transform"
                            />
                        </a>
                    </div>
                {/if}
            </div>
        </section>
    </main>

    <!-- Footer -->
    <footer class="py-12 px-6 border-t border-white/5">
        <div class="max-w-4xl mx-auto">
            <nav class="flex justify-center gap-8 mb-8 text-sm text-white/70">
                <a
                    href="/marketing2/how"
                    class="hover:text-white/90 transition-colors duration-300"
                    >{$m2t.navHow}</a
                >
                <a
                    href="/marketing2/features"
                    class="hover:text-white/90 transition-colors duration-300"
                    >{$m2t.navFeatures}</a
                >
                <a
                    href="#security"
                    class="hover:text-white/90 transition-colors duration-300"
                    >{$m2t.navSecurity}</a
                >
            </nav>
            <div class="text-center space-y-4">
                <p class="text-xs text-white/70">
                    {$m2t.footerDisclaimer}
                </p>
                <p class="text-sm text-white/60 font-serif italic">
                    {$m2t.footerTagline}
                </p>
            </div>
        </div>
    </footer>
</div>

<style>
    /* Reveal animations */
    .reveal-section {
        opacity: 0;
        transform: translateY(30px);
        transition:
            opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* "revealed" is added by the reveal action at runtime, so it is marked global */
    .reveal-section:global(.revealed) {
        opacity: 1;
        transform: translateY(0);
    }

    /* 3D Card transitions */
    .card-3d {
        transition:
            transform 0.3s ease,
            box-shadow 0.3s ease;
        transform-style: preserve-3d;
    }

    /* Nav link hover effect */
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
            color-mix(in srgb, var(--color-gold) 50%, transparent),
            color-mix(in srgb, var(--color-primary) 50%, transparent)
        );
        transition: width 0.3s ease;
    }

    .nav-link:hover::after {
        width: 100%;
    }

    .nav-link:hover {
        color: white;
    }

    /* Floating animations */
    @keyframes float-slow {
        0%,
        100% {
            transform: translateY(0) rotate(0deg);
        }
        50% {
            transform: translateY(-30px) rotate(3deg);
        }
    }

    @keyframes float-medium {
        0%,
        100% {
            transform: translateY(0) rotate(0deg);
        }
        50% {
            transform: translateY(-20px) rotate(-2deg);
        }
    }

    @keyframes float-fast {
        0%,
        100% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(-15px);
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
            opacity: 0.3;
        }
        50% {
            transform: translateY(-50px) translateX(-5px);
            opacity: 0.2;
        }
        75% {
            transform: translateY(-30px) translateX(5px);
            opacity: 0.3;
        }
    }

    .animate-float-slow {
        animation: float-slow 20s ease-in-out infinite;
    }
    .animate-float-medium {
        animation: float-medium 15s ease-in-out infinite;
    }
    .animate-float-fast {
        animation: float-fast 10s ease-in-out infinite;
    }
    .animate-float-particle {
        animation: float-particle 8s ease-in-out infinite;
    }

    /* Scroll indicator */
    .scroll-indicator {
        width: 24px;
        height: 40px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        position: relative;
    }

    .scroll-dot {
        width: 4px;
        height: 8px;
        background: rgba(255, 255, 255, 0.4);
        border-radius: 2px;
        position: absolute;
        left: 50%;
        top: 8px;
        transform: translateX(-50%);
        animation: scrollDot 2s ease-in-out infinite;
    }

    @keyframes scrollDot {
        0%,
        100% {
            top: 8px;
            opacity: 1;
        }
        50% {
            top: 24px;
            opacity: 0.3;
        }
    }

    /* Pulse visualization */
    .pulse-ring {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        border: 1px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
        animation: pulseRing 3s ease-out infinite;
    }

    .pulse-ring-1 {
        width: 48px;
        height: 48px;
        animation-delay: 0s;
    }
    .pulse-ring-2 {
        width: 72px;
        height: 72px;
        animation-delay: 1s;
    }
    .pulse-ring-3 {
        width: 96px;
        height: 96px;
        animation-delay: 2s;
    }

    @keyframes pulseRing {
        0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0.8;
        }
        100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
        }
    }

    /* Heart beat. Icon classes sit on child icon components, so they are global under this page's divs */
    div :global(.heart-beat) {
        animation: heartBeat 1.5s ease-in-out infinite;
    }

    @keyframes heartBeat {
        0%,
        100% {
            transform: scale(1);
        }
        14% {
            transform: scale(1.15);
        }
        28% {
            transform: scale(1);
        }
        42% {
            transform: scale(1.15);
        }
        56% {
            transform: scale(1);
        }
    }

    /* Icon animations */
    div :global(.icon-spin) {
        animation: iconSpin 20s linear infinite;
    }

    @keyframes iconSpin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    div :global(.icon-pulse) {
        animation: iconPulse 3s ease-in-out infinite;
    }

    @keyframes iconPulse {
        0%,
        100% {
            opacity: 0.5;
            transform: scale(1);
        }
        50% {
            opacity: 0.8;
            transform: scale(1.1);
        }
    }

    div :global(.icon-shimmer) {
        animation: iconShimmer 3s ease-in-out infinite;
    }

    @keyframes iconShimmer {
        0%,
        100% {
            filter: brightness(1);
        }
        50% {
            filter: brightness(1.3);
        }
    }

    /* Icon container hover */
    .icon-container {
        transition:
            transform 0.3s ease,
            box-shadow 0.3s ease;
    }

    .icon-container:hover {
        transform: scale(1.1);
        box-shadow: 0 0 30px color-mix(in srgb, var(--color-gold) 20%, transparent);
    }

    /* Success ring animation */
    .success-ring {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 80px;
        height: 80px;
        border-radius: 50%;
        border: 2px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
        animation: successRing 1s ease-out;
    }

    @keyframes successRing {
        0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
        }
        50% {
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
        }
    }

    /* Menu animations */
    div :global(.animate-spin-in) {
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

    /* Globe in the language button (lucide child, group-hover variant) */
    @media (prefers-reduced-motion: no-preference) {
        :global(.group:hover .group-hover\:animate-spin-slow) {
            animation: spinSlow 10s linear infinite;
        }
    }

    @keyframes spinSlow {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    /* Slide in animation */
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

    /* Smooth scroll */
    :global(html) {
        scroll-behavior: smooth;
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
        .reveal-section {
            opacity: 1;
            transform: none;
            transition: none;
        }

        .animate-float-slow,
        .animate-float-medium,
        .animate-float-fast,
        .animate-float-particle,
        .pulse-ring,
        .scroll-dot,
        div :global(.heart-beat),
        div :global(.icon-spin),
        div :global(.icon-pulse),
        div :global(.icon-shimmer),
        div :global(.animate-spin-in) {
            animation: none;
        }
    }

    /* Focus states for keyboard navigation */
    :global(a:focus-visible),
    :global(button:focus-visible),
    :global(input:focus-visible) {
        outline: 2px solid color-mix(in srgb, var(--color-gold) 50%, transparent);
        outline-offset: 4px;
    }

    /* Easter egg animations */
    .easter-egg-container {
        animation:
            easterFadeIn 0.5s ease,
            easterFadeOut 0.5s ease 4.5s forwards;
    }

    .easter-heart {
        animation: heartFloat 3s ease-in-out infinite;
    }

    @keyframes heartFloat {
        0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
        }
        10% {
            opacity: 1;
        }
        90% {
            opacity: 1;
        }
        100% {
            transform: translateY(-100px) rotate(360deg);
            opacity: 0;
        }
    }

    .easter-message {
        animation: easterMessagePop 0.5s ease 0.3s both;
    }

    @keyframes easterMessagePop {
        0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
        }
        50% {
            transform: translate(-50%, -50%) scale(1.1);
        }
        100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
    }

    @keyframes easterFadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes easterFadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }

    /* Loading skeleton */
    @keyframes shimmer {
        0% {
            background-position: 200% 0;
        }
        100% {
            background-position: -200% 0;
        }
    }

    /* Touch feedback */
    @media (hover: none) {
        .card-3d:active {
            transform: scale(0.98);
        }

        .nav-link:active,
        a:active {
            opacity: 0.7;
        }
    }
</style>
