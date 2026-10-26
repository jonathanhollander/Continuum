<script lang="ts">
    import { untrack } from "svelte";
    import { Upload, Loader2 } from "lucide-svelte";
    import MediaGallery, { type GalleryItem } from "./MediaGallery.svelte";
    import { blobUrlFor } from "./MediaView.svelte";
    import { uploadMedia } from "$lib/services/mediaService";
    import { notifications } from "$lib/stores/notificationStore";
    import type { EvidenceItem } from "$lib/stores/propertyStore.svelte";

    /** Stored evidence (media references). Files upload as they are chosen; the
     *  owner saves the list on its record and removes media it no longer keeps. */
    let {
        evidence = $bindable([]),
        module = "properties",
        referenceId = undefined,
        onsetCover = undefined,
    }: {
        evidence?: EvidenceItem[];
        module?: string;
        referenceId?: string;
        onsetCover?: (mediaId: number) => void;
    } = $props();

    let isDragging = $state(false);
    let isProcessing = $state(false);
    let fileInput: HTMLInputElement;

    // Object URLs from the shared authorised cache, by media id.
    let urls: Record<number, string> = $state({});
    $effect(() => {
        const list = evidence;
        untrack(() => loadUrls(list));
    });

    function loadUrls(list: EvidenceItem[]) {
        for (const e of list) {
            if (e.id in urls) continue;
            urls[e.id] = "";
            blobUrlFor(e.id).then(
                (u) => (urls = { ...urls, [e.id]: u }),
                (err) => {
                    delete urls[e.id];
                    console.warn("[evidence] file open paused", e.id, err);
                },
            );
        }
    }

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
        target.value = "";
    }

    async function handleFiles(files: File[]) {
        isProcessing = true;
        try {
            for (const file of files) {
                if (!file.type.startsWith("video/") && !file.type.startsWith("image/")) continue;
                try {
                    const saved = await uploadMedia(file, module, referenceId);
                    evidence = [
                        ...evidence,
                        { id: saved.id, filename: saved.filename, mime: saved.mime_type },
                    ];
                } catch (e: any) {
                    notifications.showError(e);
                }
            }
        } finally {
            isProcessing = false;
        }
    }

    function handleDelete(e: CustomEvent<string>) {
        evidence = evidence.filter((i) => String(i.id) !== String(e.detail));
    }

    function handleSetCover(e: CustomEvent<string>) {
        onsetCover?.(Number(e.detail));
    }

    // EvidenceItem -> GalleryItem, once its file has opened
    let galleryItems = $derived(
        evidence
            .filter((e) => urls[e.id])
            .map(
                (e) =>
                    ({
                        id: String(e.id),
                        url: urls[e.id],
                        type: e.mime.startsWith("video/") ? "video" : "image",
                        name: e.filename,
                        isFavorite: false,
                    }) as GalleryItem,
            ),
    );
</script>

<div class="space-y-6">
    <!-- Drag & Drop Area -->
    <div
        class="relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 group cursor-pointer
        {isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'}"
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        ondrop={handleDrop}
        role="button"
        tabindex="0"
        onclick={() => fileInput.click()}
        onkeydown={(e) => {
            if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                fileInput.click();
            }
        }}
    >
        <input
            type="file"
            multiple
            accept="image/*,video/*"
            class="hidden"
            bind:this={fileInput}
            onchange={handleFileSelect}
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
