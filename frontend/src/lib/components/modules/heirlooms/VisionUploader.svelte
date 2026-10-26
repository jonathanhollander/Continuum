<script lang="ts">
    import { onDestroy } from "svelte";
    import { ImagePlus, Upload } from "lucide-svelte";
    import SmartTextarea from "$lib/components/ui/SmartTextarea.svelte";
    import HeirloomImage from "./HeirloomImage.svelte";
    import { uploadMedia, isValidMediaType } from "$lib/services/mediaService";

    // Both are bound by the page so the photo and the Provenance text are saved with the heirloom.
    let {
        imageUrl = $bindable(""),
        provenance = $bindable(""),
        uploading = $bindable(false),
        uploadFailed = $bindable(false),
        onselect,
    }: {
        imageUrl?: string; provenance?: string; uploading?: boolean; uploadFailed?: boolean;
        onselect?: () => void;
    } = $props();

    let fileInput: HTMLInputElement;
    let isDragging = $state(false);
    // The photo goes to the media store; the record keeps only its address ("/api/media/N/download").
    let selectedFile: File | null = $state(null);
    let sequence = 0;
    let alive = true;
    onDestroy(() => {
        alive = false;
        sequence++;
        if (localPreview) URL.revokeObjectURL(localPreview);
    });
    let message = $state<string | null>(null);
    let localPreview = $state<string | null>(null);
    let previewFor = $state<string | null>(null); // the saved address the local preview shows
    let showLocal = $derived(!!localPreview && (uploading || uploadFailed || (!!imageUrl && imageUrl === previewFor)));

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
        if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }

    async function handleFile(file: File) {
        if (!file.type.startsWith("image/") || !isValidMediaType(file)) return;
        const attempt = ++sequence;
        selectedFile = file;
        onselect?.();
        if (localPreview) URL.revokeObjectURL(localPreview);
        localPreview = URL.createObjectURL(file);
        previewFor = null;
        message = null;
        uploading = true;
        uploadFailed = false;
        try {
            const media = await uploadMedia(file, "heirlooms");
            // A newer selection or a replacement draft owns its own uploader.
            if (!alive || attempt !== sequence) return;
            imageUrl = media.download_url;
            previewFor = media.download_url;
        } catch (err: any) {
            if (!alive || attempt !== sequence) return;
            uploadFailed = true;
            message = err?.message || "Saving this photo paused. It is still here, ready to try again.";
        } finally {
            if (alive && attempt === sequence) uploading = false;
        }
    }


    function triggerUpload() {
        fileInput.click();
    }
</script>

<div class="space-y-4">
    <!-- Drag and drop is an extra way in; the Add a photo button inside covers keyboard use. -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 overflow-hidden group
        {isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/40 hover:bg-muted'}"
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        ondrop={handleDrop}
    >
        <input
            type="file"
            accept="image/*"
            aria-label="Add a photo"
            class="hidden"
            bind:this={fileInput}
            onchange={(e) =>
                e.currentTarget.files && handleFile(e.currentTarget.files[0])}
        />

        {#if imageUrl || showLocal}
            <div
                class="relative aspect-video w-full max-w-sm mx-auto rounded-lg overflow-hidden shadow-sm"
            >
                {#if showLocal && localPreview}
                    <img
                        src={localPreview}
                        alt="Uploaded heirloom"
                        class="w-full h-full object-cover"
                    />
                {:else}
                    <HeirloomImage
                        src={imageUrl}
                        alt="Uploaded heirloom"
                        class="w-full h-full object-cover"
                    />
                {/if}

                <button
                    type="button"
                    onclick={triggerUpload}
                    class="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    title="Choose a different photo"
                    aria-label="Choose a different photo"
                >
                    <Upload size={14} />
                </button>
            </div>
        {:else}
            <div
                class="py-8 cursor-pointer"
                role="button"
                tabindex="0"
                aria-label="Add a photo"
                onclick={triggerUpload}
                onkeydown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        triggerUpload();
                    }
                }}
            >
                <div
                    class="w-16 h-16 bg-primary-soft text-primary-hover rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-primary/20"
                >
                    <ImagePlus size={32} />
                </div>
                <h3 class="text-sm font-bold text-foreground mb-1">
                    Add a photo
                </h3>
                <p class="text-xs text-muted-foreground">
                    Add a photo by dropping it here or choosing one
                </p>
            </div>
        {/if}
    </div>

    {#if uploading}
        <p class="text-xs text-muted-foreground text-center" aria-live="polite">Saving your photo…</p>
    {:else if message}
        <p class="text-xs text-muted-foreground text-center" aria-live="polite">{message}</p>
        {#if uploadFailed && selectedFile}
            <div class="text-center">
                <button type="button" onclick={() => selectedFile && handleFile(selectedFile)}
                    class="text-sm font-semibold text-primary underline underline-offset-4">Try Again</button>
            </div>
        {/if}
    {/if}

    <!-- Provenance / Story Field with SmartTextarea -->
    <div class="pt-4">
        <SmartTextarea
            bind:value={provenance}
            context="heirloom"
            placeholder="Tell the story of this item..."
            label="Provenance"
        />
    </div>
</div>
