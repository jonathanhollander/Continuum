<script lang="ts">
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
    } from "$lib/services/mediaService";

    let {
        value = $bindable(""), // url
        mediaId = $bindable(null),
        label = "Upload File",
        mode = "any", // 'image' | 'document' | 'any'
        module = "general",
        category = "uncategorized",
        referenceId = undefined,
        onchange,
    } = $props<{
        value?: string;
        mediaId?: number | null;
        label?: string;
        mode?: "image" | "document" | "any";
        module: string;
        category?: string;
        referenceId?: string;
        onchange?: (url: string, id?: number) => void;
    }>();

    let dragging = $state(false);
    let processing = $state(false);
    let error: string | null = $state(null);
    let fileInput: HTMLInputElement | undefined = $state();
    let uploadProgress = $state(0);

    // Derived file type from value/url if available
    let isImage = $derived(
        value &&
            (value.match(/\.(jpeg|jpg|gif|png|webp|heic)$/i) ||
                mode === "image"),
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
        if (target.files && target.files[0]) {
            processFile(target.files[0]);
        }
    }

    async function processFile(file: File) {
        // Mode Validation
        if (mode === "image" && !file.type.startsWith("image/")) {
            error = "Please upload an image file.";
            return;
        }
        if (mode === "document" && file.type.startsWith("image/")) {
            error = "Please upload a document (PDF, Text).";
            return;
        }

        // Expanded Validation using mediaService
        if (!isValidMediaType(file)) {
            error =
                "File type not supported. Please upload PDF, Text, CSV, or standard Images/Media. Word documents (.doc/.docx) are not accepted for security.";
            return;
        }

        // 10MB Check (matching backend)
        if (file.size > 10 * 1024 * 1024) {
            error = "File is too large (Max 10MB).";
            return;
        }

        error = null;
        processing = true;
        uploadProgress = 0;

        try {
            // Upload to Backend (S3/Local)
            // Note: We don't pass 'category' here because mediaService logic (implied by previous plan steps)
            // calculated it on backend.
            // WAIT, plan said "Update save_file to accept doc_category (passed from upload endpoint)".
            // But mediaService.ts uploadMedia function doesn't take category arg in my previous view?
            // I should check if I updated mediaService.ts to accept category.
            // Checking previous steps: I updated backend logic to `get_doc_category(mime_type)`.
            // So I DON'T need to pass it from frontend. Backend derives it. Good.

            const response = await uploadMedia(
                file,
                module,
                referenceId,
                file.name, // Use filename as description initially
                (progress) => {
                    uploadProgress = progress.percentage;
                },
            );

            // Update State
            value = response.download_url;
            mediaId = response.id;

            if (onchange) onchange(value, mediaId);
        } catch (err: any) {
            console.error("Upload failed", err);
            error = err.message || "Upload failed. Please try again.";
        } finally {
            processing = false;
            uploadProgress = 0;
        }
    }

    function clearFile() {
        value = "";
        mediaId = null;
        if (onchange) onchange("", undefined);
        if (fileInput) fileInput.value = "";
    }
</script>

