<script lang="ts">
    import {
        Heart,
        Image,
        Scroll,
        MapPin,
        Music,
        Plus,
        X,
        Upload,
        PlayCircle,
        PauseCircle,
        ChevronLeft,
        ChevronRight,
        Pencil,
    } from "lucide-svelte";
    import { fade, slide, scale } from "svelte/transition";
    import FileUploader from "$lib/components/ui/FileUploader.svelte";
    import EducationalResources from "$lib/components/family/EducationalResources.svelte";
    import FamilyTreeGraph from "$lib/components/family/FamilyTreeGraph.svelte";
    import BlueprintCard from "$lib/components/ui/BlueprintCard.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte";
    import ConciergeFlow from "$lib/components/concierge/ConciergeFlow.svelte";
    import { onMount } from "svelte";
    import { estateProfile } from "$lib/stores/estateStore";
    import { activityLog } from "$lib/stores/activityLog";
    import { t, language } from "$lib/stores/localization";
    import { getSmartSamples } from "$lib/data/smartSamples";

    // --- State & Types ---
    type MemoryType = "photo" | "recipe" | "quote";
    let viewMode = $state<"dashboard" | "concierge">("dashboard"); // Default to dashboard for now, or check memories later

    interface Memory {
        id: number;
        type: MemoryType;
        title: string;
        date?: string;
        image?: string;
        desc?: string;
        text?: string;
        author?: string;
    }

    let memories = $state<Memory[]>([]);
    let showAddModal = $state(false);

    // Form Mock-Model
    let newMemory = $state<Partial<Memory> & { id?: number }>({
        type: "photo",
        title: "",
        desc: "",
        image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80", // Default placeholder
        author: $estateProfile.ownerName || "Me",
        date: new Date().getFullYear().toString(),
    });

    import { getStored, setStored } from "$lib/stores/persistence";

    // ... imports

    const STORAGE_KEY = "family_memories";

    onMount(() => {
        // Default Seed Data (DISABLED FOR GHOST ROW TEST - UNCOMMENT TO RESTORE)
        /*
        const defaults: Memory[] = [
           ...
        ];
        */

        memories = getStored<Memory[]>(STORAGE_KEY, []); // Start empty to test Ghost Rows
        // if (memories.length === 0) {
        //     viewMode = "concierge";
        // }
    });

    function handleConciergeAnswer(e: CustomEvent) {
        // Logic to handle intermediate answers if needed
    }

    function handleConciergeComplete(e: CustomEvent) {
        const answers = e.detail;

        // Auto-create a memory from the concierge answer
        if (answers.fav_memory) {
            const newId = Date.now();
            memories = [
                {
                    id: newId,
                    type: "quote",
                    title: "My Favorite Memory",
                    text: answers.fav_memory,
                    author: "Me",
                },
                ...memories,
            ];
            save();
        }

        viewMode = "dashboard";
    }

    function save() {
        setStored(STORAGE_KEY, memories);
    }

    function saveMemory() {
        if (!newMemory.title) return;

        if (newMemory.id) {
            // Edit Mode
            const oldMemory = memories.find((m) => m.id === newMemory.id);
            const changes = [];

            if (oldMemory) {
                if (oldMemory.title !== newMemory.title)
                    changes.push({
                        field: "title",
                        oldValue: oldMemory.title,
                        newValue: newMemory.title,
                    });
                if (oldMemory.desc !== newMemory.desc)
                    changes.push({
                        field: "description",
                        oldValue: oldMemory.desc,
                        newValue: newMemory.desc,
                    });
                if (oldMemory.text !== newMemory.text)
                    changes.push({
                        field: "text",
                        oldValue: oldMemory.text,
                        newValue: newMemory.text,
                    });
            }

            memories = memories.map((m) =>
                m.id === newMemory.id ? ({ ...newMemory } as Memory) : m,
            );

            // Log UPDATE
            activityLog.logEvent({
                module: "Family Hub",
                action: "UPDATE",
                entityType: "Memory",
                entityId: String(newMemory.id),
                entityName: newMemory.title || "Unnamed Memory",
                changes,
                userContext: $estateProfile.ownerName || "User",
            });
        } else {
            // Create Mode
            const newId = Date.now();
            memories = [{ ...newMemory, id: newId } as Memory, ...memories];

            // Log CREATE
            activityLog.logEvent({
                module: "Family Hub",
                action: "CREATE",
                entityType: "Memory",
                entityId: String(newId),
                entityName: newMemory.title || "Unnamed Memory",
                userContext: $estateProfile.ownerName || "User",
            });
        }

        save();
        resetForm();
    }

    function editMemory(memory: Memory) {
        newMemory = { ...memory };
        showAddModal = true;
    }

    function resetForm() {
        showAddModal = false;
        newMemory = {
            id: undefined,
            type: "photo",
            title: "",
            desc: "",
            author: $estateProfile.ownerName || "Me",
            image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80",
            date: new Date().getFullYear().toString(),
        };
    }

    function deleteMemory(id: number) {
        if (!confirm("Remove this memory?")) return;
        memories = memories.filter((m) => m.id !== id);
        save();
    }

    const collections = [
        {
            title: "Photo Albums",
            icon: Image,
            color: "bg-rose-100 text-rose-600",
            count: 12,
        },
        {
            title: "Family Recipes",
            icon: Scroll,
            color: "bg-amber-100 text-amber-600",
            count: 8,
        },
        {
            title: "Places We Loved",
            icon: MapPin,
            color: "bg-emerald-100 text-emerald-600",
            count: 5,
        },
        {
            title: "Our Playlist",
            icon: Music,
            color: "bg-purple-100 text-purple-600",
            count: 1,
        },
    ];

    // Slideshow Logic
    let showSlideshow = $state(false);
    let currentSlide = $state(0);
    let isPlaying = $state(true);
    let slideInterval: any;

    let photoMemories = $derived(memories.filter((m) => m.type === "photo"));

    function startSlideshow() {
        if (photoMemories.length === 0) return alert("Add some photos first!");
        showSlideshow = true;
        currentSlide = 0;
        isPlaying = true;
        startTimer();
    }

    function startTimer() {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 4000);
    }

    function stopTimer() {
        clearInterval(slideInterval);
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % photoMemories.length;
    }

    function prevSlide() {
        currentSlide =
            (currentSlide - 1 + photoMemories.length) % photoMemories.length;
        if (isPlaying) startTimer(); // Reset timer if playing
    }

    function togglePlay() {
        isPlaying = !isPlaying;
        if (isPlaying) startTimer();
        else stopTimer();
    }

    function closeSlideshow() {
        showSlideshow = false;
        stopTimer();
    }
