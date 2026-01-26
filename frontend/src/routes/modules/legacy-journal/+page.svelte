<script lang="ts">
    import { fade, fly } from "svelte/transition";
    import {
        BookOpen,
        Plus,
        Search,
        X,
        Edit3,
        Trash2,
        Loader2,
        Sparkles,
        Calendar,
        Tag,
        Quote,
    } from "lucide-svelte";
    import { onMount } from "svelte";

    // Components
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";
    import Modal from "$lib/components/ui/Modal.svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import Affirmation from "$lib/components/Affirmation.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte";
    import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte";
    import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";

    // Sub-components for tabs
    import EthicalWill from "$lib/components/modules/legacy-journal/EthicalWill.svelte";
    import LifeLessons from "$lib/components/modules/legacy-journal/LifeLessons.svelte";
    import AccomplishmentsGallery from "$lib/components/modules/legacy-journal/AccomplishmentsGallery.svelte";

    // Store and data
    import { journalStore, type JournalEntry } from "$lib/stores/journalStore.svelte";
    import { REFLECTION_POOLS } from "$lib/data/reflectionPools";
    import { language } from "$lib/stores/localization";
    import type { ViewMode } from "$lib/stores/userPreferencesStore.svelte";

    // State
    let activeTab = $state<"reflections" | "will" | "lessons" | "accomplishments">("reflections");
    let isLoading = $state(true);
    let showAddModal = $state(false);
    let showAffirmation = $state(false);
    let viewMode = $state<ViewMode>('card');
    let searchQuery = $state("");
    let editingEntry = $state<JournalEntry | null>(null);
    let parsedCustomAttributes = $state<Record<string, any>>({});

    // Form state
    let newEntry = $state<Partial<JournalEntry>>({
        type: "reflection",
        title: "",
        content: "",
        tags: "",
    });

    // Derived data
    let items = $derived(journalStore.items.filter(e => e.type === 'reflection'));
    let filteredItems = $derived(
        searchQuery
            ? items.filter(
                  (item) =>
                      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.tags?.toLowerCase().includes(searchQuery.toLowerCase())
              )
            : items
    );

    // Smart sample data for ghost rows
    const sampleEntries = [
        {
            title: "The Summer We Built the Treehouse",
            content: "Every summer, Dad would take a week off work to do something special with us kids...",
            tags: "family, childhood, dad",
        },
        {
            title: "What I Learned from Mom's Kitchen",
            content: "The most important lessons I learned weren't in school. They were standing beside Mom...",
            tags: "mom, wisdom, cooking",
        },
        {
            title: "My Philosophy on Hard Work",
            content: "I've always believed that hard work isn't just about the outcome...",
            tags: "values, work ethic",
        },
    ];

    // Journal prompt pool for AI Helper
    const journalPromptPool = [
        "Help me describe a childhood memory that shaped who I am...",
        "Write about a value I want my children to carry forward...",
        "Tell the story of how I met the love of my life...",
        "Describe a challenge I overcame and what it taught me...",
        "Write about a person who influenced my life deeply...",
        "Share wisdom I wish I'd known at 20 years old...",
    ];

    onMount(async () => {
        await journalStore.sync();
        isLoading = false;
    });

    function openAddModal() {
        editingEntry = null;
        newEntry = {
            type: "reflection",
            title: "",
            content: "",
            tags: "",
        };
        parsedCustomAttributes = {};
        showAddModal = true;
    }

    function openEditModal(entry: JournalEntry) {
        editingEntry = entry;
        newEntry = { ...entry };
        try {
            parsedCustomAttributes = entry.tags ? {} : {};
        } catch {
            parsedCustomAttributes = {};
        }
        showAddModal = true;
    }

    async function saveEntry() {
        if (!newEntry.content) return;

        if (editingEntry && editingEntry.id) {
            await journalStore.update(editingEntry.id, {
                ...newEntry,
                type: "reflection",
            } as JournalEntry);
        } else {
            await journalStore.create({
                ...newEntry,
                type: "reflection",
            } as JournalEntry);
        }

        showAddModal = false;
        showAffirmation = true;
        newEntry = { type: "reflection", title: "", content: "", tags: "" };
        parsedCustomAttributes = {};
        editingEntry = null;
    }

    async function deleteEntry(id: number) {
        if (!confirm("Remove this reflection? Your words will be preserved in the activity log.")) return;
        await journalStore.delete(id);
    }

    function formatDate(dateString?: string): string {
        if (!dateString) return "Just now";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }

    function prefillFromSample(sample: typeof sampleEntries[0]) {
        newEntry = {
            type: "reflection",
            title: sample.title,
            content: sample.content,
            tags: sample.tags,
        };
        showAddModal = true;
    }
