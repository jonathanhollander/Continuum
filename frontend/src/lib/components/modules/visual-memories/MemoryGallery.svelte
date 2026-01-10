<script lang="ts">
    import type { InternalMemory } from "$lib/stores/visualMemoryStore";
    import {
        Grid,
        LayoutTemplate,
        X,
        ChevronLeft,
        ChevronRight,
        Heart,
    } from "lucide-svelte";
    import { createEventDispatcher } from "svelte";
    import { fade, fly } from "svelte/transition";

    export let memories: InternalMemory[] = [];
    export let viewMode: "grid" | "carousel" = "grid";
    export let selectedIds: string[] = [];
    export let isSelectionMode = false;

    const dispatch = createEventDispatcher();

    // Carousel State
    let activeIndex = 0;

    $: if (viewMode === "carousel" && memories.length > 0) {
        // Reset or clamp index when switching views
        activeIndex = Math.min(activeIndex, memories.length - 1);
    }

    function toggleSelection(id: string, e: Event) {
        e.stopPropagation();
        if (selectedIds.includes(id)) {
            selectedIds = selectedIds.filter((i) => i !== id);
        } else {
            selectedIds = [...selectedIds, id];
        }
        dispatch("selectionChange", selectedIds);
    }

    function handleCardClick(memory: InternalMemory) {
        if (isSelectionMode) {
            toggleSelection(memory.id, new Event("click"));
        } else {
            viewMode = "carousel";
            activeIndex = memories.indexOf(memory);
            dispatch("viewChange", "carousel");
        }
    }

    function nextImage() {
        if (activeIndex < memories.length - 1) activeIndex++;
    }

    function prevImage() {
        if (activeIndex > 0) activeIndex--;
    }

    function toggleFavorite(id: string, e: Event) {
        e.stopPropagation();
        dispatch("toggleFavorite", id);
    }
</script>

<div class="flex flex-col h-full">
    <!-- View Controls -->
    <div class="flex justify-end mb-6">
        <div class="bg-slate-100 p-1 rounded-lg flex">
            <button
                class="p-2 rounded-md transition-all {viewMode === 'grid'
                    ? 'bg-white text-[#4A7C74] shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'}"
                on:click={() => {
                    viewMode = "grid";
                    dispatch("viewChange", "grid");
                }}
                title="Grid View"
            >
                <Grid size={18} />
            </button>
            <button
                class="p-2 rounded-md transition-all {viewMode === 'carousel'
                    ? 'bg-white text-[#4A7C74] shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'}"
                on:click={() => {
                    viewMode = "carousel";
                    dispatch("viewChange", "carousel");
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
                    class="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all {selectedIds.includes(
                        memory.id,
                    )
                        ? 'ring-4 ring-indigo-500 ring-offset-2'
                        : ''}"
                    on:click={() => handleCardClick(memory)}
                >
                    <img
                        src={memory.url}
                        alt={memory.name}
                        class="w-full h-full object-cover transition-transform duration-500 {isSelectionMode
                            ? 'scale-100'
                            : 'group-hover:scale-105'}"
                        loading="lazy"
                    />

                    <!-- Selection Overlay -->
                    {#if isSelectionMode}
                        <div
                            class="absolute inset-0 bg-black/10 flex items-start justify-end p-2 transition-opacity"
                        >
                            <div
                                class="h-6 w-6 rounded-full border-2 border-white flex items-center justify-center transition-colors {selectedIds.includes(
                                    memory.id,
                                )
                                    ? 'bg-indigo-500 border-indigo-500'
                                    : 'bg-black/30'}"
                            >
                                {#if selectedIds.includes(memory.id)}
                                    <div
                                        class="w-2.5 h-2.5 bg-white rounded-full"
                                    ></div>
                                {/if}
                            </div>
                        </div>
                    {/if}

                    <!-- Overlay (Only when not in selection mode or on hover) -->
                    {#if !isSelectionMode}
                        <div
                            class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4"
                        >
                            <div
                                class="text-white font-medium truncate text-sm"
                            >
                                {memory.name}
                            </div>
                            <div class="flex gap-2 mt-1">
                                {#each memory.tags as tag}
                                    <span
                                        class="text-[10px] bg-white/20 backdrop-blur px-2 py-0.5 rounded-full text-white"
                                        >{tag}</span
                                    >
                                {/each}
                            </div>
                        </div>

                        <!-- Actions -->
                        <div
                            class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2"
                        >
                            <button
                                class="p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white text-slate-500 hover:text-red-500 transition-colors"
                                on:click={(e) => toggleFavorite(memory.id, e)}
                            >
                                <Heart
                                    size={14}
                                    class={memory.isFavorite
                                        ? "fill-red-500 text-red-500"
                                        : ""}
                                />
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
                <img
                    src={memories[activeIndex].url}
                    alt={memories[activeIndex].name}
                    class="absolute inset-0 w-full h-full object-contain"
                    in:fade={{ duration: 300 }}
                />
            {/key}

            <!-- Controls -->
            <button
                class="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-30 backdrop-blur transition-all"
                on:click={prevImage}
                disabled={activeIndex === 0}
            >
                <ChevronLeft size={24} />
            </button>

            <button
                class="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-30 backdrop-blur transition-all"
                on:click={nextImage}
                disabled={activeIndex === memories.length - 1}
            >
                <ChevronRight size={24} />
            </button>

            <!-- Info Bar -->
            <div
                class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white"
            >
                <div class="flex justify-between items-end">
                    <div>
                        <h2 class="text-xl font-bold mb-2">
                            {memories[activeIndex].name}
                        </h2>
                        <div class="flex gap-2 mb-4">
                            {#each memories[activeIndex].tags as tag}
                                <span
                                    class="text-xs bg-white/20 backdrop-blur px-3 py-1 rounded-full"
                                    >{tag}</span
                                >
                            {/each}
                        </div>
                        <p class="text-white/80 text-sm max-w-2xl">
                            {memories[activeIndex].description ||
                                "No description provided."}
                        </p>
                    </div>

                    <button
                        class="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors mb-1"
                        on:click={() =>
                            dispatch(
                                "toggleFavorite",
                                memories[activeIndex].id,
                            )}
                    >
                        <Heart
                            size={20}
                            class={memories[activeIndex].isFavorite
                                ? "fill-red-500 text-red-500"
                                : ""}
                        />
                    </button>
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
                            on:click={() => (activeIndex = i)}
                        >
                            <img
                                src={mem.url}
                                alt=""
                                class="w-full h-full object-cover"
                            />
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Close Carousel -->
            <button
                class="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur transition-colors"
                on:click={() => (viewMode = "grid")}
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
