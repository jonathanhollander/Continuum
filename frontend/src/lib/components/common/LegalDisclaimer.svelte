<script lang="ts">
    import { Scale, TriangleAlert, ShieldAlert } from "lucide-svelte";
    import { slide } from "svelte/transition";

    export let variant: "inline" | "banner" = "inline";
    export let title = "Legal Disclaimer";
    export let message =
        "Continuum shares this information to help you learn and organize. For legal guidance specific to your situation, a qualified attorney can help, since laws vary by jurisdiction.";
</script>

{#if variant === "banner"}
    <div
        class="w-full bg-warning-soft border-y border-warning/30 py-3 px-6 flex items-start gap-4"
        transition:slide
    >
        <div class="mt-0.5">
            <Scale size={18} class="text-warning" />
        </div>
        <div class="flex-1">
            <p class="text-foreground text-xs md:text-sm leading-relaxed">
                <strong class="text-warning font-bold block md:inline md:mr-1"
                    >{title}:</strong
                >
                {message}
            </p>
        </div>
    </div>
{:else}
    <!-- Inline / Card Variant -->
    <div
        class="rounded-xl border border-border bg-muted/50 p-4 flex gap-4 transition-colors hover:bg-muted"
    >
        <div
            class="w-10 h-10 rounded-full bg-card flex items-center justify-center shrink-0 border border-border shadow-sm"
        >
            <ShieldAlert size={18} class="text-muted-foreground" />
        </div>
        <div class="text-sm text-muted-foreground leading-relaxed">
            <h4 class="text-foreground font-bold mb-1">{title}</h4>
            {message}
        </div>
    </div>
{/if}
