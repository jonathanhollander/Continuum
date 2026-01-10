<script context="module" lang="ts">
    export interface GalleryItem {
        id: string;
        url: string;
        type?: "image" | "video";
        thumbnailUrl?: string; // For videos
        name: string;
        tags?: string[];
        description?: string;
        isFavorite?: boolean;
    }
</script>

<script lang="ts">
    import {
        Grid,
        LayoutTemplate,
        X,
        ChevronLeft,
        ChevronRight,
        Heart,
        Play,
        Trash2,
        Image as ImageIcon,
    } from "lucide-svelte";
    import { createEventDispatcher } from "svelte";
    import { fade } from "svelte/transition";

    export let items: GalleryItem[] = [];
    export let viewMode: "grid" | "carousel" = "grid";
    export let selectedIds: string[] = [];
    export let isSelectionMode = false;
    export let allowFavorites = true;
    export let allowDelete = false;

    const dispatch = createEventDispatcher<{
        selectionChange: string[];
        viewChange: "grid" | "carousel";
        toggleFavorite: string;
        delete: string;
        setCover: string;
    }>();

    // Carousel State
    let activeIndex = 0;

    $: if (viewMode === "carousel" && items.length > 0) {
        activeIndex = Math.min(activeIndex, items.length - 1);
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

    function handleCardClick(item: GalleryItem) {
        if (isSelectionMode) {
            toggleSelection(item.id, new Event("click"));
        } else {
            viewMode = "carousel";
            activeIndex = items.indexOf(item);
            dispatch("viewChange", "carousel");
        }
    }

    function nextImage() {
        if (activeIndex < items.length - 1) activeIndex++;
    }

    function prevImage() {
        if (activeIndex > 0) activeIndex--;
    }

    function toggleFavorite(id: string, e: Event) {
        e.stopPropagation();
        dispatch("toggleFavorite", id);
    }

    function handleDelete(id: string, e: Event) {
        e.stopPropagation();
        if (confirm("Delete this item?")) {
            dispatch("delete", id);
        }
    }

    function handleSetCover(item: GalleryItem, e: Event) {
        e.stopPropagation();
        dispatch("setCover", item.url);
    }
</script>

<div class="flex flex-col h-full">
    <!-- View Controls -->
    <div class="flex justify-between items-center mb-6">
        <div class="text-xs font-bold uppercase tracking-widest text-slate-400">
            {items.length} Items
        </div>
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
                disabled={items.length === 0}
            >
                <LayoutTemplate size={18} />
            </button>
        </div>
    </div>

    <!-- Content -->
    {#if viewMode === "grid"}
        {#if items.length === 0}
            <div
                class="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200"
            >
                <div
                    class="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm mb-4"
                >
                    <ImageIcon size={32} />
                </div>
                <p class="text-slate-400 font-medium">Gallery is empty</p>
            </div>
        {:else}
            <div
                class="grid grid-cols-2 lg:grid-cols-4 gap-4"
                in:fade={{ duration: 300 }}
            >
                {#each items as item (item.id)}
                    <div
                        class="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all {selectedIds.includes(
                            item.id,
                        )
                            ? 'ring-4 ring-indigo-500 ring-offset-2'
                            : ''}"
                        on:click={() => handleCardClick(item)}
                    >
                        {#if item.type === "video"}
                            <div
                                class="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                            >
                                <div
                                    class="w-12 h-12 bg-black/40 backdrop-blur rounded-full flex items-center justify-center text-white"
                                >
                                    <Play size={24} fill="white" class="ml-1" />
                                </div>
                            </div>
                            {#if item.thumbnailUrl}
                                <img
                                    src={item.thumbnailUrl}
                                    alt={item.name}
                                    class="w-full h-full object-cover"
                                />
                            {:else}
                                <video
                                    src={item.url}
                                    class="w-full h-full object-cover"
                                    muted
                                    playsinline
                                ></video>
                            {/if}
                        {:else}
                            <img
                                src={item.url}
                                alt={item.name}
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
                                        item.id,
                                    )
                                        ? 'bg-indigo-500 border-indigo-500'
                                        : 'bg-black/30'}"
                                >
                                    {#if selectedIds.includes(item.id)}
                                        <div
                                            class="w-2.5 h-2.5 bg-white rounded-full"
                                        ></div>
                                    {/if}
                                </div>
                            </div>
                        {/if}

                        <!-- Overlay Actions -->
                        {#if !isSelectionMode}
                            <div
                                class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4"
                            >
                                <div
                                    class="text-white font-medium truncate text-sm"
                                >
                                    {item.name}
                                </div>

                                <!-- Actions -->
                                <div class="absolute top-2 right-2 flex gap-1">
                                    {#if allowFavorites}
                                        <button
                                            class="p-1.5 bg-white/80 backdrop-blur rounded-full hover:bg-white text-slate-500 hover:text-red-500 transition-colors"
                                            on:click={(e) =>
                                                toggleFavorite(item.id, e)}
                                            title="Favorite"
                                        >
                                            <Heart
                                                size={14}
                                                class={item.isFavorite
                                                    ? "fill-red-500 text-red-500"
                                                    : ""}
                                            />
                                        </button>
                                    {/if}
                                    {#if allowDelete}
                                        <button
                                            class="p-1.5 bg-white/80 backdrop-blur rounded-full hover:bg-white text-slate-500 hover:text-rose-500 transition-colors"
                                            on:click={(e) =>
                                                handleDelete(item.id, e)}
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    {/if}
                                </div>
                                <!-- Cover Action -->
                                {#if !selectedIds.includes(item.id) && item.type === "image"}
                                    <div
                                        class="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity delay-75"
                                    >
                                        <button
                                            class="text-[10px] bg-white/20 backdrop-blur px-2 py-0.5 rounded-full text-white hover:bg-white/40"
                                            on:click={(e) =>
                                                handleSetCover(item, e)}
                                        >
                                            Set Cover
                                        </button>
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}
    {:else}
        <!-- Carousel View -->
        <div
            class="flex-1 relative flex items-center justify-center bg-slate-900 rounded-2xl overflow-hidden min-h-[500px]"
            in:fade
        >
            <!-- Main Content -->
            {#key activeIndex}
                {#if items[activeIndex].type === "video"}
                    <video
                        src={items[activeIndex].url}
                        class="absolute inset-0 w-full h-full object-contain"
                        controls
                        autoplay
                    >
                        <track kind="captions" />
                    </video>
                {:else}
                    <img
                        src={items[activeIndex].url}
                        alt={items[activeIndex].name}
                        class="absolute inset-0 w-full h-full object-contain"
                        in:fade={{ duration: 300 }}
                    />
                {/if}
            {/key}

            <!-- Controls -->
            <button
                class="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-30 backdrop-blur transition-all z-20"
                on:click={prevImage}
                disabled={activeIndex === 0}
            >
                <ChevronLeft size={24} />
            </button>

            <button
                class="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-30 backdrop-blur transition-all z-20"
                on:click={nextImage}
                disabled={activeIndex === items.length - 1}
            >
                <ChevronRight size={24} />
            </button>

            <!-- Info Bar -->
            <div
                class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white z-20"
            >
                <div class="flex justify-between items-end">
                    <div>
                        <h2 class="text-xl font-bold mb-2">
                            {items[activeIndex].name}
                        </h2>
                        {#if items[activeIndex].description}
                            <p class="text-white/80 text-sm max-w-2xl">
                                {items[activeIndex].description}
                            </p>
                        {/if}
                    </div>

                    <div class="flex gap-2">
                        {#if allowDelete}
                            <button
                                class="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                                on:click={(e) =>
                                    handleDelete(items[activeIndex].id, e)}
                            >
                                <Trash2 size={20} class="text-rose-400" />
                            </button>
                        {/if}
                        {#if allowFavorites}
                            <button
                                class="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                                on:click={() =>
                                    dispatch(
                                        "toggleFavorite",
                                        items[activeIndex].id,
                                    )}
                            >
                                <Heart
                                    size={20}
                                    class={items[activeIndex].isFavorite
                                        ? "fill-red-500 text-red-500"
                                        : ""}
                                />
                            </button>
                        {/if}
                    </div>
                </div>

                <!-- Thumbnails Strip -->
                <div
                    class="flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-hide mask-fade"
                >
                    {#each items as item, i}
                        <button
                            class="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all {i ===
                            activeIndex
                                ? 'border-white opacity-100 scale-105'
                                : 'border-transparent opacity-50 hover:opacity-80'}"
                            on:click={() => (activeIndex = i)}
                        >
                            {#if item.type === "video"}
                                <div
                                    class="absolute inset-0 flex items-center justify-center bg-black/20"
                                >
                                    <Play size={16} fill="white" />
                                </div>
                                <div class="w-full h-full bg-slate-800"></div>
                                <!-- Placeholder if no thumbnail -->
                            {:else}
                                <img
                                    src={item.url}
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
                class="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur transition-colors z-30"
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
