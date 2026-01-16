<script lang="ts">
    import { onMount, getContext } from "svelte";
    import { fade, fly, scale } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import {
        ArrowRight,
        Shield,
        Heart,
        Infinity as InfinityIcon,
        Fingerprint,
        ScanEye,
        Sparkles,
        FileText,
    } from "lucide-svelte";
    import type { Writable, Readable } from "svelte/store";

    const { mLanguage, mt } = getContext("marketingTranslations") as {
        mLanguage: Writable<string>;
        mt: Readable<any>;
    };

    // Assets from notion-assets & screenshots
    const assets = {
        vault: "/Marketing/product_shots/shot_vault.png",
        letters: "/Marketing/product_shots/shot_letters.png",
        guardian: "/Marketing/product_shots/shot_guardian.png",
        legacy: "/Marketing/product_shots/shot_heirlooms.png",
        heroBg: "/Marketing/notion-assets/assets/covers_default/digital_legacy_management_cover.png",
    };

    let scrollY = $state(0);
    let innerHeight = $state(0);
    let innerWidth = $state(0);
    let canvas: HTMLCanvasElement;
    let mouseX = $state(0);
    let mouseY = $state(0);

    // --- Kinetic Progress (Apple-style) ---
    const heroProgress = $derived(
        Math.max(0, Math.min(scrollY / (innerHeight || 1), 1)),
    );

    // Smooth Velocity Tracking
    let scrollVelocity = $state(0);
    let lastScrollY = 0;
    let lastTime = 0;

    onMount(() => {
        const updateVelocity = (time: number) => {
            const dt = time - lastTime;
            if (dt > 0) {
                const dy = scrollY - lastScrollY;
                scrollVelocity = (dy / dt) * 10; // Normalized scale
                lastScrollY = scrollY;
                lastTime = time;
            }
            requestAnimationFrame(updateVelocity);
        };
        requestAnimationFrame(updateVelocity);
    });

    // --- Atmospheric Mesh State ---
    const meshState = $derived.by(() => {
        if (scrollY < innerHeight * 0.5)
            return {
                primary: "rgba(245, 158, 11, 0.12)", // Amber
                secondary: "rgba(15, 17, 21, 1)",
                accent: "rgba(251, 191, 36, 0.05)",
            };
        if (scrollY < innerHeight * 1.5)
            return {
                primary: "rgba(31, 22, 16, 1)", // Warm Espresso
                secondary: "rgba(15, 17, 21, 1)",
                accent: "rgba(245, 158, 11, 0.08)",
            };
        return {
            primary: "rgba(8, 13, 18, 1)", // Midnight Navy
            secondary: "rgba(13, 43, 39, 0.15)", // Teal accents
            accent: "rgba(45, 212, 191, 0.05)",
        };
    });

    // --- Hero Animation: Interactive Digital Dust ---
    onMount(() => {
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const particles: Particle[] = [];
        const particleCount = 200; // Increased count

        // Mouse interaction
        window.addEventListener("mousemove", (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            originX: number;
            originY: number;
            size: number;
            color: string;
            friction: number = 0.95;
            ease: number = 0.05;

            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.originX = this.x;
                this.originY = this.y;
                this.vx = (Math.random() - 0.5) * 1;
                this.vy = (Math.random() - 0.5) * 1;
                this.size = Math.random() * 2 + 0.5;
                // Warm Gold / Teal mix
                this.color =
                    Math.random() > 0.6
                        ? `rgba(245, 158, 11, ${Math.random() * 0.7})`
                        : `rgba(45, 212, 191, ${Math.random() * 0.7})`;
            }

            update() {
                // Return to origin (Orbit feel)
                this.vx += (this.originX - this.x) * 0.001;
                this.vy += (this.originY - this.y) * 0.001;

                // Mouse interaction (Repulsion)
                const dx = mouseX - this.x;
                const dy = mouseY - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const force = 100; // Interaction radius

                if (dist < force) {
                    const angle = Math.atan2(dy, dx);
                    const push = (force - dist) * 0.02; // Strength
                    this.vx -= Math.cos(angle) * push;
                    this.vy -= Math.sin(angle) * push;
                }

                this.x += this.vx;
                this.y += this.vy;

                // Friction
                this.vx *= this.friction;
                this.vy *= this.friction;
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            }
        }

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        function animate(time: number) {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);

            // Velocity-based streaking effect
            const velocityEffect = Math.min(Math.abs(scrollVelocity) * 2, 20);

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.update();

                // Draw Streak
                ctx.beginPath();
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.size;
                ctx.lineCap = "round";
                ctx.moveTo(p.x, p.y);
                // Streak direction depends on scroll direction
                const streakY =
                    scrollVelocity > 0 ? -velocityEffect : velocityEffect;
                ctx.lineTo(p.x, p.y + streakY);
                ctx.stroke();

                for (let j = i + 1; j < particles.length; j++) {
                    const dx = p.x - particles[j].x;
                    const dy = p.y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 120) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 - distance / 800})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    });

    // --- Holographic Tilt Logic ---
    function handleTilt(e: MouseEvent) {
        // Disable on touch devices to prevent sticky tilt
        if (
            typeof window !== "undefined" &&
            window.matchMedia("(hover: none)").matches
        )
            return;

        const card = e.currentTarget as HTMLElement;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Increased sensitivity for a more premium feel
        const rotateX = ((y - centerY) / centerY) * -8; // Increased from 5 to 8
        const rotateY = ((x - centerX) / centerX) * 8;

        card.style.setProperty("--rx", `${rotateX}deg`);
        card.style.setProperty("--ry", `${rotateY}deg`);
        card.style.setProperty("--mx", `${x}px`);
        card.style.setProperty("--my", `${y}px`);
    }

    function resetTilt(e: MouseEvent) {
        const card = e.currentTarget as HTMLElement;
        card.style.setProperty("--rx", `0deg`);
        card.style.setProperty("--ry", `0deg`);
    }

    // --- Intersection Observer (Blur Reveal) ---
    function reveal(node: HTMLElement) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        node.classList.add("in-view");
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: "0px 0px -50px 0px", // Trigger slightly later for stability
            },
        );

        observer.observe(node);
        return {
            destroy() {
                observer.disconnect();
            },
        };
    }

    // --- Intro Sequence State ---
    let introVisible = false;
    onMount(() => {
        // Force scroll to top on reload
        if (typeof window !== "undefined") {
            window.scrollTo(0, 0);
            if (history.scrollRestoration) {
                history.scrollRestoration = "manual";
            }
        }
        setTimeout(() => (introVisible = true), 500);
    });

    // --- Commitment CTA Logic ---
    let signature = "";
    let email = "";
    let step = 0; // 0: Name, 1: Email, 2: Signed

    function handleNameSubmit() {
        if (signature.length > 2) {
            step = 1;
        }
    }

    function handleEmailSubmit() {
        if (email.includes("@") && email.includes(".")) {
            step = 2;
        }
    }
