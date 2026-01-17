<script lang="ts">
    import { fade, fly } from "svelte/transition";
    import {
        Image,
        ExternalLink,
        Plus,
        Grid,
        List as ListIcon,
        X,
        Save,
    } from "lucide-svelte";
    import EmptyStateGuide from "$lib/components/ui/EmptyStateGuide.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte"; // NEW IMPORT
    import {
        visualMemories,
        externalArchives,
        addArchive,
        updateArchive,
        removeArchive,
        addMemory,
        removeMemory,
        toggleFavorite,
        deleteMemories,
        tagMemories,
        type ExternalArchive,
    } from "$lib/stores/visualMemoryStore";
    import { onMount } from "svelte";
    import ExternalArchiveCard from "$lib/components/modules/visual-memories/ExternalArchiveCard.svelte";
    import MemoryGallery from "$lib/components/modules/visual-memories/MemoryGallery.svelte";
    import BulkActionBar from "$lib/components/modules/visual-memories/BulkActionBar.svelte";

    let activeTab = $state<"gallery" | "archives">("gallery");

    // Gallery State
    let viewMode = $state<"grid" | "carousel">("grid");
    let fileInput: HTMLInputElement;
    let isSelectionMode = $state(false);
    let selectedIds = $state<string[]>([]);

    // Archive Management State
    let showArchiveModal = $state(false);
    let editingArchive = $state<ExternalArchive | null>(null);
    let archiveForm = $state({
        platform: "",
        locationDetails: "",
        accessUrl: "",
    });

    let hasMemories = $derived($visualMemories.length > 0);
    let hasArchives = $derived($externalArchives.length > 0);
    let selectedCount = $derived(selectedIds.length);

    // --- Archive Functions ---

    function openArchiveModal(archive: ExternalArchive | null = null) {
        editingArchive = archive;
        if (archive) {
            archiveForm = {
                platform: archive.platform,
                locationDetails: archive.locationDetails,
                accessUrl: archive.accessUrl || "",
            };
        } else {
            archiveForm = { platform: "", locationDetails: "", accessUrl: "" };
        }
        showArchiveModal = true;
    }

    function saveArchive() {
        if (!archiveForm.platform || !archiveForm.locationDetails) return;

        if (editingArchive) {
            updateArchive(editingArchive.id, archiveForm);
        } else {
            addArchive(archiveForm);
        }
        showArchiveModal = false;
    }

    function handleDeleteArchive(id: string) {
        if (confirm("Remove this archive location?")) {
            removeArchive(id);
        }
    }

    // --- Gallery Functions ---

    function handleFileUpload(e: Event) {
        const input = e.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        Array.from(input.files).forEach((file) => {
            if (
                !file.type.startsWith("image/") &&
                !file.type.startsWith("video/")
            )
                return;

            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const result = loadEvent.target?.result as string;
                addMemory({
                    url: result,
                    name: file.name.split(".")[0].replace(/-|_/g, " "),
                    type: file.type.startsWith("image/") ? "photo" : "video",
                    tags: [],
                    isFavorite: false,
                    size: file.size,
                });
            };
            reader.readAsDataURL(file);
        });

        input.value = ""; // Clear input
    }

    function triggerUpload() {
        fileInput.click();
    }

    function toggleSelectionMode() {
        isSelectionMode = !isSelectionMode;
        if (!isSelectionMode) {
            selectedIds = [];
        }
    }

    function handleBulkDeleteSubmit() {
        if (confirm(`Permanently delete ${selectedCount} memories?`)) {
            deleteMemories(selectedIds);
            selectedIds = [];
            isSelectionMode = false;
        }
    }

    function handleBulkTag(e: CustomEvent<string>) {
        tagMemories(selectedIds, e.detail);
        selectedIds = [];
        isSelectionMode = false;
    }
</script>

