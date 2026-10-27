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

    // The bubble is placed once on open; hide it if anything scrolls while it shows.
    // Capture phase so scrolls inside nested containers count too.
    $: if (typeof window !== "undefined") {
        if (isVisible) window.addEventListener("scroll", handleMouseLeave, { capture: true, passive: true });
        else window.removeEventListener("scroll", handleMouseLeave, { capture: true });
    }

    onDestroy(() => {
        clearTimeout(timeoutId);
        trigger?.removeAttribute("aria-describedby");
        if (typeof window !== "undefined") window.removeEventListener("scroll", handleMouseLeave, { capture: true });
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

    function handleFocusIn(event: FocusEvent) {
        parentNode = event.currentTarget as HTMLElement;
        clearTimeout(timeoutId);
        calculatePosition();
        isVisible = true;
    }

    function handleFocusOut() {
        handleMouseLeave();
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Escape" && isVisible) {
            handleMouseLeave();
        }
    }

    function calculatePosition() {
        if (!parentNode) return;
        // The bubble is position: fixed, so viewport coordinates are used as-is.
        const rect = parentNode.getBoundingClientRect();

        // Default gap
        const gap = 8;

        switch (position) {
            case "top":
                coords = {
                    x: rect.left + rect.width / 2,
                    y: rect.top - gap,
                };
                break;
            case "bottom":
                coords = {
                    x: rect.left + rect.width / 2,
                    y: rect.bottom + gap,
                };
                break;
            case "left":
                coords = {
                    x: rect.left - gap,
                    y: rect.top + rect.height / 2,
                };
                break;
            case "right":
                coords = {
                    x: rect.right + gap,
                    y: rect.top + rect.height / 2,
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
    on:focusin={handleFocusIn}
    on:focusout={handleFocusOut}
    on:keydown={handleKeydown}
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
