<script lang="ts">
    import { slide, fly } from "svelte/transition";
    import { ChevronDown } from "lucide-svelte";

    // Optional page guidance (card E3, CU-019): one collapsed "Why this matters"
    // disclosure holding the description and the reason, so the form comes first.
    export let detailedDescription: string | undefined = undefined;
    export let whyMatters: string | undefined = undefined;

    let open = false;
    const bodyId = `guidance-${Math.random().toString(36).slice(2, 9)}`;
</script>

{#if detailedDescription || whyMatters}
    <div in:fly={{ y: 20, duration: 800, delay: 100 }}>
        <div
            class="bg-primary/5 rounded-xl border border-primary/10 overflow-hidden backdrop-blur-sm"
        >
            <button
                type="button"
                data-testid="guidance-toggle"
                aria-expanded={open}
                aria-controls={bodyId}
                class="w-full px-6 py-3 flex items-center justify-between text-sm font-medium text-primary-hover hover:bg-primary/5 transition-colors text-left"
                on:click={() => (open = !open)}
            >
                <span class="uppercase tracking-widest text-xs"
                    >Why this matters</span
                >
                <span
                    class="transform transition-transform duration-300"
                    class:rotate-180={open}
                >
                    <ChevronDown size={16} />
                </span>
            </button>

            {#if open}
                <div
                    id={bodyId}
                    data-testid="guidance-body"
                    transition:slide
                    class="px-6 pb-5 pt-3 space-y-3 text-muted-foreground leading-relaxed border-t border-primary/10"
                >
                    {#if detailedDescription}
                        <p>{@html detailedDescription}</p>
                    {/if}
                    {#if whyMatters}
                        <p>{@html whyMatters}</p>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
{/if}