<div class="space-y-2">
    {#if label}
        <label class="block text-xs font-bold uppercase text-gray-500 mb-1"
            >{label}</label
        >
    {/if}

    {#if value}
        <div
            class="relative rounded-xl overflow-hidden bg-white border border-gray-200 group transition-all hover:shadow-md"
        >
            {#if isImage}
                <div class="h-48 w-full bg-gray-100 relative">
                    <img
                        src={value}
                        alt="Uploaded file"
                        class="w-full h-full object-cover"
                    />
                    <!-- Checkmark Badge -->
                    <div
                        class="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1 shadow-sm z-10"
                    >
                        <CircleCheck size={16} />
                    </div>
                </div>
            {:else}
                <div class="flex items-center gap-4 p-4">
                    <div class="bg-indigo-50 text-indigo-600 p-3 rounded-lg">
                        <FileText size={32} />
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 truncate">
                            {value.split("/").pop()?.split("?")[0] ||
                                "Document"}
                        </p>
                        <a
                            href={value}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                            View Document
                        </a>
                    </div>
                    <div class="text-green-500">
                        <CircleCheck size={20} />
                    </div>
                </div>
            {/if}

            <!-- Overlay Actions -->
            <div
                class={isImage
                    ? "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                    : "bg-gray-50 p-2 flex justify-end gap-2 border-t border-gray-100"}
            >
                {#if isImage}
                    <button
                        onclick={clearFile}
                        class="bg-white text-rose-600 px-4 py-2 rounded-lg font-bold text-sm shadow-lg hover:bg-rose-50 flex items-center gap-2"
                    >
                        <Trash2 size={16} /> Remove
                    </button>
                {:else}
                    <button
                        onclick={() => fileInput?.click()}
                        class="text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 flex items-center gap-2"
                    >
                        <RefreshCw size={14} /> Replace
                    </button>
                    <button
                        onclick={clearFile}
                        class="text-rose-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white hover:shadow-sm border border-transparent hover:border-rose-100 flex items-center gap-2"
                    >
                        <Trash2 size={14} /> Remove
                    </button>
                {/if}
            </div>
        </div>
    {:else}
        <div
            class="relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
            {dragging
                ? 'border-[#4A7C74] bg-[#4A7C74]/5'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
            {error ? 'border-red-300 bg-red-50' : ''}"
            ondragover={handleDragOver}
            ondragleave={handleDragLeave}
            ondrop={handleDrop}
            onclick={() => fileInput?.click()}
            onkeydown={(e) => e.key === "Enter" && fileInput?.click()}
            role="button"
            tabindex="0"
        >
            <input
                type="file"
                bind:this={fileInput}
                onchange={handleFileSelect}
                accept={mode === "image"
                    ? "image/*"
                    : mode === "document"
                      ? ".pdf,.txt,.csv"
                      : ".pdf,.txt,.csv,image/*,.mp4,.mp3"}
                class="hidden"
            />

            <div
                class="flex flex-col items-center justify-center gap-3 text-gray-400"
            >
                {#if processing}
                    <div
                        class="relative h-12 w-12 flex items-center justify-center"
                    >
                        <Loader2
                            class="animate-spin text-[#4A7C74]"
                            size={32}
                        />
                    </div>
                    <div
                        class="flex flex-col gap-1 items-center w-full max-w-[200px]"
                    >
                        <span class="text-sm font-medium text-gray-700"
                            >Uploading... {uploadProgress}%</span
                        >
                        <div
                            class="w-full h-1 bg-gray-200 rounded-full overflow-hidden"
                        >
                            <div
                                class="h-full bg-[#4A7C74] transition-all duration-300"
                                style="width: {uploadProgress}%"
                            ></div>
                        </div>
                    </div>
                {:else}
                    <div class="p-3 bg-white rounded-full shadow-sm">
                        {#if mode === "document"}
                            <FileText size={24} />
                        {:else if mode === "image"}
                            <Image size={24} />
                        {:else}
                            <Upload size={24} />
                        {/if}
                    </div>
                    <div>
                        <p class="text-sm font-bold text-gray-600">
                            {mode === "image"
                                ? "Upload Image"
                                : mode === "document"
                                  ? "Upload Document"
                                  : "Click to upload"}
                        </p>
                        <p class="text-xs mt-1 text-gray-400">
                            {mode === "image"
                                ? "JPG, PNG"
                                : mode === "document"
                                  ? "PDF, Text"
                                  : "PDF, JPG, PNG"} (Max 10MB)
                        </p>
                    </div>
                {/if}
            </div>

            {#if error}
                <div
                    class="mt-3 text-xs font-bold text-red-500 bg-white/50 py-1 px-2 rounded inline-block"
                >
                    {error}
                </div>
            {/if}
        </div>
    {/if}
</div>
