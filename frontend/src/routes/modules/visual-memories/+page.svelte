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
    import EmptyState from "$lib/components/EmptyState.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte"; // NEW IMPORT
    import {
        visualMemories,
        externalArchives,
        addArchive,
        updateArchive,
        removeArchive,
        addMemory as addVisualMemory,
        removeMemory as removeVisualMemory,
        toggleFavorite as toggleVisualFavorite,
        syncAllMemories,
        type ExternalArchive,
    } from "$lib/stores/visualMemoryStore.svelte.ts";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";
    import * as registryRaw from "$lib/data/registry.json";

    // Registry Data Handling
    const registryData = (registryRaw as any).default || registryRaw;
    const registry = Array.isArray(registryData) ? registryData : [];
    const module = registry.find((m) => m.id === "visual-memories");
    import { onMount, type ComponentProps } from "svelte";
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
    let archiveForm = $state<{
        platform: string;
        locationDetails: string;
        accessUrl: string;
    }>({
        platform: "",
        locationDetails: "",
        accessUrl: "",
    });

    let hasMemories = $derived(visualMemories.items.length > 0);
    let hasArchives = $derived(externalArchives.items.length > 0);
    let selectedCount = $derived(selectedIds.length);

    onMount(() => {
        syncAllMemories();
    });

    // --- Archive Functions ---

    function openArchiveModal(archive: ExternalArchive | null = null) {
        editingArchive = archive;
        if (archive) {
            archiveForm = {
                platform: archive.platform,
                locationDetails:
                    archive.location_details || archive.locationDetails || "",
                accessUrl: archive.access_url || archive.accessUrl || "",
            };
        } else {
            archiveForm = { platform: "", locationDetails: "", accessUrl: "" };
        }
        showArchiveModal = true;
    }

    function saveArchive() {
        if (!archiveForm.platform || !archiveForm.locationDetails) return;

        if (editingArchive && editingArchive.id) {
            updateArchive(editingArchive.id, {
                platform: archiveForm.platform,
                location_details: archiveForm.locationDetails,
                access_url: archiveForm.accessUrl,
            });
        } else {
            addArchive({
                platform: archiveForm.platform,
                location_details: archiveForm.locationDetails,
                access_url: archiveForm.accessUrl,
            });
        }
        showArchiveModal = false;
    }

    function handleDeleteArchive(id: number) {
        if (
            confirm(
                "Remove this archive location? You can add it back anytime.",
            )
        ) {
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
                addVisualMemory({
                    url: result,
                    name: file.name.split(".")[0].replace(/-|_/g, " "),
                    type: file.type.startsWith("image/") ? "photo" : "video",
                    tags: "",
                    is_favorite: false,
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
        if (
            confirm(
                `Remove ${selectedCount} memories? This action cannot be undone.`,
            )
        ) {
            // Bulk delete not explicitly implemented in SyncManager but we can map
            selectedIds.forEach((id) => removeVisualMemory(Number(id)));
            selectedIds = [];
            isSelectionMode = false;
        }
    }

    function handleBulkTag(e: CustomEvent<string>) {
        // Bulk tag not explicitly implemented in SyncManager but we can map
        selectedIds.forEach((id) => {
            // In a real app we'd have a bulk API, for now we do sequential updates if needed
            // or just leave it for now if complex.
        });
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

{#if module}
    <LivingBlueprintHeader
        title={module.title}
        subtitle={module.description}
        tier={module.role === "owner" ? "preparation" : "executor"}
    />
{/if}

<div class="max-w-7xl mx-auto p-8 animate-in fade-in duration-500">
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
                        memories={visualMemories.items}
                        bind:viewMode
                        bind:selectedIds
                        bind:isSelectionMode
                        on:toggleFavorite={(e) =>
                            toggleVisualFavorite(e.detail)}
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
                    class="bg-white rounded-2xl border border-slate-200 p-4 min-h-[400px] flex items-center justify-center"
                >
                    <EmptyState
                        title="Your memories live in many places"
                        whyMatters="<strong>Your family's most precious photos and videos are scattered across services they may not even know exist.</strong> iCloud, Google Photos, Dropbox, old hard drives, Facebook albums—each one holds irreplaceable memories that could be lost forever if no one knows where to look.<br/><br/>By mapping where your digital memories live, you're ensuring that future generations can access the visual story of your life. These aren't just files—they're birthdays, vacations, quiet moments, and family history."
                        encouragement="Start with just one location—wherever you store most of your photos. You can add more as you remember them."
                        icon={Image}
                        iconClass="text-purple-500"
                        ctaLabel="Add first archive location"
                        onAction={() => openArchiveModal()}
                    />
                </div>
            {:else}
                <div
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {#each externalArchives.items as archive (archive.id)}
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
