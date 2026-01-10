<script lang="ts">
    import { page } from "$app/stores";
    import { culturalTraditions } from "$lib/data/culturalTraditions";
    import { ArrowLeft, CircleCheck } from "lucide-svelte";
    import { fade } from "svelte/transition";

    $: type = $page.params.type as keyof typeof culturalTraditions;
    $: tradition = culturalTraditions[type];
</script>

<div class="max-w-4xl mx-auto p-8 min-h-screen">
    <a
        href="/modules/funeral"
        class="inline-flex items-center gap-2 text-stone-500 hover:text-[#304743] mb-8 font-bold transition-colors"
    >
        <ArrowLeft size={20} /> Back to Funeral Planner
    </a>

    {#if tradition}
        <div
            in:fade
            class="bg-white rounded-3xl p-10 shadow-sm border border-stone-100"
        >
            <!-- Header -->
            <div class="text-center mb-12 border-b border-stone-100 pb-10">
                <div class="text-6xl mb-6">{tradition.icon}</div>
                <h1 class="font-serif text-5xl text-[#304743] mb-4">
                    {tradition.title}
                </h1>
                <p
                    class="text-xl text-stone-500 max-w-2xl mx-auto font-light leading-relaxed"
                >
                    {tradition.description}
                </p>
            </div>

            <!-- Sections -->
            <div class="space-y-12">
                {#each tradition.sections as section}
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div class="md:col-span-1">
                            <h2
                                class="text-2xl font-bold text-[#304743] mb-4 sticky top-8"
                            >
                                {section.title}
                            </h2>
                        </div>
                        <div class="md:col-span-2 space-y-6">
                            {#each section.content as paragraph}
                                <p
                                    class="text-lg text-stone-700 leading-relaxed font-serif"
                                >
                                    {paragraph}
                                </p>
                            {/each}

                            {#if section.checklist}
                                <div
                                    class="bg-[#F9FAFB] rounded-xl p-6 mt-6 border border-stone-200"
                                >
                                    <h4
                                        class="font-bold text-sm text-stone-400 uppercase tracking-wider mb-4"
                                    >
                                        Checklist Items
                                    </h4>
                                    <ul class="space-y-3">
                                        {#each section.checklist as item}
                                            <li class="flex items-start gap-4">
                                                <CircleCheck
                                                    class="text-[#4A7C74] shrink-0 mt-0.5"
                                                    size={20}
                                                />
                                                <span
                                                    class="text-stone-800 font-medium"
                                                    >{item}</span
                                                >
                                            </li>
                                        {/each}
                                    </ul>
                                </div>
                            {/if}
                        </div>
                    </div>
                    {#if section !== tradition.sections[tradition.sections.length - 1]}
                        <hr class="border-stone-100" />
                    {/if}
                {/each}
            </div>
        </div>
    {:else}
        <div class="text-center py-20">
            <h2 class="text-2xl font-bold text-gray-300">
                Tradition not found
            </h2>
        </div>
    {/if}
</div>
