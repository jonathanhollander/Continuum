<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import {
        ScanEye,
        Upload,
        Loader2,
        Sparkles,
        CircleCheck,
    } from "lucide-svelte";
    import {
        analyzeHeirloomImage,
        type AnalyzedHeirloom,
    } from "$lib/services/visionService";
    import SmartTextarea from "$lib/components/ui/SmartTextarea.svelte";

    export let imageUrl: string = "";

    const dispatch = createEventDispatcher<{
        analyze: AnalyzedHeirloom;
    }>();

    let fileInput: HTMLInputElement;
    let isDragging = false;
    let isAnalyzing = false;
    let analysisComplete = false;
    let provenance = "";

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
            startAnalysis(file);
        };
        reader.readAsDataURL(file);
    }

    async function startAnalysis(file: File) {
        isAnalyzing = true;
        analysisComplete = false;

        try {
            const result = await analyzeHeirloomImage(file);
            dispatch("analyze", result);
            analysisComplete = true;
        } catch (error) {
            console.error("Analysis failed", error);
        } finally {
            isAnalyzing = false;
        }
    }

    function triggerUpload() {
        fileInput.click();
    }
</script>

<div class="space-y-4">
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

                <!-- Overlay for Analysis State -->
                {#if isAnalyzing}
                    <div
                        class="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white"
                    >
                        <div class="relative">
                            <div
                                class="absolute inset-0 bg-indigo-500 blur-xl opacity-50 animate-pulse"
                            ></div>
                            <Loader2
                                size={48}
                                class="animate-spin relative z-10 text-indigo-400"
                            />
                        </div>
                        <p
                            class="mt-4 font-mono text-sm uppercase tracking-widest text-indigo-300 animate-pulse"
                        >
                            Analyzing Artifact...
                        </p>
                    </div>
                {/if}

                {#if analysisComplete}
                    <div
                        class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-emerald-500/90 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg backdrop-blur-md animate-in slide-in-from-bottom-4 fade-in duration-500"
                    >
                        <ScanEye size={16} />
                        <span class="text-xs font-bold uppercase tracking-wide"
                            >Analysis Complete</span
                        >
                    </div>

                    <button
                        on:click={triggerUpload}
                        class="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                        title="Change Image"
                    >
                        <Upload size={14} />
                    </button>
                {/if}
            </div>
        {:else}
            <div class="py-8 cursor-pointer" on:click={triggerUpload}>
                <div
                    class="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-indigo-100"
                >
                    <ScanEye size={32} />
                </div>
                <h3 class="text-sm font-bold text-slate-700 mb-1">
                    Visual Archivist
                </h3>
                <p class="text-xs text-slate-400">
                    Drag photo here or click to upload
                </p>
                <div
                    class="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-[10px] font-bold uppercase tracking-wide text-indigo-500"
                >
                    <Sparkles size={10} />
                    AI Powered
                </div>
            </div>
        {/if}
    </div>

    {#if analysisComplete}
        <div
            class="bg-indigo-50 rounded-xl p-4 border border-indigo-100 animate-in fade-in slide-in-from-top-2"
        >
            <div class="flex items-start gap-3">
                <div class="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <Sparkles size={18} />
                </div>
                <div>
                    <h4 class="text-sm font-bold text-indigo-900">
                        Insight Generated
                    </h4>
                    <p class="text-xs text-indigo-700 mt-1">
                        We've identified this item and drafted a description.
                        Review the details below.
                    </p>
                </div>
            </div>
        </div>
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
