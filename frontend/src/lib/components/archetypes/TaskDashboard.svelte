<script lang="ts">
    import { onMount } from "svelte";
    import {
        Plus,
        Calendar,
        CircleCheck,
        Circle,
        Clock,
        MoreHorizontal,
        ArrowRight,
        Kanban,
        ListTodo,
        Sparkles,
        Play,
        Trash2,
        TriangleAlert,
        Map,
        Compass,
        Footprints,
        Flag,
        X,
    } from "lucide-svelte";
    import { slide, scale, fade, fly } from "svelte/transition";
    import { flip } from "svelte/animate";
    import { getStored, setStored } from "$lib/stores/persistence";

    export let module: any;

    type TaskStatus = "todo" | "doing" | "done";

    interface Task {
        id: string;
        title: string;
        status: TaskStatus;
        priority: "high" | "medium" | "low";
        dueDate?: string;
        assignee?: "Executor" | "Attorney" | "Family";
    }

    let tasks: Task[] = [];
    let showAddForm = false;
    let showWizard = false;
    let newTask = "";

    const storageKey = `tasks_${module.id}`;

    // Standard Blueprints for One-Click Setup
    const blueprints = [
        {
            name: "First 30 Days",
            icon: Compass,
            description: "Essential first steps after a loss",
            tasks: [
                {
                    title: "Locate Original Will",
                    priority: "high",
                    assignee: "Executor",
                },
                {
                    title: "Order 10 Certified Death Certificates",
                    priority: "high",
                    assignee: "Executor",
                },
                {
                    title: "Secure Main Residence",
                    priority: "high",
                    assignee: "Executor",
                },
                {
                    title: "Notify Social Security Administration",
                    priority: "medium",
                    assignee: "Executor",
                },
            ],
        },
        {
            name: "Annual Review",
            icon: Calendar,
            description: "Keeping things up to date",
            tasks: [
                {
                    title: "Update Beneficiary Designations",
                    priority: "medium",
                    assignee: "Family",
                },
                {
                    title: "Review Insurance Policy Limits",
                    priority: "medium",
                    assignee: "Advisor",
                },
                {
                    title: "Check Digital Asset Access",
                    priority: "low",
                    assignee: "Family",
                },
            ],
        },
    ];

    onMount(() => {
        // Seed with sample data if empty
        const defaultTasks: Task[] = [
            {
                id: "1",
                title: "Review Estate Plan Draft",
                status: "todo",
                priority: "high",
                dueDate: "2024-12-01",
                assignee: "Executor",
            },
        ];
        tasks = getStored(storageKey, defaultTasks);
    });

    function save() {
        setStored(storageKey, tasks);
    }

    function addTask(
        title: string = newTask,
        priority: "high" | "medium" | "low" = "medium",
        assignee: any = "Executor",
    ) {
        if (!title) return;

        tasks = [
            ...tasks,
            {
                id: crypto.randomUUID(),
                title,
                status: "todo",
                priority,
                assignee,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0], // +7 days
            },
        ];

        newTask = "";
        showAddForm = false;
        save();
    }

    function removeTask(id: string) {
        tasks = tasks.filter((t) => t.id !== id);
        save();
    }

    function moveTask(task: Task, newStatus: TaskStatus) {
        task.status = newStatus;
        tasks = tasks; // Trigger reactivity
        save();
    }

    function loadBlueprint(blueprint: any) {
        const newTasks = blueprint.tasks.map((t: any) => ({
            id: crypto.randomUUID(),
            title: t.title,
            status: "todo",
            priority: t.priority,
            assignee: t.assignee,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
        }));

        tasks = [...tasks, ...newTasks];
        showWizard = false;
        save();
    }

    function getPriorityColor(p: string) {
        switch (p) {
            case "high":
                return "text-amber-700 bg-amber-100 border-amber-200";
            case "medium":
                return "text-[#4A7C74] bg-[#4A7C74]/10 border-[#4A7C74]/20";
            case "low":
                return "text-slate-600 bg-slate-100 border-slate-200";
            default:
                return "text-gray-600";
        }
    }

    $: todos = tasks.filter((t) => t.status === "todo");
    $: doing = tasks.filter((t) => t.status === "doing");
    $: done = tasks.filter((t) => t.status === "done");
    $: progress =
        tasks.length > 0 ? Math.round((done.length / tasks.length) * 100) : 0;
</script>

