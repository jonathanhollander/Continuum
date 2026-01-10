<script lang="ts">
    import { Upload, X, Image as ImageIcon, CircleCheck } from "lucide-svelte";
    import { createEventDispatcher } from "svelte";

    export let imageUrl: string = "";
    export let label: string = "Upload Image";

    const dispatch = createEventDispatcher();
    let dragging = false;
    let processing = false;
    let error: string | null = null;
    let fileInput: HTMLInputElement;

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

    function processFile(file: File) {
        if (!file.type.startsWith("image/")) {
            error = "Please upload an image file (JPG, PNG).";
            return;
        }

        // 2MB Initial Check
        if (file.size > 5 * 1024 * 1024) {
            error = "File is too large (Max 5MB).";
            return;
        }

        error = null;
        processing = true;

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                // Resize logic: Max 800px dimension
                const MAX_SIZE = 800;
                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);

                // Compress to JPEG 0.7 quality
                const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
                imageUrl = compressedDataUrl;
                dispatch("change", compressedDataUrl);
                processing = false;
            };
        };
    }

    function clearImage() {
        imageUrl = "";
        dispatch("change", "");
        if (fileInput) fileInput.value = "";
    }
</script>

<div class="space-y-2">
    <label class="block text-xs font-bold uppercase text-gray-500 mb-1"
        >{label}</label
    >

    {#if imageUrl}
        <div
            class="relative h-48 w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200 group"
        >
            <img
                src={imageUrl}
                alt="Uploaded preview"
                class="w-full h-full object-cover"
            />

            <div
                class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
            >
                <button
                    on:click={clearImage}
                    class="bg-white text-rose-600 px-4 py-2 rounded-lg font-bold text-sm shadow-lg hover:bg-rose-50 flex items-center gap-2"
                >
                    <X size={16} /> Remove
                </button>
            </div>

            <div
                class="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1 shadow-sm"
            >
                <CircleCheck size={16} />
            </div>
        </div>
    {:else}
        <div
            class="relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
            {dragging
                ? 'border-[#4A7C74] bg-[#4A7C74]/5'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
            {error ? 'border-red-300 bg-red-50' : ''}"
            on:dragover={handleDragOver}
            on:dragleave={handleDragLeave}
            on:drop={handleDrop}
            on:click={() => fileInput.click()}
        >
            <input
                type="file"
                bind:this={fileInput}
                on:change={handleFileSelect}
                accept="image/*"
                class="hidden"
            />

            <div
                class="flex flex-col items-center justify-center gap-3 text-gray-400"
            >
                {#if processing}
                    <div
                        class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4A7C74]"
                    ></div>
                    <span class="text-sm font-medium">Compressing...</span>
                {:else}
                    <div class="p-3 bg-white rounded-full shadow-sm">
                        <Upload size={24} />
                    </div>
                    <div>
                        <p class="text-sm font-bold text-gray-600">
                            Click to upload or drag image here
                        </p>
                        <p class="text-xs mt-1">Supports JPG, PNG (Max 5MB)</p>
                    </div>
                {/if}
            </div>

            {#if error}
                <div
                    class="absolute bottom-2 left-0 right-0 text-center text-xs font-bold text-red-500"
                >
                    {error}
                </div>
            {/if}
        </div>
    {/if}
</div>
