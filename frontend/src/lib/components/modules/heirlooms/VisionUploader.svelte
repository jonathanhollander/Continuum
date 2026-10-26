<script lang="ts">
    import { ImagePlus, Upload } from "lucide-svelte";
    import SmartTextarea from "$lib/components/ui/SmartTextarea.svelte";

    export let imageUrl: string = "";
    // Bound by the page so the Provenance text is saved with the heirloom.
    export let provenance: string = "";

    let fileInput: HTMLInputElement;
    let isDragging = false;

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

    function handleFile(file: File) {
        if (!file.type.startsWith("image/")) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            imageUrl = e.target?.result as string;
        };
        reader.readAsDataURL(file);
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
            ? 'border-indigo-500 bg-indigo-50/50'
            : 'border-stone-200 hover:border-indigo-300 hover:bg-stone-50'}"
        on:dragover={handleDragOver}
        on:dragleave={handleDragLeave}
        on:drop={handleDrop}
    >
        <input
            type="file"
            accept="image/*"
            aria-label="Add a photo"
            class="hidden"
            bind:this={fileInput}
            on:change={(e) =>
                e.currentTarget.files && handleFile(e.currentTarget.files[0])}
        />

        {#if imageUrl}
            <div
                class="relative aspect-video w-full max-w-sm mx-auto rounded-lg overflow-hidden shadow-sm"
            >
                <img
                    src={imageUrl}
                    alt="Uploaded heirloom"
                    class="w-full h-full object-cover"
                />

                <button
                    type="button"
                    on:click={triggerUpload}
                    class="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    title="Change Image"
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
                on:click={triggerUpload}
                on:keydown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        triggerUpload();
                    }
                }}
            >
                <div
                    class="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-indigo-100"
                >
                    <ImagePlus size={32} />
                </div>
                <h3 class="text-sm font-bold text-slate-700 mb-1">
                    Add a photo
                </h3>
                <p class="text-xs text-slate-400">
                    Drag photo here or click to upload
                </p>
            </div>
        {/if}
    </div>

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
