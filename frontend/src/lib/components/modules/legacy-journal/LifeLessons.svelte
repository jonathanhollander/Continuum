<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import { Tag, Plus, Filter, Search, X } from "lucide-svelte";
    import SmartTextarea from "$lib/components/ui/SmartTextarea.svelte";
    import { onMount } from "svelte";

    // --- Types ---
    interface Lesson {
        id: number;
        title: string;
        category: string;
        preview: string;
        tags: string[];
    }

    let tags = ["All", "Career", "Love", "Money", "Parenting", "Resilience"];
    let activeTag = "All";

    let lessons: Lesson[] = [];
    let showAddModal = false;
    let newLesson: Partial<Lesson> = {
        title: "",
        category: "Life",
        preview: "",
        tags: ["Life"],
    };

    import { getStored, setStored } from "$lib/stores/persistence";

    // ... imports

    const STORAGE_KEY = "life_lessons";

    onMount(() => {
        const defaults = [
            {
                id: 1,
                title: "The 80/20 Rule of Happiness",
                category: "Life",
                preview:
                    "Focus on the 20% of activities that bring 80% of your joy.",
                tags: ["Life", "Happiness"],
            },
            {
                id: 2,
                title: "Compound Interest Applies to Relationships",
                category: "Relationships",
                preview:
                    "Small, consistent acts of kindness matter more than grand gestures.",
                tags: ["Love", "Relationships"],
            },
            {
                id: 3,
                title: "Never Sign Anything When Hungry",
                category: "Business",
                preview:
                    "Always take a step back. Hunger—for food or success—clouds judgment.",
                tags: ["Career", "Money"],
            },
        ];

        lessons = getStored(STORAGE_KEY, defaults);
    });

    function save() {
        setStored(STORAGE_KEY, lessons);
    }

    function addLesson() {
        if (!newLesson.title) return;
        lessons = [{ ...newLesson, id: Date.now() } as Lesson, ...lessons];
        save();
        showAddModal = false;
        newLesson = {
            title: "",
            category: "Life",
            preview: "",
            tags: ["Life"],
        };
    }

    function removeLesson(id: number) {
        if (!confirm("Delete this lesson?")) return;
        lessons = lessons.filter((l) => l.id !== id);
        save();
    }

    $: filteredLessons =
        activeTag === "All"
            ? lessons
            : lessons.filter(
                  (l) => l.tags.includes(activeTag) || l.category === activeTag,
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
                        Share Wisdom
                    </h3>
                    <button on:click={() => (showAddModal = false)}
                        ><X
                            size={20}
                            class="text-gray-400 hover:text-gray-600"
                        /></button
                    >
                </div>
                <div class="p-6 space-y-4">
                    <div class="space-y-2">
                        <label class="text-xs font-bold uppercase text-gray-400"
                            >Lesson Title</label
                        >
                        <input
                            bind:value={newLesson.title}
                            class="w-full p-3 rounded-xl border border-gray-200 focus:border-[#4A7C74] outline-none font-bold text-lg"
                            placeholder="e.g. Trust your gut"
                        />
                    </div>
                    <div class="space-y-2">
                        <label class="text-xs font-bold uppercase text-gray-400"
                            >Category</label
                        >
                        <select
                            bind:value={newLesson.category}
                            class="w-full p-3 rounded-xl border border-gray-200 focus:border-[#4A7C74] outline-none bg-white"
                        >
                            <option>Life</option>
                            <option>Career</option>
                            <option>Love</option>
                            <option>Money</option>
                            <option>Parenting</option>
                        </select>
                    </div>
                    <div class="space-y-2">
                        <label class="text-xs font-bold uppercase text-gray-400"
                            >The Lesson</label
                        >
                        <SmartTextarea
                            context="life_lesson"
                            bind:value={newLesson.preview}
                            placeholder="What did you learn?"
                            minHeight="150px"
                        />
                    </div>
                    <button
                        on:click={addLesson}
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
                    on:click={() => (activeTag = tag)}
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
                    placeholder="Search wisdom..."
                    class="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 focus:border-[#4A7C74] focus:ring-0 text-sm bg-white"
                />
            </div>
            <button
                on:click={() => (showAddModal = true)}
                class="p-2 bg-[#4A7C74] text-white rounded-xl shadow-lg hover:bg-[#3b635d] transition-colors"
            >
                <Plus size={20} />
            </button>
        </div>
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each filteredLessons as lesson (lesson.id)}
            <div
                in:scale={{ duration: 300, start: 0.95 }}
                class="group bg-white rounded-2xl p-6 border border-stone-200 shadow-sm hover:shadow-md hover:border-[#4A7C74]/50 transition-all cursor-pointer h-full flex flex-col relative"
            >
                <button
                    on:click|stopPropagation={() => removeLesson(lesson.id)}
                    class="absolute top-2 right-2 p-1.5 bg-gray-50 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                >
                    <X size={14} />
                </button>

                <div class="mb-4">
                    <span
                        class="inline-block px-2.5 py-1 rounded-md bg-stone-100 text-xs font-bold text-stone-500 tracking-wide uppercase"
                    >
                        {lesson.category}
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
                    {lesson.preview}
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
                        >Read Lesson →</span
                    >
                </div>
            </div>
        {/each}

        <!-- Add New Card -->
        <button
            on:click={() => (showAddModal = true)}
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
</div>