</script>

<svelte:window bind:scrollY bind:innerHeight bind:innerWidth />

<!-- Living Mesh Atmosphere (The Apple Standard) -->
<div
    class="fixed inset-0 z-[-3] overflow-hidden pointer-events-none transition-colors duration-1000 bg-[#020408]"
>
    <!-- Deep Parallax Stars -->
    <div
        class="absolute inset-0 opacity-[0.4]"
        style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 100px 100px; transform: translateY({scrollY *
            -0.05}px);"
    ></div>

    <!-- Grainy Noise Overlay -->
    <div
        class="fixed inset-0 z-10 opacity-[0.15] mix-blend-overlay pointer-events-none"
        style="background-image: url('https://grainy-gradients.vercel.app/noise.svg');"
    ></div>

    <!-- The Morphing Mesh -->
    <div
        class="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] opacity-40 blur-[160px] animate-slow-spin transition-all duration-[2000ms]"
        style="
            background: radial-gradient(circle at center, {meshState.primary} 0%, transparent 50%),
                        radial-gradient(circle at 30% 30%, {meshState.accent} 0%, transparent 40%),
                        radial-gradient(circle at 70% 70%, {meshState.secondary} 0%, transparent 60%);
            transform: rotate({scrollY * 0.04}deg) scale({1.1 +
            Math.abs(scrollVelocity) * 0.02});
        "
    ></div>
</div>

<!-- Global Digital Grid Underlay -->
<div
    class="fixed inset-0 pointer-events-none z-[-2] opacity-[0.05]"
    style="background-image: linear-gradient(rgba(45, 212, 191, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(45, 212, 191, 0.2) 1px, transparent 1px); background-size: 50px 50px; transform: perspective(1000px) rotateX(60deg) translateY({scrollY *
        -0.1}px);"
