<script context="module" lang="ts">
    let tooltipCount = 0;
</script>

<script lang="ts">
    import { onDestroy } from "svelte";
    import { fade } from "svelte/transition";
    import { cn } from "$lib/utils";
    import { portal } from "$lib/actions/portal";

    export let content: string;
    export let position: "top" | "bottom" | "left" | "right" = "right";
    export let delay: number = 200;

    let isVisible = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    let parentNode: HTMLElement;
    let tooltipNode: HTMLElement;
    let coords = { x: 0, y: 0 };
    const tooltipId = `tooltip-${++tooltipCount}`;

    // The slotted element (e.g. a nav link) is the trigger; link it to the bubble while shown.
    $: trigger = parentNode?.firstElementChild as HTMLElement | null | undefined;
    $: if (trigger) {
        if (isVisible && content) trigger.setAttribute("aria-describedby", tooltipId);
        else trigger.removeAttribute("aria-describedby");
    }

    onDestroy(() => {
        clearTimeout(timeoutId);
        trigger?.removeAttribute("aria-describedby");
    });

    function handleMouseEnter(event: MouseEvent) {
        parentNode = event.currentTarget as HTMLElement;
        timeoutId = setTimeout(() => {
            calculatePosition();
            isVisible = true;
        }, delay);
    }

    function handleMouseLeave() {
        clearTimeout(timeoutId);
        isVisible = false;
    }

    function calculatePosition() {
        if (!parentNode) return;
        const rect = parentNode.getBoundingClientRect();
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        // Default gap
        const gap = 8;

        switch (position) {
            case "top":
                coords = {
                    x: rect.left + rect.width / 2 + scrollX,
                    y: rect.top - gap + scrollY,
                };
                break;
            case "bottom":
                coords = {
                    x: rect.left + rect.width / 2 + scrollX,
                    y: rect.bottom + gap + scrollY,
                };
                break;
            case "left":
                coords = {
                    x: rect.left - gap + scrollX,
                    y: rect.top + rect.height / 2 + scrollY,
                };
                break;
            case "right":
                coords = {
                    x: rect.right + gap + scrollX,
                    y: rect.top + rect.height / 2 + scrollY,
                };
                break;
        }
    }

    // Styles for the tooltip based on position
    function getStyles(pos: string, x: number, y: number) {
        let transform = "";
        switch (pos) {
            case "top":
                transform = "translate(-50%, -100%)";
                break;
            case "bottom":
                transform = "translate(-50%, 0)";
                break;
            case "left":
                transform = "translate(-100%, -50%)";
                break;
            case "right":
                transform = "translate(0, -50%)";
                break;
        }
        return `top: ${y}px; left: ${x}px; transform: ${transform};`;
    }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
    class="relative block"
    on:mouseenter={handleMouseEnter}
    on:mouseleave={handleMouseLeave}
>
    <slot />
</div>

{#if isVisible && content}
    <div
        use:portal
        id={tooltipId}
        role="tooltip"
        in:fade={{ duration: 200 }}
        out:fade={{ duration: 150 }}
        class={cn(
            "fixed z-[9999] w-64 p-3 text-xs leading-relaxed text-slate-200 pointer-events-none",
            "bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl",
            "after:absolute after:inset-0 after:rounded-xl after:ring-1 after:ring-inset after:ring-white/10",
        )}
        style={getStyles(position, coords.x, coords.y)}
    >
        <div class="relative z-10 font-medium">
            {content}
        </div>

        <!-- Holographic shine effect -->
        <div
            class="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/5 to-transparent opacity-50"
        ></div>
    </div>
{/if}
