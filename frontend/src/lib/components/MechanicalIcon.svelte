<script lang="ts">
    import { cn } from "$lib/utils";

    export let urgency: "normal" | "urgent" = "normal";
    export let className: string | undefined = undefined;
    export { className as class };
</script>

<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={cn(
        "size-6 text-foreground/80 group-hover:text-primary transition-colors duration-300",
        className,
        urgency === "urgent" ? "animate-tick" : "",
    )}
    {...$$restProps}
>
    <g
        class="origin-center transition-transform duration-1000 ease-in-out group-hover:rotate-180"
    >
        <slot />
    </g>

    <!-- Decorative "Jewel" Bearing -->
    <circle cx="12" cy="12" r="1" class="fill-destructive/20 stroke-none" />
</svg>

<style>
    @keyframes tick {
        0%,
        100% {
            transform: rotate(0deg);
        }
        25% {
            transform: rotate(-5deg);
        }
        75% {
            transform: rotate(5deg);
        }
    }
    .animate-tick {
        animation: tick 0.5s infinite;
    }
</style>
