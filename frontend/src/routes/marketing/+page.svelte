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
        guardian: "/Marketing/product_shots/shot_heirlooms.png",
        legacy: "/Marketing/product_shots/shot_heirlooms.png",
        heroBg: "/Marketing/notion-assets/assets/covers_default/digital_legacy_management_cover.png",
    };

    let scrollY = 0;
    let innerHeight = 0;
    let canvas: HTMLCanvasElement;
    let mouseX = 0;
    let mouseY = 0;

    // --- Atmospheric State ---
    // 0 = Charcoal (Deep Space), 1 = Amber (Memory), 2 = Teal (Vault)
    let activeAtmosphere = "bg-[#0F1115]";
    $: {
        if (scrollY < innerHeight * 0.8)
            activeAtmosphere = "bg-[#0F1115]"; // Hero
        else if (scrollY < innerHeight * 1.8)
            activeAtmosphere = "bg-[#1f1610]"; // Emotional (Warm Dark Brown/Amber)
        else activeAtmosphere = "bg-[#080d12]"; // Tech (Deep Blue/Black)
    }

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

        function animate() {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);

            // Connect particles
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();

                for (let j = i; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 120) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 - distance / 800})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animate);
        }

        animate();

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    });

    // --- Holographic Tilt Logic ---
    function handleTilt(e: MouseEvent) {
        const card = e.currentTarget as HTMLElement;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -5; // Max 5deg tilt
        const rotateY = ((x - centerX) / centerX) * 5;

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
            { threshold: 0.2 },
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

<svelte:window bind:scrollY bind:innerHeight />

<!-- Living Atmosphere Background -->
<div
    class="fixed inset-0 {activeAtmosphere} transition-colors duration-[2000ms] pointer-events-none z-[-2]"
></div>

<!-- Global Noise Texture -->
<div
    class="fixed inset-0 bg-repeat opacity-[0.03] pointer-events-none z-[-1] mix-blend-overlay"
    style="background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJ4Ij48ZmVUdXJYdWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIiAvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCN4KSIgb3BhY2l0eT0iMC41IiAvPjwvc3ZnPg==');"
></div>

<!-- Hero Section -->
<section
    class="relative min-h-[120vh] flex items-center justify-center overflow-hidden pt-32 pb-20"
>
    <!-- Living Background Dust -->
    <canvas bind:this={canvas} class="absolute inset-0 z-0 opacity-40"></canvas>

    <!-- Gradient Underlay -->
    <div
        class="absolute inset-0 bg-gradient-to-b from-[#0F1115] via-transparent to-[#0F1115] z-0 opacity-80"
    ></div>

    {#if introVisible}
        <div
            class="relative z-10 text-center px-4 max-w-6xl mx-auto flex flex-col items-center"
            in:fade={{ duration: 2000 }}
        >
            <!-- The Main Title -->
            <h1
                class="text-5xl md:text-[7rem] font-serif font-medium text-white leading-[0.9] tracking-tighter drop-shadow-2xl mb-8"
            >
                {$mt.heroTitle} <br />
                <span
                    class="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-500 italic relative"
                >
                    {$mt.heroSubtitle}
                    <div
                        class="absolute inset-0 blur-3xl bg-amber-400/10 -z-10 animate-pulse"
                    ></div>
                </span>
            </h1>

            <p
                class="text-lg md:text-2xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed tracking-wide mb-16 px-4"
                in:fly={{ y: 20, duration: 1500, delay: 500 }}
            >
                {$mt.heroDesc}
            </p>

            <!-- The Primary Graphic: The Hidden Shoebox -->
            <div
                class="relative group perspective-container w-full max-w-4xl mx-auto px-4"
                in:fly={{ y: 40, duration: 2000, delay: 800 }}
                on:mousemove={handleTilt}
                on:mouseleave={resetTilt}
            >
                <div
                    class="holo-card relative rounded-[2.5rem] overflow-hidden border border-white/20 shadow-[0_40px_100px_-15px_rgba(0,0,0,0.8)] bg-black transition-all duration-700"
                >
                    <img
                        src="/images/hero_shoebox.png"
                        alt="The Hidden Shoebox Discovery"
                        class="w-full h-auto object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-1000"
                    />

                    <!-- Atmospheric Overlay (Matches the glow in the image) -->
                    <div
                        class="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-transparent pointer-events-none"
                    ></div>

                    <!-- Shine effect -->
                    <div class="shine"></div>
                </div>

                <!-- Ground Reflection / Glow -->
                <div
                    class="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[90%] h-20 bg-amber-500/10 blur-[80px] rounded-full -z-10"
                ></div>
            </div>

            <div class="pt-24" in:fade={{ delay: 1500, duration: 1000 }}>
                <div class="animate-bounce">
                    <ArrowRight
                        class="text-white/20 rotate-90 mx-auto"
                        size={32}
                    />
                </div>
            </div>
        </div>
    {/if}
</section>

<!-- The Gap (Emotional Core) -->
<section class="py-24 md:py-40 px-4 md:px-6 relative">
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
            class="relative group perspective-container"
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

<!-- Features Grid -->
<section class="py-24 md:py-40 px-4 md:px-6">
    <div class="max-w-7xl mx-auto space-y-32">
        <div class="mb-20">
            <h2
                class="text-xs font-bold uppercase tracking-[0.3em] text-amber-500 mb-4"
            >
                {$mt.toolkitTitle}
            </h2>
            <p class="text-4xl md:text-6xl font-serif font-bold text-white">
                {$mt.toolkitDesc}
            </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8 perspective-container">
            <!-- Pillar 1: The Vault -->
            <div
                class="group holo-card relative bg-[#0F1115] rounded-3xl overflow-hidden border border-white/10 shadow-xl"
                on:mousemove={handleTilt}
                on:mouseleave={resetTilt}
                use:reveal
            >
                <div class="h-64 overflow-hidden relative">
                    <img
                        src={assets.vault}
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 object-top"
                        alt="Vault Interface"
                    />
                </div>
                <div class="p-8">
                    <div class="flex items-center gap-3 mb-6">
                        <div
                            class="p-3 bg-teal-500/20 text-teal-400 rounded-xl"
                        >
                            <Shield size={24} />
                        </div>
                        <h3 class="text-2xl font-bold text-white">
                            {$mt.vaultTitle}
                        </h3>
                    </div>
                    <p class="text-slate-400 leading-relaxed text-lg">
                        {$mt.vaultDesc}
                    </p>
                </div>
                <div class="shine"></div>
            </div>

            <!-- Pillar 2: The Signal -->
            <div
                class="group holo-card relative bg-[#0F1115] rounded-3xl overflow-hidden border border-white/10 shadow-xl"
                on:mousemove={handleTilt}
                on:mouseleave={resetTilt}
                use:reveal
            >
                <div class="h-64 overflow-hidden relative">
                    <img
                        src={assets.letters}
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 object-top"
                        alt="Letters Interface"
                    />
                </div>
                <div class="p-8 text-right flex flex-col items-end">
                    <div class="flex items-center gap-3 mb-6">
                        <h3 class="text-2xl font-bold text-white">
                            {$mt.lettersTitle}
                        </h3>
                        <div
                            class="p-3 bg-amber-500/20 text-amber-400 rounded-xl"
                        >
                            <Heart size={24} />
                        </div>
                    </div>
                    <p class="text-slate-400 leading-relaxed text-lg">
                        {$mt.lettersDesc}
                    </p>
                </div>
                <div class="shine"></div>
            </div>

            <!-- Pillar 3: The Guardian -->
            <div
                class="group holo-card relative bg-[#0F1115] rounded-3xl overflow-hidden border border-white/10 shadow-xl"
                on:mousemove={handleTilt}
                on:mouseleave={resetTilt}
                use:reveal
            >
                <div class="h-64 overflow-hidden relative">
                    <img
                        src={assets.guardian}
                        class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        alt="Guardian"
                    />
                </div>
                <div class="p-8">
                    <div class="flex items-center gap-3 mb-6">
                        <div
                            class="p-3 bg-blue-500/20 text-blue-400 rounded-xl"
                        >
                            <Sparkles size={24} />
                        </div>
                        <h3 class="text-2xl font-bold text-white">
                            {$mt.guideTitle}
                        </h3>
                    </div>
                    <p class="text-slate-400 leading-relaxed text-lg">
                        {$mt.guideDesc}
                    </p>
                </div>
                <div class="shine"></div>
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
                    class="hero-title text-6xl md:text-9xl font-serif font-black tracking-tighter leading-[0.85] text-white perspective-1000"
                >
                    <span class="block overflow-hidden">
                        <span class="block">{$mt.aiTitle}</span>
                    </span>
                    <span class="block overflow-hidden text-[#F59E0B]">
                        <span class="block">{$mt.aiEmpathy}</span>
                    </span>
                </h1>
                <p
                    class="mt-8 text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed"
                >
                    {$mt.aiDesc}
                </p>
            </div>
        </div>

        <div class="grid md:grid-cols-3 gap-8 perspective-container">
            <!-- AI Card 1: Visual Archivist -->
            <div
                class="group relative p-8 rounded-3xl bg-[#0F1115] border border-white/5 hover:border-indigo-500/30 transition-all duration-500"
                on:mousemove={handleTilt}
                on:mouseleave={resetTilt}
                use:reveal
            >
                <div
                    class="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform"
                >
                    <ScanEye size={24} />
                </div>
                <div class="space-y-4">
                    <h3 class="text-2xl font-bold text-white">
                        {$mt.archivistTitle}
                    </h3>
                    <p class="text-slate-400 leading-relaxed">
                        {$mt.archivistDesc}
                    </p>
                </div>
                <div class="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                        class="h-full bg-indigo-500 w-0 group-hover:w-full transition-all duration-1000 ease-out"
                    ></div>
                </div>
                <div class="shine"></div>
            </div>

            <!-- AI Card 2: Empathy Engine -->
            <div
                class="group relative p-8 rounded-3xl bg-[#0F1115] border border-white/5 hover:border-emerald-500/30 transition-all duration-500 delay-100"
                on:mousemove={handleTilt}
                on:mouseleave={resetTilt}
                use:reveal
            >
                <div
                    class="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform"
                >
                    <Sparkles size={24} />
                </div>
                <div class="space-y-4">
                    <h3 class="text-2xl font-bold text-white">
                        {$mt.empathyTitle}
                    </h3>
                    <p class="text-slate-400 leading-relaxed">
                        {$mt.empathyDesc}
                    </p>
                </div>
                <div class="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                        class="h-full bg-emerald-500 w-0 group-hover:w-full transition-all duration-1000 ease-out"
                    ></div>
                </div>
                <div class="shine"></div>
            </div>

            <!-- AI Card 3: Jargon Slayer -->
            <div
                class="group relative p-8 rounded-3xl bg-[#0F1115] border border-white/5 hover:border-amber-500/30 transition-all duration-500 delay-200"
                on:mousemove={handleTilt}
                on:mouseleave={resetTilt}
                use:reveal
            >
                <div
                    class="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform"
                >
                    <FileText size={24} />
                </div>
                <div class="space-y-4">
                    <h3 class="text-2xl font-bold text-white">
                        {$mt.jargonTitle}
                    </h3>
                    <p class="text-slate-400 leading-relaxed">
                        {$mt.jargonDesc}
                    </p>
                </div>
                <div class="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                        class="h-full bg-amber-500 w-0 group-hover:w-full transition-all duration-1000 ease-out"
                    ></div>
                </div>
                <div class="shine"></div>
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
    /* Reveal Animation Text */
    .reveal-text {
        opacity: 0;
        filter: blur(10px);
        transform: translateY(20px);
        transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
    }

    :global(.in-view) .reveal-text {
        opacity: 1;
        filter: blur(0);
        transform: translateY(0);
    }
    :global(.in-view) .delay-200 {
        transition-delay: 0.2s;
    }

    /* Holographic Card Logic */
    .perspective-container {
        perspective: 1000px;
    }
    .holo-card {
        transform-style: preserve-3d;
        transform: perspective(1000px) rotateX(var(--rx, 0deg))
            rotateY(var(--ry, 0deg));
    }
    .shine {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(
            circle at var(--mx, 50%) var(--my, 50%),
            rgba(255, 255, 255, 0.1) 0%,
            transparent 50%
        );
        pointer-events: none;
        z-index: 30;
    }
    .shadow-glow {
        box-shadow: 0 0 20px -5px rgba(245, 158, 11, 0.3);
    }
</style>
