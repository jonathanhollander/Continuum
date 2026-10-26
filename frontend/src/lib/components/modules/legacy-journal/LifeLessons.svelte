<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import { Plus, Search, X } from "lucide-svelte";
    import SmartTextarea from "$lib/components/ui/SmartTextarea.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte";
    import { journalStore, type JournalEntry } from "$lib/stores/journalStore.svelte";
    import { activityLog } from "$lib/stores/activityLog.svelte";

    // Each lesson is a JournalEntry: type "life_lesson", title, content = the lesson,
    // tags = its category.
    const categories = ["Life", "Career", "Love", "Money", "Parenting", "Resilience"];
    let tags = ["All", ...categories];
    let activeTag = $state("All");
    let searchQuery = $state("");
    let showAddModal = $state(false);
    let editingId = $state<number | undefined>(undefined);

    const blankLesson = () => ({ title: "", category: "Life", content: "" });
    let newLesson = $state(blankLesson());

    let lessons = $derived(journalStore.items.filter((e) => e.type === "life_lesson"));

    function openNew() {
        editingId = undefined;
        newLesson = blankLesson();
        showAddModal = true;
    }

    function openEdit(lesson: JournalEntry) {
        editingId = lesson.id;
        newLesson = {
            title: lesson.title ?? "",
            category: lesson.tags || "Life",
            content: lesson.content ?? "",
        };
        showAddModal = true;
    }

    async function saveLesson() {
        if (!newLesson.title.trim()) return;
        const data = {
            title: newLesson.title.trim(),
            tags: newLesson.category || "Life",
            content: newLesson.content || "",
        };
        try {
            let entityId: number | undefined = editingId;
            if (editingId !== undefined) {
                await journalStore.update(editingId, data);
            } else {
                const created = (await journalStore.create({ type: "life_lesson", ...data })) as
                    | JournalEntry
                    | undefined;
                entityId = created?.id;
            }
            activityLog.logEvent({
                module: "Life Lessons",
                action: editingId !== undefined ? "UPDATE" : "CREATE",
                entityType: "Lesson",
                entityId: String(entityId ?? ""),
                entityName: data.title,
                userContext: "User",
            });
            showAddModal = false;
            editingId = undefined;
            newLesson = blankLesson();
        } catch {
            // SyncManager showed a gentle message; the form keeps the person's words.
        }
    }

    function removeLesson(id?: number) {
        if (id === undefined) return;
        if (!confirm("Remove this lesson? You can add it back later.")) return;
        journalStore.delete(id);
    }

    // Filter Logic
    let filteredLessons = $derived(
        lessons.filter((l) => {
            if (activeTag !== "All" && (l.tags || "Life") !== activeTag) return false;
            const q = searchQuery.trim().toLowerCase();
            if (!q) return true;
            return (
                (l.title ?? "").toLowerCase().includes(q) ||
                (l.content ?? "").toLowerCase().includes(q)
            );
        }),
    );
</script>

