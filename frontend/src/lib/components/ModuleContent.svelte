<script lang="ts">
    import { onMount } from "svelte";
    import {
        CircleCheck,
        Circle,
        FileText,
        ArrowRight,
        BookOpen,
        CircleAlert,
    } from "lucide-svelte";
    import { fly } from "svelte/transition";

    export let module: any;

    let mounted = false;
    let completedSteps: Record<string, boolean> = {};

    // Generate simulated steps based on the module context
    // In a real app, these would come from the database/YAML
    $: steps = [
        `Review ${module.title} requirements`,
        `Gather necessary documents for ${module.role}`,
        `Verify information accuracy`,
        `Confirm details with key stakeholders`,
        `Finalize and archive record`,
    ];

    onMount(() => {
        mounted = true;
        // Load state from local storage
        const saved = localStorage.getItem(`continuum_module_${module.id}`);
        if (saved) {
            completedSteps = JSON.parse(saved);
        }
    });

    function toggleStep(stepIndex: number) {
        completedSteps[stepIndex] = !completedSteps[stepIndex];
        // Persist to local storage
        localStorage.setItem(
            `continuum_module_${module.id}`,
            JSON.stringify(completedSteps),
        );
    }

    $: progress = Math.round(
        (Object.values(completedSteps).filter(Boolean).length / steps.length) *
            100,
    );
</script>

<div class="space-y-12 animate-in fade-in duration-500">
    <!-- Automated Context Analysis -->
    <section class="grid md:grid-cols-3 gap-8">
        <div class="md:col-span-2 space-y-6">
            <div
                class="bg-card border border-border rounded-xl p-8 shadow-sm relative overflow-hidden group"
            >
                <div
                    class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"
                >
                    <FileText size={120} />
                </div>

                <h3 class="text-xl font-serif mb-4 flex items-center gap-2">
                    <BookOpen class="text-primary size-5" />
                    Module Overview
                </h3>

                {#if module.description && module.description.length > 50}
                    <div
                        class="p-6 bg-muted/30 rounded-lg border border-border/50 text-foreground whitespace-pre-wrap font-serif leading-relaxed shadow-inner"
                    >
                        {module.description}
                    </div>
                {:else}
                    <p class="text-muted-foreground leading-relaxed text-lg">
                        {module.description ||
                            `This module is a critical component of the ${module.role} workflow.`}
                    </p>
                    <p class="text-muted-foreground mt-2">
                        It is designed to help you organize and secure relevant
                        information regarding <em>{module.title}</em>. Proper
                        completion of this section ensures that your estate
                        planning remains comprehensive and accessible when
                        needed.
                    </p>
                {/if}
                <div
                    class="mt-6 flex items-center gap-4 text-sm text-muted-foreground/80"
                >
                    <span
                        class="flex items-center gap-1.5 bg-secondary/30 px-3 py-1 rounded-full"
                    >
                        <CircleAlert size={14} />
                        Priority Level: High
                    </span>
                    <span
                        class="flex items-center gap-1.5 bg-secondary/30 px-3 py-1 rounded-full"
                    >
                        Estimated Time: 15-30 mins
                    </span>
                </div>
            </div>

            <!-- Action Items -->
            <div class="space-y-4">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-lg font-serif">Action Items</h3>
                    <span class="text-sm font-mono text-primary"
                        >{progress}% Complete</span
                    >
                </div>

                <!-- Progress Bar -->
                <div
                    class="h-2 w-full bg-secondary/20 rounded-full overflow-hidden mb-6"
                >
                    <div
                        class="h-full bg-primary transition-all duration-500 ease-out"
                        style="width: {progress}%"
                    ></div>
                </div>

                <div class="grid gap-3">
                    {#each steps as step, i}
                        <button
                            class="flex items-start gap-4 p-4 rounded-lg border text-left transition-all duration-200 group
                            {completedSteps[i]
                                ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                                : 'bg-card border-border hover:border-primary/50 hover:shadow-md'}"
                            on:click={() => toggleStep(i)}
                        >
                            <div
                                class="mt-0.5 shrink-0 transition-colors duration-300 {completedSteps[
                                    i
                                ]
                                    ? 'text-primary'
                                    : 'text-muted-foreground group-hover:text-primary'}"
                            >
                                {#if completedSteps[i]}
                                    <CircleCheck
                                        size={20}
                                        class="fill-primary/10"
                                    />
                                {:else}
                                    <Circle size={20} />
                                {/if}
                            </div>
                            <div>
                                <span
                                    class="font-medium {completedSteps[i]
                                        ? 'text-foreground/60 line-through decoration-primary/30'
                                        : 'text-foreground'}"
                                >
                                    {step}
                                </span>
                            </div>
                        </button>
                    {/each}
                </div>
            </div>
        </div>

        <!-- Sidebar / Resources -->
        <div class="space-y-6">
            <section
                class="bg-secondary/5 border border-border/50 rounded-xl p-6"
            >
                <h3
                    class="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4"
                >
                    Quick Resources
                </h3>
                <ul class="space-y-3">
                    <li>
                        <a
                            href="#"
                            class="flex items-center justify-between group p-2 hover:bg-background rounded transition-colors text-sm"
                        >
                            <span
                                class="group-hover:text-primary transition-colors"
                                >Download Template PDF</span
                            >
                            <ArrowRight
                                size={14}
                                class="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-primary"
                            />
                        </a>
                    </li>
                    <li>
                        <a
                            href="#"
                            class="flex items-center justify-between group p-2 hover:bg-background rounded transition-colors text-sm"
                        >
                            <span
                                class="group-hover:text-primary transition-colors"
                                >Digital Vault Instructions</span
                            >
                            <ArrowRight
                                size={14}
                                class="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-primary"
                            />
                        </a>
                    </li>
                    <li>
                        <a
                            href="#"
                            class="flex items-center justify-between group p-2 hover:bg-background rounded transition-colors text-sm"
                        >
                            <span
                                class="group-hover:text-primary transition-colors"
                                >Legal Review Checklist</span
                            >
                            <ArrowRight
                                size={14}
                                class="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-primary"
                            />
                        </a>
                    </li>
                </ul>
            </section>

            <section
                class="bg-primary/5 border border-primary/10 rounded-xl p-6"
            >
                <h3 class="font-bold text-sm text-primary mb-2">Need Help?</h3>
                <p class="text-xs text-muted-foreground mb-4">
                    If you're unsure about this specific module, consult the
                    master guide or contact your estate attorney based on the
                    "Legal Documents" section.
                </p>
            </section>
        </div>
    </section>
</div>