>
    <!-- Scanning Beam -->
    <div
        class="absolute inset-0 bg-gradient-to-b from-transparent via-teal-500/20 to-transparent h-40 w-full animate-scan"
    ></div>
</div>

<!-- Digital Threads (Connecting Sections) -->
<svg class="fixed inset-0 pointer-events-none z-[-2] w-full h-full opacity-20">
    <defs>
        <linearGradient id="threadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="transparent" />
            <stop offset="50%" stop-color="#F59E0B" />
            <stop offset="100%" stop-color="transparent" />
        </linearGradient>
    </defs>
    <!-- Dynamic Thread Lines -->
    <path
        d="M {innerWidth * 0.2} 0 Q {innerWidth * 0.3} {innerHeight *
            0.5} {innerWidth * 0.1} {innerHeight}"
        stroke="url(#threadGrad)"
        stroke-width="2"
        fill="none"
        style="stroke-dasharray: 1000; stroke-dashoffset: {scrollY % 1000}"
    />
    <path
        d="M {innerWidth * 0.8} 0 Q {innerWidth * 0.7} {innerHeight *
            0.5} {innerWidth * 0.9} {innerHeight}"
        stroke="url(#threadGrad)"
        stroke-width="2"
        fill="none"
        style="stroke-dasharray: 1000; stroke-dashoffset: {-scrollY % 1000}"
    />
</svg>

<!-- Hero Section (Extended for Scroll Animation) -->
<section class="relative h-[250vh] overflow-visible">
    <!-- Sticky Portal for Animations -->
    <div
        class="sticky top-0 h-screen w-full flex flex-col items-center justify-start overflow-hidden pt-12 md:pt-24"
    >
        <!-- Background Dust (Speed up with scroll) -->
        <canvas
            bind:this={canvas}
            class="absolute inset-0 z-0 opacity-40"
            style="transform: translateY({scrollY * 0.2}px)"
        ></canvas>

        <!-- The Morphing Landscape -->
        <div
            class="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col items-center"
            style="transform: translateY({-scrollY * 0.1}px); opacity: {1 -
                heroProgress * 1.5}"
        >
            <!-- Text Suite (Staggered Clip-Reveal) -->
            <div class="text-center mb-8 md:mb-12 z-20">
                <div class="overflow-visible mb-1 py-1">
                    <h1
                        class="text-4xl md:text-[6rem] font-serif font-medium text-white leading-[0.9] tracking-tighter drop-shadow-2xl {introVisible
                            ? 'hero-clip-reveal'
                            : 'opacity-0'}"
                        style="--delay: 0.1s"
                    >
                        {$mt.heroTitle}
                    </h1>
                </div>
                <div class="overflow-visible mb-2 py-1">
                    <h1
                        class="text-4xl md:text-[6rem] font-serif font-medium leading-[0.9] tracking-tighter {introVisible
                            ? 'hero-clip-reveal'
                            : 'opacity-0'}"
                        style="--delay: 0.3s"
                    >
                        <span
                            class="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-500 italic relative"
                        >
                            {$mt.heroSubtitle}
                        </span>
                    </h1>
                </div>
                <div class="overflow-visible py-1">
                    <p
                        class="text-base md:text-xl text-slate-300 max-w-xl mx-auto font-light leading-relaxed tracking-wide px-4 {introVisible
                            ? 'hero-clip-reveal'
                            : 'opacity-0'}"
                        style="--delay: 0.5s"
                    >
                        {$mt.heroDesc}
                    </p>
                </div>
            </div>

            <!-- The Anchor: The Device (Apple-esque Display Frame) -->
            <div
                class="relative group perspective-container w-full transition-all duration-300 px-4 md:px-0"
                style="
                    max-width: min(1000px, 90vw);
                    transform: 
                        scale({1.15 - heroProgress * 0.15}) 
                        translateY({heroProgress * 80}px)
                        rotateX({heroProgress * 5}deg);
                "
                on:mousemove={handleTilt}
                on:mouseleave={resetTilt}
            >
                <!-- Device Frame -->
                <div
                    class="relative rounded-[2.5rem] md:rounded-[4rem] p-2 md:p-3 bg-gradient-to-br from-slate-400 via-slate-700 to-slate-900 border border-white/20 shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] transition-all duration-700 overflow-hidden"
                >
                    <!-- Bezel -->
                    <div
                        class="relative rounded-[2rem] md:rounded-[3.5rem] bg-black overflow-hidden aspect-[16/10] shadow-inner border border-black/40"
                    >
                        <img
                            src="/images/hero_shoebox.png"
                            alt="The Hidden Shoebox Discovery"
                            class="w-full h-full object-cover opacity-90 transition-all duration-1000 group-hover:scale-[1.02]"
                            style="filter: brightness({1 -
                                (1 - heroProgress) * 0.5})"
                        />

                        <!-- Glossy Glass Overlay -->
                        <div
                            class="absolute inset-0 pointer-events-none z-20 opacity-40 bg-gradient-to-tr from-white/10 via-transparent to-white/5"
                            style="transform: translate(calc(var(--mx, 50%) * 0.05px), calc(var(--my, 50%) * 0.05px)) scale(1.5);"
                        ></div>

                        <!-- Internal Shine (Tracking) -->
                        <div class="shine opacity-40"></div>

                        <!-- Screen Overlay Gradient -->
                        <div
                            class="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-transparent pointer-events-none"
                        ></div>
                    </div>

                    <!-- Camera Dot -->
                    <div
                        class="absolute top-4 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-800 shadow-inner"
                    ></div>
                </div>

                <!-- Ground Reflection (Parallax) -->
                <div
                    class="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[95%] bg-amber-500/10 blur-[100px] rounded-full -z-10 transition-all duration-500"
                    style="
                        height: {60 + heroProgress * 60}px;
                        opacity: {heroProgress * 0.8};
                    "
                ></div>
            </div>
        </div>

        <!-- Scroll Indicator (Fades out quickly) -->
        <div
            class="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 transition-opacity duration-500"
            style="opacity: {1 - heroProgress * 4}"
        >
            <span
                class="text-white/30 text-xs font-bold uppercase tracking-[0.3em]"
                >Scroll to Discover</span
            >
            <div
                class="w-px h-12 bg-gradient-to-b from-white/40 to-transparent"
            ></div>
        </div>
    </div>
