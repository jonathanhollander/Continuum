<script lang="ts">
    import { slide, fade } from "svelte/transition";
    import {
        SquareCheck,
        ArrowLeft,
        Clock,
        Building2,
        DollarSign,
        Mail,
        Briefcase,
        ChevronRight,
        TriangleAlert,
        Leaf,
        FolderOpen,
        NotebookPen,
    } from "lucide-svelte";
    import { onMount } from "svelte";
    import GriefSupportBanner from "$lib/components/GriefSupportBanner.svelte";
    import ExecutorTaskDetail from "$lib/components/executor/ExecutorTaskDetail.svelte";
    import { executorTasks } from "$lib/data/executorTasks";
    import { currentScenario } from "$lib/stores/scenarioStore.svelte";
    import {
        executorSteps,
        STEP_RECORDS,
    } from "$lib/stores/executorStepsStore.svelte";

    let activeTab = $state("checklist");
    let selectedTask = $state<any>(null);

    // Ticks and notes live on the server (executor_steps), so they follow the account.
    onMount(() => {
        executorSteps.sync();
    });

    function toggleCompletion(id: string) {
        executorSteps.toggle(id).catch(() => {});
    }

    let noteDraft = $state("");
    let noteSaved = $state(false);

    function openTask(task: any) {
        selectedTask = task;
        noteDraft = executorSteps.noteFor(task.id);
        noteSaved = false;
    }

    async function saveNote() {
        if (!selectedTask) return;
        const id = selectedTask.id;
        if (noteDraft === executorSteps.noteFor(id)) {
            noteSaved = true;
            return;
        }
        try {
            await executorSteps.saveNote(id, noteDraft);
            if (selectedTask?.id === id) noteSaved = true;
        } catch {
            // The store shows a gentle message; the draft stays in the box.
        }
    }

    const GOV_PHASES = new Set(["Legal", "Government"]);
    // Phases in lib/data/tasks: Immediate, Legal, Government, Financial, Administrative, Digital, Assets, Closing, Expert
    const SUDDEN_PHASES = new Set(["Immediate", ...GOV_PHASES]);

    // Reactive filtering based on Scenario Mode
    let filteredTasks = $derived(
        [...executorTasks]
            .filter((task) =>
                activeTab === "bureau" ? GOV_PHASES.has(task.phase) : true,
            )
            .filter((task) => {
                if ($currentScenario === "Sudden") {
                    // Sudden passing: the first days and the legal/government steps, plus anything urgent
                    return SUDDEN_PHASES.has(task.phase) || task.urgent;
                }
                if ($currentScenario === "Planned") {
                    // In Planned, show administrative and asset tasks
                    return task.phase !== "Expert";
                }
                return true; // General shows all
            })
            .sort((a, b) => {
                if ($currentScenario === "Sudden") {
                    // Sort Urgent first for Sudden Passing
                    return (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0);
                }
                return 0; // Default chronological
            }),
    );
</script>

