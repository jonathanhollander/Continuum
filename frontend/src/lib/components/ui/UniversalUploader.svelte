<script lang="ts">
    import { onDestroy } from "svelte";
    import {
        Upload,
        X,
        FileText,
        Image as ImageIcon,
        CircleCheck,
        Loader2,
        RefreshCw,
        Trash2,
    } from "lucide-svelte";
    import {
        uploadMedia,
        type MediaUploadResponse,
        formatFileSize,
        isValidMediaType,
        ACCEPT_ATTRIBUTE,
        mediaIdFromRef,
    } from "$lib/services/mediaService";
    import MediaView from "./MediaView.svelte";

    let {
        value = $bindable(""), // url
        mediaId = $bindable(null),
        label = "Upload File",
        mode = "any", // 'image' | 'document' | 'any'
        module = "general",
        category = "uncategorized",
        referenceId = undefined,
        onchange,
        onabandoned,
        uploadState = $bindable("idle"),
        disabled = false,
    } = $props<{
        value?: string;
        mediaId?: number | null;
        label?: string;
        mode?: "image" | "document" | "any";
        module: string;
        category?: string;
        referenceId?: string;
        uploadState?: "idle" | "uploading" | "failed";
        disabled?: boolean;
        /** The initiating form owns a late upload even after its uploader is gone. */
        onabandoned?: (file: MediaUploadResponse) => void;
        /** `file` comes with a fresh upload: its name, type and size, as the server stored them. */
        onchange?: (
            url: string,
            id?: number,
            file?: { filename: string; mime_type: string; file_size: number },
        ) => void;
    }>();

    const uid = $props.id();

    let dragging = $state(false);
    let processing = $state(false);
    let error: string | null = $state(null);
    let fileInput: HTMLInputElement | undefined = $state();
    let uploadProgress = $state(0);
    let attempt = 0;
    let destroyed = false;
    onDestroy(() => { destroyed = true; attempt++; });
    /** The last upload's record, passed to the preview while it is still the file shown. */
    let uploaded = $state<MediaUploadResponse | null>(null);
    let shownId = $derived(mediaIdFromRef(mediaId ?? value));

    let acceptAttr = $derived(
        mode === "image" ? "image/*" : mode === "document" ? ".pdf,.txt,.csv" : ACCEPT_ATTRIBUTE,
    );

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        dragging = true;
    }

    function handleDragLeave() {
        dragging = false;
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        dragging = false;
        if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    }

    function handleFileSelect(e: Event) {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        target.value = "";
        if (file) processFile(file);
    }

    async function processFile(file: File) {
        if (disabled || destroyed) return;
        const operation = ++attempt;
        uploadState = "failed";
        processing = false;
        // Mode Validation
        if (mode === "image" && !file.type.startsWith("image/")) {
            error = "This space keeps images. An image file will fit here.";
            return;
        }
        if (mode === "document" && file.type.startsWith("image/")) {
            error = "This space keeps PDF and text documents.";
            return;
        }

        // Expanded Validation using mediaService
        if (!isValidMediaType(file)) {
            error =
                "This space keeps PDF, text and CSV files, images, audio and video.";
            return;
        }

        // 10MB Check (matching backend)
        if (file.size > 10 * 1024 * 1024) {
            error = "This space holds files up to 10 MB. A smaller copy will fit.";
            return;
        }

        error = null;
        processing = true;
        uploadState = "uploading";
        uploadProgress = 0;

        try {
            const response = await uploadMedia(
                file,
                module,
                referenceId,
                file.name, // Use filename as description initially
                (progress) => {
                    if (!destroyed && operation === attempt) uploadProgress = progress.percentage;
                },
            );

            if (destroyed || operation !== attempt) {
                onabandoned?.(response);
                return;
            }
            uploaded = response;
            value = response.download_url;
            mediaId = response.id;
            uploadState = "idle";

            if (onchange)
                onchange(value, mediaId, {
                    filename: response.filename,
                    mime_type: response.mime_type,
                    file_size: response.file_size,
                });
        } catch (err: any) {
            if (destroyed || operation !== attempt) return;
            console.error("Upload failed", err);
            error = err.message || "Saving this file paused. It is ready to try again.";
            uploadState = "failed";
        } finally {
            if (!destroyed && operation === attempt) {
                processing = false;
                uploadProgress = 0;
            }
        }
    }

    function clearFile() {
        if (disabled) return;
        attempt++;
        processing = false;
        uploadState = "idle";
        error = null;
        value = "";
        mediaId = null;
        uploaded = null;
        if (onchange) onchange("", undefined);
        if (fileInput) fileInput.value = "";
    }
