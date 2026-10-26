<script lang="ts">
    /**
     * Shows one stored file: image, audio or video plays inline; any file can be
     * saved. `src` is a media id or its download_url ("/api/media/12/download").
     * Data URLs and other plain URLs are shown as images.
     */
    import { onDestroy } from "svelte";
    import { FileText, Download } from "lucide-svelte";
    import {
        mediaIdFromRef,
        getMedia,
        fetchMediaBlob,
        downloadMedia,
        formatFileSize,
        type MediaRef,
    } from "$lib/services/mediaService";

    let { src, class: className = "" } = $props<{ src: MediaRef; class?: string }>();

    let objectUrl = $state<string | null>(null);
    let mime = $state("");
    let filename = $state("");
    let size = $state(0);
    let loading = $state(false);
    let message = $state<string | null>(null);

    let mediaId = $derived(mediaIdFromRef(src));

    $effect(() => {
        const id = mediaId;
        message = null;
        if (id === null) return;
        let cancelled = false;
        loading = true;
        (async () => {
            try {
                const meta = await getMedia(id);
                if (cancelled) return;
                mime = meta.mime_type;
                filename = meta.filename;
                size = meta.file_size;
                if (/^(image|audio|video)\//.test(mime)) {
                    const blob = await fetchMediaBlob(id);
                    if (cancelled) return;
                    if (objectUrl) URL.revokeObjectURL(objectUrl);
                    objectUrl = URL.createObjectURL(blob);
                }
            } catch (e: any) {
                if (!cancelled) message = e?.message || "This file is taking a moment to open.";
            } finally {
                if (!cancelled) loading = false;
            }
        })();
        return () => {
            cancelled = true;
        };
    });

    onDestroy(() => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
    });

    async function save() {
        if (mediaId === null) return;
        try {
            await downloadMedia(mediaId, filename || undefined);
        } catch (e: any) {
            message = e?.message || "This file is taking a moment to open.";
        }
    }
</script>

<div class="media-view {className}" data-media-id={mediaId ?? ""}>
    {#if mediaId === null}
        {#if typeof src === "string" && src}
            <img src={src} alt="Saved file" class="w-full h-full object-cover" />
        {/if}
    {:else if loading}
        <div class="p-4 text-sm text-gray-500">Opening your file…</div>
    {:else}
        {#if objectUrl && mime.startsWith("image/")}
            <img src={objectUrl} alt={filename} class="w-full h-full object-cover" />
        {:else if objectUrl && mime.startsWith("audio/")}
            <audio controls src={objectUrl} class="w-full"></audio>
        {:else if objectUrl && mime.startsWith("video/")}
            <!-- svelte-ignore a11y_media_has_caption -->
            <video controls src={objectUrl} class="w-full max-h-72 bg-black rounded-lg"></video>
        {/if}
        <div class="flex items-center gap-3 p-3">
            {#if !objectUrl}
                <div class="bg-indigo-50 text-indigo-600 p-2 rounded-lg">
                    <FileText size={24} />
                </div>
            {/if}
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{filename || "Your file"}</p>
                {#if size}
                    <p class="text-xs text-gray-500">{formatFileSize(size)}</p>
                {/if}
            </div>
            <button
                type="button"
                onclick={save}
                class="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-50"
            >
                <Download size={14} /> Save a copy
            </button>
        </div>
    {/if}
    {#if message}
        <p class="px-3 pb-2 text-xs text-gray-600">{message}</p>
    {/if}
</div>
