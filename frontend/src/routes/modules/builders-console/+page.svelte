<script lang="ts">
    import {
        acceptanceStore,
        acceptanceTasks,
        estateComplexity,
        filteredTasks,
        acceptanceProgress,
        timeRemaining,
        type AcceptanceTask,
        type EstateComplexity,
    } from "$lib/stores/acceptanceStore";
    import {
        ShieldCheck,
        Clock,
        Filter,
        Search,
        ChevronDown,
        ChevronUp,
        CircleCheck,
        Circle,
        Info,
        Settings2,
        Zap,
        BarChart3,
        LayoutGrid,
        ArrowRight,
    } from "lucide-svelte";
    import { fade, slide, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";

    let searchQuery = "";
    let selectedSection = "all";
    let showComplexitySettings = false;

    $: sections = ["all", ...new Set($acceptanceTasks.map((t) => t.section))];

    $: displayTasks = $filteredTasks.filter((task) => {
        const matchesSearch =
            task.page.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.check.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSection =
            selectedSection === "all" || task.section === selectedSection;
        return matchesSearch && matchesSection;
    });

    $: groupedTasks = displayTasks.reduce(
        (acc, task) => {
            if (!acc[task.section]) acc[task.section] = [];
            acc[task.section].push(task);
            return acc;
        },
        {} as Record<string, AcceptanceTask[]>,
    );

    function formatTime(minutes: number): string {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
    }

    const complexityInfomation = {
        simple: "Focuses on the essential foundation. Ideal for early-stage planning or straightforward estates.",
        moderate:
            "Adds detailed financial and insurance tracking. Recommended for established households.",
        complex:
            "Full suite of estate planning tools, including advanced trusts, business assets, and complex legacies.",
    };
</script>

<div
    class="max-w-6xl mx-auto p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
>
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div class="space-y-2">
            <div class="flex items-center gap-3">
                <div
                    class="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 text-white"
                >
                    <ShieldCheck class="w-8 h-8" />
                </div>
                <div>
                    <h1 class="font-serif font-bold text-3xl text-slate-900">
                        Builder's Console
                    </h1>
                    <p class="text-slate-500 font-medium">
                        Compliance & Verification Command Center
                    </p>
                </div>
            </div>
        </div>

        <div class="flex items-center gap-4">
            <button
                on:click={() =>
                    (showComplexitySettings = !showComplexitySettings)}
                class="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm"
            >
                <Settings2 size={18} />
                Estate Complexity:
                <span class="text-indigo-600 capitalize"
                    >{$estateComplexity}</span
                >
            </button>
        </div>
    </div>

    {#if showComplexitySettings}
        <div
            transition:slide={{ duration: 300, easing: quintOut }}
            class="bg-indigo-900 rounded-2xl p-6 text-white overflow-hidden relative group"
        >
            <div
                class="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700"
            >
                <Zap size={160} />
            </div>

            <div class="relative z-10 space-y-6">
                <div class="flex items-center gap-3">
                    <Zap class="text-amber-400" />
                    <h2 class="text-xl font-bold">Configure Planning Depth</h2>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {#each ["simple", "moderate", "complex"] as level}
                        <button
                            on:click={() =>
                                acceptanceStore.setComplexity(
                                    level as EstateComplexity,
                                )}
                            class="p-4 rounded-xl border-2 transition-all text-left space-y-2 {$estateComplexity ===
                            level
                                ? 'bg-white/10 border-white'
                                : 'bg-transparent border-white/20 hover:border-white/40'}"
                        >
                            <div class="flex items-center justify-between">
                                <span class="font-bold capitalize">{level}</span
                                >
                                {#if $estateComplexity === level}
                                    <CircleCheck
                                        size={16}
                                        class="text-emerald-400"
                                    />
                                {/if}
                            </div>
                            <p class="text-xs text-white/70 leading-relaxed">
                                {complexityInfomation[
                                    level as EstateComplexity
                                ]}
                            </p>
                        </button>
                    {/each}
                </div>
            </div>
        </div>
    {/if}

    <!-- Progress Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
            class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between"
        >
            <div class="flex items-center justify-between mb-4">
                <div class="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <BarChart3 size={20} />
                </div>
                <span class="text-2xl font-black text-indigo-600"
                    >{$acceptanceProgress}%</span
                >
            </div>
            <div>
                <h3 class="font-bold text-slate-900 mb-1">
                    Overall Completion
                </h3>
                <div class="w-full bg-slate-100 rounded-full h-2 mt-2">
                    <div
                        class="bg-indigo-600 h-2 rounded-full transition-all duration-1000 ease-out"
                        style="width: {$acceptanceProgress}%"
                    ></div>
                </div>
            </div>
        </div>

        <div
            class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between"
        >
            <div class="flex items-center justify-between mb-4">
                <div class="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <Clock size={20} />
                </div>
                <span class="text-2xl font-black text-amber-600"
                    >{formatTime($timeRemaining)}</span
                >
            </div>
            <div>
                <h3 class="font-bold text-slate-900 mb-1">Estimated Effort</h3>
                <p class="text-sm text-slate-500">
                    Remaining time to 100% setup
                </p>
            </div>
        </div>

        <div
            class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between"
        >
            <div class="flex items-center justify-between mb-4">
                <div class="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <LayoutGrid size={20} />
                </div>
                <span class="text-2xl font-black text-emerald-600"
                    >{displayTasks.filter((t) => t.status === "Complete")
                        .length} / {displayTasks.length}</span
                >
            </div>
            <div>
                <h3 class="font-bold text-slate-900 mb-1">Task Inventory</h3>
                <p class="text-sm text-slate-500">
                    Compliance checkpoints verified
                </p>
            </div>
        </div>
    </div>

    <!-- Filters -->
    <div
        class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row gap-4"
    >
        <div class="relative flex-1">
            <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"
            />
            <input
                type="text"
                bind:value={searchQuery}
                placeholder="Search checkpoints..."
                class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
            />
        </div>
        <div class="flex items-center gap-2">
            <Filter size={16} class="text-slate-400" />
            <select
                bind:value={selectedSection}
                class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
                {#each sections as section}
                    <option value={section}
                        >{section === "all" ? "All Sections" : section}</option
                    >
                {/each}
            </select>
        </div>
    </div>

    <!-- Task List -->
    <div class="space-y-12">
        {#each Object.entries(groupedTasks) as [section, tasks]}
            <div class="space-y-4">
                <div class="flex items-center gap-4">
                    <h2
                        class="font-serif font-bold text-xl text-slate-800 shrink-0"
                    >
                        {section}
                    </h2>
                    <div class="h-px bg-slate-200 w-full"></div>
                    <span
                        class="text-xs font-bold uppercase tracking-widest text-slate-400 shrink-0"
                    >
                        {tasks.filter((t) => t.status === "Complete").length} of
                        {tasks.length} Done
                    </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {#each tasks as task (task.id)}
                        <button
                            on:click={() => acceptanceStore.toggleTask(task.id)}
                            class="group relative text-left p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:translate-y-[-2px] {task.status ===
                            'Complete'
                                ? 'bg-emerald-50/30 border-emerald-200'
                                : 'bg-white border-slate-200 hover:border-indigo-300'}"
                        >
                            <div class="flex items-start gap-4">
                                <div
                                    class="mt-1 transition-transform group-hover:scale-110"
                                >
                                    {#if task.status === "Complete"}
                                        <div class="text-emerald-500">
                                            <CircleCheck
                                                size={24}
                                                fill="currentColor"
                                                class="text-emerald-500 fill-emerald-50 text-white"
                                            />
                                        </div>
                                    {:else}
                                        <div
                                            class="text-slate-300 group-hover:text-indigo-400 transition-colors"
                                        >
                                            <Circle size={24} />
                                        </div>
                                    {/if}
                                </div>
                                <div class="flex-1 space-y-1">
                                    <div
                                        class="flex items-center justify-between"
                                    >
                                        <h4
                                            class="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors"
                                        >
                                            {task.page}
                                        </h4>
                                        <span
                                            class="text-[10px] font-black uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full"
                                        >
                                            {task.role}
                                        </span>
                                    </div>
                                    <p
                                        class="text-sm text-slate-500 leading-relaxed"
                                    >
                                        {task.check}
                                    </p>
                                    <div class="flex items-center gap-4 pt-2">
                                        <div
                                            class="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase"
                                        >
                                            <Clock size={12} />
                                            {task.estTime} min
                                        </div>
                                        <div
                                            class="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase"
                                        >
                                            <Zap size={12} />
                                            {task.complexity}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {#if task.status === "Complete"}
                                <div
                                    class="absolute inset-0 bg-emerald-50/5 pointer-events-none rounded-2xl"
                                ></div>
                            {/if}
                        </button>
                    {/each}
                </div>
            </div>
        {/each}

        {#if Object.keys(groupedTasks).length === 0}
            <div
                class="bg-slate-50 rounded-3xl p-16 text-center border-2 border-dashed border-slate-200"
            >
                <div
                    class="p-4 bg-slate-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center text-slate-400"
                >
                    <Search size={40} />
                </div>
                <h3 class="text-xl font-bold text-slate-900 mb-2">
                    No checkpoints found
                </h3>
                <p class="text-slate-500">
                    Adjust your search or filters to see more tasks.
                </p>
            </div>
        {/if}
    </div>

    <!-- Help Callout -->
    <div
        class="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6"
    >
        <div class="p-3 bg-white rounded-xl shadow-sm text-indigo-600">
            <Info size={24} />
        </div>
        <div class="flex-1 text-center md:text-left">
            <h4 class="font-bold text-slate-900">
                Why use the Builder's Console?
            </h4>
            <p class="text-slate-600 text-sm mt-1">
                This console ensures the plan you've built is actually ready for
                your loved ones. Complete these manual checks to verify your
                estate's integrity.
            </p>
        </div>
        <button
            class="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
        >
            View Analytics
            <ArrowRight size={18} />
        </button>
    </div>
</div>

<style>
    /* Custom scrollbar for better aesthetics */
    :global(body) {
        scrollbar-gutter: stable;
    }
</style>
