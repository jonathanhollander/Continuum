<script lang="ts">
    import { onMount } from "svelte";
    import {
        CircleCheck,
        Circle,
        FileText,
        BookOpen,
    } from "lucide-svelte";
    import { registerProfileSlice } from "$lib/services/sync.svelte";

    export let module: any;

    // Every module's ticked steps, kept on this account's profile record (/api/estate/profile) as
    // one JSON text, so a nested module id is never case-converted on the way.
    type Ticks = Record<string, Record<string, boolean>>;
    const checklists = registerProfileSlice<{ moduleChecklists: string }>(
        "module_checklists",
        (data: any) => ({
            moduleChecklists:
                typeof data?.moduleChecklists === "string"
                    ? data.moduleChecklists
                    : "{}",
        }),
    );
    const readAll = (): Ticks => {
        try {
            const all = JSON.parse(checklists.data?.moduleChecklists || "{}");
            return all && typeof all === "object" ? all : {};
        } catch {
            return {};
        }
    };

    let completedSteps: Record<string, boolean> = {};
    let touched = false;

    // Generate simulated steps based on the module context
    // In a real app, these would come from the database/YAML
    $: steps = [
        `Review ${module.title} requirements`,
        `Gather necessary documents for ${module.role}`,
        `Take a look to see it all reads right`,
        `Confirm details with key stakeholders`,
        `Finalize and archive record`,
    ];

    const legacyKey = () => `continuum_module_${module.id}`;

    onMount(() => {
        completedSteps = readAll()[module.id] || {};
        checklists
            .sync()
            .then(async () => {
                const all = readAll();
                const server = all[module.id] || {};
                // Ticks from before the move to the account: carried over once, then cleared here.
                let legacy: Record<string, boolean> = {};
                try {
                    legacy = JSON.parse(localStorage.getItem(legacyKey()) || "{}") || {};
                } catch {
                    legacy = {};
                }
                const merged = { ...legacy, ...server };
                if (Object.keys(legacy).length > 0) {
                    all[module.id] = merged;
                    await checklists.update({ moduleChecklists: JSON.stringify(all) });
                }
                localStorage.removeItem(legacyKey());
                if (!touched) completedSteps = merged;
            })
            .catch(() => {});
    });

    async function toggleStep(stepIndex: number) {
        touched = true;
        completedSteps[stepIndex] = !completedSteps[stepIndex];
        completedSteps = completedSteps;
        const all = readAll();
        all[module.id] = { ...completedSteps };
        try {
            await checklists.update({ moduleChecklists: JSON.stringify(all) });
        } catch {
            // The store has already shown its gentle retry message; the tick stays on screen.
        }
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
                            `This section is part of your ${module.role} journey.`}
                    </p>
                    <p class="text-muted-foreground mt-2">
                        This is a place to gather what matters about
                        <em>{module.title}</em>, so it's easy for others to
                        find.
                    </p>
                {/if}
                <div
                    class="mt-6 flex items-center gap-4 text-sm text-muted-foreground/80"
                >
                    <span
                        class="flex items-center gap-1.5 bg-secondary/30 px-3 py-1 rounded-full"
                    >
                        A short while, at your pace
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
                class="bg-primary/5 border border-primary/10 rounded-xl p-6"
            >
                <h3 class="font-bold text-sm text-primary mb-2">Need Help?</h3>
                <p class="text-xs text-muted-foreground mb-4">
                    Whenever you'd like more guidance, your estate attorney is
                    a good place to start.
                </p>
            </section>
        </div>
    </section>
</div>
