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
        Info,
        Leaf,
        FolderOpen,
        NotebookPen,
    } from "lucide-svelte";
    import { onMount, untrack } from "svelte";
    import GriefSupportBanner from "$lib/components/GriefSupportBanner.svelte";
    import ExecutorTaskDetail from "$lib/components/executor/ExecutorTaskDetail.svelte";
    import { executorTasks } from "$lib/data/executorTasks";
    import {
        currentScenario,
        SCENARIO_DESCRIPTIONS,
        type Scenario,
    } from "$lib/stores/scenarioStore.svelte";
    import {
        executorSteps,
        STEP_RECORDS,
    } from "$lib/stores/executorStepsStore.svelte";
    import { executorSharing, type ExecutorNoteSharing, type ExecutorSharingOwner } from "$lib/stores/executorSharingStore.svelte";
    import { auth } from '$lib/stores/auth';
    import { activeAccountId } from '$lib/stores/keyringStore';
    import { currentProfileId } from '$lib/stores/profileContext';

    let activeTab = $state("checklist");
    let selectedTask = $state<any>(null);
    let sharingDraft = $state<ExecutorNoteSharing>('executors_only');
    let sharingLoaded = $state(false);
    let sharingBusy = $state(false);
    let sharingNote = $state('');
    let sharingFailed = $state(false);
    let sharingOwner: ExecutorSharingOwner | null = null;
    let sharingNamespace: string | null = null;
    let sharingEpoch = 0;

    async function loadSharing() {
        const owner = executorSharing.captureOwner();
        const epoch = sharingEpoch;
        if (!executorSharing.isCurrent(owner)) return;
        sharingLoaded = false;
        sharingOwner = null;
        try {
            const confirmed = await executorSharing.sync(owner);
            if (epoch !== sharingEpoch || !executorSharing.isCurrent(owner)) return;
            sharingLoaded = confirmed;
            if (confirmed) { sharingDraft = executorSharing.current; sharingOwner = owner; sharingNote = ''; }
            else sharingNote = 'Your sharing choice is ready to load again.';
        } catch {
            if (epoch === sharingEpoch && executorSharing.isCurrent(owner)) sharingNote = 'Your sharing choice is ready to load again.';
        }
    }

    async function saveSharing() {
        const owner = sharingOwner;
        const epoch = sharingEpoch;
        if (!sharingLoaded || sharingBusy || !owner || !executorSharing.isCurrent(owner)) return;
        sharingBusy = true;
        sharingNote = '';
        try {
            await executorSharing.save(sharingDraft, owner);
            if (epoch !== sharingEpoch || !executorSharing.isCurrent(owner)) return;
            sharingFailed = false;
            sharingNote = 'Sharing choice saved.';
        } catch {
            if (epoch !== sharingEpoch || !executorSharing.isCurrent(owner)) return;
            sharingFailed = true;
            sharingNote = 'Your sharing choice is ready to save again.';
        } finally {
            if (epoch === sharingEpoch && executorSharing.isCurrent(owner)) sharingBusy = false;
        }
    }

    $effect(() => {
        const ready = !$auth.loading && $auth.isAuthenticated && !!$auth.user && !!$auth.token && !!$activeAccountId;
        const profile = $currentProfileId;
        const owner = executorSharing.captureOwner();
        const namespace = ready && owner.session.ready ? JSON.stringify([owner.session.generation, $activeAccountId, profile]) : null;
        if (namespace === sharingNamespace) return;
        sharingNamespace = namespace;
        sharingEpoch++;
        sharingOwner = null;
        sharingDraft = 'executors_only';
        sharingLoaded = false;
        sharingBusy = false;
        sharingNote = '';
        sharingFailed = false;
        if (namespace) untrack(() => { void loadSharing(); });
    });

    // Ticks and notes live on the server (executor_steps), so they follow the account.
    // ?tab=bureau opens on the Gov & Bureaus steps (the /executor hub links there).
    onMount(() => {
        executorSteps.sync();
        if (new URL(window.location.href).searchParams.get("tab") === "bureau")
            activeTab = "bureau";
    });

    // The situation the steps are arranged for; saved with the estate profile (scenario_settings).
    const SCENARIOS: Scenario[] = ["General", "Sudden", "Planned"];
    function chooseScenario(mode: Scenario) {
        currentScenario.set(mode).catch(() => {}); // the store rolls back and shows the gentle error
    }

    let finishedCount = $derived(
        executorTasks.filter((t) => executorSteps.isDone(t.id)).length,
    );

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