</section>

<!-- The Gap (Emotional Core) -->
<section class="py-12 md:py-24 px-4 md:px-6 relative overflow-hidden">
    <!-- Visible Background Texture -->
    <div
        class="absolute inset-0 z-0 opacity-30"
        style="background-image: radial-gradient(#ffffff 1px, transparent 1px); background-size: 40px 40px; mask-image: linear-gradient(to bottom, transparent, black, transparent);"
    ></div>
    <div
        class="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent pointer-events-none"
    ></div>
    <div
        class="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-24 items-center"
    >
        <div class="space-y-8" use:reveal>
            <div
                class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-900/20 border border-amber-800/50 text-xs font-mono uppercase tracking-widest text-amber-500 shadow-glow"
            >
                <Heart size={12} fill="currentColor" />
                The Kindest Gift
            </div>

            <h2
                class="text-4xl md:text-6xl font-serif font-bold text-white mb-8"
            >
                {$mt.giftTitle}
            </h2>

            <div
                class="text-xl md:text-2xl text-slate-400 space-y-6 max-w-3xl mx-auto leading-relaxed"
            >
                <p>
                    {$mt.giftDesc1}
                </p>
                <p>
                    {$mt.giftDesc2}
                </p>
            </div>
        </div>

        <div
            class="relative group perspective-container reveal-card"
            style="transition-delay: 0.3s"
            use:reveal
            on:mousemove={handleTilt}
            on:mouseleave={resetTilt}
        >
            <div
                class="holo-card relative rounded-[1rem] overflow-hidden transform-gpu transition-transform border border-white/20 shadow-2xl bg-[#0F1115]"
            >
                <!-- Removed overlay for pure product look -->
                <img
                    src={assets.legacy}
                    alt="Heirlooms Interface"
                    class="w-full h-auto object-cover hover:scale-105 transition-all duration-1000"
                />
                <!-- Shine Effect -->
                <div class="shine"></div>
            </div>
        </div>
    </div>
</section>

