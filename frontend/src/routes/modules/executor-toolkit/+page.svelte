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
    } from "lucide-svelte";
    import ExecutorTaskDetail from "$lib/components/executor/ExecutorTaskDetail.svelte";
    import { executorTasks } from "$lib/data/executorTasks";
    import { currentScenario } from "$lib/stores/scenario";

    let activeTab = $state("checklist");
    let selectedTask = $state<any>(null);

    // Use local state for completion status to persist across views
    let completionStatus = $state<Record<string, boolean>>({});

    function toggleCompletion(id: string) {
        completionStatus[id] = !completionStatus[id];
    }

    // Reactive filtering based on Scenario Mode
    let filteredTasks = $derived(
        [...executorTasks]
            .filter((task) => {
                if ($currentScenario === "Sudden") {
                    // In Sudden Passing, only show immediate tasks (Phase 1/2) and anything urgent
                    return (
                        task.phase === "Immediate" ||
                        task.phase === "Foundation" ||
                        task.urgent
                    );
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
    <div class="mb-10 text-center">
        <div
            class="inline-flex items-center justify-center p-4 bg-slate-100 text-slate-700 rounded-full mb-6"
        >
            <Briefcase size={40} />
        </div>
        <h1 class="font-serif font-bold text-4xl text-[#304743] mb-4">
            Executor Toolkit
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
                <Clock size={16} class="inline mr-2" /> First 48 Hours
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
        class="bg-white rounded-3xl border border-stone-200 shadow-sm p-8 min-h-[500px]"
    >
        {#if selectedTask}
            <!-- Task Detail View -->
            <div in:slide={{ axis: "x", duration: 300 }}>
                <button
                    onclick={() => (selectedTask = null)}
                    class="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#304743] mb-6 transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Checklist
                </button>

                <ExecutorTaskDetail blocks={selectedTask.blocks} />

                <div class="mt-12 pt-8 border-t flex justify-end">
                    <button
                        onclick={() => {
                            toggleCompletion(selectedTask.id);
                            selectedTask = null;
                        }}
                        class="px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all
                        {completionStatus[selectedTask.id]
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-[#304743] text-white hover:bg-[#2A3F3B]'}"
                    >
                        <SquareCheck size={18} />
                        {completionStatus[selectedTask.id]
                            ? "Marked Complete"
                            : "Mark as Complete"}
                    </button>
                </div>
            </div>
        {:else if activeTab === "checklist"}
            <!-- Task List View -->
            <div in:fade class="space-y-4 max-w-3xl mx-auto">
                {#each filteredTasks as task}
                    <div
                        role="button"
                        tabindex="0"
                        class="w-full text-left group flex items-center gap-4 p-4 rounded-xl border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-[#4A7C74]/20"
                        onclick={() => (selectedTask = task)}
                        onkeydown={(e) =>
                            (e.key === "Enter" || e.key === " ") &&
                            (selectedTask = task)}
                    >
                        <button
                            type="button"
                            onclick={(e) => {
                                e.stopPropagation();
                                toggleCompletion(task.id);
                            }}
                            class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-colors
                             {completionStatus[task.id]
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 text-transparent hover:border-[#4A7C74]'}"
                        >
                            <SquareCheck size={16} />
                        </button>

                        <div class="flex-1">
                            <h3
                                class="font-bold text-lg text-[#304743] {completionStatus[
                                    task.id
                                ]
                                    ? 'line-through opacity-50'
                                    : ''} group-hover:text-[#4A7C74] transition-colors"
                            >
                                {task.title}
                            </h3>
                            <p class="text-sm text-gray-500">{task.desc}</p>
                        </div>

                        {#if task.urgent && !completionStatus[task.id]}
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
        {:else}
            <div class="text-center py-20 text-gray-400">
                Other tabs coming soon...
            </div>
        {/if}
    </div>
</div>