<!-- Archive Modal -->
{#if showArchiveModal}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
        transition:fade
    >
        <div
            class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            in:fly={{ y: 20 }}
        >
            <div
                class="p-6 border-b border-slate-100 flex justify-between items-center"
            >
                <h3 class="font-serif font-bold text-xl text-[#304743]">
                    {editingArchive ? "Edit Location" : "Add Legacy Location"}
                </h3>
                <button
                    onclick={() => (showArchiveModal = false)}
                    class="text-slate-400 hover:text-slate-600"
                >
                    <X size={20} />
                </button>
            </div>

            <div class="p-6 space-y-4">
                <div class="space-y-2">
                    <label
                        class="text-xs font-bold uppercase text-slate-500 tracking-wider"
                        >Platform / Device Name</label
                    >
                    <input
                        type="text"
                        bind:value={archiveForm.platform}
                        placeholder="e.g. iCloud, Google Photos, My Passport Drive"
                        class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#4A7C74]/20 focus:border-[#4A7C74] outline-none font-medium"
                    />
                </div>

                <div class="space-y-2">
                    <label
                        class="text-xs font-bold uppercase text-slate-500 tracking-wider"
                        >Access Instructions</label
                    >
                    <textarea
                        bind:value={archiveForm.locationDetails}
                        placeholder="How do executors access this? e.g. 'Login details in password vault' or 'Physical drive in fireproof safe'"
                        class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#4A7C74]/20 focus:border-[#4A7C74] outline-none font-medium h-24 resize-none"
                    ></textarea>
                </div>

                <div class="space-y-2">
                    <label
                        class="text-xs font-bold uppercase text-slate-500 tracking-wider"
                        >Direct URL (Optional)</label
                    >
                    <div class="relative">
                        <ExternalLink
                            size={16}
                            class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            bind:value={archiveForm.accessUrl}
                            placeholder="https://..."
                            class="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#4A7C74]/20 focus:border-[#4A7C74] outline-none font-medium text-sm"
                        />
                    </div>
                </div>
            </div>

            <div
                class="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3"
            >
                <button
                    onclick={() => (showArchiveModal = false)}
                    class="px-4 py-2 font-bold text-slate-500 hover:text-slate-700 text-sm"
                >
                    Cancel
                </button>
                <button
                    onclick={saveArchive}
                    disabled={!archiveForm.platform ||
                        !archiveForm.locationDetails}
                    class="px-6 py-2 bg-[#4A7C74] text-white rounded-lg font-bold text-sm shadow-sm hover:bg-[#3b635d] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                    <Save size={16} /> Save Location
                </button>
            </div>
        </div>
    </div>
{/if}

<div class="max-w-7xl mx-auto p-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="text-center mb-12">
        <div
            class="inline-flex items-center justify-center p-4 bg-purple-100 text-purple-800 rounded-full mb-6 relative"
        >
            <Image size={48} />
            <!-- Decorative -->
            <div
                class="absolute -right-2 -top-2 bg-white p-1.5 rounded-full shadow-sm border border-slate-100 text-amber-500"
            >
                <Grid size={16} />
            </div>
        </div>
        <h1 class="text-4xl font-serif font-bold text-[#304743] mb-4">
            Visual Memories
        </h1>
        <p class="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Preserve your most cherished photos and videos, and create a map to
            the rest of your digital legacy.
        </p>
    </div>

    <!-- Tabs / Navigation -->
    <div
        class="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-100 pb-4"
    >
        <div class="flex p-1 bg-slate-100 rounded-full">
            <button
                class="px-6 py-2 rounded-full font-bold text-sm transition-all {activeTab ===
                'gallery'
                    ? 'bg-white text-[#4A7C74] shadow-sm'
                    : 'text-slate-500 hover:text-[#4A7C74]'}"
                onclick={() => (activeTab = "gallery")}
            >
                Curated Gallery
            </button>
            <button
                class="px-6 py-2 rounded-full font-bold text-sm transition-all {activeTab ===
                'archives'
                    ? 'bg-white text-[#4A7C74] shadow-sm'
                    : 'text-slate-500 hover:text-[#4A7C74]'}"
                onclick={() => (activeTab = "archives")}
            >
                External Archives
            </button>
        </div>

        {#if activeTab === "archives"}
            <button
                onclick={() => openArchiveModal()}
                class="flex items-center gap-2 px-4 py-2 bg-[#4A7C74] text-white rounded-lg font-bold text-sm hover:bg-[#3b635d] transition-colors shadow-sm"
            >
                <Plus size={16} /> Add Location
            </button>
        {:else}
            <button
                onclick={triggerUpload}
                class="flex items-center gap-2 px-4 py-2 bg-[#4A7C74] text-white rounded-lg font-bold text-sm hover:bg-[#3b635d] transition-colors shadow-sm"
            >
                <Plus size={16} /> Add Memories
            </button>
        {/if}
    </div>

    <!-- Content Area -->
    {#if activeTab === "gallery"}
        <div in:fade>
            <div
                class="bg-white rounded-2xl border border-slate-200 p-8 min-h-[400px] relative"
            >
                {#if hasMemories}
                    <div class="absolute top-8 left-8 z-10">
                        <button
                            class="text-sm font-bold px-3 py-1.5 rounded-lg transition-colors {isSelectionMode
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}"
                            onclick={toggleSelectionMode}
                        >
                            {isSelectionMode
                                ? "Done Selecting"
                                : "Select Items"}
                        </button>
                    </div>
                {/if}

                {#if !hasMemories}
                    <div class="p-8">
                        <div class="grid gap-4">
                            <GhostRow type="Memory" onClick={triggerUpload} />
                            <GhostRow type="Memory" onClick={triggerUpload} />
                            <GhostRow type="Memory" onClick={triggerUpload} />
                        </div>
                        <div class="flex justify-center mt-6">
                            <button
                                onclick={triggerUpload}
                                class="text-sm font-bold text-[#4A7C74] hover:bg-[#4A7C74]/5 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Image size={14} /> Upload First Memory
                            </button>
                        </div>
                    </div>
                {:else}
                    <MemoryGallery
                        memories={$visualMemories}
                        bind:viewMode
                        bind:selectedIds
                        bind:isSelectionMode
                        on:toggleFavorite={(e) => toggleFavorite(e.detail)}
                    />
                {/if}
            </div>
        </div>

        <!-- Hidden File Input -->
        <input
            type="file"
            bind:this={fileInput}
            multiple
            accept="image/*,video/*"
            class="hidden"
            onchange={handleFileUpload}
        />

        <BulkActionBar
            {selectedCount}
            ondelete={handleBulkDeleteSubmit}
            ontag={handleBulkTag}
            onclear={() => {
                selectedIds = [];
                isSelectionMode = false;
            }}
        />
    {:else}
        <div in:fade>
            {#if !hasArchives}
                <div
                    class="bg-white rounded-2xl border border-slate-200 p-8 min-h-[400px] flex items-center justify-center"
                >
                    <EmptyStateGuide
                        icon={ExternalLink}
                        title="Map Your Digital Legacy"
                        description="Tell your executors where to find your photo libraries (e.g. iCloud, Google Photos, Hard Drives)."
                        actionLabel="Add Archive Location"
                        onAdd={() => openArchiveModal()}
                    />
                </div>
            {:else}
                <div
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {#each $externalArchives as archive (archive.id)}
                        <ExternalArchiveCard
                            {archive}
                            onedit={(e: CustomEvent) =>
                                openArchiveModal(e.detail)}
                            ondelete={(e: CustomEvent) =>
                                handleDeleteArchive(e.detail)}
                        />
                    {/each}

                    <!-- Add Card -->
                    <button
                        onclick={() => openArchiveModal()}
                        class="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-[#4A7C74]/50 hover:bg-[#4A7C74]/5 hover:text-[#4A7C74] transition-all min-h-[160px] group"
                    >
                        <div
                            class="w-12 h-12 rounded-full bg-slate-50 group-hover:bg-white flex items-center justify-center mb-3 transition-colors"
                        >
                            <Plus size={24} />
                        </div>
                        <span class="font-bold text-sm"
                            >Add Another Location</span
                        >
                    </button>
                </div>
            {/if}
        </div>
    {/if}
</div>
