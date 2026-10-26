<script lang="ts">
    import { askConfirm } from "$lib/components/ui/ConfirmModal.svelte";
    import { focusTrap } from "$lib/actions/focusTrap";
    import { fade, fly } from "svelte/transition";
    import {
        Image,
        ExternalLink,
        Plus,
        Grid,
        List as ListIcon,
        X,
        Save,
        Loader2,
    } from "lucide-svelte";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte"; // NEW IMPORT
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import {
        visualMemories,
        externalArchives,
        addArchive,
        updateArchive,
        removeArchive,
        addMemory as addVisualMemory,
        removeMemory as removeVisualMemory,
        toggleFavorite as toggleVisualFavorite,
        addTagToMemories,
        affirmMemories,
        tagList,
        syncAllMemories,
        type ExternalArchive,
    } from "$lib/stores/visualMemoryStore.svelte";
    import { uploadMedia, updateMediaMetadata, deleteMedia, isValidMediaType } from "$lib/services/mediaService";
    import { get } from "svelte/store";
    import { notifications } from "$lib/stores/notificationStore";
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
    import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";
    import { userPreferencesStore, type ViewMode } from "$lib/stores/userPreferencesStore.svelte";

    let activeTab = $state<"gallery" | "archives">("gallery");
    // The Cards/Table choice is kept per module in the person's preferences.
    let dataViewMode = $derived<ViewMode>(userPreferencesStore.getViewMode('visual-memories'));

    // Gallery State
    let viewMode = $state<"grid" | "carousel">("grid");
    let fileInput: HTMLInputElement | undefined = $state();
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
    let isLoading = $state(true);

    onMount(async () => {
        await syncAllMemories();
        isLoading = false;
    });

    // --- Archive Functions ---

    function openArchiveModal(archive: ExternalArchive | null = null) {
        editingArchive = archive;
        if (archive) {
            // A saved archive comes back camelCased by SyncManager; one still being saved keeps the
            // snake_case it was created with, so both spellings occur.
            const a = archive as ExternalArchive & { locationDetails?: string; accessUrl?: string };
            archiveForm = {
                platform: a.platform,
                locationDetails: a.location_details || a.locationDetails || "",
                accessUrl: a.access_url || a.accessUrl || "",
            };
        } else {
            archiveForm = { platform: "", locationDetails: "", accessUrl: "" };
        }
        showArchiveModal = true;
    }

    let savingArchive = $state(false);
    const archiveSaveVersions = new WeakMap<object, number>();
    const archiveRecoveryIds = new WeakMap<object, string>();
    async function saveArchive() {
        if (savingArchive || !archiveForm.platform || !archiveForm.locationDetails) return;
        const form = archiveForm;
        const original = JSON.stringify(form);
        const id = editingArchive?.id;
        const submitted = {
            platform: form.platform,
            location_details: form.locationDetails,
            access_url: form.accessUrl,
        };
        const version = (archiveSaveVersions.get(form) ?? 0) + 1;
        archiveSaveVersions.set(form, version);
        let completed = false;
        const attempt = async () => {
            if (savingArchive || completed || archiveSaveVersions.get(form) !== version) return;
            savingArchive = true;
            try {
                const saved = id
                    ? await updateArchive(id, submitted, attempt, archiveRecoveryIds.get(form))
                    : await addArchive(submitted, attempt, archiveRecoveryIds.get(form));
                completed = true;
                archiveRecoveryIds.delete(form);
                if (archiveForm === form) {
                    if (JSON.stringify(archiveForm) === original) {
                        showArchiveModal = false;
                        editingArchive = null;
                        archiveForm = { platform: "", locationDetails: "", accessUrl: "" };
                    } else editingArchive = saved; // a later edit continues the saved location
                }
            } catch (e) {
                if (e && typeof e === "object" && "recoveryId" in e && typeof e.recoveryId === "string") archiveRecoveryIds.set(form, e.recoveryId);
                // The manager offers Retry; the location and instructions stay in this form.
            } finally {
                savingArchive = false;
            }
        };
        await attempt();
    }

    async function handleDeleteArchive(id: number) {
        if (
            await askConfirm(
                "Remove this archive location? You can add it back anytime.",
            )
        ) {
            removeArchive(id);
        }
    }

    // --- Gallery Functions ---

    let uploadingCount = $state(0);

    // Each file goes to the media API; the record keeps only its download_url.
    // Resolves true once the memory is saved (the batch affirms once for all of them).
    async function saveOne(file: File): Promise<boolean> {
        let media;
        try {
            media = await uploadMedia(file, "visual_memories");
        } catch (err: any) {
            notifications.showError({
                message: err?.message || "Saving this file paused. It is still here, ready to try again.",
                code: "UPLOAD_ERROR",
                technicalDetails: String(err),
            } as any);
            return false;
        }
        return saveRecord(media, {
            url: media.download_url,
            name: file.name.replace(/\.[^.]+$/, "").replace(/-|_/g, " "),
            type: file.type.startsWith("image/") ? "photo" : "video",
            tags: [],
            is_favorite: false,
            size: file.size,
        });
    }

    // The record save shows its own gentle message with a retry. A retry reuses the
    // uploaded file; closing that message without retrying removes the upload.
    async function saveRecord(media: { id: number }, data: Parameters<typeof addVisualMemory>[0]): Promise<boolean> {
        let retried = false;
        // A save that succeeds on Try Again happens on its own, so it gets its own affirmation.
        const retry = async () => {
            retried = true;
            if (await saveRecord(media, data)) affirmMemories();
        };
        try {
            const record = await addVisualMemory(data, retry);
            if (record?.id != null) {
                await updateMediaMetadata(media.id, undefined, String(record.id)).catch((e) =>
                    console.warn("[visual-memories] reference_id link paused", e),
                );
            }
            return true;
        } catch {
            const noteId = get(notifications).filter((n) => n.type === "error").at(-1)?.id;
            if (!noteId) return false;
            let unsub = () => {};
            unsub = notifications.subscribe((list) => {
                if (list.some((n) => n.id === noteId)) return;
                unsub();
                // A retry runs right after its message closes, so check once it has had the chance
                queueMicrotask(() => {
                    if (!retried) {
                        deleteMedia(media.id).catch((e) =>
                            console.warn("[visual-memories] upload removal paused", media.id, e),
                        );
                    }
                });
            });
            return false;
        }
    }

    async function handleFileUpload(e: Event) {
        const input = e.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;
        const files = Array.from(input.files).filter(
            (file) =>
                (file.type.startsWith("image/") || file.type.startsWith("video/")) &&
                isValidMediaType(file),
        );
        input.value = ""; // Clear input

        uploadingCount += files.length;
        let saved = 0;
        for (const file of files) {
            try {
                if (await saveOne(file)) saved += 1;
            } finally {
                uploadingCount -= 1;
            }
        }
        if (saved > 0) affirmMemories();
    }

    async function handleRemoveMemory(id: number) {
        if (await askConfirm("Remove this item? You can upload it again if needed.")) {
            removeVisualMemory(id);
        }
    }

    function triggerUpload() {
        fileInput?.click();
    }

    function toggleSelectionMode() {
        isSelectionMode = !isSelectionMode;
        if (!isSelectionMode) {
            selectedIds = [];
        }
    }

    async function handleBulkDeleteSubmit() {
        if (
            await askConfirm(
                `Remove ${selectedCount} ${selectedCount === 1 ? "memory" : "memories"}?`,
            )
        ) {
            selectedIds.forEach((id) => removeVisualMemory(Number(id)));
            selectedIds = [];
            isSelectionMode = false;
        }
    }

    function handleBulkTag(tag: string) {
        addTagToMemories(selectedIds.map(Number), tag);
        selectedIds = [];
        isSelectionMode = false;
    }
