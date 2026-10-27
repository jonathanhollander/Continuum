<script lang="ts">
    import { page } from "$app/stores";
    import { culturalTraditions } from "$lib/data/culturalTraditions";
    import { FUNERAL_TRADITIONS } from "$lib/data/funeralTraditions";
    import { ArrowLeft, CircleCheck } from "lucide-svelte";
    import { fade } from "svelte/transition";

    type Guide = {
        title: string;
        description: string;
        icon: string;
        sections: { title: string; content: string[]; checklist?: string[] }[];
    };

    // The long guide where one is written; otherwise a short one built from the
    // same tradition data the Final Wishes wizard uses, so every wizard choice opens here.
    function guideFor(type: string): Guide | undefined {
        const long = (culturalTraditions as Record<string, Guide>)[type];
        if (long) return long;
        const t = FUNERAL_TRADITIONS[type];
        if (!t) return undefined;
        return {
            title: `${t.name} Traditions`,
            description: type === "other"
                ? "Plan the personal traditions, gathering, and people you want involved."
                : `Questions to discuss with your chosen ${t.terminology.officiant} or funeral provider.`,
            icon: "🕊️",
            sections: [
                {
                    title: "The traditions that matter to you",
                    content: [`Which of these would you like included in your ${t.terminology.service}? Note any family customs, readings, music, or gatherings you want to discuss.`],
                    checklist: t.commonRituals,
                },
                {
                    title: "People and practical arrangements",
                    content: [
                        `Who would you like to lead the ${t.terminology.service}, and how can your family contact them? Ask that person and your chosen funeral provider about timing and preparation${t.terminology.bodyPreparation !== "Preparation" ? ` (${t.terminology.bodyPreparation})` : ""}.`,
                        "Where are any existing arrangements or prepaid-plan details kept? Record the names and locations your family will need.",
                    ],
                },
                {
                    title: "Record your own choices",
                    content: [
                        "Which details matter most to you, and which would you like your family to choose? Return to Final Wishes to record your preferences for the venue, person leading, atmosphere, music, and costs.",
                    ],
                },
            ],
        };
    }

    let tradition = $derived(guideFor($page.params.type ?? ""));
</script>

<div class="max-w-4xl mx-auto p-8 min-h-screen">
    <a
        href="/modules/funeral"
        class="inline-flex items-center gap-2 text-muted-foreground hover:text-primary-deep dark:hover:text-primary-hover mb-8 font-bold transition-colors"
    >
        <ArrowLeft size={20} /> Back to Final Wishes
    </a>

    {#if tradition}
        <div
            in:fade
            class="bg-card rounded-2xl p-10 shadow-sm border border-border"
        >
            <!-- Header -->
            <div class="text-center mb-12 border-b border-border pb-10">
                <div class="text-6xl mb-6">{tradition.icon}</div>
                <h1 class="font-serif text-5xl text-primary-deep dark:text-primary-hover mb-4">
                    {tradition.title}
                </h1>
                <p
                    class="text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed"
                >
                    {tradition.description}
                </p>
            </div>

            <!-- Sections -->
            <p class="mb-8 text-sm text-muted-foreground leading-relaxed">Use this guide to prepare questions for the people helping you. Discuss the customs that matter to you with your chosen community contact or funeral provider, then record your own choices in Final Wishes.</p>
            <div class="space-y-12">
                {#each tradition.sections as section}
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div class="md:col-span-1">
                            <h2
                                class="text-2xl font-bold text-primary-deep dark:text-primary-hover mb-4 sticky top-8"
                            >
                                {section.title}
                            </h2>
                        </div>
                        <div class="md:col-span-2 space-y-6">
                            {#each section.content as paragraph}
                                <p
                                    class="text-lg text-foreground leading-relaxed font-serif"
                                >
                                    {paragraph}
                                </p>
                            {/each}

                            {#if section.checklist}
                                <div
                                    class="bg-muted rounded-xl p-6 mt-6 border border-border"
                                >
                                    <h4
                                        class="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-4"
                                    >
                                        Things to consider
                                    </h4>
                                    <ul class="space-y-3">
                                        {#each section.checklist as item}
                                            <li class="flex items-start gap-4">
                                                <CircleCheck
                                                    class="text-primary shrink-0 mt-0.5"
                                                    size={20}
                                                />
                                                <span
                                                    class="text-foreground font-medium"
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
                        <hr class="border-border" />
                    {/if}
                {/each}
            </div>
        </div>
    {:else}
        <div class="text-center py-20 space-y-6">
            <h2 class="text-2xl font-bold text-primary-deep dark:text-primary-hover">
                Choose a tradition to see its details
            </h2>
            <div class="flex flex-wrap justify-center gap-3">
                {#each Object.values(FUNERAL_TRADITIONS) as t}
                    <a
                        href="/modules/funeral/traditions/{t.key}"
                        class="px-4 py-2 rounded-xl border border-border bg-card text-foreground font-bold text-sm hover:border-primary transition-colors"
                        >{t.name}</a
                    >
                {/each}
            </div>
        </div>
    {/if}
</div>