<div class="space-y-8">
    <!-- Add Modal -->
    {#if showAddModal}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            transition:fade
        >
            <div
                class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                in:scale
            >
                <div
                    class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50"
                >
                    <h3 class="font-serif font-bold text-xl text-[#304743]">
                        {editingId !== undefined ? "Refine this lesson" : "Share Wisdom"}
                    </h3>
                    <button onclick={() => (showAddModal = false)}
                        ><X
                            size={20}
                            class="text-gray-400 hover:text-gray-600"
                        /></button
                    >
                </div>
                <div class="p-6 space-y-4">
                    <div class="space-y-2">
                        <label
                            for="lesson-title"
                            class="text-xs font-bold uppercase text-gray-400"
                            >Lesson Title</label
                        >
                        <input
                            id="lesson-title"
                            bind:value={newLesson.title}
                            class="w-full p-3 rounded-xl border border-gray-200 focus:border-[#4A7C74] outline-none font-bold text-lg"
                            placeholder="e.g. Trust your gut"
                        />
                    </div>
                    <div class="space-y-2">
                        <label
                            for="lesson-category"
                            class="text-xs font-bold uppercase text-gray-400"
                            >Category</label
                        >
                        <select
                            id="lesson-category"
                            bind:value={newLesson.category}
                            class="w-full p-3 rounded-xl border border-gray-200 focus:border-[#4A7C74] outline-none bg-white"
                        >
                            {#each categories as c}
                                <option>{c}</option>
                            {/each}
                        </select>
                    </div>
                    <div class="space-y-2">
                        <label
                            for="lesson-content"
                            class="text-xs font-bold uppercase text-gray-400"
                            >The Lesson</label
                        >
                        <SmartTextarea
                            context="life_lesson"
                            bind:value={newLesson.content}
                            placeholder="What did you learn?"
                            minHeight="150px"
                        />
                    </div>
                    <button
                        onclick={saveLesson}
                        class="w-full py-3 bg-[#4A7C74] text-white rounded-xl font-bold mt-2"
                        >Save Lesson</button
                    >
                </div>
            </div>
        </div>
    {/if}

    <!-- Controls -->
    <div class="flex flex-col md:flex-row gap-4 justify-between items-center">
        <!-- Tags -->
        <div class="flex flex-wrap gap-2">
            {#each tags as tag}
                <button
                    onclick={() => (activeTag = tag)}
                    class="px-4 py-1.5 rounded-full text-sm font-bold transition-all border
                    {activeTag === tag
                        ? 'bg-[#304743] border-[#304743] text-white'
                        : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300'}"
                >
                    {tag}
                </button>
            {/each}
        </div>

        <!-- Search / Filter -->
        <div class="flex items-center gap-2 w-full md:w-auto">
            <div class="relative w-full md:w-64">
                <Search
                    size={16}
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Search wisdom..."
                    class="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 focus:border-[#4A7C74] focus:ring-0 text-sm bg-white"
                />
            </div>
            <button
                onclick={openNew}
                aria-label="Add a lesson"
                class="p-2 bg-[#4A7C74] text-white rounded-xl shadow-lg hover:bg-[#3b635d] transition-colors"
            >
                <Plus size={20} />
            </button>
        </div>
    </div>

    <!-- Grid -->
    {#if lessons.length === 0}
        <div
            class="space-y-4 border border-dashed border-stone-200 rounded-2xl p-8 bg-stone-50/50"
        >
            <div class="text-center mb-6">
                <h3 class="font-serif font-bold text-xl text-stone-600">
                    Your Wisdom Library
                </h3>
                <p class="text-sm text-stone-400">
                    Capture the lessons that defined your journey.
                </p>
            </div>

            <GhostRow type="Lesson" onClick={openNew} />
            <GhostRow type="Lesson" onClick={openNew} />

            <div class="flex justify-center mt-6">
                <button
                    onclick={openNew}
                    class="px-6 py-2 bg-[#4A7C74] text-white rounded-full font-bold shadow-lg hover:bg-[#3b635d] transition-all"
                >
                    + Write First Lesson
                </button>
            </div>
        </div>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each filteredLessons as lesson (lesson.id)}
                <div
                    in:scale={{ duration: 300, start: 0.95 }}
                    onclick={() => openEdit(lesson)}
                    onkeydown={(e) => e.key === "Enter" && openEdit(lesson)}
                    role="button"
                    tabindex="0"
                    data-testid="life-lesson"
                    class="group bg-white rounded-2xl p-6 border border-stone-200 shadow-sm hover:shadow-md hover:border-[#4A7C74]/50 transition-all cursor-pointer h-full flex flex-col relative"
                >
                    <button
                        onclick={(e) => {
                            e.stopPropagation();
                            removeLesson(lesson.id);
                        }}
                        class="absolute top-2 right-2 p-1.5 bg-gray-50 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                    >
                        <X size={14} />
                    </button>

                    <div class="mb-4">
                        <span
                            class="inline-block px-2.5 py-1 rounded-md bg-stone-100 text-xs font-bold text-stone-500 tracking-wide uppercase"
                        >
                            {lesson.tags || "Life"}
                        </span>
                    </div>

                    <h3
                        class="text-xl font-serif font-bold text-[#304743] mb-3 leading-tight group-hover:text-[#4A7C74] transition-colors"
                    >
                        {lesson.title}
                    </h3>

                    <p
                        class="text-muted-foreground text-sm leading-relaxed mb-6 flex-grow"
                    >
                        {lesson.content}
                    </p>

                    <div
                        class="flex justify-between items-center pt-4 border-t border-stone-100"
                    >
                        <div class="flex -space-x-2">
                            <!-- Placeholder for "Shared With" faces -->
                            <div
                                class="w-6 h-6 rounded-full bg-stone-200 border-2 border-white"
                            ></div>
                            <div
                                class="w-6 h-6 rounded-full bg-stone-300 border-2 border-white"
                            ></div>
                        </div>
                        <span
                            class="text-xs font-bold text-[#4A7C74] group-hover:underline"
                            >Open lesson →</span
                        >
                    </div>
                </div>
            {/each}

            <!-- Add New Card -->
            <button
                onclick={openNew}
                class="border-2 border-dashed border-stone-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-stone-50 hover:border-[#4A7C74] hover:text-[#4A7C74] transition-all min-h-[250px] group w-full"
            >
                <div
                    class="w-16 h-16 rounded-full bg-stone-100 group-hover:bg-[#4A7C74]/10 flex items-center justify-center mb-4 transition-colors"
                >
                    <Plus
                        size={32}
                        class="text-stone-400 group-hover:text-[#4A7C74]"
                    />
                </div>
                <h3 class="font-bold text-lg mb-1">Add a New Lesson</h3>
                <p class="text-sm text-stone-400 max-w-[200px]">
                    Capture a thought, a quote, or a story before it fades.
                </p>
            </button>
        </div>
    {/if}
</div>