<div class="max-w-6xl mx-auto px-8 py-6 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="mb-10 text-left">
        <div
            class="inline-flex items-center justify-center p-4 bg-muted text-foreground rounded-full mb-6"
        >
            <Briefcase size={40} />
        </div>
        <h1 class="font-serif font-bold text-4xl text-foreground mb-4">
            Executor Guide
        </h1>

        {#if $currentScenario === "Sudden"}
            <div
                in:slide
                class="mt-4 max-w-2xl bg-info/10 border border-info/20 rounded-lg p-4 flex items-start gap-3 text-left"
            >
                <Info class="text-info shrink-0 mt-1" size={20} />
                <div>
                    <h3 class="font-bold text-foreground">Gentle first steps</h3>
                    <p class="text-sm text-foreground">
                        These come first because they help most right now.
                    </p>
                </div>
            </div>
        {:else if $currentScenario === "Planned"}
            <div
                in:slide
                class="mt-4 max-w-2xl bg-success/10 border border-success/20 rounded-lg p-4 flex items-start gap-3 text-left"
            >
                <Leaf class="text-success shrink-0 mt-1" size={20} />
                <div>
                    <h3 class="font-bold text-foreground">
                        Planned Passing Mode Active
                    </h3>
                    <p class="text-sm text-foreground">
                        Much of the groundwork may already be in place. Look it
                        over when you're ready.
                    </p>
                </div>
            </div>
        {/if}

        <div class="mt-6 max-w-2xl" data-testid="scenario-choice">
            <div class="flex flex-wrap gap-2">
                {#each SCENARIOS as mode}
                    <button
                        type="button"
                        aria-pressed={$currentScenario === mode}
                        onclick={() => chooseScenario(mode)}
                        class="px-4 py-1.5 rounded-full text-sm font-semibold border transition-all {$currentScenario ===
                        mode
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-muted-foreground border-border hover:bg-muted'}"
                    >
                        {mode} Passing
                    </button>
                {/each}
            </div>
            <p class="mt-2 text-sm text-muted-foreground">
                {SCENARIO_DESCRIPTIONS[$currentScenario]}
            </p>
        </div>

        <section class="mt-6 max-w-2xl rounded-xl border border-border bg-card p-5 space-y-3" aria-label="Checklist note sharing" data-testid="executor-sharing">
            <label for="executor-note-sharing" class="block font-semibold">Who can read your checklist notes?</label>
            <p class="text-sm text-muted-foreground">Your full copy keeps your notes. Choose who sees the recorded steps and notes through a recipient link and its download copy.</p>
            <div class="flex flex-wrap gap-3 items-center">
                <select id="executor-note-sharing" bind:value={sharingDraft} disabled={!sharingLoaded || sharingBusy} class="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <option value="executors_only">Recipients marked as executors</option>
                    <option value="all_recipients">All recipients</option>
                </select>
                <button onclick={saveSharing} disabled={!sharingLoaded || sharingBusy} class="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary-hover disabled:opacity-60" data-testid="save-executor-sharing">
                    {sharingBusy ? 'Saving sharing choice…' : sharingFailed ? 'Try saving again' : 'Save sharing choice'}
                </button>
                {#if !sharingLoaded}<button onclick={loadSharing} class="text-sm text-primary-hover underline">Load sharing choice</button>{/if}
            </div>
            {#if sharingNote}<p class="text-sm text-muted-foreground" role="status" data-testid="executor-sharing-status">{sharingNote}</p>{/if}
        </section>

        <div class="mt-8 text-left">
            <GriefSupportBanner compact={true} />
        </div>
    </div>

    <!-- Navigation Tabs (Only show if no task selected) -->
    {#if !selectedTask}
        <div class="flex flex-wrap gap-2 mb-8" in:fade>
            <button
                onclick={() => (activeTab = "checklist")}
                class="px-5 py-2 rounded-full font-bold text-sm transition-all {activeTab ===
                'checklist'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-card text-muted-foreground hover:bg-muted'}"
            >
                <Clock size={16} class="inline mr-2" /> Every step
            </button>
            <button
                onclick={() => (activeTab = "bureau")}
                class="px-5 py-2 rounded-full font-bold text-sm transition-all {activeTab ===
                'bureau'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-card text-muted-foreground hover:bg-muted'}"
            >
                <Building2 size={16} class="inline mr-2" /> Gov & Bureaus
            </button>
            <span
                class="ml-auto self-center text-sm text-muted-foreground"
                data-testid="steps-finished"
            >
                {finishedCount} of {executorTasks.length} steps finished
            </span>
        </div>
    {/if}

    <!-- Content Area -->
    <div
        class="bg-card rounded-2xl border border-border shadow-sm p-8 min-h-[500px]"
    >
        {#if selectedTask}
            <!-- Task Detail View -->
            <div in:slide={{ axis: "x", duration: 300 }}>
                <button
                    onclick={() => {
                        saveNote();
                        selectedTask = null;
                    }}
                    class="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Checklist
                </button>

                {#if STEP_RECORDS[selectedTask.id]}
                    <a
                        href={STEP_RECORDS[selectedTask.id].href}
                        data-testid="step-record-link"
                        class="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-lg bg-primary/10 text-primary-hover text-sm font-semibold hover:bg-primary/20 transition-colors"
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
                        class="flex items-center gap-2 text-sm font-bold text-foreground mb-2"
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
                        class="w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    ></textarea>
                    <div class="mt-2 flex items-center justify-end gap-3">
                        {#if noteSaved}
                            <span class="text-xs text-primary" in:fade
                                >Your note is saved.</span
                            >
                        {/if}
                        <button
                            type="button"
                            data-testid="save-note"
                            onclick={saveNote}
                            class="px-4 py-2 rounded-lg text-sm font-semibold bg-card border border-border text-primary-hover hover:bg-muted"
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
                            ? 'bg-success/10 text-success hover:bg-success/20'
                            : 'bg-primary text-primary-foreground hover:bg-primary-hover'}"
                    >
                        <SquareCheck size={18} />
                        {executorSteps.isDone(selectedTask.id)
                            ? "Finished — tap to reopen"
                            : "Mark this step as finished"}
                    </button>
                </div>
            </div>
        {:else}
            <!-- Task List View -->
            <div in:fade class="space-y-4">
                {#each filteredTasks as task}
                    <div
                        role="button"
                        tabindex="0"
                        class="w-full text-left group flex items-center gap-4 p-4 rounded-xl border border-transparent hover:border-border hover:bg-muted transition-all cursor-pointer outline-none focus:ring-2 focus:ring-primary/20"
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
                                : `Mark ${task.title} as finished`}
                            onclick={(e) => {
                                e.stopPropagation();
                                toggleCompletion(task.id);
                            }}
                            class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-colors
                             {executorSteps.isDone(task.id)
                                ? 'bg-success border-success text-primary-foreground'
                                : 'border-muted-foreground text-transparent hover:border-primary'}"
                        >
                            <SquareCheck size={16} />
                        </button>

                        <div class="flex-1">
                            <h3
                                class="font-bold text-lg text-foreground {executorSteps.isDone(
                                    task.id,
                                )
                                    ? 'line-through opacity-50'
                                    : ''} group-hover:text-primary-hover transition-colors"
                            >
                                {task.title}
                            </h3>
                            <p class="text-sm text-muted-foreground">{task.desc}</p>
                            {#if executorSteps.noteFor(task.id)}
                                <p
                                    class="mt-1 text-xs text-primary-hover italic truncate"
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
                                class="hidden sm:inline-flex items-center gap-1 shrink-0 px-3 py-1 rounded-md text-xs font-semibold text-primary-hover bg-muted hover:bg-primary/15"
                            >
                                <FolderOpen size={12} />
                                {STEP_RECORDS[task.id].label}
                            </a>
                        {/if}

                        {#if task.urgent && !executorSteps.isDone(task.id)}
                            <span
                                class="px-2 py-1 bg-warning-soft text-warning text-xs font-bold rounded-md uppercase tracking-wide"
>First days</span
                            >
                        {/if}

                        <ChevronRight
                            size={18}
                            class="text-muted-foreground group-hover:text-primary"
                        />
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>
