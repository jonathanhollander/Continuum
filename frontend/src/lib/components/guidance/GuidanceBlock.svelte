<script lang="ts">
    import { slide, fly } from "svelte/transition";
    import { ChevronDown } from "lucide-svelte";

    export let detailedDescription: string | undefined = undefined;
    export let whyMatters: string | undefined = undefined;

    let showWhyMatters = false;
</script>

{#if detailedDescription || whyMatters}
    <div in:fly={{ y: 20, duration: 800, delay: 100 }}>
        <div
            class="bg-primary/5 rounded-xl border border-primary/10 overflow-hidden backdrop-blur-sm"
        >
            {#if detailedDescription}
                <div
                    class="px-6 py-4 text-muted-foreground/80 leading-relaxed border-b border-primary/5 last:border-0"
                >
                    {@html detailedDescription}
                </div>
            {/if}

            {#if whyMatters}
                <button
                    class="w-full px-6 py-3 flex items-center justify-between text-sm font-medium text-primary hover:bg-primary/5 transition-colors text-left"
                    on:click={() => (showWhyMatters = !showWhyMatters)}
                >
                    <span class="uppercase tracking-widest text-xs opacity-70"
                        >Why this matters</span
                    >
                    <span
                        class="transform transition-transform duration-300"
                        class:rotate-180={showWhyMatters}
                    >
                        <ChevronDown size={16} />
                    </span>
                </button>

                {#if showWhyMatters}
                    <div
                        transition:slide
                        class="px-6 pb-5 pt-1 text-muted-foreground/80 leading-relaxed bg-primary/5 border-t border-primary/10"
                    >
                        {@html whyMatters}
                    </div>
                {/if}
            {/if}
        </div>
    </div>
{/if}
