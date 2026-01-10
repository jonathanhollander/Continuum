<script lang="ts">
    import { cn } from "$lib/utils";
    import { onMount } from "svelte";
    import { fade, fly } from "svelte/transition";

    export let title: string;
    export let subtitle: string | undefined = undefined;
    export let tier:
        | "preparation"
        | "executor"
        | "financial"
        | "legal"
        | "family" = "preparation";
    let className: string | undefined = undefined;
    export { className as class };

    let mounted = false;

    onMount(() => {
        mounted = true;
    });
</script>

<header
    class={cn(
        "relative overflow-hidden bg-background text-foreground border-b border-border py-24",
        "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_center,var(--color-primary)_0%,transparent_70%)] before:opacity-5",
        className,
    )}
>
    <!-- Layer 1: Technical Grid -->
    <div class="absolute inset-0 pointer-events-none text-muted-foreground/30">
        <svg class="absolute inset-0 size-full opacity-20" aria-hidden="true">
            <defs>
                <pattern
                    id="blueprint-grid"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                >
                    <path
                        d="M0 40L40 0H20L0 20M40 40V20L20 40"
                        stroke="currentColor"
                        stroke-width="0.5"
                        fill="none"
                    />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#blueprint-grid)" />
        </svg>
    </div>

    <!-- Layer 2: Architectural Drawing (Simplified "Cornerstone") -->
    <svg
        viewBox="0 0 100 100"
        class="absolute top-0 right-0 size-64 text-primary/20 pointer-events-none"
    >
        {#if mounted}
            <rect
                x="10"
                y="10"
                width="80"
                height="80"
                fill="none"
                stroke="currentColor"
                stroke-width="1"
                class="animate-draw-path"
            />
            <line
                x1="10"
                y1="10"
                x2="90"
                y2="90"
                stroke="currentColor"
                stroke-width="0.5"
                class="animate-draw-path delay-100"
            />
            <line
                x1="90"
                y1="10"
                x2="10"
                y2="90"
                stroke="currentColor"
                stroke-width="0.5"
                class="animate-draw-path delay-200"
            />
        {/if}
    </svg>

    <!-- Layer 3: Content using Heirloom Typography -->
    <div class="container relative z-10 px-6 mx-auto">
        <div class="max-w-3xl space-y-4">
            {#if mounted}
                <div in:fly={{ y: 20, duration: 800 }}>
                    <!-- Tier Indicator (Blueprint Style) -->
                    <div
                        class="font-blueprint text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4 flex items-center gap-2"
                    >
                        <span class="w-8 h-[1px] bg-border"></span>
                        {tier} Module
                    </div>

                    <!-- Main Title (Monument Serif) -->
                    <h1
                        class="font-serif text-5xl md:text-6xl font-bold tracking-tight text-primary"
                    >
                        {title}
                    </h1>

                    <!-- Subtitle (Sans/Blueprint mix) -->
                    {#if subtitle}
                        <p
                            class="font-blueprint text-xl text-muted-foreground mt-4 max-w-xl leading-relaxed"
                        >
                            {subtitle}
                        </p>
                    {/if}
                </div>
            {/if}
        </div>
    </div>

    <!-- Decorative Bottom Border (Meridian Line) -->
    <div
        class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
    ></div>
</header>

<style>
    .animate-draw-path {
        stroke-dasharray: 1;
        stroke-dashoffset: 1;
        animation: draw 1.5s ease-in-out forwards;
    }

    @keyframes draw {
        to {
            stroke-dashoffset: 0;
        }
    }

    .delay-100 {
        animation-delay: 0.1s;
    }
    .delay-200 {
        animation-delay: 0.2s;
    }
</style>