<!-- The Feature Gallery (Bento Grid) -->
<section class="py-24 px-4 md:px-6 relative overflow-hidden">
    <div class="max-w-7xl mx-auto">
        <div class="mb-20 text-center" use:reveal>
            <h2
                class="text-xs font-bold uppercase tracking-[0.3em] text-amber-500 mb-4"
            >
                {$mt.toolkitTitle}
            </h2>
            <p
                class="text-4xl md:text-6xl font-serif font-bold text-white max-w-4xl mx-auto leading-tight"
            >
                Everything you need to leave <span class="italic text-amber-500"
                    >more than money.</span
                >
            </p>
        </div>

        <!-- The Grid -->
        <div
            class="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 auto-rows-[300px] md:auto-rows-[400px]"
        >
            <!-- Vault: Large Focus (8 cols) -->
            <div
                class="md:col-span-8 md:row-span-1 relative rounded-[2rem] overflow-hidden group reveal"
                use:reveal
            >
                <div
                    class="absolute inset-0 bg-[#0F1115] border border-white/10 group-hover:border-amber-500/30 transition-colors z-0"
                ></div>
                <img
                    src={assets.vault}
                    class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all duration-1000 group-hover:scale-105"
                    alt="Vault"
                />
                <div
                    class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10"
                ></div>

                <div class="absolute bottom-8 left-8 right-8 z-20">
                    <div class="w-10 h-px bg-amber-500/50 mb-4"></div>
                    <h3 class="text-3xl font-serif font-bold text-white mb-2">
                        {$mt.vaultTitle}
                    </h3>
                    <p class="text-slate-400 max-w-lg">{$mt.vaultDesc}</p>
                </div>
            </div>

            <!-- Letters: Tall Side (4 cols) -->
            <div
                class="md:col-span-4 md:row-span-2 relative rounded-[2rem] overflow-hidden group reveal"
                use:reveal
            >
                <div
                    class="absolute inset-0 bg-[#0F1115] border border-white/10 group-hover:border-amber-500/30 transition-colors z-0"
                ></div>
                <img
                    src={assets.letters}
                    class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all duration-1000 group-hover:scale-105"
                    alt="Letters"
                />
                <div
                    class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10"
                ></div>

                <div class="absolute bottom-8 left-8 right-8 z-20">
                    <div class="w-10 h-px bg-amber-500/50 mb-4"></div>
                    <h3 class="text-3xl font-serif font-bold text-white mb-2">
                        {$mt.lettersTitle}
                    </h3>
                    <p class="text-slate-400">{$mt.lettersDesc}</p>
                </div>
            </div>

            <!-- Heirlooms: Center Wide (8 cols) -->
            <div
                class="md:col-span-8 md:row-span-1 relative rounded-[2rem] overflow-hidden group reveal"
                use:reveal
            >
                <div
                    class="absolute inset-0 bg-[#0F1115] border border-white/10 group-hover:border-amber-500/30 transition-colors z-0"
                ></div>
                <div
                    class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent z-0"
                ></div>

                <div class="grid md:grid-cols-2 h-full z-10 relative">
                    <div class="p-8 flex flex-col justify-center">
                        <div class="w-10 h-px bg-teal-500/50 mb-4"></div>
                        <h3
                            class="text-3xl font-serif font-bold text-white mb-2"
                        >
                            Heirlooms Registry
                        </h3>
                        <p class="text-slate-400">
                            Archiving the stories behind your most precious
                            items with visual intelligence.
                        </p>
                    </div>
                    <div
                        class="relative overflow-hidden p-6 md:p-8 flex items-center justify-center"
                    >
                        <img
                            src={assets.legacy}
                            class="w-full h-full object-contain rounded-2xl shadow-2xl transition-all duration-1000 group-hover:scale-110"
                            alt="Heirlooms"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- Section 3: The Guardian (Center Immersive) -->
        <div class="relative py-24" use:reveal>
            <div
                class="absolute inset-0 bg-blue-500/5 blur-[120px] rounded-full"
            ></div>
            <div class="relative z-10 max-w-4xl mx-auto text-center space-y-8">
                <div
                    class="inline-flex p-4 bg-blue-500/10 text-blue-400 rounded-3xl mb-4"
                >
                    <Sparkles size={32} />
                </div>
                <h3
                    class="text-4xl md:text-6xl font-serif font-bold text-white"
                >
                    {$mt.guideTitle}
                </h3>
                <p class="text-xl md:text-2xl text-slate-400 leading-relaxed">
                    {$mt.guideDesc}
                </p>
                <div class="relative mt-12 group">
                    <img
                        src={assets.guardian}
                        class="w-full h-auto rounded-[3rem] shadow-2xl border border-white/10 group-hover:border-blue-500/30 transition-all duration-700"
                        alt="Guardian"
                    />
                    <div
                        class="absolute inset-0 rounded-[3rem] bg-gradient-to-t from-black/80 via-transparent to-transparent"
                    ></div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- The Secret: AI Concierge -->
