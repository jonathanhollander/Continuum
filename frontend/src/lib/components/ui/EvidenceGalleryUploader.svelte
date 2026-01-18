<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { Upload, Loader2, Video, Image as ImageIcon } from "lucide-svelte";
    import MediaGallery, { type GalleryItem } from "./MediaGallery.svelte";
    import type { EvidenceItem } from "$lib/stores/propertyStore.svelte";
    import { analyzeAssetImage } from "$lib/services/visionService";

    export let evidence: EvidenceItem[] = [];
    export let allowAnalysis = true;

    const dispatch = createEventDispatcher<{
        change: EvidenceItem[];
        setCover: string;
    }>();

    let isDragging = false;
    let isProcessing = false;
    let fileInput: HTMLInputElement;

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        isDragging = true;
    }

    function handleDragLeave() {
        isDragging = false;
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        isDragging = false;
        if (e.dataTransfer?.files) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    }

    function handleFileSelect(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.files) {
            handleFiles(Array.from(target.files));
        }
    }

    async function handleFiles(files: File[]) {
        isProcessing = true;
        const newItems: EvidenceItem[] = [];

        for (const file of files) {
            // Determine Type
            const isVideo = file.type.startsWith("video/");
            const isImage = file.type.startsWith("image/");

            if (!isVideo && !isImage) continue;

            const url = URL.createObjectURL(file);
            let name = file.name;

            // Video Thumbnail Logic (Basic)
            let thumbnailUrl: string | undefined;

            // AI Analysis (Images only)
            if (allowAnalysis && isImage) {
                try {
                    const analysis = await analyzeAssetImage(file);
                    if (analysis.name) name = analysis.name; // Use auto-generated name
                } catch (err) {
                    console.warn("Analysis skipped", err);
                }
            }

            newItems.push({
                id: crypto.randomUUID(),
                type: isVideo ? "video" : "image",
                url,
                thumbnailUrl,
                name,
                dateAdded: Date.now(),
                size: file.size,
            });
        }

        evidence = [...evidence, ...newItems];
        dispatch("change", evidence);
        isProcessing = false;
    }

    function handleDelete(e: CustomEvent<string>) {
        evidence = evidence.filter((i) => i.id !== e.detail);
        dispatch("change", evidence);
    }

    function handleSetCover(e: CustomEvent<string>) {
        dispatch("setCover", e.detail);
    }

    // Convert EvidenceItem -> GalleryItem for display
    $: galleryItems = evidence.map(
        (e) =>
            ({
                id: e.id,
                url: e.url,
                type: e.type,
                thumbnailUrl: e.thumbnailUrl,
                name: e.name,
                isFavorite: false,
            }) as GalleryItem,
    );
</script>

<div class="space-y-6">
    <!-- Drag & Drop Area -->
    <div
        class="relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 group cursor-pointer
        {isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'}"
        on:dragover={handleDragOver}
        on:dragleave={handleDragLeave}
        on:drop={handleDrop}
        on:click={() => fileInput.click()}
    >
        <input
            type="file"
            multiple
            accept="image/*,video/*"
            class="hidden"
            bind:this={fileInput}
            on:change={handleFileSelect}
        />

        {#if isProcessing}
            <div class="flex flex-col items-center justify-center py-4">
                <Loader2 size={32} class="animate-spin text-blue-500 mb-2" />
                <p class="text-sm font-bold text-slate-500">
                    Processing media...
                </p>
            </div>
        {:else}
            <div class="flex flex-col items-center gap-3">
                <div
                    class="p-4 bg-white rounded-full shadow-sm text-blue-500 group-hover:scale-110 transition-transform"
                >
                    <Upload size={24} />
                </div>
                <div>
                    <h4 class="font-bold text-slate-700">
                        Click to Upload Evidence
                    </h4>
                    <p class="text-xs text-slate-400 mt-1">
                        Support for Images (JPG, PNG) and Video (MP4)
                    </p>
                </div>
            </div>
        {/if}
    </div>

    <!-- Gallery Display -->
    {#if evidence.length > 0}
        <MediaGallery
            items={galleryItems}
            allowDelete={true}
            allowFavorites={false}
            on:delete={handleDelete}
            on:setCover={handleSetCover}
        />
    {/if}
</div>