</script>

<div class="space-y-2">
    {#if label}
        <label id="{uid}-label" for="{uid}-file" class="block text-xs font-bold uppercase text-muted-foreground mb-1"
            >{label}</label
        >
    {/if}

    {#if value}
        <div
            class="relative rounded-xl overflow-hidden bg-card border border-border group transition-all hover:shadow-md"
        >
            <MediaView src={mediaId ?? value} record={uploaded && uploaded.id === shownId ? uploaded : undefined} />

            <!-- Overlay Actions -->
            <div class="bg-muted p-2 flex justify-end gap-2 border-t border-border">
                <button
                    type="button"
                    {disabled}
                    onclick={() => fileInput?.click()}
                    class="text-foreground px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-card hover:shadow-sm border border-transparent hover:border-border flex items-center gap-2"
                >
                    <RefreshCw size={14} /> Replace
                </button>
                <button
                    type="button"
                    {disabled}
                    onclick={clearFile}
                    class="text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-card hover:shadow-sm border border-transparent hover:border-border flex items-center gap-2"
                >
                    <Trash2 size={14} /> Remove
                </button>
            </div>
            <input
                id="{uid}-file"
                type="file"
                {disabled}
                bind:this={fileInput}
                onchange={handleFileSelect}
                accept={acceptAttr}
                class="hidden"
            />
        </div>
        {#if error}
            <p role="alert" class="text-xs font-bold text-warning">
                {error}
            </p>
        {/if}
    {:else}
        <div
            class="relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
            {dragging
                ? 'border-primary bg-primary-soft'
                : error
                  ? 'border-warning bg-card'
                  : 'border-border bg-card hover:border-muted-foreground/40 hover:bg-muted'}"
            ondragover={handleDragOver}
            ondragleave={handleDragLeave}
            ondrop={handleDrop}
            onclick={() => !disabled && fileInput?.click()}
            onkeydown={(e) => !disabled && e.key === "Enter" && fileInput?.click()}
            role="button"
            tabindex={disabled ? -1 : 0}
            aria-disabled={disabled}
            aria-describedby={label ? `${uid}-label` : undefined}
        >
            <input
                id="{uid}-file"
                type="file"
                {disabled}
                bind:this={fileInput}
                onchange={handleFileSelect}
                accept={acceptAttr}
                class="hidden"
            />

            <div
                class="flex flex-col items-center justify-center gap-3 text-muted-foreground"
            >
                {#if processing}
                    <div
                        class="relative h-12 w-12 flex items-center justify-center"
                    >
                        <Loader2
                            class="animate-spin text-primary"
                            size={32}
                        />
                    </div>
                    <div
                        class="flex flex-col gap-1 items-center w-full max-w-[200px]"
                    >
                        <span class="text-sm font-medium text-foreground"
                            >Uploading... {uploadProgress}%</span
                        >
                        <div
                            class="w-full h-1 bg-border rounded-full overflow-hidden"
                        >
                            <div
                                class="h-full bg-primary transition-all duration-300"
                                style="width: {uploadProgress}%"
                            ></div>
                        </div>
                    </div>
                {:else}
                    <div class="p-3 bg-card rounded-full shadow-sm">
                        {#if mode === "document"}
                            <FileText size={24} />
                        {:else if mode === "image"}
                            <ImageIcon size={24} />
                        {:else}
                            <Upload size={24} />
                        {/if}
                    </div>
                    <div>
                        <p class="text-sm font-bold text-foreground">
                            {mode === "image"
                                ? "Upload Image"
                                : mode === "document"
                                  ? "Upload Document"
                                  : "Add a file here"}
                        </p>
                        <p class="text-xs mt-1 text-muted-foreground">
                            {mode === "image"
                                ? "JPG, PNG"
                                : mode === "document"
                                  ? "PDF, Text"
                                  : "PDF, images, audio, video"} (up to 10 MB)
                        </p>
                    </div>
                {/if}
            </div>

            {#if error}
                <div
                    role="alert"
                    class="mt-3 text-xs font-bold text-warning py-1 px-2 rounded inline-block"
                >
                    {error}
                </div>
            {/if}
        </div>
    {/if}
</div>
