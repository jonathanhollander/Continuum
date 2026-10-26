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
    let fileStates = $state<Record<number, "loading" | "ready" | "error">>({});
    $effect(() => {
        const list = evidence;
        untrack(() => loadUrls(list));
    });

    function loadUrls(list: EvidenceItem[]) {
        for (const e of list) {
            if (!fileStates[e.id]) void openFile(e.id);
        }
    }

    async function openFile(id: number) {
        if (fileStates[id] === "loading") return;
        fileStates[id] = "loading";
        try {
            urls[id] = await blobUrlFor(id);
            fileStates[id] = "ready";
        } catch (err) {
            fileStates[id] = "error";
            console.warn("[evidence] file open paused", id, err);
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

    function handleDelete(id: string) {
        evidence = evidence.filter((i) => String(i.id) !== String(id));
    }

    function handleSetCover(id: string) {
        onsetCover?.(Number(id));
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
            ? 'border-primary bg-primary-soft'
            : 'border-border hover:border-primary hover:bg-muted'}"
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
                <Loader2 size={32} class="animate-spin text-primary mb-2" />
                <p class="text-sm font-bold text-muted-foreground">
                    Preparing your photos...
                </p>
            </div>
        {:else}
            <div class="flex flex-col items-center gap-3">
                <div
                    class="p-4 bg-card rounded-full shadow-sm text-primary group-hover:scale-110 transition-transform"
                >
                    <Upload size={24} />
                </div>
                <div>
                    <h4 class="font-bold text-foreground">
                        Add a photo or document
                    </h4>
                    <p class="text-xs text-muted-foreground mt-1">
                        Support for Images (JPG, PNG) and Video (MP4)
                    </p>
                </div>
            </div>
        {/if}
    </div>

    <!-- Gallery Display -->
    {#if evidence.length > 0}
        <div class="space-y-3">
            {#each evidence as item (item.id)}
                {#if !urls[item.id]}
                    <div class="rounded-xl border border-border bg-muted p-4 flex flex-wrap items-center justify-between gap-3" data-media-id={item.id}>
                        <div class="min-w-0 flex-1">
                            <p class="text-sm font-medium text-foreground break-words">{item.filename}</p>
                            {#if fileStates[item.id] === "error"}
                                <p class="text-xs text-muted-foreground mt-1">You can try opening this file again.</p>
                            {:else}
                                <p class="text-xs text-muted-foreground mt-1" role="status">Opening your file…</p>
                            {/if}
                        </div>
                        {#if fileStates[item.id] === "error"}
                            <button
                                type="button"
                                class="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary-hover"
                                aria-label={`Try again: ${item.filename}`}
                                onclick={() => void openFile(item.id)}
                            >Try again</button>
                        {/if}
                    </div>
                {/if}
            {/each}
        </div>
        {#if galleryItems.length > 0}
            <MediaGallery
                items={galleryItems}
                allowDelete={true}
                allowFavorites={false}
                ondelete={handleDelete}
                onsetcover={handleSetCover}
            />
        {/if}
    {/if}
</div>