</script>

<div class="min-h-screen bg-[#FDFBF7]">
    <!-- Add Memory Modal -->
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
                        Preserve a Memory
                    </h3>
                    <button
                        onclick={resetForm}
                        class="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <X size={20} class="text-gray-500" />
                    </button>
                </div>
                <div class="p-6 space-y-4">
                    <!-- Type Selector -->
                    <div class="flex gap-2 p-1 bg-gray-100 rounded-lg">
                        <button
                            class="flex-1 py-2 text-sm font-bold rounded-md transition-all {newMemory.type ===
                            'photo'
                                ? 'bg-white shadow text-[#4A7C74]'
                                : 'text-gray-500 hover:text-gray-700'}"
                            onclick={() => (newMemory.type = "photo")}
                            >Photo</button
                        >
                        <button
                            class="flex-1 py-2 text-sm font-bold rounded-md transition-all {newMemory.type ===
                            'recipe'
                                ? 'bg-white shadow text-[#4A7C74]'
                                : 'text-gray-500 hover:text-gray-700'}"
                            onclick={() => (newMemory.type = "recipe")}
                            >Recipe</button
                        >
                        <button
                            class="flex-1 py-2 text-sm font-bold rounded-md transition-all {newMemory.type ===
                            'quote'
                                ? 'bg-white shadow text-[#4A7C74]'
                                : 'text-gray-500 hover:text-gray-700'}"
                            onclick={() => (newMemory.type = "quote")}
                            >Quote</button
                        >
                    </div>

                    <div class="space-y-2">
                        <label
                            class="text-xs font-bold uppercase text-gray-400"
                        >
                            Title
                            <input
                                bind:value={newMemory.title}
                                class="w-full p-3 rounded-xl border border-gray-200 focus:border-[#4A7C74] focus:ring-0 outline-none font-serif text-lg mt-1"
                                placeholder="e.g. Summer Vacation 2005"
                            />
                        </label>
                    </div>

                    {#if newMemory.type === "photo"}
                        <div class="space-y-4">
                            <FileUploader
                                label="Memory Photo"
                                bind:imageUrl={newMemory.image}
                            />
                            {#if !newMemory.image}
                                <div class="space-y-1">
                                    <label
                                        class="text-xs font-bold uppercase text-gray-400"
                                    >
                                        Or Paste URL
                                        <input
                                            bind:value={newMemory.image}
                                            class="w-full p-3 rounded-xl border border-gray-200 focus:border-[#4A7C74] outline-none text-sm mt-1"
                                            placeholder="https://..."
                                        />
                                    </label>
                                </div>
                            {/if}
                        </div>
                        <div class="space-y-2">
                            <label
                                class="text-xs font-bold uppercase text-gray-400"
                            >
                                Date / Year
                                <input
                                    bind:value={newMemory.date}
                                    class="w-full p-3 rounded-xl border border-gray-200 focus:border-[#4A7C74] outline-none mt-1"
                                    placeholder="e.g. July 2005"
                                />
                            </label>
                        </div>
                    {:else if newMemory.type === "recipe"}
                        <div class="space-y-2">
                            <label
                                class="text-xs font-bold uppercase text-gray-400"
                            >
                                Description / Ingredients
                                <textarea
                                    bind:value={newMemory.desc}
                                    class="w-full p-3 rounded-xl border border-gray-200 focus:border-[#4A7C74] outline-none h-24 resize-none mt-1"
                                    placeholder="Secret ingredients..."
                                ></textarea>
                            </label>
                        </div>
                    {:else if newMemory.type === "quote"}
                        <div class="space-y-2">
                            <label
                                class="text-xs font-bold uppercase text-gray-400"
                            >
                                Quote Text
                                <textarea
                                    bind:value={newMemory.text}
                                    class="w-full p-3 rounded-xl border border-gray-200 focus:border-[#4A7C74] outline-none h-24 resize-none font-serif italic text-lg mt-1"
                                    placeholder="'Stay hungry, stay foolish...'"
                                ></textarea>
                            </label>
                        </div>
                        <div class="space-y-2">
                            <label
                                class="text-xs font-bold uppercase text-gray-400"
                            >
                                Attribution
                                <input
                                    bind:value={newMemory.author}
                                    class="w-full p-3 rounded-xl border border-gray-200 focus:border-[#4A7C74] outline-none mt-1"
                                    placeholder="e.g. Grandma"
                                />
                            </label>
                        </div>
                    {/if}

                    <button
                        onclick={saveMemory}
                        class="w-full py-4 bg-[#4A7C74] text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-[#3b635d] transition-all transform active:scale-95"
                    >
                        {newMemory.id ? "Update Memory" : "Save Memory"}
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Hero Section -->
    <section
        class="relative h-[400px] overflow-hidden flex items-center justify-center text-center px-4"
    >
        <div
            class="absolute inset-0 bg-gradient-to-b from-rose-50/80 to-[#FDFBF7] z-10"
        ></div>
        <img
            src="https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1600&q=80"
            alt="Family gathering"
            class="absolute inset-0 w-full h-full object-cover opacity-20"
        />

        <div class="relative z-20 max-w-2xl mx-auto space-y-6" in:fade>
            <div
                class="inline-flex items-center justify-center p-3 bg-white/80 backdrop-blur-sm rounded-full shadow-sm mb-4"
            >
                <Heart class="w-6 h-6 text-rose-500 fill-rose-500" />
            </div>
            <h1
                class="font-serif text-5xl md:text-6xl text-slate-800 tracking-tight"
            >
                The Family Hub
            </h1>
            <p class="text-xl text-slate-600 font-light leading-relaxed">
                A gathering place for our shared history, cherished memories,
                and the legacy that connects us all.
            </p>
        </div>
    </section>

    <!-- Family Network Visualizer -->
    <section class="max-w-7xl mx-auto px-6 -mt-16 relative z-30 mb-20">
        <div
            class="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100"
        >
            <div
                class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50"
            >
                <div>
                    <h2 class="font-serif text-2xl text-slate-800">
                        Family Network
                    </h2>
                    <p class="text-slate-500 text-sm">
                        Interactive map of your estate hierarchy and key roles.
                    </p>
                </div>
            </div>
            <div class="h-[600px] w-full bg-slate-50">
                <FamilyTreeGraph />
            </div>
        </div>
    </section>

    {#if viewMode === "concierge"}
        <div class="max-w-4xl mx-auto px-6 py-12" in:fade>
            <ConciergeFlow
                steps={[
                    {
                        id: "intro",
                        question: $t("wizard.start"),
                        type: "text",
                        placeholder: "Press Enter...",
                        required: false,
                    },
                    {
                        id: "fav_memory",
                        question:
                            "What is one favorite memory you want to preserve right now?",
                        type: "textarea",
                        placeholder: "I remember when...",
                        required: true,
                    },
                    {
                        id: "role",
                        question: "Who are you preserving this legacy for?",
                        type: "select",
                        options: [
                            "My Children",
                            "My Spouse",
                            "Myself",
                            "Future Generations",
                        ],
                        required: true,
                    },
                ]}
                oncomplete={handleConciergeComplete}
            />
            <div class="text-center mt-8">
                <button
                    onclick={() => (viewMode = "dashboard")}
                    class="text-slate-400 hover:text-slate-600 underline text-sm"
                >
                    Skip tour, go to dashboard
                </button>
            </div>
        </div>
    {:else}
        <div class="max-w-6xl mx-auto px-6 pb-20 relative z-30" in:fade>
            <!-- BLUEPRINT HEADER -->
            <div class="mb-12">
                ...
                <BlueprintCard
                    title="Establish Your Family Network"
                    description="Your estate plan relies on trusted people. Identify your key players to unlock the full power of the Continuum."
                    timeEstimate="5 mins"
                    steps={[
                        {
                            label: "Connect 3 Family Members",
                            completed: memories.length >= 3,
                        } /* Using memories.length as proxy for now, but should be Family Members */,
                        { label: "Designate an Executor", completed: false },
                        {
                            label: "Upload a Shared Memory",
                            completed: memories.length > 0,
                        },
                    ]}
                />
            </div>

            <!-- Quick Access Collections -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                {#each collections as item}
                    <button
                        class="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group text-center"
                    >
                        <div
                            class="w-12 h-12 rounded-full {item.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform"
                        >
                            <svelte:component
                                this={item.icon}
                                class="w-6 h-6"
                            />
                        </div>
                        <h3 class="font-bold text-slate-800 mb-1">
                            {item.title}
                        </h3>
                        <div
                            class="text-xs text-slate-400 font-medium uppercase tracking-wider"
                        >
                            {item.count} Items
                        </div>
                    </button>
                {/each}
            </div>

            <!-- Latest Memories Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Feed Column -->
                <div class="md:col-span-2 space-y-8">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <h2 class="font-serif text-3xl text-slate-800">
                                Latest Memories
                            </h2>
                            {#if memories.length > 0}
                                <button
                                    onclick={startSlideshow}
                                    class="text-xs font-bold text-[#4A7C74] bg-[#4A7C74]/10 px-3 py-1.5 rounded-full hover:bg-[#4A7C74]/20 transition-colors flex items-center gap-1"
                                >
                                    <PlayCircle size={14} /> Slideshow
                                </button>
                            {/if}
                        </div>
                        <button
                            onclick={() => (showAddModal = true)}
                            class="flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-700 rounded-full font-bold hover:bg-rose-200 transition-colors"
                        >
                            <Plus size={18} /> Add Memory
                        </button>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {#if memories.length === 0}
                            <!-- GHOST ROWS -->
                            <div class="col-span-full flex justify-center mb-4">
                                <button
                                    onclick={() => (viewMode = "concierge")}
                                    class="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full hover:bg-indigo-100 transition-colors flex items-center gap-2"
                                >
                                    <Pencil size={16} />
                                    {$t("wizard.start")}
                                </button>
                            </div>

                            {#each getSmartSamples($language).memories || [] as sample}
                                <GhostRow
                                    name={sample.name}
                                    subtitle={sample.description}
                                    type="Memory"
                                    onClick={() => {
                                        newMemory = {
                                            ...newMemory,
                                            title: sample.name,
                                            desc: sample.description,
                                            type:
                                                sample.type === "Recipe"
                                                    ? "recipe"
                                                    : sample.type === "Quote"
                                                      ? "quote"
                                                      : "photo",
                                        };
                                        showAddModal = true;
                                    }}
                                >
                                    <svelte:fragment slot="icon">
                                        <svelte:component
                                            this={sample.type === "Recipe"
                                                ? Scroll
                                                : sample.type === "Quote"
                                                  ? Plus
                                                  : Image}
                                            size={20}
                                            class="text-slate-400"
                                        />
                                    </svelte:fragment>
                                </GhostRow>
                            {/each}
                        {:else}
                            {#each memories as memory (memory.id)}
                                <div
                                    class="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative"
                                    in:fade
                                >
                                    <!-- Delete Button (Hover) -->
                                    <button
                                        onclick={() => editMemory(memory)}
                                        class="absolute top-2 right-10 p-1.5 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-blue-100 text-blue-500"
                                        title="Edit Memory"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onclick={() => deleteMemory(memory.id)}
                                        class="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-100 text-red-500"
                                        title="Delete Memory"
                                    >
                                        <X size={14} />
                                    </button>

                                    {#if memory.type === "photo"}
                                        <div
                                            class="aspect-[4/3] overflow-hidden bg-gray-100"
                                        >
                                            <img
                                                src={memory.image}
                                                alt={memory.title}
                                                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                        <div class="p-4">
                                            <h3
                                                class="font-bold text-slate-800 text-lg leading-tight group-hover:text-rose-600 transition-colors"
                                            >
                                                {memory.title}
                                            </h3>
                                            <p
                                                class="text-xs text-slate-400 mt-2 font-medium tracking-wide uppercase"
                                            >
                                                {memory.date}
                                            </p>
                                        </div>
                                    {:else if memory.type === "recipe"}
                                        <div
                                            class="p-6 bg-amber-50 h-full flex flex-col"
                                        >
                                            <div
                                                class="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-4 text-amber-500 shadow-sm"
                                            >
                                                <Scroll class="w-5 h-5" />
                                            </div>
                                            <h3
                                                class="font-serif text-xl text-amber-900 font-bold mb-2"
                                            >
                                                {memory.title}
                                            </h3>
                                            <p
                                                class="text-sm text-amber-800/80 leading-relaxed italic"
                                            >
                                                "{memory.desc}"
                                            </p>
                                        </div>
                                    {:else if memory.type === "quote"}
                                        <div
                                            class="p-8 bg-slate-800 h-full flex flex-col justify-center text-center items-center"
                                        >
                                            <p
                                                class="font-serif text-xl text-white leading-relaxed mb-4"
                                            >
                                                "{memory.text}"
                                            </p>
                                            <div
                                                class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                                            >
                                                — {memory.author}
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                            {/each}
                        {/if}
                    </div>
                </div>

                <!-- Sidebar / Timeline Preview -->
                <div class="space-y-8">
                    <!-- Educational Resources Widget -->
                    <button
                        class="bg-[#304743] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group cursor-pointer text-left w-full"
                        onclick={() =>
                            document
                                .getElementById("educational-section")
                                ?.scrollIntoView({ behavior: "smooth" })}
                    >
                        <div
                            class="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500"
                        >
                            <PlayCircle size={120} />
                        </div>
                        <div class="relative z-10">
                            <h3 class="font-serif font-bold text-xl mb-2">
                                Learning Center
                            </h3>
                            <p
                                class="text-emerald-100/80 text-sm mb-4 line-clamp-2"
                            >
                                Watch our guide videos to understand your role
                                in the estate plan.
                            </p>
                            <span
                                class="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full"
                            >
                                5 Videos Available
                            </span>
                        </div>
                    </button>

                    <div
                        class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
                    >
                        <h3
                            class="font-bold text-slate-800 mb-4 flex items-center gap-2"
                        >
                            <MapPin class="w-4 h-4 text-emerald-500" />
                            Our Journey
                        </h3>
                        <div
                            class="space-y-6 relative pl-4 border-l-2 border-slate-100"
                        >
                            <div class="relative">
                                <div
                                    class="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm"
                                ></div>
                                <div
                                    class="text-xs font-bold text-slate-400 mb-1"
                                >
                                    2024
                                </div>
                                <div class="font-medium text-slate-800">
                                    Moved to Seattle
                                </div>
                            </div>
                            <div class="relative">
                                <div
                                    class="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-300 border-2 border-white"
                                ></div>
                                <div
                                    class="text-xs font-bold text-slate-400 mb-1"
                                >
                                    2018
                                </div>
                                <div class="font-medium text-slate-800">
                                    Trip to Italy
                                </div>
                            </div>
                            <div class="relative">
                                <div
                                    class="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-300 border-2 border-white"
                                ></div>
                                <div
                                    class="text-xs font-bold text-slate-400 mb-1"
                                >
                                    2010
                                </div>
                                <div class="font-medium text-slate-800">
                                    Bought the Cabin
                                </div>
                            </div>
                        </div>
                        <div
                            class="mt-4 pt-4 border-t border-slate-100 text-center"
                        >
                            <a
                                href="/modules/timeline"
                                class="text-xs font-bold text-[#4A7C74] hover:underline"
                                >Manage Full Timeline →</a
                            >
                        </div>
                    </div>
                </div>
            </div>

            <!-- Educational Resources Section -->
            <div
                id="educational-section"
                class="mt-20 pt-10 border-t border-slate-200"
            >
                <h2 class="font-serif text-3xl text-slate-800 mb-8 text-center">
                    Family Learning Center
                </h2>
                <EducationalResources />
            </div>
        </div>
    {/if}

    <!-- Slideshow Overlay -->
    {#if showSlideshow && photoMemories.length > 0}
        <div
            transition:fade
            class="fixed inset-0 z-[100] bg-black flex items-center justify-center p-0"
        >
            <!-- Background Blur -->
            <div
                class="absolute inset-0 opacity-50 blur-3xl scale-110 pointer-events-none"
            >
                <img
                    src={photoMemories[currentSlide].image}
                    alt=""
                    class="w-full h-full object-cover"
                />
            </div>

            <!-- Main Slide -->
            <div
                class="relative w-full h-full max-w-7xl mx-auto flex flex-col justify-center items-center p-8 z-10"
            >
                <div
                    class="relative w-full h-[80vh] flex items-center justify-center"
                >
                    {#key currentSlide}
                        <img
                            in:fade={{ duration: 1000 }}
                            src={photoMemories[currentSlide].image}
                            alt={photoMemories[currentSlide].title}
                            class="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        />
                    {/key}
                </div>

                <!-- Caption -->
                <div class="mt-8 text-center text-white/90 space-y-2">
                    <h2 class="font-serif text-3xl font-bold">
                        {photoMemories[currentSlide].title}
                    </h2>
                    <p class="text-lg font-light tracking-wide opacity-80">
                        {photoMemories[currentSlide].date}
                    </p>
                </div>
            </div>

            <!-- Controls Overlay -->
            <div
                class="absolute inset-0 z-20 flex flex-col justify-between p-8 pointer-events-none"
            >
                <div class="flex justify-end pointer-events-auto">
                    <button
                        onclick={closeSlideshow}
                        class="p-4 bg-black/20 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div
                    class="flex items-center justify-center gap-8 pointer-events-auto pb-8"
                >
                    <button
                        onclick={prevSlide}
                        class="p-4 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all"
                    >
                        <ChevronLeft size={32} />
                    </button>

                    <button
                        onclick={togglePlay}
                        class="p-6 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all scale-100 hover:scale-110"
                    >
                        {#if isPlaying}
                            <PauseCircle size={48} />
                        {:else}
                            <PlayCircle size={48} />
                        {/if}
                    </button>

                    <button
                        onclick={nextSlide}
                        class="p-4 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all"
                    >
                        <ChevronRight size={32} />
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>
