<script module lang="ts">
    import { get } from "svelte/store";
    import { fetchMediaBlob } from "$lib/services/mediaService";
    import { auth } from "$lib/stores/auth";
    import { activeAccountId } from "$lib/stores/keyringStore";

    /**
     * One object URL per media id for the page's life, shared by every MediaView,
     * so the same file shown twice is fetched once. Emptied (and revoked) when the
     * signed-in account changes or signs out, so one account never sees another's file.
     */
    const blobUrls = new Map<number, Promise<string>>();

    export function blobUrlFor(id: number): Promise<string> {
        let url = blobUrls.get(id);
        if (!url) {
            url = fetchMediaBlob(id).then((blob) => URL.createObjectURL(blob));
            url.catch(() => blobUrls.delete(id));
            blobUrls.set(id, url);
        }
        return url;
    }

    /** The object URL already made (or being made) for this id, if any. */
    export function cachedBlobUrl(id: number): Promise<string> | undefined {
        return blobUrls.get(id);
    }

    function forgetBlobUrls() {
        for (const url of blobUrls.values()) {
            url.then((u) => URL.revokeObjectURL(u), () => undefined);
        }
        blobUrls.clear();
    }

    if (typeof window !== "undefined") {
        let account = get(activeAccountId);
        activeAccountId.subscribe((id) => {
            if (id !== account) forgetBlobUrls();
            account = id;
        });
        let signedIn = get(auth).isAuthenticated;
        auth.subscribe((s) => {
            if (signedIn && !s.isAuthenticated) forgetBlobUrls();
            signedIn = s.isAuthenticated;
        });
    }
</script>

<script lang="ts">
    /**
     * Shows one stored file: image, audio or video plays inline; any file can be
     * saved. `src` is a media id or its download_url ("/api/media/12/download").
     * Data URLs and other plain URLs are shown as images.
     *
     * Pass `record` (the media row or upload response) or `mimeType` when the
     * caller already has it: the file is then fetched directly, with no metadata
     * request first.
     */
    import { FileText, Download } from "lucide-svelte";
    import {
        mediaIdFromRef,
        getMedia,
        downloadMedia,
        formatFileSize,
        type MediaFile,
        type MediaRef,
    } from "$lib/services/mediaService";

    let {
        src,
        record = undefined,
        mimeType = undefined,
        class: className = "",
    } = $props<{
        src: MediaRef;
        record?: Partial<MediaFile> | null;
        mimeType?: string | null;
        class?: string;
    }>();

    let objectUrl = $state<string | null>(null);
    let mime = $state("");
    let filename = $state("");
    let size = $state(0);
    let loading = $state(false);
    let message = $state<string | null>(null);

    let mediaId = $derived(mediaIdFromRef(src));
    let knownMime = $derived(mimeType || record?.mime_type || "");

    const playable = (type: string) => /^(image|audio|video)\//.test(type);

    $effect(() => {
        const id = mediaId;
        const typeGiven = knownMime;
        const given = record;
        message = null;
        objectUrl = null;
        mime = typeGiven;
        filename = given?.filename ?? "";
        size = given?.file_size ?? 0;
        if (id === null) {
            loading = false;
            return;
        }
        let cancelled = false;
        loading = true;
        (async () => {
            try {
                if (!typeGiven) {
                    const meta = await getMedia(id);
                    if (cancelled) return;
                    mime = meta.mime_type;
                    filename = meta.filename;
                    size = meta.file_size;
                }
                if (playable(mime)) {
                    const url = await blobUrlFor(id);
                    if (cancelled) return;
                    objectUrl = url;
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

    async function save() {
        if (mediaId === null) return;
        try {
            await downloadMedia(mediaId, filename || undefined, cachedBlobUrl(mediaId));
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
