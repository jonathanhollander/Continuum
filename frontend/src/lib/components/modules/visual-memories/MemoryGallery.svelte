<script lang="ts">
    import { askConfirm } from "$lib/components/ui/ConfirmModal.svelte";
    import { tagList, removeMemory, updateMemory, type VisualMemory } from "$lib/stores/visualMemoryStore.svelte";
    import {
        Grid,
        LayoutTemplate,
        X,
        ChevronLeft,
        ChevronRight,
        Heart,
        Play,
        Trash2,
        Pencil,
    } from "lucide-svelte";
    import { fade, fly } from "svelte/transition";
    import { onDestroy } from "svelte";
    import { mediaIdFromRef, getMediaBlobUrl } from "$lib/services/mediaService";

    let {
        memories = [],
        viewMode = $bindable<"grid" | "carousel">("grid"),
        selectedIds = $bindable<string[]>([]),
        isSelectionMode = false,
        onToggleFavorite,
        onSelectionChange,
        onViewChange
    } = $props<{
        memories?: VisualMemory[];
        viewMode?: "grid" | "carousel";
        selectedIds?: string[];
        isSelectionMode?: boolean;
        onToggleFavorite?: (id: string) => void;
        onSelectionChange?: (ids: string[]) => void;
        onViewChange?: (mode: "grid" | "carousel") => void;
    }>();

    // Stored files (url = "/api/media/12/download") need the auth header, so they are
    // fetched once and shown from object URLs. data: URLs from older records show as-is.
    let blobUrls = $state<Record<string, string>>({});
    const requested = new Set<string>();

    $effect(() => {
        for (const m of memories) {
            const ref = m?.url;
            if (!ref || requested.has(ref) || mediaIdFromRef(ref) === null) continue;
            requested.add(ref);
            getMediaBlobUrl(ref)
                .then((u) => (blobUrls = { ...blobUrls, [ref]: u }))
                .catch((e) => {
                    requested.delete(ref);
                    console.warn("[visual-memories] file open failed", e);
                });
        }
    });

    onDestroy(() => Object.values(blobUrls).forEach((u) => URL.revokeObjectURL(u)));

    function srcOf(m: VisualMemory): string | undefined {
        if (!m?.url) return undefined;
        return mediaIdFromRef(m.url) === null ? m.url : blobUrls[m.url];
    }

    // A video at rest paints nothing until it has decoded a frame; seeking a
    // little past 0 once the metadata is in makes the browser show that frame.
    function showFirstFrame(e: Event) {
        const v = e.currentTarget as HTMLVideoElement;
        if (v.currentTime === 0 && v.paused) {
            v.currentTime = Math.min(0.1, (v.duration || 0.2) / 2);
        }
    }

    // Carousel State
    let activeIndex = $state(0);

    // Reset or clamp index when switching views
    $effect(() => {
        if (viewMode === "carousel" && memories.length > 0) {
            activeIndex = Math.min(activeIndex, memories.length - 1);
        } else if (viewMode === "carousel") {
            viewMode = "grid";
        }
    });

    function toggleSelection(id: string, e: Event) {
        e.stopPropagation();
        if (selectedIds.includes(id)) {
            selectedIds = selectedIds.filter((i: string) => i !== id);
        } else {
            selectedIds = [...selectedIds, id];
        }
        onSelectionChange?.(selectedIds);
    }

    function handleCardClick(memory: VisualMemory) {
        if (isSelectionMode) {
            toggleSelection(String(memory.id), new Event("click"));
        } else {
            viewMode = "carousel";
            activeIndex = memories.indexOf(memory);
            onViewChange?.("carousel");
        }
    }

    function nextImage() {
        if (activeIndex < memories.length - 1) activeIndex++;
    }

    function prevImage() {
        if (activeIndex > 0) activeIndex--;
    }

    async function handleRemove(id: string, e?: Event) {
        e?.stopPropagation();
        if (await askConfirm("Remove this item? You can upload it again if needed.")) {
            removeMemory(Number(id));
        }
    }

    // Naming and describing the memory open in the carousel.
    let editingId = $state<string | null>(null);
    let editName = $state("");
    let editDescription = $state("");
    let isSavingDetails = $state(false);

    function startEdit(m: VisualMemory) {
        editingId = String(m.id);
        editName = m.name ?? "";
        editDescription = m.description ?? "";
    }

    async function saveDetails() {
        if (!editingId || !editName.trim() || isSavingDetails) return;
        isSavingDetails = true;
        try {
            await updateMemory(Number(editingId), { name: editName.trim(), description: editDescription.trim() });
            editingId = null;
        } catch {
            // The sync manager shows a gentle note; the words stay in the form.
        } finally {
            isSavingDetails = false;
        }
    }

    // Moving to another memory closes the form.
    $effect(() => {
        if (viewMode !== "carousel" || String(memories[activeIndex]?.id) !== editingId) editingId = null;
    });

    function toggleFavorite(id: string, e: Event) {
        e.stopPropagation();
        onToggleFavorite?.(id);
    }
