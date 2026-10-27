<script lang="ts">
    import {
        acceptanceStore,
        acceptanceTasks,
        estateComplexity,
        filteredTasks,
        acceptanceProgress,
        type AcceptanceTask,
        type EstateComplexity,
    } from "$lib/stores/acceptanceStore.svelte";
    import {
        ShieldCheck,
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

    let searchQuery = $state("");
    let selectedSection = $state("all");
    let showComplexitySettings = $state(false);

    let sections = $derived([
        "all",
        ...new Set($acceptanceTasks.map((t) => t.section)),
    ]);

    let displayTasks = $derived(
        $filteredTasks.filter((task) => {
            const matchesSearch =
                task.page.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.check.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesSection =
                selectedSection === "all" || task.section === selectedSection;
            return matchesSearch && matchesSection;
        }),
    );

    let groupedTasks = $derived(
        displayTasks.reduce(
            (acc, task) => {
                if (!acc[task.section]) acc[task.section] = [];
                acc[task.section].push(task);
                return acc;
            },
            {} as Record<string, AcceptanceTask[]>,
        ),
    );

    const complexityInfomation = {
        simple: "Show the initial review checks for contacts, documents, messages and wishes.",
        moderate:
            "Include the initial checks plus more account, property, insurance and service reviews.",
        complex:
            "Show every check, including brokerage, retirement and digital asset reviews.",
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
                    class="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20 text-primary-foreground"
                >
                    <ShieldCheck class="w-8 h-8" />
                </div>
                <div>
                    <h1 class="font-serif font-bold text-3xl text-foreground">
                        Builder Tools
                    </h1>
                    <p class="text-muted-foreground font-medium">
                        Your manual review checklist
                    </p>
                </div>
            </div>
        </div>

        <div class="flex items-center gap-4">
            <button
                onclick={() =>
                    (showComplexitySettings = !showComplexitySettings)}
                class="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-muted-foreground font-bold hover:bg-muted transition-all shadow-sm"
            >
                <Settings2 size={18} />
                Checks shown:
                <span class="text-primary-hover capitalize"
                    >{($estateComplexity?.level ?? "moderate")}</span
                >
            </button>
        </div>
    </div>

    {#if showComplexitySettings}
        <div
            transition:slide={{ duration: 300, easing: quintOut }}
            class="bg-primary-deep rounded-2xl p-6 text-white overflow-hidden relative group"
        >
            <div
                class="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700"
            >
                <Zap size={160} />
            </div>

            <div class="relative z-10 space-y-6">
                <div class="flex items-center gap-3">
                    <Zap class="text-gold" />
                    <h2 class="text-xl font-bold text-white">Choose checklist depth</h2>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {#each ["simple", "moderate", "complex"] as level}
                        <button
                            onclick={() =>
                                acceptanceStore.setComplexity(
                                    level as EstateComplexity,
                                )}
                            class="p-4 rounded-xl border-2 transition-all text-left space-y-2 {($estateComplexity?.level ?? 'moderate') ===
                            level
                                ? 'bg-white/10 border-white'
                                : 'bg-transparent border-white/20 hover:border-white/40'}"
                        >
                            <div class="flex items-center justify-between">
                                <span class="font-bold capitalize">{level}</span
                                >
                                {#if ($estateComplexity?.level ?? "moderate") === level}
                                    <CircleCheck
                                        size={16}
                                        class="text-white"
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
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
            class="bg-card rounded-2xl p-6 border border-border shadow-sm flex flex-col justify-between"
        >
            <div class="flex items-center justify-between mb-4">
                <div class="p-2 bg-primary-soft text-primary-hover rounded-lg">
                    <BarChart3 size={20} />
                </div>
                <span class="text-2xl font-black text-primary-hover"
                    >{$acceptanceProgress}%</span
                >
            </div>
            <div>
                <h3 class="font-bold text-foreground mb-1">
                    Review checks ticked
                </h3>
                <div class="w-full bg-muted rounded-full h-2 mt-2">
                    <div
                        class="bg-primary h-2 rounded-full transition-all duration-1000 ease-out"
                        style="width: {$acceptanceProgress}%"
                    ></div>
                </div>
            </div>
        </div>

        <div
            class="bg-card rounded-2xl p-6 border border-border shadow-sm flex flex-col justify-between"
        >
            <div class="flex items-center justify-between mb-4">
                <div class="p-2 bg-success/10 text-success rounded-lg">
                    <LayoutGrid size={20} />
                </div>
                <span class="text-2xl font-black text-success"
                    >{displayTasks.filter((t) => t.status === "Complete")
                        .length} / {displayTasks.length}</span
                >
            </div>
            <div>
                <h3 class="font-bold text-foreground mb-1">Your checks</h3>
                <p class="text-sm text-muted-foreground">
                    Ticked so far
                </p>
            </div>
        </div>
    </div>

    <!-- Filters -->
    <div
        class="bg-card rounded-2xl border border-border shadow-sm p-4 flex flex-col md:flex-row gap-4"
    >
        <div class="relative flex-1">
            <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4"
            />
            <input
                type="text"
                bind:value={searchQuery}
                aria-label="Search your checks"
                placeholder="Search your checks…"
                class="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium"
            />
        </div>
        <div class="flex items-center gap-2">
            <Filter size={16} class="text-muted-foreground" />
            <select
                bind:value={selectedSection}
                aria-label="Sections"
                class="bg-muted border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium"
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
                        class="font-serif font-bold text-xl text-foreground shrink-0"
                    >
                        {section}
                    </h2>
                    <div class="h-px bg-border w-full"></div>
                    <span
                        class="text-xs font-bold uppercase tracking-widest text-muted-foreground shrink-0"
                    >
                        {tasks.filter((t) => t.status === "Complete").length} of
                        {tasks.length} checked
                    </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {#each tasks as task (task.taskId)}
                        <div class="relative">
                        <button
                            onclick={() => acceptanceStore.toggleTask(task.taskId)?.catch(() => {})}
                            class="group relative w-full h-full text-left p-5 pb-10 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:translate-y-[-2px] {task.status ===
                            'Complete'
                                ? 'bg-success/10 border-success/30'
                                : 'bg-card border-border hover:border-primary/40'}"
                        >
                            <div class="flex items-start gap-4">
                                <div
                                    class="mt-1 transition-transform group-hover:scale-110"
                                >
                                    {#if task.status === "Complete"}
                                        <div class="text-success">
                                            <CircleCheck
                                                size={24}
                                                fill="currentColor"
                                                class="text-success fill-success/10"
                                            />
                                        </div>
                                    {:else}
                                        <div
                                            class="text-muted-foreground group-hover:text-primary transition-colors"
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
                                            class="font-bold text-foreground group-hover:text-primary-hover transition-colors"
                                        >
                                            {task.page}
                                        </h4>
                                        <span
                                            class="text-[10px] font-black uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
                                        >
                                            {task.role}
                                        </span>
                                    </div>
                                    <p
                                        class="text-sm text-muted-foreground leading-relaxed"
                                    >
                                        {task.check}
                                    </p>
                                </div>
                            </div>

                            {#if task.status === "Complete"}
                                <div
                                    class="absolute inset-0 bg-success/5 pointer-events-none rounded-2xl"
                                ></div>
                            {/if}
                        </button>
                        {#if task.href}
                            <a
                                href={task.href}
                                class="absolute bottom-4 right-5 text-xs text-primary-hover hover:underline flex items-center gap-1 font-bold"
                            >
                                Go to page <ArrowRight size={12} />
                            </a>
                        {/if}
                        </div>
                    {/each}
                </div>
            </div>
        {/each}

        {#if Object.keys(groupedTasks).length === 0}
            <div
                class="bg-muted rounded-2xl p-16 text-center border-2 border-dashed border-border"
            >
                <div
                    class="p-4 bg-muted rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center text-muted-foreground"
                >
                    <Search size={40} />
                </div>
                <h3 class="text-xl font-bold text-foreground mb-2">
                    Try a different search
                </h3>
                <p class="text-muted-foreground">
                    Adjust your search or filters to see more tasks.
                </p>
            </div>
        {/if}
    </div>

    <!-- Help Callout -->
    <div
        class="bg-primary-soft border border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6"
    >
        <div class="p-3 bg-card rounded-xl shadow-sm text-primary">
            <Info size={24} />
        </div>
        <div class="flex-1 text-center md:text-left">
            <h4 class="font-bold text-foreground">
                Why use Builder Tools?
            </h4>
            <p class="text-muted-foreground text-sm mt-1">
                Open a related page, review its records, then tick the check yourself.
                These percentages count your review checks.
            </p>
        </div>
        <a
            href="/modules/analytics"
            class="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all flex items-center gap-2"
        >
            View Analytics
            <ArrowRight size={18} />
        </a>
    </div>
</div>

<style>
    /* Custom scrollbar for better aesthetics */
    :global(body) {
        scrollbar-gutter: stable;
    }
</style>
