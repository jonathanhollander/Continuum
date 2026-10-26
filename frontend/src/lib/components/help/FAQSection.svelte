<script lang="ts">
    import { ChevronDown, ChevronUp, HelpCircle } from "lucide-svelte";
    import { faqs } from "$lib/data/faqs";

    let openIndex: number | null = 0; // Default first one open

    function toggle(index: number) {
        openIndex = openIndex === index ? null : index;
    }
</script>

<div class="space-y-4 max-w-3xl mx-auto">
    {#each faqs as faq, i}
        <div
            class="bg-card rounded-xl border border-border overflow-hidden transition-all duration-200 {openIndex ===
            i
                ? 'shadow-md border-primary/30'
                : 'hover:border-primary/40'}"
        >
            <button
                class="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                on:click={() => toggle(i)}
            >
                <div class="flex items-center gap-4">
                    <span
                        class="p-2 rounded-lg {openIndex === i
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'} transition-colors"
                    >
                        <HelpCircle size={20} />
                    </span>
                    <div>
                        <span
                            class="text-xs font-bold text-gold-text uppercase tracking-wider mb-1 block"
                            >{faq.category}</span
                        >
                        <h3 class="font-medium text-lg text-primary-deep dark:text-primary-hover">
                            {faq.question}
                        </h3>
                    </div>
                </div>
                {#if openIndex === i}
                    <ChevronUp size={20} class="text-primary" />
                {:else}
                    <ChevronDown size={20} class="text-muted-foreground" />
                {/if}
            </button>

            {#if openIndex === i}
                <div class="px-5 pb-5 pl-[4.5rem]">
                    <p class="text-muted-foreground leading-relaxed text-lg">
                        {faq.answer}
                    </p>
                </div>
            {/if}
        </div>
    {/each}
</div>