<div class="max-w-6xl mx-auto p-6 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="mb-10 text-left">
        <div
            class="inline-flex items-center justify-center p-4 bg-slate-100 text-slate-700 rounded-full mb-6"
        >
            <Briefcase size={40} />
        </div>
        <h1 class="font-serif font-bold text-4xl text-[#304743] mb-4">
            Executor Guide
        </h1>

        {#if $currentScenario === "Sudden"}
            <div
                in:slide
                class="mt-4 mx-auto max-w-2xl bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 text-left"
            >
                <TriangleAlert class="text-red-500 shrink-0 mt-1" size={20} />
                <div>
                    <h3 class="font-bold text-red-800">
                        Sudden Passing Mode Active
                    </h3>
                    <p class="text-sm text-red-600">
                        Tasks are reorganized to prioritize immediate
                        stabilization and legal security. Focus on the "Urgent"
                        items first.
                    </p>
                </div>
            </div>
        {:else if $currentScenario === "Planned"}
            <div
                in:slide
                class="mt-4 mx-auto max-w-2xl bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 text-left"
            >
                <Leaf class="text-green-500 shrink-0 mt-1" size={20} />
                <div>
                    <h3 class="font-bold text-green-800">
                        Planned Passing Mode Active
                    </h3>
                    <p class="text-sm text-green-600">
                        The workflow is optimized for an organized estate. Many
                        discovery tasks may already be complete—verify and mark
                        them off.
                    </p>
                </div>
            </div>
        {/if}

        <div class="mt-8 text-left">
            <GriefSupportBanner compact={true} />
        </div>
    </div>

    <!-- Navigation Tabs (Only show if no task selected) -->
    {#if !selectedTask}
        <div class="flex flex-wrap justify-center gap-2 mb-8" in:fade>
            <button
                onclick={() => (activeTab = "checklist")}
                class="px-5 py-2 rounded-full font-bold text-sm transition-all {activeTab ===
                'checklist'
                    ? 'bg-[#304743] text-white shadow-md'
                    : 'bg-white text-gray-500 hover:bg-gray-50'}"
            >
                <Clock size={16} class="inline mr-2" /> Every step
            </button>
            <button
                onclick={() => (activeTab = "bureau")}
                class="px-5 py-2 rounded-full font-bold text-sm transition-all {activeTab ===
                'bureau'
                    ? 'bg-[#304743] text-white shadow-md'
                    : 'bg-white text-gray-500 hover:bg-gray-50'}"
            >
                <Building2 size={16} class="inline mr-2" /> Gov & Bureaus
            </button>
        </div>
    {/if}

    <!-- Content Area -->
    <div
        class="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 min-h-[500px]"
    >
        {#if selectedTask}
            <!-- Task Detail View -->
            <div in:slide={{ axis: "x", duration: 300 }}>
                <button
                    onclick={() => {
                        saveNote();
                        selectedTask = null;
                    }}
                    class="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#304743] mb-6 transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Checklist
                </button>

                {#if STEP_RECORDS[selectedTask.id]}
                    <a
                        href={STEP_RECORDS[selectedTask.id].href}
                        data-testid="step-record-link"
                        class="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-lg bg-[#4A7C74]/10 text-[#304743] text-sm font-semibold hover:bg-[#4A7C74]/20 transition-colors"
                    >
                        <FolderOpen size={16} />
                        Open {STEP_RECORDS[selectedTask.id].label}
                    </a>
                {/if}

                <ExecutorTaskDetail
                    blocks={selectedTask.blocks}
                    stepId={selectedTask.id}
                />

                <div class="mt-10 pt-6 border-t">
                    <label
                        for="step-note"
                        class="flex items-center gap-2 text-sm font-bold text-[#304743] mb-2"
                    >
                        <NotebookPen size={16} /> Your notes for this step
                    </label>
                    <textarea
                        id="step-note"
                        data-testid="step-note"
                        bind:value={noteDraft}
                        oninput={() => (noteSaved = false)}
                        onblur={saveNote}
                        rows="4"
                        placeholder="Who you spoke with, what was sent, what comes next…"
                        class="w-full rounded-xl border border-stone-200 p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4A7C74]/30"
                    ></textarea>
                    <div class="mt-2 flex items-center justify-end gap-3">
                        {#if noteSaved}
                            <span class="text-xs text-[#4A7C74]" in:fade
                                >Your note is saved.</span
                            >
                        {/if}
                        <button
                            type="button"
                            data-testid="save-note"
                            onclick={saveNote}
                            class="px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-stone-200 text-[#304743] hover:bg-stone-50"
                        >
                            Save my note
                        </button>
                    </div>
                </div>

                <div class="mt-12 pt-8 border-t flex justify-end">
                    <button
                        onclick={() => {
                            toggleCompletion(selectedTask.id);
                            saveNote();
                            selectedTask = null;
                        }}
                        class="px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all
                        {executorSteps.isDone(selectedTask.id)
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-[#304743] text-white hover:bg-[#2A3F3B]'}"
                    >
                        <SquareCheck size={18} />
                        {executorSteps.isDone(selectedTask.id)
                            ? "Done — tap to reopen"
                            : "Mark this step done"}
                    </button>
                </div>
            </div>
        {:else}
            <!-- Task List View -->
            <div in:fade class="space-y-4 max-w-3xl mx-auto">
                {#each filteredTasks as task}
                    <div
                        role="button"
                        tabindex="0"
                        class="w-full text-left group flex items-center gap-4 p-4 rounded-xl border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-[#4A7C74]/20"
                        data-testid="step-row"
                        data-step={task.id}
                        onclick={() => openTask(task)}
                        onkeydown={(e) =>
                            e.target === e.currentTarget &&
                            (e.key === "Enter" || e.key === " ") &&
                            openTask(task)}
                    >
                        <button
                            type="button"
                            data-testid="step-tick"
                            aria-pressed={executorSteps.isDone(task.id)}
                            aria-label={executorSteps.isDone(task.id)
                                ? `Reopen ${task.title}`
                                : `Mark ${task.title} done`}
                            onclick={(e) => {
                                e.stopPropagation();
                                toggleCompletion(task.id);
                            }}
                            class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-colors
                             {executorSteps.isDone(task.id)
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 text-transparent hover:border-[#4A7C74]'}"
                        >
                            <SquareCheck size={16} />
                        </button>

                        <div class="flex-1">
                            <h3
                                class="font-bold text-lg text-[#304743] {executorSteps.isDone(
                                    task.id,
                                )
                                    ? 'line-through opacity-50'
                                    : ''} group-hover:text-[#4A7C74] transition-colors"
                            >
                                {task.title}
                            </h3>
                            <p class="text-sm text-gray-500">{task.desc}</p>
                            {#if executorSteps.noteFor(task.id)}
                                <p
                                    class="mt-1 text-xs text-[#4A7C74] italic truncate"
                                    data-testid="step-note-preview"
                                >
                                    <NotebookPen size={12} class="inline mr-1" />
                                    {executorSteps.noteFor(task.id)}
                                </p>
                            {/if}
                        </div>

                        {#if STEP_RECORDS[task.id]}
                            <a
                                href={STEP_RECORDS[task.id].href}
                                data-testid="step-row-link"
                                onclick={(e) => e.stopPropagation()}
                                class="hidden sm:inline-flex items-center gap-1 shrink-0 px-3 py-1 rounded-md text-xs font-semibold text-[#304743] bg-stone-100 hover:bg-[#4A7C74]/15"
                            >
                                <FolderOpen size={12} />
                                {STEP_RECORDS[task.id].label}
                            </a>
                        {/if}

                        {#if task.urgent && !executorSteps.isDone(task.id)}
                            <span
                                class="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-md uppercase tracking-wide"
                                >Urgent</span
                            >
                        {/if}

                        <ChevronRight
                            size={18}
                            class="text-gray-300 group-hover:text-[#4A7C74]"
                        />
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>