<div class="space-y-8 animate-in fade-in duration-500">
    <!-- Header / Stats -->
    <div
        class="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/50"
    >
        <div>
            <div class="flex items-center gap-2 mb-2">
                <div class="bg-[#4A7C74]/10 text-[#4A7C74] p-2 rounded-full">
                    <Map size={24} />
                </div>
                <h3 class="text-3xl font-serif font-bold text-primary">
                    Your Peace of Mind Journey
                </h3>
            </div>
            <p class="text-muted-foreground mt-1 max-w-lg">
                Estate settlement is a marathon, not a sprint. We've broken it
                down into manageable steps.
            </p>
        </div>

        <div class="flex gap-3">
            <button
                on:click={() => (showWizard = true)}
                class="bg-secondary/10 hover:bg-secondary/20 text-[#4A7C74] px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
            >
                <Compass size={18} /> where do I start?
            </button>

            <button
                on:click={() => (showAddForm = !showAddForm)}
                class="bg-[#4A7C74] hover:bg-[#3b635d] text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
                <Plus size={18} /> Add Step
            </button>
        </div>
    </div>

    <!-- Guided Wizard Overlay -->
    {#if showWizard}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            transition:fade
        >
            <div
                class="bg-background border border-border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div class="p-8 bg-[#FBF9EB]/50 relative">
                    <button
                        on:click={() => (showWizard = false)}
                        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                        ><X size={20} /></button
                    >
                    <h3
                        class="font-serif font-bold text-2xl text-[#304743] mb-2"
                    >
                        Choose your Path
                    </h3>
                    <p class="text-muted-foreground">
                        Select a guide to auto-populate your journey with
                        recommended steps.
                    </p>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                        {#each blueprints as bp}
                            <button
                                on:click={() => loadBlueprint(bp)}
                                class="text-left p-6 bg-white border border-border hover:border-[#4A7C74] rounded-xl transition-all hover:shadow-lg group relative overflow-hidden"
                            >
                                <div
                                    class="bg-[#4A7C74]/5 p-3 rounded-full w-fit mb-4 text-[#4A7C74]"
                                >
                                    <svelte:component
                                        this={bp.icon}
                                        size={24}
                                    />
                                </div>
                                <h4
                                    class="font-bold text-lg text-[#304743] mb-1 group-hover:underline"
                                >
                                    {bp.name}
                                </h4>
                                <p
                                    class="text-sm text-muted-foreground leading-relaxed"
                                >
                                    {bp.description}
                                </p>
                                <div
                                    class="absolute bottom-0 left-0 w-full h-1 bg-[#4A7C74] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"
                                ></div>
                            </button>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    {/if}

    <!-- Progress Bar -->
    {#if tasks.length > 0}
        <div
            class="bg-secondary/5 rounded-full h-2 w-full overflow-hidden flex items-center"
        >
            <div
                class="bg-[#4A7C74] h-full transition-all duration-1000"
                style="width: {progress}%"
            ></div>
        </div>
        <div
            class="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1"
        >
            <span>Start</span>
            <span>{progress}% Complete</span>
            <span>Peace of Mind</span>
        </div>
    {/if}

    <!-- Quick Add Form -->
    {#if showAddForm}
        <div
            transition:slide
            class="glass-panel p-4 rounded-xl flex gap-3 items-center border-[#4A7C74]/20"
        >
            <div class="bg-[#4A7C74]/10 p-2 rounded-full text-[#4A7C74]">
                <Footprints size={20} />
            </div>
            <input
                bind:value={newTask}
                placeholder="What is the next small step?"
                class="flex-1 bg-transparent border-none outline-none text-lg placeholder:text-muted-foreground/50 font-serif"
                on:keydown={(e) => e.key === "Enter" && addTask()}
            />
            <button
                on:click={() => addTask()}
                class="font-bold text-[#4A7C74] hover:text-[#3b635d]"
                >Add</button
            >
        </div>
    {/if}

    <!-- Kanban Board -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
        <!-- To Do -->
        <div
            class="flex flex-col h-full bg-secondary/5 rounded-xl border border-white/20"
        >
            <div
                class="p-4 border-b border-border/40 flex justify-between items-center sticky top-0 bg-secondary/5 backdrop-blur-md rounded-t-xl z-10"
            >
                <h4
                    class="font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2"
                >
                    <Circle size={16} /> To Do
                    <span
                        class="bg-black/5 px-2 py-0.5 rounded-full text-[10px]"
                        >{todos.length}</span
                    >
                </h4>
            </div>
            <div class="p-4 space-y-3 overflow-y-auto flex-1">
                {#each todos as task (task.id)}
                    <div
                        class="glass-card p-4 rounded-lg group hover:border-l-4 hover:border-l-[#4A7C74] transition-all cursor-grab active:cursor-grabbing relative"
                        animate:flip
                    >
                        <button
                            on:click={() => removeTask(task.id)}
                            class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                            ><Trash2 size={14} /></button
                        >

                        <div class="flex flex-wrap gap-2 mb-2">
                            <span
                                class="text-[10px] uppercase font-bold px-2 py-0.5 rounded border {getPriorityColor(
                                    task.priority,
                                )}">{task.priority}</span
                            >
                            {#if task.assignee}
                                <span
                                    class="text-[10px] uppercase font-bold px-2 py-0.5 rounded border bg-gray-100 text-gray-600 border-gray-200 flex items-center gap-1"
                                >
                                    <ListTodo size={10} />
                                    {task.assignee}
                                </span>
                            {/if}
                        </div>
                        <h5 class="font-bold text-foreground leading-snug mb-3">
                            {task.title}
                        </h5>

                        <div
                            class="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-border/50"
                        >
                            <div
                                class="flex items-center gap-1 text-xs text-muted-foreground"
                            >
                                <Calendar size={12} />
                                {task.dueDate}
                            </div>
                            <button
                                on:click={() => moveTask(task, "doing")}
                                class="text-xs font-bold text-[#4A7C74] hover:underline flex items-center gap-1"
                            >
                                Start Step <ArrowRight size={12} />
                            </button>
                        </div>
                    </div>
                {/each}
                {#if todos.length === 0}
                    <div class="text-center py-10 opacity-50 text-sm italic">
                        You're all caught up. Breathe easy.
                    </div>
                {/if}
            </div>
        </div>

        <!-- In Progress -->
        <div
            class="flex flex-col h-full bg-[#4A7C74]/5 rounded-xl border border-[#4A7C74]/10"
        >
            <div
                class="p-4 border-b border-border/40 flex justify-between items-center sticky top-0 bg-[#4A7C74]/5 backdrop-blur-md rounded-t-xl z-10"
            >
                <h4
                    class="font-bold text-sm uppercase tracking-widest text-[#4A7C74] flex items-center gap-2"
                >
                    <Footprints size={16} /> In Progress
                    <span
                        class="bg-[#4A7C74]/20 px-2 py-0.5 rounded-full text-[10px]"
                        >{doing.length}</span
                    >
                </h4>
            </div>
            <div class="p-4 space-y-3 overflow-y-auto flex-1">
                {#each doing as task (task.id)}
                    <div
                        class="glass-card p-4 rounded-lg border-l-4 border-l-[#4A7C74] cursor-grab active:cursor-grabbing relative shadow-md"
                    >
                        <h5 class="font-bold text-foreground leading-snug mb-3">
                            {task.title}
                        </h5>

                        <div
                            class="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-border/50"
                        >
                            <span
                                class="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white text-muted-foreground shadow-sm"
                                >{task.priority}</span
                            >
                            <button
                                on:click={() => moveTask(task, "done")}
                                class="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                            >
                                Mark Complete <CircleCheck size={12} />
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        </div>

        <!-- Done -->
        <div
            class="flex flex-col h-full bg-emerald-500/5 rounded-xl border border-emerald-500/10"
        >
            <div
                class="p-4 border-b border-border/40 flex justify-between items-center sticky top-0 bg-emerald-500/5 backdrop-blur-md rounded-t-xl z-10"
            >
                <h4
                    class="font-bold text-sm uppercase tracking-widest text-emerald-800 flex items-center gap-2"
                >
                    <Flag size={16} /> ACCOMPLISHED
                    <span
                        class="bg-emerald-200 px-2 py-0.5 rounded-full text-[10px]"
                        >{done.length}</span
                    >
                </h4>
            </div>
            <div class="p-4 space-y-3 overflow-y-auto flex-1">
                {#each done as task (task.id)}
                    <div
                        class="bg-white/40 p-4 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
                    >
                        <h5
                            class="font-medium text-foreground line-through decoration-muted-foreground leading-snug"
                        >
                            {task.title}
                        </h5>
                        <div class="flex justify-end mt-2">
                            <button
                                on:click={() => moveTask(task, "todo")}
                                class="text-[10px] font-bold text-muted-foreground hover:text-primary"
                                >Re-open</button
                            >
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>