</script>

{#if isLoading}
    <div class="flex items-center justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
{:else}
<!-- Archive Modal -->
{#if showArchiveModal}
    <div role="dialog" aria-modal="true" aria-labelledby="archive-dialog-title" use:focusTrap={{ onEscape: () => (showArchiveModal = false) }}
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
        transition:fade
    >
        <div
            class="bg-card rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            in:fly={{ y: 20 }}
        >
            <div
                class="p-6 border-b border-border flex justify-between items-center"
            >
                <h3 id="archive-dialog-title" class="font-serif font-bold text-xl text-primary-deep dark:text-primary-hover">
                    {editingArchive ? "Edit Location" : "Add Legacy Location"}
                </h3>
                <button aria-label="Close"
                    onclick={() => (showArchiveModal = false)}
                    class="text-muted-foreground hover:text-foreground"
                >
                    <X size={20} />
                </button>
            </div>

            <div class="p-6 space-y-4">
                <div class="space-y-2">
                    <label for="memory-platform"
                        class="text-xs font-bold uppercase text-muted-foreground tracking-wider"
                        >Platform / Device Name</label
                    >
                    <input id="memory-platform"
                        type="text"
                        bind:value={archiveForm.platform}
                        placeholder="e.g. iCloud, Google Photos, My Passport Drive"
                        class="w-full px-4 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-medium"
                    />
                </div>

                <div class="space-y-2">
                    <label for="memory-location-details"
                        class="text-xs font-bold uppercase text-muted-foreground tracking-wider"
                        >Access Instructions</label
                    >
                    <textarea id="memory-location-details"
                        bind:value={archiveForm.locationDetails}
                        placeholder="How do executors access this? e.g. 'Login details in password vault' or 'Physical drive in fireproof safe'"
                        class="w-full px-4 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-medium h-24 resize-none"
                    ></textarea>
                </div>

                <div class="space-y-2">
                    <label for="memory-access-url"
                        class="text-xs font-bold uppercase text-muted-foreground tracking-wider"
                        >Direct URL (Optional)</label
                    >
                    <div class="relative">
                        <ExternalLink
                            size={16}
                            class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <input id="memory-access-url"
                            type="text"
                            bind:value={archiveForm.accessUrl}
                            placeholder="https://..."
                            class="w-full pl-10 pr-4 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-medium text-sm"
                        />
                    </div>
                </div>
            </div>

            <div
                class="p-6 bg-muted border-t border-border flex justify-end gap-3"
            >
                <button
                    onclick={() => (showArchiveModal = false)}
                    class="px-4 py-2 font-bold text-muted-foreground hover:text-foreground text-sm"
                >
                    Maybe later
                </button>
                <button
                    onclick={saveArchive}
                    disabled={savingArchive || !archiveForm.platform ||
                        !archiveForm.locationDetails}
                    aria-busy={savingArchive}
                    class="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm shadow-sm hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                    <Save size={16} /> {savingArchive ? "Saving..." : "Save Location"}
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

<div class="max-w-7xl mx-auto p-8 animate-in fade-in duration-500">

    <!-- AI Prompt Bar -->
    <div class="max-w-3xl mx-auto mb-8">
        <AIPromptBar context="visual-memories" />
    </div>

    <!-- Tabs / Navigation -->
    <div
        class="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 border-b border-border pb-4"
    >
        <div class="flex p-1 bg-muted rounded-full">
            <button
                class="px-6 py-2 rounded-full font-bold text-sm transition-all {activeTab ===
                'gallery'
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-primary'}"
                onclick={() => (activeTab = "gallery")}
            >
                Curated Gallery
            </button>
            <button
                class="px-6 py-2 rounded-full font-bold text-sm transition-all {activeTab ===
                'archives'
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-primary'}"
                onclick={() => (activeTab = "archives")}
            >
                External Archives
            </button>
        </div>

        <div class="flex items-center gap-3">
            {#if activeTab === "archives"}
                <button
                    onclick={() => openArchiveModal()}
                    class="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:bg-primary-hover transition-colors shadow-sm"
                >
                    <Plus size={16} /> Add Location
                </button>
            {:else}
                <DataViewToggle module="visual-memories" />
                <button
                    onclick={triggerUpload}
                    class="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:bg-primary-hover transition-colors shadow-sm"
                >
                    {#if uploadingCount > 0}
                        <Loader2 size={16} class="animate-spin" /> Saving your memories…
                    {:else}
                        <Plus size={16} /> Add Memories
                    {/if}
                </button>
            {/if}
        </div>
    </div>

    <!-- Content Area -->
    {#if activeTab === "gallery"}
        <div in:fade>
            <div
                class="bg-card rounded-2xl border border-border p-8 min-h-[400px] relative"
            >
                {#if hasMemories}
                    <div class="absolute top-8 left-8 z-10">
                        <button
                            class="text-sm font-bold px-3 py-1.5 rounded-lg transition-colors {isSelectionMode
                                ? 'bg-primary-soft text-primary-hover'
                                : 'bg-muted text-muted-foreground hover:bg-border'}"
                            onclick={toggleSelectionMode}
                        >
                            {isSelectionMode
                                ? "Finished choosing"
                                : "Choose items"}
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
                                class="text-sm font-bold text-primary hover:bg-primary/5 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Image size={14} /> Upload First Memory
                            </button>
                        </div>
                    </div>
                {:else if dataViewMode === "table"}
                    <div class="overflow-x-auto mt-12">
                        <table class="w-full text-left text-sm">
                            <thead>
                                <tr class="border-b border-border text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    <th class="py-3 pr-4">Name</th>
                                    <th class="py-3 pr-4">Type</th>
                                    <th class="py-3 pr-4">Tags</th>
                                    <th class="py-3 pr-4">Favorite</th>
                                    <th class="py-3"><span class="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each visualMemories.items as memory (memory.id)}
                                    <tr class="border-b border-border">
                                        <td class="py-3 pr-4 font-medium text-foreground">{memory.name}</td>
                                        <td class="py-3 pr-4 text-muted-foreground">{memory.type === "video" ? "Video" : "Photo"}</td>
                                        <td class="py-3 pr-4">
                                            <div class="flex flex-wrap gap-1">
                                                {#each tagList(memory.tags) as tag}
                                                    <span class="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{tag}</span>
                                                {/each}
                                            </div>
                                        </td>
                                        <td class="py-3 pr-4">
                                            <button
                                                class="text-xs font-bold px-2 py-1 rounded-lg transition-colors {memory.is_favorite || (memory as any).isFavorite
                                                    ? 'bg-primary-soft text-primary-hover'
                                                    : 'text-muted-foreground hover:bg-muted'}"
                                                aria-pressed={!!(memory.is_favorite || (memory as any).isFavorite)}
                                                onclick={() => toggleVisualFavorite(Number(memory.id))}
                                            >
                                                Favorite
                                            </button>
                                        </td>
                                        <td class="py-3 text-right">
                                            <button
                                                aria-label="Remove this item"
                                                class="text-xs font-bold px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                                onclick={() => handleRemoveMemory(Number(memory.id))}
                                            >
                                                Remove this item
                                            </button>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {:else}
                    <MemoryGallery
                        memories={visualMemories.items}
                        bind:viewMode
                        bind:selectedIds
                        {isSelectionMode}
                        onToggleFavorite={(id) =>
                            toggleVisualFavorite(Number(id))}
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
                    class="bg-card rounded-2xl border border-border p-4 min-h-[400px] flex items-center justify-center"
                >
                    <EmptyState
                        title="Your memories live in many places"
                        whyMatters="<strong>Your family's photos and videos live in many places.</strong> iCloud, Google Photos, Dropbox, old hard drives, Facebook albums each hold irreplaceable memories.<br/><br/>Listing where they live helps your family find the visual story of your life: birthdays, vacations, quiet moments, family history."
                        encouragement="Start with just one location—wherever you store most of your photos. You can add more as you remember them."
                        icon={Image}
                        iconClass="text-primary"
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
                            onedit={(arch) => openArchiveModal(arch)}
                            ondelete={(id) => handleDeleteArchive(id)}
                        />
                    {/each}

                    <!-- Add Card -->
                    <button
                        onclick={() => openArchiveModal()}
                        class="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all min-h-[160px] group"
                    >
                        <div
                            class="w-12 h-12 rounded-full bg-muted group-hover:bg-card flex items-center justify-center mb-3 transition-colors"
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
{/if}
