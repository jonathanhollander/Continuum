<script lang="ts">
    import { askConfirm } from "$lib/components/ui/ConfirmModal.svelte";
    import { focusTrap } from "$lib/actions/focusTrap";
    import {
        Heart,
        Image,
        Scroll,
        MapPin,
        Plus,
        X,
        Upload,
        PlayCircle,
        PauseCircle,
        ChevronLeft,
        ChevronRight,
        Pencil,
        Loader2,
        Sparkles,
    } from "lucide-svelte";
    import { fade, slide, scale } from "svelte/transition";
    import FileUploader from "$lib/components/ui/FileUploader.svelte";
    import EducationalResources from "$lib/components/family/EducationalResources.svelte";
    import FamilyTreeGraph from "$lib/components/family/FamilyTreeGraph.svelte";
    import BlueprintCard from "$lib/components/ui/BlueprintCard.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte";
    import ConciergeFlow from "$lib/components/concierge/ConciergeFlow.svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import { onMount } from "svelte";
    import { estateProfile } from "$lib/stores/estateStore.svelte";
    import { familyStore } from "$lib/stores/familyStore.svelte";
    import { timelineStore } from "$lib/stores/timelineStore.svelte";
    import { estateExecutorName } from "$lib/stores/analyticsStore";
    import { activityLog } from "$lib/stores/activityLog.svelte";
    import { t, language } from "$lib/stores/localization";
    import { getSmartSamples } from "$lib/data/smartSamples";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";
    import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";
    import { userPreferencesStore, type ViewMode } from "$lib/stores/userPreferencesStore.svelte";
    import * as registryRaw from "$lib/data/registry.json";

    let dataViewMode = $derived<ViewMode>(userPreferencesStore.getViewMode('family-hub'));

    // Registry Data Handling
    const registryData = (registryRaw as any).default || registryRaw;
    const registry = Array.isArray(registryData) ? registryData : [];
    const module = registry.find((m) => m.id === "family-hub");

    import {
        familyMemories,
        addFamilyMemory,
        updateFamilyMemory,
        removeFamilyMemory,
    } from "$lib/stores/visualMemoryStore.svelte";

    // --- State & Types ---
    type MemoryType = "photo" | "recipe" | "quote";
    let viewMode = $state<"dashboard" | "concierge">("dashboard");

    interface Memory {
        id?: number;
        type: MemoryType;
        title: string;
        date?: string;
        image?: string;
        desc?: string;
        text?: string;
        author?: string;
        is_favorite?: boolean;
    }

    let memories = $derived(familyMemories.items);
    let showAddModal = $state(false);
    let isLoading = $state(true);

    // Form Mock-Model
    let newMemory = $state<Partial<Memory> & { id?: number }>({
        type: "photo",
        title: "",
        desc: "",
        image: "",
        author: $estateProfile.ownerName || "Me",
        date: new Date().getFullYear().toString(),
    });

    onMount(async () => {
        await familyMemories.sync();
        isLoading = false;
    });

    function handleConciergeAnswer(e: CustomEvent) {
        // Logic to handle intermediate answers if needed
    }

    const wizardSteps = [
        {
            id: "intro",
            question: "wizard.family_intro",
            type: "boolean" as const,
            logic: { yes: "fav_memory", no: "EXIT" },
        },
        {
            id: "fav_memory",
            question:
                "What is one favorite memory you want to preserve right now?",
            type: "textarea" as const,
            placeholder: "I remember when...",
            required: true,
        },
        {
            id: "role",
            question: "Who are you preserving this legacy for?",
            type: "select" as const,
            options: [
                "My Children",
                "My Spouse",
                "Myself",
                "Future Generations",
            ],
            required: true,
        },
    ];

    function handleConciergeComplete(answers: Record<string, any>) {
        if (answers.intro === false) {
            viewMode = "dashboard";
            return;
        }

        // Auto-create a memory from the concierge answer
        if (answers.fav_memory) {
            addFamilyMemory({
                type: "quote",
                title: "My Favorite Memory",
                text: answers.fav_memory,
                author: "Me",
                is_favorite: false,
            });
        }

        viewMode = "dashboard";
    }

    async function saveMemory() {
        if (!newMemory.title) return;

        try {
        if (newMemory.id) {
            // Edit Mode
            const oldMemory = memories.find(
                (m: Memory) => m.id === newMemory.id,
            );
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

            await updateFamilyMemory(newMemory.id, newMemory as any);

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
            const created = await addFamilyMemory({
                ...newMemory,
                is_favorite: false,
            } as any, saveMemory);

            // Log CREATE
            activityLog.logEvent({
                module: "Family Hub",
                action: "CREATE",
                entityType: "Memory",
                entityId: String(created?.id ?? "new"),
                entityName: newMemory.title || "Unnamed Memory",
                userContext: $estateProfile.ownerName || "User",
            });
        }

        resetForm();
        } catch {
            // The manager already showed the one gentle message; the form stays open with the draft.
        }
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
            image: "",
            date: new Date().getFullYear().toString(),
        };
    }

    async function deleteMemory(id: number | undefined) {
        if (id === undefined) return;
        if (
            !(await askConfirm(
                "Remove this memory? You can always add it back later if needed.",
            ))
        )
            return;
        removeFamilyMemory(id);
    }

    // Slideshow Logic
    let showSlideshow = $state(false);
    let currentSlide = $state(0);
    let isPlaying = $state(true);
    let slideInterval: any;

    let photoMemories = $derived(memories.filter((m) => m.type === "photo"));

    // The three most recent events from The Life Timeline
    let journeyEvents = $derived(
        [...(timelineStore.items || [])]
            .sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0))
            .slice(0, 3),
    );

    function startSlideshow() {
        if (photoMemories.length === 0) return;
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

{#if isLoading}
    <div class="flex items-center justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
{:else}
<div class="min-h-screen bg-background">
    <div class="max-w-6xl mx-auto px-8 pt-8">
    </div>

    <!-- Add Memory Modal -->
    {#if showAddModal}
        <div role="dialog" aria-modal="true" use:focusTrap={{ onEscape: resetForm }}
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            transition:fade
        >
            <div
                class="bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                in:scale
            >
                <div
                    class="p-6 border-b border-border flex justify-between items-center bg-muted"
                >
                    <h3 class="font-serif font-bold text-xl text-foreground">
                        Preserve a Memory
                    </h3>
                    <button aria-label="Close"
                        onclick={resetForm}
                        class="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <X size={20} class="text-muted-foreground" />
                    </button>
                </div>
                <div class="p-6 space-y-4">
                    <!-- Type Selector -->
                    <div class="flex gap-2 p-1 bg-muted rounded-lg">
                        <button
                            class="flex-1 py-2 text-sm font-bold rounded-md transition-all {newMemory.type ===
                            'photo'
                                ? 'bg-card shadow text-primary'
                                : 'text-muted-foreground hover:text-foreground'}"
                            onclick={() => (newMemory.type = "photo")}
                            >Photo</button
                        >
                        <button
                            class="flex-1 py-2 text-sm font-bold rounded-md transition-all {newMemory.type ===
                            'recipe'
                                ? 'bg-card shadow text-primary'
                                : 'text-muted-foreground hover:text-foreground'}"
                            onclick={() => (newMemory.type = "recipe")}
                            >Recipe</button
                        >
                        <button
                            class="flex-1 py-2 text-sm font-bold rounded-md transition-all {newMemory.type ===
                            'quote'
                                ? 'bg-card shadow text-primary'
                                : 'text-muted-foreground hover:text-foreground'}"
                            onclick={() => (newMemory.type = "quote")}
                            >Quote</button
                        >
                    </div>

                    <div class="space-y-2">
                        <label
                            class="text-xs font-bold uppercase text-muted-foreground"
                        >
                            Title
                            <input
                                bind:value={newMemory.title}
                                class="w-full p-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none font-serif text-lg mt-1"
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
                                        class="text-xs font-bold uppercase text-muted-foreground"
                                    >
                                        Or Paste URL
                                        <input
                                            bind:value={newMemory.image}
                                            class="w-full p-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none text-sm mt-1"
                                            placeholder="https://..."
                                        />
                                    </label>
                                </div>
                            {/if}
                        </div>
                        <div class="space-y-2">
                            <label
                                class="text-xs font-bold uppercase text-muted-foreground"
                            >
                                Date / Year
                                <input
                                    bind:value={newMemory.date}
                                    class="w-full p-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none mt-1"
                                    placeholder="e.g. July 2005"
                                />
                            </label>
                        </div>
                    {:else if newMemory.type === "recipe"}
                        <div class="space-y-2">
                            <label
                                class="text-xs font-bold uppercase text-muted-foreground"
                            >
                                Description / Ingredients
                                <textarea
                                    bind:value={newMemory.desc}
                                    class="w-full p-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none h-24 resize-none mt-1"
                                    placeholder="Secret ingredients..."
                                ></textarea>
                            </label>
                        </div>
                    {:else if newMemory.type === "quote"}
                        <div class="space-y-2">
                            <label
                                class="text-xs font-bold uppercase text-muted-foreground"
                            >
                                Quote Text
                                <textarea
                                    bind:value={newMemory.text}
                                    class="w-full p-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none h-24 resize-none font-serif italic text-lg mt-1"
                                    placeholder="'Stay hungry, stay foolish...'"
                                ></textarea>
                            </label>
                        </div>
                        <div class="space-y-2">
                            <label
                                class="text-xs font-bold uppercase text-muted-foreground"
                            >
                                Attribution
                                <input
                                    bind:value={newMemory.author}
                                    class="w-full p-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none mt-1"
                                    placeholder="e.g. Grandma"
                                />
                            </label>
                        </div>
                    {/if}

                    <button
                        onclick={saveMemory}
                        class="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-primary-hover transition-all transform active:scale-95"
                    >
                        Save this memory
                    </button>
                </div>
            </div>
        </div>
    {/if}

    {#if module}
        <LivingBlueprintHeader
            title={module.title}
            subtitle={module.description}
        />
    {/if}

    <!-- Family Network Visualizer -->
    <section class="max-w-7xl mx-auto px-8 -mt-16 relative z-30 mb-20">
        <div
            class="bg-card rounded-2xl shadow-xl overflow-hidden border border-border"
        >
            <div
                class="p-6 border-b border-border flex justify-between items-center bg-muted/50"
            >
                <div>
                    <h2 class="font-serif text-2xl text-foreground">
                        Family Network
                    </h2>
                    <p class="text-muted-foreground text-sm">
                        Interactive map of your estate hierarchy and key roles.
                    </p>
                </div>
            </div>
            <div class="w-full bg-muted">
                <FamilyTreeGraph />
            </div>
        </div>
    </section>

    {#if viewMode === "concierge"}
        <div class="max-w-4xl mx-auto px-6 py-12" in:fade>
            <ConciergeFlow
                steps={wizardSteps}
                oncomplete={handleConciergeComplete}
            />
            <div class="text-center mt-8">
                <button
                    onclick={() => (viewMode = "dashboard")}
                    class="text-muted-foreground hover:text-foreground underline text-sm"
                >
                    Continue to your dashboard
                </button>
            </div>
        </div>
    {:else}
        <div class="max-w-6xl mx-auto px-8 pb-20 relative z-30" in:fade>
            <!-- BLUEPRINT HEADER -->
            <div class="mb-12">
                <BlueprintCard
                    title="Establish Your Family Network"
                    description="Your plan is held by trusted people. Add them here whenever you feel ready."
                    timeEstimate="At your own pace"
                    steps={[
                        {
                            label: "Welcome 3 family members",
                            completed: familyStore.members.length >= 3,
                        },
                        { label: "Name your executor", completed: !!$estateExecutorName },
                        {
                            label: "Share a memory",
                            completed: memories.length > 0,
                        },
                    ]}
                />
            </div>

            <!-- AI Concierge Drafting Assistant -->
            <AIPromptBar
                context="heirlooms"
                prompts={[
                    "Help me capture a family memory...",
                    "Draft a story about this family tradition...",
                    "Write about the significance of this photo...",
                    "Help me preserve a family recipe with its history..."
                ]}
            />

            <!-- Latest Memories Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Feed Column -->
                <div class="md:col-span-2 space-y-8">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <h2 class="font-serif text-3xl text-foreground">
                                Latest Memories
                            </h2>
                            {#if photoMemories.length > 0}
                                <button
                                    onclick={startSlideshow}
                                    class="text-xs font-bold text-primary-hover bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors flex items-center gap-1"
                                >
                                    <PlayCircle size={14} /> Slideshow
                                </button>
                            {/if}
                        </div>
                        <div class="flex items-center gap-3">
                            <DataViewToggle module="family-hub" />
                            <button
                                onclick={() => (showAddModal = true)}
                                class="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full font-bold hover:bg-primary-hover transition-colors"
                            >
                                <Plus size={18} /> Add Memory
                            </button>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {#if memories.length === 0}
                            <!-- GHOST ROWS -->
                            <div class="col-span-full flex justify-center mb-4">
                                <button
                                    onclick={() => (viewMode = "concierge")}
                                    class="text-sm font-bold text-primary-hover bg-primary-soft px-4 py-2 rounded-full hover:bg-primary/20 transition-colors flex items-center gap-2"
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
                                    onclick={() => {
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
                                    {#snippet icon()}
                                        {@const Icon = sample.type === "Recipe" ? Scroll : sample.type === "Quote" ? Plus : Image}
                                        <Icon
                                            size={20}
                                            class="text-muted-foreground"
                                        />
                                    {/snippet}
                                </GhostRow>
                            {/each}
                        {:else}
                            {#if dataViewMode === 'card'}
                                {#each memories as memory (memory.id)}
                                    <div
                                        class="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative"
                                        in:fade
                                    >
                                        <!-- Card actions -->
                                        <button
                                            onclick={() => editMemory(memory)}
                                            aria-label="Edit Memory"
                                            class="absolute top-2 right-10 p-1.5 bg-card/80 rounded-full z-10 hover:bg-muted text-muted-foreground hover:text-primary-hover"
                                            title="Edit Memory"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onclick={() => deleteMemory(memory.id)}
                                            aria-label="Remove this item"
                                            class="absolute top-2 right-2 p-1.5 bg-card/80 rounded-full z-10 hover:bg-danger-soft text-muted-foreground hover:text-danger"
                                            title="Remove this memory"
                                        >
                                            <X size={14} />
                                        </button>

                                        {#if memory.type === "photo"}
                                            <div
                                                class="aspect-[4/3] overflow-hidden bg-muted"
                                            >
                                                <img
                                                    src={memory.image}
                                                    alt={memory.title}
                                                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>
                                            <div class="p-4">
                                                <h3
                                                    class="font-bold text-foreground text-lg leading-tight group-hover:text-primary-hover transition-colors"
                                                >
                                                    {memory.title}
                                                </h3>
                                                <p
                                                    class="text-xs text-muted-foreground mt-2 font-medium tracking-wide uppercase"
                                                >
                                                    {memory.date}
                                                </p>
                                            </div>
                                        {:else if memory.type === "recipe"}
                                            <div
                                                class="p-6 bg-muted h-full flex flex-col"
                                            >
                                                <div
                                                    class="w-10 h-10 bg-card rounded-full flex items-center justify-center mb-4 text-gold-text shadow-sm"
                                                >
                                                    <Scroll class="w-5 h-5" />
                                                </div>
                                                <h3
                                                    class="font-serif text-xl text-foreground font-bold mb-2"
                                                >
                                                    {memory.title}
                                                </h3>
                                                <p
                                                    class="text-sm text-muted-foreground leading-relaxed italic"
                                                >
                                                    "{memory.desc}"
                                                </p>
                                            </div>
                                        {:else if memory.type === "quote"}
                                            <div
                                                class="p-8 bg-primary-deep h-full flex flex-col justify-center text-center items-center"
                                            >
                                                <p
                                                    class="font-serif text-xl text-white leading-relaxed mb-4"
                                                >
                                                    "{memory.text}"
                                                </p>
                                                <div
                                                    class="text-xs font-bold text-white/70 uppercase tracking-widest"
                                                >
                                                    — {memory.author}
                                                </div>
                                            </div>
                                        {:else}
                                            <div class="p-6">
                                                <h3 class="font-bold text-foreground text-lg leading-tight">
                                                    {memory.title}
                                                </h3>
                                                {#if memory.desc || memory.text}
                                                    <p class="text-sm text-muted-foreground mt-2 leading-relaxed">
                                                        {memory.desc || memory.text}
                                                    </p>
                                                {/if}
                                                {#if memory.date}
                                                    <p class="text-xs text-muted-foreground mt-2 font-medium tracking-wide uppercase">
                                                        {memory.date}
                                                    </p>
                                                {/if}
                                            </div>
                                        {/if}
                                    </div>
                                {/each}
                            {:else}
                                <!-- Table View -->
                                <div class="col-span-full bg-card rounded-xl border border-border overflow-hidden">
                                    <table class="w-full">
                                        <thead class="bg-muted border-b border-border">
                                            <tr>
                                                <th class="text-left px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Title</th>
                                                <th class="text-left px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Type</th>
                                                <th class="text-left px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Date</th>
                                                <th class="text-left px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Author</th>
                                                <th class="text-right px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-border">
                                            {#each memories as memory (memory.id)}
                                                <tr class="hover:bg-muted transition-colors group">
                                                    <td class="px-4 py-3 font-medium text-foreground">{memory.title}</td>
                                                    <td class="px-4 py-3">
                                                        <span class="px-2 py-1 rounded text-xs font-medium capitalize {memory.type === 'photo' ? 'bg-info/10 text-info' : memory.type === 'recipe' ? 'bg-muted text-gold-text' : 'bg-muted text-muted-foreground'}">
                                                            {memory.type}
                                                        </span>
                                                    </td>
                                                    <td class="px-4 py-3 text-muted-foreground text-sm">{memory.date || '-'}</td>
                                                    <td class="px-4 py-3 text-muted-foreground text-sm">{memory.author || '-'}</td>
                                                    <td class="px-4 py-3 text-right">
                                                        <div class="flex items-center justify-end gap-1 transition-opacity">
                                                            <button aria-label="Edit these details"
                                                                onclick={() => editMemory(memory)}
                                                                class="p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary-hover"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button aria-label="Remove this item"
                                                                onclick={() => deleteMemory(memory.id)}
                                                                class="p-1 hover:bg-muted rounded text-muted-foreground hover:text-danger"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>
                            {/if}
                        {/if}
                    </div>
                </div>

                <!-- Sidebar / Timeline Preview -->
                <div class="space-y-8">
                    <!-- Educational Resources Widget -->
                    <button
                        class="bg-primary-deep rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group cursor-pointer text-left w-full"
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
                            <h3 class="font-serif font-bold text-xl mb-2 text-white">
                                Learning Center
                            </h3>
                            <p
                                class="text-white/80 text-sm mb-4 line-clamp-2"
                            >
                                Our guide videos are here for you, whenever you want
                                to learn more about your role.
                            </p>
                        </div>
                    </button>

                    <div
                        class="bg-card p-6 rounded-2xl shadow-sm border border-border"
                    >
                        <h3
                            class="font-bold text-foreground mb-4 flex items-center gap-2"
                        >
                            <MapPin class="w-4 h-4 text-primary" />
                            Our Journey
                        </h3>
                        {#if journeyEvents.length > 0}
                            <div
                                class="space-y-6 relative pl-4 border-l-2 border-border"
                            >
                                {#each journeyEvents as event, i (event.id)}
                                    <div class="relative">
                                        <div
                                            class="absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-card {i === 0
                                                ? 'bg-primary shadow-sm'
                                                : 'bg-border'}"
                                        ></div>
                                        <div
                                            class="text-xs font-bold text-muted-foreground mb-1"
                                        >
                                            {event.year}
                                        </div>
                                        <div class="font-medium text-foreground">
                                            {event.label}
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                        <div
                            class="text-center {journeyEvents.length > 0
                                ? 'mt-4 pt-4 border-t border-border'
                                : ''}"
                        >
                            <a
                                href="/modules/timeline"
                                class="text-xs font-bold text-primary hover:underline"
                                >Manage Full Timeline →</a
                            >
                        </div>
                    </div>
                </div>
            </div>

            <!-- Educational Resources Section -->
            <div
                id="educational-section"
                class="mt-20 pt-10 border-t border-border"
            >
                <h2 class="font-serif text-3xl text-foreground mb-8 text-center">
                    Family Learning Center
                </h2>
                <EducationalResources />
            </div>
        </div>
    {/if}

    <!-- Slideshow Overlay -->
    {#if showSlideshow && photoMemories.length > 0}
        <div role="dialog" aria-modal="true" use:focusTrap={{ onEscape: closeSlideshow }}
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
                    <button aria-label="Close"
                        onclick={closeSlideshow}
                        class="p-4 bg-black/20 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div
                    class="flex items-center justify-center gap-8 pointer-events-auto pb-8"
                >
                    <button aria-label="Previous"
                        onclick={prevSlide}
                        class="p-4 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all"
                    >
                        <ChevronLeft size={32} />
                    </button>

                    <button aria-label={isPlaying ? "Pause" : "Play"}
                        onclick={togglePlay}
                        class="p-6 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all scale-100 hover:scale-110"
                    >
                        {#if isPlaying}
                            <PauseCircle size={48} />
                        {:else}
                            <PlayCircle size={48} />
                        {/if}
                    </button>

                    <button aria-label="Next"
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
{/if}