</script>

<svelte:head>
    <title>Legacy Journal | Continuum</title>
</svelte:head>

<!-- Page Header -->
<LivingBlueprintHeader
    title="Your Story, Your Legacy"
    subtitle="Capture the memories, values, and wisdom that make you who you are"
    tier="family"
    detailedDescription="Your life is filled with stories worth telling - moments of joy, lessons learned, values discovered. This journal is your space to preserve those treasures for the people who matter most."
    whyMatters="The stories we carry shape generations. Without a place to write them down, precious memories fade and wisdom goes unshared. Your words here become a lasting gift - a window into your heart that your loved ones can return to again and again."
>
    <button
        onclick={openAddModal}
        class="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
    >
        <Plus size={18} />
        Share a memory
    </button>
</LivingBlueprintHeader>

{#if isLoading}
    <div class="flex items-center justify-center py-24">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
{:else}
    <div class="max-w-6xl mx-auto p-6 md:p-8 animate-in fade-in duration-500">
        <!-- Affirmation Message -->
        <Affirmation module="journal" bind:show={showAffirmation} />

        <!-- Tab Navigation -->
        <div class="flex justify-center gap-2 mb-8 flex-wrap">
            <button
                onclick={() => (activeTab = "reflections")}
                class="px-5 py-2.5 rounded-full font-bold text-sm transition-all {activeTab ===
                'reflections'
                    ? 'bg-primary text-primary-foreground shadow-lg transform -translate-y-0.5'
                    : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}"
            >
                <span class="flex items-center gap-2">
                    <BookOpen size={16} />
                    Reflections
                </span>
            </button>
            <button
                onclick={() => (activeTab = "will")}
                class="px-5 py-2.5 rounded-full font-bold text-sm transition-all {activeTab ===
                'will'
                    ? 'bg-primary text-primary-foreground shadow-lg transform -translate-y-0.5'
                    : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}"
            >
                Ethical Will
            </button>
            <button
                onclick={() => (activeTab = "lessons")}
                class="px-5 py-2.5 rounded-full font-bold text-sm transition-all {activeTab ===
                'lessons'
                    ? 'bg-primary text-primary-foreground shadow-lg transform -translate-y-0.5'
                    : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}"
            >
                Life Lessons
            </button>
            <button
                onclick={() => (activeTab = "accomplishments")}
                class="px-5 py-2.5 rounded-full font-bold text-sm transition-all {activeTab ===
                'accomplishments'
                    ? 'bg-amber-600 text-white shadow-lg transform -translate-y-0.5'
                    : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}"
            >
                Accomplishments
            </button>
        </div>

        <!-- Content Area -->
        <div class="min-h-[400px]">
            {#if activeTab === "reflections"}
                <div in:fade={{ duration: 300 }}>
                    <!-- AI Helper Section -->
                    <div class="max-w-3xl mx-auto mb-8">
                        <AIPromptBar
                            context="letters"
                            promptPool={journalPromptPool}
                        />
                    </div>

                    <!-- Controls Row -->
                    <div class="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                        <div class="relative w-full md:w-80">
                            <Search
                                size={18}
                                class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="text"
                                bind:value={searchQuery}
                                placeholder="Search your memories..."
                                class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>
                        <div class="flex items-center gap-3">
                            <DataViewToggle module="legacy-journal" onchange={(mode) => viewMode = mode} />
                            <button
                                onclick={openAddModal}
                                class="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
                            >
                                <Plus size={18} />
                                Write a reflection
                            </button>
                        </div>
                    </div>

                    <!-- Data Display -->
                    {#if filteredItems.length === 0 && !searchQuery}
                        <!-- Empty State -->
                        <EmptyState
                            title="Your story is waiting to be told"
                            whyMatters="<strong>Every memory you hold is a gift waiting to be given.</strong> The stories of your life - your triumphs, your lessons, your laughter - deserve to be preserved. Without writing them down, these precious moments may fade with time.<br/><br/>Your reflections become a legacy. When you share your memories here, you're creating something your loved ones will treasure forever."
                            encouragement="Start with one memory. A moment that made you smile. A lesson you learned. Your words matter more than you know."
                            icon={BookOpen}
                            iconClass="text-primary"
                            ctaLabel="Share your first memory"
                            onAction={openAddModal}
                        />

                        <!-- Sample Data / Ghost Rows -->
                        <div class="mt-8 space-y-3 max-w-2xl mx-auto">
                            <p class="text-sm text-slate-500 text-center mb-4">
                                Need inspiration? Click an example below to get started:
                            </p>
                            {#each sampleEntries as sample}
                                <GhostRow
                                    name={sample.title}
                                    subtitle={sample.content.slice(0, 60) + "..."}
                                    type="Memory"
                                    onClick={() => prefillFromSample(sample)}
                                >
                                    {#snippet icon()}
                                        <Quote size={20} class="text-slate-400" />
                                    {/snippet}
                                </GhostRow>
                            {/each}
                        </div>
                    {:else if filteredItems.length === 0 && searchQuery}
                        <!-- No search results -->
                        <div class="text-center py-12">
                            <Search size={48} class="mx-auto text-slate-300 mb-4" />
                            <p class="text-slate-500">No reflections match "{searchQuery}"</p>
                            <button
                                onclick={() => (searchQuery = "")}
                                class="mt-4 text-primary hover:underline"
                            >
                                Clear search
                            </button>
                        </div>
                    {:else}
                        <!-- Display entries based on view mode -->
                        {#if viewMode === 'card'}
                            <!-- Card Grid View -->
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {#each filteredItems as entry (entry.id)}
                                    <div
                                        in:fade={{ duration: 400 }}
                                        class="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group relative"
                                    >
                                        <!-- Decorative top bar -->
                                        <div class="h-2 bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30"></div>

                                        <div class="p-5">
                                            <!-- Title -->
                                            <h3 class="font-serif font-bold text-lg text-slate-800 mb-2 line-clamp-2">
                                                {entry.title || "Untitled Reflection"}
                                            </h3>

                                            <!-- Date -->
                                            <div class="flex items-center gap-2 text-xs text-slate-400 mb-3">
                                                <Calendar size={12} />
                                                {formatDate(entry.created_at)}
                                            </div>

                                            <!-- Content preview -->
                                            <p class="text-slate-600 text-sm leading-relaxed line-clamp-4 mb-4">
                                                {entry.content}
                                            </p>

                                            <!-- Tags -->
                                            {#if entry.tags}
                                                <div class="flex flex-wrap gap-1.5">
                                                    {#each entry.tags.split(",").slice(0, 3) as tag}
                                                        <span class="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                                                            {tag.trim()}
                                                        </span>
                                                    {/each}
                                                </div>
                                            {/if}
                                        </div>

                                        <!-- Hover actions -->
                                        <div class="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onclick={() => openEditModal(entry)}
                                                class="p-2 bg-white/90 text-slate-500 hover:text-primary rounded-full shadow-sm transition-colors"
                                                title="Edit"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button
                                                onclick={() => entry.id && deleteEntry(entry.id)}
                                                class="p-2 bg-white/90 text-slate-500 hover:text-red-500 rounded-full shadow-sm transition-colors"
                                                title="Remove"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                {/each}

                                <!-- Add new placeholder card -->
                                <button
                                    onclick={openAddModal}
                                    class="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all min-h-[250px] group"
                                >
                                    <div class="w-14 h-14 rounded-full bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center mb-3 transition-colors">
                                        <Plus size={28} />
                                    </div>
                                    <span class="font-bold">Write a new reflection</span>
                                </button>
                            </div>
                        {:else}
                            <!-- Table View -->
                            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <table class="w-full">
                                    <thead class="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Title</th>
                                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Preview</th>
                                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Date</th>
                                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Tags</th>
                                            <th class="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-slate-100">
                                        {#each filteredItems as entry (entry.id)}
                                            <tr class="hover:bg-slate-50 transition-colors group">
                                                <td class="px-4 py-3">
                                                    <span class="font-medium text-slate-800">{entry.title || "Untitled"}</span>
                                                </td>
                                                <td class="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
                                                    {entry.content?.slice(0, 80)}...
                                                </td>
                                                <td class="px-4 py-3 text-sm text-slate-500">
                                                    {formatDate(entry.created_at)}
                                                </td>
                                                <td class="px-4 py-3">
                                                    {#if entry.tags}
                                                        <span class="text-xs text-slate-400">{entry.tags}</span>
                                                    {:else}
                                                        <span class="text-xs text-slate-300">-</span>
                                                    {/if}
                                                </td>
                                                <td class="px-4 py-3 text-right">
                                                    <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onclick={() => openEditModal(entry)}
                                                            class="p-1.5 text-slate-400 hover:text-primary transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit3 size={14} />
                                                        </button>
                                                        <button
                                                            onclick={() => entry.id && deleteEntry(entry.id)}
                                                            class="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                                            title="Remove"
                                                        >
                                                            <Trash2 size={14} />
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
            {:else if activeTab === "will"}
                <div in:fade={{ duration: 300 }}>
                    <EthicalWill />
                </div>
            {:else if activeTab === "lessons"}
                <div in:fade={{ duration: 300 }}>
                    <LifeLessons />
                </div>
            {:else if activeTab === "accomplishments"}
                <div in:fade={{ duration: 300 }}>
                    <AccomplishmentsGallery />
                </div>
            {/if}
        </div>
    </div>
{/if}

<!-- Add/Edit Modal -->
<Modal
    bind:open={showAddModal}
    title={editingEntry ? "Continue your reflection" : "Capture a memory"}
    description="Your stories matter. Take your time - there's no right or wrong way to share what's in your heart."
    maxWidth="max-w-lg"
>
    <div class="space-y-4">
        <!-- Title -->
        <div>
            <label for="entry-title" class="block text-xs font-bold uppercase text-slate-500 mb-1.5 tracking-wide">
                Give it a title (optional)
            </label>
            <input
                id="entry-title"
                type="text"
                bind:value={newEntry.title}
                class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="e.g., The Day I Learned to Ride a Bike"
            />
        </div>

        <!-- Content -->
        <div>
            <label for="entry-content" class="block text-xs font-bold uppercase text-slate-500 mb-1.5 tracking-wide">
                Your memory or reflection
            </label>
            <textarea
                id="entry-content"
                bind:value={newEntry.content}
                class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none min-h-[200px]"
                placeholder="Write freely. Tell the story as you remember it..."
            ></textarea>
            <p class="text-xs text-slate-400 mt-1.5">
                Share as much or as little as you'd like. Your words are a gift.
            </p>
        </div>

        <!-- Tags -->
        <div>
            <label for="entry-tags" class="block text-xs font-bold uppercase text-slate-500 mb-1.5 tracking-wide">
                Tags (optional)
            </label>
            <div class="relative">
                <Tag size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    id="entry-tags"
                    type="text"
                    bind:value={newEntry.tags}
                    class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="family, childhood, wisdom (comma separated)"
                />
            </div>
        </div>

        <!-- Custom Fields -->
        <div class="pt-4 mt-4 border-t border-slate-100">
            <CustomFieldsManager
                entityType="journal_entry"
                bind:data={parsedCustomAttributes}
            />
        </div>
    </div>

    <!-- Footer buttons -->
    <div class="-mx-6 -mb-6 px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 mt-6">
        <button
            onclick={() => (showAddModal = false)}
            class="px-6 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
        >
            Not right now
        </button>
        <button
            onclick={saveEntry}
            disabled={!newEntry.content}
            class="px-6 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
        >
            {editingEntry ? "Save my updates" : "Preserve this memory"}
        </button>
    </div>
</Modal>
