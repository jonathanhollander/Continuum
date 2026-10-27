<script lang="ts">
    import { onMount } from "svelte";
    import {
        CircleCheck,
        Circle,
        FileText,
        BookOpen,
        ArrowRight,
    } from "lucide-svelte";
    import { registerProfileSlice } from "$lib/services/sync.svelte";
    import { captureSession, isCurrentSession, type SessionOwnership } from "$lib/services/sessionOwnership";

    export let module: any;
    // The route keys this component by ID; asynchronous work keeps that mounted identity.
    const moduleId: string = module.id;

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
            return all && typeof all === "object" && !Array.isArray(all) ? all : {};
        } catch {
            return {};
        }
    };

    let completedSteps: Record<string, boolean> = {};
    let touched = false;
    let active = false;
    let canEdit = false;
    let editSession: SessionOwnership | null = null;

    // Each step opens the module where that part of the plan lives. A tick is kept by the
    // step's page, so the list can change order without moving anyone's ticks.
    type Step = { label: string; href: string };
    const STEPS: Record<string, Step[]> = {
        owner: [
            { label: "Record people and how to reach them", href: "/modules/contacts" },
            { label: "Record documents and where originals are kept", href: "/modules/legal-documents" },
            { label: "Explain accounts, ownership and contacts", href: "/modules/financial-accounts" },
            { label: "Write funeral and memorial wishes", href: "/modules/funeral" },
            { label: "Write a letter and choose its recipient", href: "/modules/letters" },
        ],
        executor: [
            { label: "Review the executor guide and next steps", href: "/modules/executor-toolkit" },
            { label: "Find documents and their originals", href: "/modules/legal-documents" },
            { label: "Review recurring services and billing notes", href: "/modules/subscriptions" },
            { label: "Find people to contact", href: "/modules/contacts" },
            { label: "Read funeral wishes and arrangements", href: "/modules/funeral" },
        ],
    };
    $: steps = STEPS[module.role] || STEPS.owner;

    const legacyKey = `continuum_module_${moduleId}`;

    onMount(() => {
        active = true;
        const owner = captureSession();
        // A shared read may finish after authentication or after another hub was visited.
        const unsubscribe = checklists.subscribe(() => {
            if (editSession && !isCurrentSession(editSession)) {
                touched = false;
                editSession = null;
            }
            if (active && !touched) completedSteps = { ...(readAll()[moduleId] || {}) };
            // applyRemote notifies subscribers before setting its final status.
            queueMicrotask(() => { if (active) canEdit = checklists.status === "synced"; });
        });
        checklists
            .sync()
            .then(async () => {
                if (!active || !isCurrentSession(owner)) return;
                const all = readAll();
                const server = all[moduleId] || {};
                // Ticks from before the move to the account: carried over once, then cleared here.
                let legacy: Record<string, boolean> = {};
                try {
                    legacy = JSON.parse(localStorage.getItem(legacyKey) || "{}") || {};
                } catch {
                    legacy = {};
                }
                const merged = { ...legacy, ...server };
                if (Object.keys(legacy).length > 0) {
                    all[moduleId] = merged;
                    await checklists.update({ moduleChecklists: JSON.stringify(all) });
                }
                if (!isCurrentSession(owner)) return;
                localStorage.removeItem(legacyKey);
                if (active && !touched) completedSteps = merged;
            })
            .catch(() => {});
        return () => {
            active = false;
            unsubscribe();
        };
    });

    async function toggleStep(key: string) {
        const owner = captureSession();
        // Wait for the complete shared map before replacing this hub's JSON entry.
        if (!active || checklists.status !== "synced" || !isCurrentSession(owner)) return;
        canEdit = false;
        touched = true;
        editSession = owner;
        completedSteps = { ...completedSteps, [key]: !completedSteps[key] };
        const all = readAll();
        all[moduleId] = { ...completedSteps };
        try {
            await checklists.update({ moduleChecklists: JSON.stringify(all) });
            if (!active || !isCurrentSession(owner)) return;
            touched = false;
            completedSteps = { ...(readAll()[moduleId] || {}) };
        } catch {
            // The store has already shown its gentle retry message; the tick stays on screen.
        }
    }

    $: progress = Math.round(
        (steps.filter((s) => completedSteps[s.href]).length / steps.length) *
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
                <div class="mb-4 flex items-center justify-between gap-4">
                    <h3 class="text-xl font-serif flex items-center gap-2">
                        <BookOpen class="text-primary size-5" />
                        How to use this checklist
                    </h3>
                    <div
                        aria-hidden="true"
                        class="shrink-0 opacity-10 group-hover:opacity-20 transition-opacity"
                    >
                        <FileText size={40} />
                    </div>
                </div>

                <p class="text-muted-foreground leading-relaxed text-lg">
                    Use this checklist to review the related records for {module.title}.
                    Open a page, add or revise the details you know, then tick the check yourself.
                </p>
                <div
                    class="mt-6 flex items-center gap-4 text-sm text-muted-foreground"
                >
                    <span
                        class="flex items-center gap-1.5 bg-muted border border-border px-3 py-1 rounded-full"
                    >
                        Review one section at a time
                    </span>
                </div>
            </div>

            <!-- Your review checks -->
            <div class="space-y-4">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-lg font-serif">Your review checks</h3>
                    <span class="text-sm font-mono text-primary"
                        >{progress}% checked</span
                    >
                </div>

                <p class="text-sm text-muted-foreground">These are manual review checks. They count what you have ticked, not whether your estate arrangements are complete.</p>

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
                    {#each steps as step (step.href)}
                        {@const done = !!completedSteps[step.href]}
                        <div
                            data-hub-step
                            class="flex items-center gap-2 rounded-lg border transition-all duration-200
                            {done
                                ? 'bg-primary/5 border-primary/20'
                                : 'bg-card border-border hover:border-primary/50 hover:shadow-md'}"
                        >
                            <button
                                type="button"
                                aria-pressed={done}
                                disabled={!canEdit}
                                class="flex flex-1 items-start gap-4 p-4 text-left group"
                                on:click={() => toggleStep(step.href)}
                            >
                                <div
                                    class="mt-0.5 shrink-0 transition-colors duration-300 {done
                                        ? 'text-primary'
                                        : 'text-muted-foreground group-hover:text-primary'}"
                                >
                                    {#if done}
                                        <CircleCheck
                                            size={20}
                                            class="fill-primary/10"
                                        />
                                    {:else}
                                        <Circle size={20} />
                                    {/if}
                                </div>
                                <span
                                    class="font-medium {done
                                        ? 'text-foreground/60 line-through decoration-primary/30'
                                        : 'text-foreground'}"
                                >
                                    {step.label}
                                </span>
                            </button>
                            <a
                                href={step.href}
                                aria-label="Open {step.label}"
                                class="mr-2 shrink-0 flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-primary-hover hover:bg-primary/10 transition-colors"
                            >
                                Open
                                <ArrowRight size={16} aria-hidden="true" />
                            </a>
                        </div>
                    {/each}
                </div>
            </div>
        </div>

        <!-- Sidebar / Resources -->
        <div class="space-y-6">
            <section
                class="bg-primary/5 border border-primary/10 rounded-xl p-6"
            >
                <h3 class="font-bold text-sm text-primary-hover mb-2">Continue in the related page</h3>
                <p class="text-xs text-muted-foreground mb-4">
                    Each Open link takes you to the page where those records live.
                    Start with the details you know and return when you have more to add.
                </p>
            </section>
        </div>
    </section>
</div>