<section class="py-32 relative bg-black/40 border-t border-white/5">
    <div class="max-w-7xl mx-auto px-6">
        <div class="mb-20 text-center">
            <div use:reveal>
                <div
                    class="reveal-text inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6"
                >
                    <span
                        class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"
                    ></span>
                    The Invisible Helper
                </div>
                <h1
                    class="split-reveal text-6xl md:text-9xl font-serif font-black tracking-tighter leading-[0.85] text-white perspective-1000"
                >
                    <span class="block overflow-hidden">
                        <span class="block">{$mt.aiTitle}</span>
                    </span>
                    <span class="block overflow-hidden text-[#F59E0B]">
                        <span class="block" style="transition-delay: 0.1s"
                            >{$mt.aiEmpathy}</span
                        >
                    </span>
                </h1>
                <p
                    class="mt-8 text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed"
                >
                    {$mt.aiDesc}
                </p>
            </div>
        </div>

        <!-- AI Concierge Expanded (Zig-Zag) -->
        <div class="space-y-48 mt-32">
            <!-- AI Card 1 -->
            <div class="grid md:grid-cols-12 gap-12 items-center" use:reveal>
                <div class="md:col-span-6 order-2 md:order-1 space-y-8">
                    <div
                        class="w-16 h-16 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-400"
                    >
                        <ScanEye size={32} />
                    </div>
                    <h3
                        class="text-3xl md:text-5xl font-serif font-bold text-white"
                    >
                        {$mt.archivistTitle}
                    </h3>
                    <p class="text-xl text-slate-400 leading-relaxed">
                        {$mt.archivistDesc}
                    </p>
                </div>
                <div class="md:col-span-6 order-1 md:order-2">
                    <div
                        class="aspect-square bg-gradient-to-br from-indigo-500/10 to-transparent rounded-[4rem] border border-white/5 flex items-center justify-center relative group"
                    >
                        <div
                            class="absolute inset-0 blur-[60px] bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-all"
                        ></div>
                        <div
                            class="relative text-indigo-400/20 transform group-hover:scale-110 transition-transform duration-700"
                        >
                            <ScanEye size={200} strokeWidth={0.5} />
                        </div>
                    </div>
                </div>
            </div>

            <!-- AI Card 2 -->
            <div class="grid md:grid-cols-12 gap-12 items-center" use:reveal>
                <div class="md:col-span-6">
                    <div
                        class="aspect-square bg-gradient-to-br from-emerald-500/10 to-transparent rounded-[4rem] border border-white/5 flex items-center justify-center relative group"
                    >
                        <div
                            class="absolute inset-0 blur-[60px] bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-all"
                        ></div>
                        <div
                            class="relative text-emerald-400/20 transform group-hover:scale-110 transition-transform duration-700"
                        >
                            <Sparkles size={200} strokeWidth={0.5} />
                        </div>
                    </div>
                </div>
                <div
                    class="md:col-span-6 space-y-8 text-right flex flex-col items-end"
                >
                    <div
                        class="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-400"
                    >
                        <Sparkles size={32} />
                    </div>
                    <h3
                        class="text-3xl md:text-5xl font-serif font-bold text-white"
                    >
                        {$mt.empathyTitle}
                    </h3>
                    <p class="text-xl text-slate-400 leading-relaxed">
                        {$mt.empathyDesc}
                    </p>
                </div>
            </div>

            <!-- AI Card 3 -->
            <div class="grid md:grid-cols-12 gap-12 items-center" use:reveal>
                <div class="md:col-span-6 order-2 md:order-1 space-y-8">
                    <div
                        class="w-16 h-16 bg-amber-500/10 rounded-3xl flex items-center justify-center text-amber-400"
                    >
                        <FileText size={32} />
                    </div>
                    <h3
                        class="text-3xl md:text-5xl font-serif font-bold text-white"
                    >
                        {$mt.jargonTitle}
                    </h3>
                    <p class="text-xl text-slate-400 leading-relaxed">
                        {$mt.jargonDesc}
                    </p>
                </div>
                <div class="md:col-span-6 order-1 md:order-2">
                    <div
                        class="aspect-square bg-gradient-to-br from-amber-500/10 to-transparent rounded-[4rem] border border-white/5 flex items-center justify-center relative group"
                    >
                        <div
                            class="absolute inset-0 blur-[60px] bg-amber-500/5 group-hover:bg-amber-500/10 transition-all"
                        ></div>
                        <div
                            class="relative text-amber-400/20 transform group-hover:scale-110 transition-transform duration-700"
                        >
                            <FileText size={200} strokeWidth={0.5} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Legal Disclaimer Trust Signal -->
