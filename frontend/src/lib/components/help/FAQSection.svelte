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
            class="bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-200 {openIndex ===
            i
                ? 'shadow-md border-[#4A7C74]/30'
                : 'hover:border-gray-300'}"
        >
            <button
                class="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                on:click={() => toggle(i)}
            >
                <div class="flex items-center gap-4">
                    <span
                        class="p-2 rounded-lg {openIndex === i
                            ? 'bg-[#4A7C74] text-white'
                            : 'bg-gray-100 text-gray-500'} transition-colors"
                    >
                        <HelpCircle size={20} />
                    </span>
                    <div>
                        <span
                            class="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-1 block"
                            >{faq.category}</span
                        >
                        <h3 class="font-medium text-lg text-[#304743]">
                            {faq.question}
                        </h3>
                    </div>
                </div>
                {#if openIndex === i}
                    <ChevronUp size={20} class="text-[#4A7C74]" />
                {:else}
                    <ChevronDown size={20} class="text-gray-400" />
                {/if}
            </button>

            {#if openIndex === i}
                <div class="px-5 pb-5 pl-[4.5rem]">
                    <p class="text-gray-600 leading-relaxed text-lg">
                        {faq.answer}
                    </p>
                </div>
            {/if}
        </div>
    {/each}
</div>
