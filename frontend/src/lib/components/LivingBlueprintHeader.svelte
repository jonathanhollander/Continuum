<script lang="ts">
    import { cn } from "$lib/utils";
    import { onMount } from "svelte";
    import { fly } from "svelte/transition";
    import GuidanceBlock from "$lib/components/guidance/GuidanceBlock.svelte";

    import type { Snippet } from "svelte";

    let {
        title,
        subtitle = undefined,
        detailedDescription = undefined,
        whyMatters = undefined,
        class: className = undefined,
        children,
    }: {
        title: string;
        subtitle?: string;
        detailedDescription?: string;
        whyMatters?: string;
        class?: string;
        children?: Snippet;
    } = $props();

    let mounted = $state(false);
    let headerEl: HTMLElement;
    // Inside a padded page wrapper the header already sits on the body's left
    // edge, so its content takes no inset of its own; full-width it takes the
    // same 32px inset as the module page bodies (p-8).
    let nested = $state(false);

    onMount(() => {
        const host = headerEl.closest("main") ?? document.body;
        nested =
            headerEl.getBoundingClientRect().left -
                host.getBoundingClientRect().left >
            1;
        mounted = true;
    });
</script>

<header
    bind:this={headerEl}
    class={cn(
        "relative overflow-hidden bg-background text-foreground border-b border-border py-12",
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

    <!-- Layer 3: Content using Heirloom Typography -->
    <div class={cn("container relative z-10 mx-auto", nested ? "px-0" : "px-8")}>
        <div class="max-w-3xl space-y-4">
            {#if mounted}
                <div in:fly={{ y: 20, duration: 800 }}>
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

            {#if mounted}
                <GuidanceBlock {detailedDescription} {whyMatters} />

                <!-- Action Slot -->
                <div class="pt-4" in:fly={{ y: 20, duration: 800, delay: 200 }}>
                    {@render children?.()}
                </div>
            {/if}
        </div>
    </div>

    <!-- Decorative Bottom Border (Meridian Line) -->
    <div
        class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
    ></div>
</header>