</script>

<div class="flex flex-col h-full">
    <!-- View Controls -->
    <div class="flex justify-end mb-6">
        <div class="bg-muted p-1 rounded-lg flex">
            <button
                class="p-2 rounded-md transition-all {viewMode === 'grid'
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'}"
                onclick={() => {
                    viewMode = "grid";
                    onViewChange?.("grid");
                }}
                title="Grid View"
            >
                <Grid size={18} />
            </button>
            <button
                class="p-2 rounded-md transition-all {viewMode === 'carousel'
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'}"
                onclick={() => {
                    viewMode = "carousel";
                    onViewChange?.("carousel");
                }}
                title="Carousel View"
            >
                <LayoutTemplate size={18} />
            </button>
        </div>
    </div>

    <!-- Content -->
    {#if viewMode === "grid"}
        <div
            class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            in:fade={{ duration: 300 }}
        >
            {#each memories as memory (memory.id)}
                <div
                    role="button"
                    tabindex="0"
                    class="group relative aspect-square bg-muted rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all {selectedIds.includes(
                        String(memory.id),
                    )
                        ? 'ring-4 ring-primary ring-offset-2 ring-offset-background'
                        : ''}"
                    onclick={() => handleCardClick(memory)}
                    onkeydown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleCardClick(memory);
                        }
                    }}
                >
                    {#if memory.type === "video"}
                        <video
                            src={srcOf(memory)}
                            muted
                            playsinline
                            preload="metadata"
                            onloadedmetadata={showFirstFrame}
                            class="w-full h-full object-cover"
                        ></video>
                        <div
                            class="absolute inset-0 flex items-center justify-center pointer-events-none"
                            aria-hidden="true"
                        >
                            <div
                                class="h-12 w-12 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white"
                            >
                                <Play size={22} class="fill-white ml-0.5" />
                            </div>
                        </div>
                    {:else}
                        <img
                            src={srcOf(memory)}
                            alt={memory.name}
                            class="w-full h-full object-cover transition-transform duration-500 {isSelectionMode
                                ? 'scale-100'
                                : 'group-hover:scale-105'}"
                            loading="lazy"
                        />
                    {/if}

                    <!-- Selection Overlay -->
                    {#if isSelectionMode}
                        <div
                            class="absolute inset-0 bg-black/10 flex items-start justify-end p-2 transition-opacity"
                        >
                            <div
                                class="h-6 w-6 rounded-full border-2 border-white flex items-center justify-center transition-colors {selectedIds.includes(
                                    String(memory.id),
                                )
                                    ? 'bg-primary border-primary'
                                    : 'bg-black/30'}"
                            >
                                {#if selectedIds.includes(String(memory.id))}
                                    <div
                                        class="w-2.5 h-2.5 bg-primary-foreground rounded-full"
                                    ></div>
                                {/if}
                            </div>
                        </div>
                    {/if}

                    <!-- Overlay (Only when not in selection mode or on hover) -->
                    {#if !isSelectionMode}
                        <div
                            class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent {memory.type === 'video'
                                ? 'opacity-100'
                                : 'opacity-0 group-hover:opacity-100'} transition-opacity flex flex-col justify-end p-4"
                        >
                            <div
                                class="text-white font-medium truncate text-sm"
                            >
                                {memory.name}
                            </div>
                            <div class="flex gap-2 mt-1">
                                {#each tagList(memory.tags) as tag}
                                    <span
                                        class="text-[10px] bg-white/20 backdrop-blur px-2 py-0.5 rounded-full text-white"
                                        >{tag}</span
                                    >
                                {/each}
                            </div>
                        </div>

                        <!-- Actions -->
                        <div
                            class="absolute top-2 right-2 transition-opacity flex gap-2"
                        >
                            <button
                                class="p-2 bg-card/80 backdrop-blur rounded-full hover:bg-card text-muted-foreground hover:text-primary transition-colors"
                                onclick={(e) =>
                                    toggleFavorite(String(memory.id), e)}
                                aria-label="Favorite"
                                aria-pressed={!!(memory.is_favorite || (memory as any).isFavorite)}
                            >
                                <Heart
                                    size={14}
                                    class={memory.is_favorite ||
                                    (memory as any).isFavorite
                                        ? "fill-primary text-primary"
                                        : ""}
                                />
                            </button>
                            <button
                                class="p-2 bg-card/80 backdrop-blur rounded-full hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
                                onclick={(e) => handleRemove(String(memory.id), e)}
                                aria-label="Remove this item"
                                title="Remove this item"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {:else}
        <!-- Carousel View -->
        <div
            class="flex-1 relative flex items-center justify-center bg-slate-900 rounded-2xl overflow-hidden min-h-[600px]"
            in:fade
        >
            <!-- Main Image -->
            {#key activeIndex}
                {#if memories[activeIndex].type === "video"}
                    <!-- svelte-ignore a11y_media_has_caption -->
                    <video
                        src={srcOf(memories[activeIndex])}
                        controls
                        playsinline
                        class="absolute left-20 right-20 top-0 w-[calc(100%-10rem)] h-[calc(100%-16rem)] object-contain"
                        in:fade={{ duration: 300 }}
                    ></video>
                {:else}
                    <img
                        src={srcOf(memories[activeIndex])}
                        alt={memories[activeIndex].name}
                        class="absolute inset-0 w-full h-full object-contain"
                        in:fade={{ duration: 300 }}
                    />
                {/if}
            {/key}

            <!-- Controls -->
            <button
                class="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-30 backdrop-blur transition-all"
                onclick={prevImage}
                disabled={activeIndex === 0}
                aria-label="Previous"
            >
                <ChevronLeft size={24} />
            </button>

            <button
                class="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-30 backdrop-blur transition-all"
                onclick={nextImage}
                disabled={activeIndex === memories.length - 1}
                aria-label="Next"
            >
                <ChevronRight size={24} />
            </button>

            <!-- Info Bar -->
            <div
                class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white"
            >
                <div class="flex justify-between items-end">
                    {#if editingId === String(memories[activeIndex].id)}
                    <div class="flex-1 max-w-2xl space-y-2 mb-4">
                        <label for="memory-name" class="sr-only">Name</label>
                        <input
                            id="memory-name"
                            bind:value={editName}
                            placeholder="Name this memory"
                            class="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/30 text-white placeholder-white/50 outline-none focus:border-white"
                        />
                        <label for="memory-description" class="sr-only">Description</label>
                        <textarea
                            id="memory-description"
                            bind:value={editDescription}
                            placeholder="The story behind this memory..."
                            class="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/30 text-white placeholder-white/50 outline-none focus:border-white h-20 resize-none text-sm"
                        ></textarea>
                        <div class="flex gap-2">
                            <button
                                onclick={saveDetails}
                                disabled={!editName.trim() || isSavingDetails}
                                class="px-4 py-2 bg-white text-slate-900 rounded-lg font-bold text-sm disabled:opacity-50"
                            >
                                Save my changes
                            </button>
                            <button
                                onclick={() => (editingId = null)}
                                class="px-4 py-2 rounded-lg font-bold text-sm text-white hover:bg-white/10"
                            >
                                Maybe later
                            </button>
                        </div>
                    </div>
                    {:else}
                    <div>
                        <h2 class="text-xl font-bold mb-2 text-white">
                            {memories[activeIndex].name}
                        </h2>
                        <div class="flex gap-2 mb-4">
                            {#each tagList(memories[activeIndex].tags) as tag}
                                <span
                                    class="text-xs bg-white/20 backdrop-blur px-3 py-1 rounded-full"
                                    >{tag}</span
                                >
                            {/each}
                        </div>
                        {#if memories[activeIndex].description}
                            <p class="text-white/80 text-sm max-w-2xl whitespace-pre-wrap">
                                {memories[activeIndex].description}
                            </p>
                        {/if}
                    </div>
                    {/if}

                    <div class="flex gap-2 mb-1">
                    <button
                        class="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                        onclick={() => startEdit(memories[activeIndex])}
                        aria-label="Name and describe this memory"
                        title="Name and describe this memory"
                    >
                        <Pencil size={20} />
                    </button>
                    <button
                        class="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                        onclick={() => handleRemove(String(memories[activeIndex].id))}
                        aria-label="Remove this item"
                        title="Remove this item"
                    >
                        <Trash2 size={20} />
                    </button>
                    <button
                        class="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                        onclick={() =>
                            onToggleFavorite?.(String(memories[activeIndex].id))}
                        aria-label="Favorite"
                        aria-pressed={!!(memories[activeIndex].is_favorite || (memories[activeIndex] as any).isFavorite)}
                    >
                        <Heart
                            size={20}
                            class={memories[activeIndex].is_favorite ||
                            (memories[activeIndex] as any).isFavorite
                                ? "fill-primary text-primary"
                                : ""}
                        />
                    </button>
                    </div>
                </div>

                <!-- Thumbnails Strip -->
                <div
                    class="flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-hide mask-fade"
                >
                    {#each memories as mem, i}
                        <button
                            class="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all {i ===
                            activeIndex
                                ? 'border-white opacity-100 scale-105'
                                : 'border-transparent opacity-50 hover:opacity-80'}"
                            onclick={() => (activeIndex = i)}
                            aria-label={mem.name}
                            aria-current={i === activeIndex}
                        >
                            {#if mem.type === "video"}
                                <video src={srcOf(mem)} muted preload="metadata" onloadedmetadata={showFirstFrame} class="w-full h-full object-cover"></video>
                            {:else}
                                <img
                                    src={srcOf(mem)}
                                    alt=""
                                    class="w-full h-full object-cover"
                                />
                            {/if}
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Close Carousel -->
            <button
                class="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur transition-colors"
                onclick={() => (viewMode = "grid")}
                aria-label="Close"
            >
                <X size={20} />
            </button>
        </div>
    {/if}
</div>

<style>
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
</style>