<section class="py-12 border-t border-white/5 bg-black/40">
    <div class="max-w-4xl mx-auto px-6 text-center" use:reveal>
        <div class="inline-flex items-center gap-2 mb-4 text-slate-500">
            <Shield size={16} />
            <span class="text-xs font-bold uppercase tracking-widest"
                >Compliance & Trust</span
            >
        </div>
        <p class="text-slate-400 text-sm leading-relaxed max-w-2xl mx-auto">
            Continuum helps you organize your intent and get your affairs in
            order. However, we are not a law firm. Use this platform to prepare,
            but always verify compliance with local healthcare and estate laws
            to ensure your wishes are legally binding.
        </p>
    </div>
</section>

<!-- Signature Commitment CTA -->
<section
    class="min-h-screen flex items-center justify-center relative overflow-hidden"
>
    <!-- Background Glow -->
    <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none"
    ></div>

    <div class="relative z-10 text-center space-y-12 max-w-3xl px-6" use:reveal>
        {#if step === 0}
            <!-- Step 1: Name -->
            <div
                in:scale={{ duration: 500, start: 0.95 }}
                out:fade={{ duration: 200 }}
            >
                <h2
                    class="text-5xl md:text-8xl font-serif font-black text-white mb-6"
                >
                    {$mt.pactTitle}
                </h2>
                <p class="text-xl text-slate-400 max-w-xl mx-auto">
                    {$mt.pactDesc}
                </p>

                <div class="relative group max-w-md mx-auto">
                    <input
                        type="text"
                        bind:value={signature}
                        placeholder={$mt.placeholderSign}
                        on:keydown={(e) =>
                            e.key === "Enter" && handleNameSubmit()}
                        class="w-full bg-white/5 border-b border-white/20 p-6 text-3xl font-serif italic text-amber-200 outline-none focus:border-amber-500 transition-all text-center"
                    />
                </div>

                <div class="mt-12 h-16">
                    {#if signature.length > 2}
                        <button
                            on:click={handleNameSubmit}
                            in:fly={{ y: 20 }}
                            class="group flex items-center gap-4 bg-white text-black px-10 py-5 rounded-full font-bold uppercase tracking-widest hover:scale-105 transition-all text-sm mt-8 mx-auto"
                        >
                            {$mt.btnNext}
                            <ArrowRight
                                size={20}
                                class="group-hover:translate-x-1 transition-transform"
                            />
                        </button>
                    {/if}
                </div>
            </div>
        {:else if step === 1}
            <!-- Step 2: Email -->
            <div
                in:scale={{ duration: 500, start: 0.95 }}
                out:fade={{ duration: 200 }}
            >
                <h3 class="text-2xl font-bold text-white mb-2">
                    {$mt.keeperTitle}
                </h3>
                <p class="text-slate-400 mb-8">
                    {$mt.keeperDesc}
                </p>
                <div class="relative max-w-md mx-auto">
                    <input
                        type="email"
                        bind:value={email}
                        placeholder="email@address.com"
                        on:keydown={(e) =>
                            e.key === "Enter" && handleEmailSubmit()}
                        class="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-xl text-white outline-none focus:border-amber-500 transition-all text-center"
                    />
                    {#if email.includes("@") && email.includes(".")}
                        <button
                            on:click={handleEmailSubmit}
                            class="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-black py-5 rounded-2xl font-bold uppercase tracking-widest transition-all shadow-xl shadow-amber-500/20 active:scale-95"
                        >
                            {$mt.btnCommit}
                        </button>
                    {/if}
                </div>
                <button
                    on:click={() => (step = 0)}
                    class="mt-8 text-slate-500 text-sm hover:text-white transition"
                    >Back</button
                >
            </div>
        {:else}
            <!-- Step 3: Success/Signed State -->
            <div in:scale={{ duration: 800, start: 0.8 }} class="space-y-8">
                <div
                    class="w-24 h-24 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto border border-teal-500/50 shadow-[0_0_50px_rgba(45,212,191,0.3)]"
                >
                    <Fingerprint size={48} class="text-teal-400" />
                </div>
                <h3 class="text-3xl font-serif font-bold text-white mb-2">
                    {$mt.welcomeTitle}
                    {signature}.
                </h3>
                <p class="text-slate-400 mb-8">
                    {$mt.sequenceSent}
                    <span class="text-amber-200">{email}</span>
                </p>
                <a
                    href="/start?email={email}&lang={$mLanguage}"
                    class="inline-flex items-center gap-4 bg-teal-500 hover:bg-teal-600 text-white px-10 py-5 rounded-2xl font-bold uppercase tracking-widest transition-all shadow-xl shadow-teal-500/20"
                >
                    {$mt.btnEnterVault}
                    <ArrowRight size={20} />
                </a>
            </div>
        {/if}
    </div>
</section>

<style>
    /* Hero Clip Reveal */
    .hero-clip-reveal {
        animation: clip-up 1.2s cubic-bezier(0.16, 1, 0.3, 1) both;
        animation-delay: var(--delay, 0s);
        will-change: transform, opacity;
    }

    @keyframes clip-up {
        from {
            transform: translateY(120%);
            opacity: 0;
            clip-path: inset(100% 0 0 0);
        }
        to {
            transform: translateY(0);
            opacity: 1;
            clip-path: inset(0 0 0 0);
        }
    }

    /* Scroll Reveal Animation System */
    :global(.reveal) {
        opacity: 0;
        transform: translateY(40px) scale(0.98);
        filter: blur(10px);
        transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        will-change: transform, opacity, filter;
    }

    :global(.reveal.in-view) {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: blur(0);
    }

    /* Staggered Reveals */
    :global(.reveal:nth-child(2)) {
        transition-delay: 0.1s;
    }
    :global(.reveal:nth-child(3)) {
        transition-delay: 0.2s;
    }
    :global(.reveal:nth-child(4)) {
        transition-delay: 0.3s;
    }
    :global(.reveal:nth-child(5)) {
        transition-delay: 0.4s;
    }

    /* Enhanced Holographic Card Logic */
    .perspective-container {
        perspective: 1200px;
    }
    .holo-card {
        transform-style: preserve-3d;
        transform: perspective(1200px) rotateX(var(--rx, 0deg))
            rotateY(var(--ry, 0deg));
        transition:
            transform 0.1s cubic-bezier(0.2, 0, 0.2, 1),
            /* Faster tracking */ border-color 0.5s ease;
        background: rgba(15, 17, 21, 0.85);
        backdrop-filter: blur(25px);
        -webkit-backdrop-filter: blur(25px);
        will-change: transform;
    }

    /* Specular Reflection Layer */
    .holo-card::before {
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(
            800px circle at var(--mx, 50%) var(--my, 50%),
            rgba(255, 255, 255, 0.1) 0%,
            transparent 60%
        );
        opacity: 0;
        transition: opacity 0.5s ease;
        pointer-events: none;
        z-index: 20;
    }
    .holo-card:hover::before {
        opacity: 1;
    }

    /* Light Sweep Effect */
    .holo-card::after {
        content: "";
        position: absolute;
        inset: -1px;
        background: linear-gradient(
            125deg,
            transparent 0%,
            transparent 35%,
            rgba(255, 255, 255, 0.25) 48%,
            /* Brighter peak */ rgba(255, 255, 255, 0.1) 52%,
            transparent 65%,
            transparent 100%
        );
        background-size: 250% 250%;
        background-position: 200% 200%;
        transition: background-position 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 10;
        pointer-events: none;
        border-radius: inherit;
        mix-blend-mode: overlay; /* Better blending */
    }
    .holo-card:hover::after {
        background-position: -100% -100%;
    }

    .shine {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(
            circle at var(--mx, 50%) var(--my, 50%),
            rgba(255, 255, 255, 0.12) 0%,
            transparent 40%
        );
        pointer-events: none;
        z-index: 30;
    }

    /* Floating Shards Polish */
    .floating-shard {
        backdrop-filter: blur(30px);
        -webkit-backdrop-filter: blur(30px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        will-change: transform;
    }

    /* Animations */
    @keyframes slow-spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    @keyframes scan {
        from {
            transform: translateY(-100%);
        }
        to {
            transform: translateY(1200%);
        }
    }

    .animate-slow-spin {
        animation: slow-spin 40s linear infinite;
    }

    .animate-scan {
        animation: scan 12s linear infinite;
    }

    .shadow-glow {
        box-shadow: 0 0 50px -10px rgba(245, 158, 11, 0.4);
    }
</style>
