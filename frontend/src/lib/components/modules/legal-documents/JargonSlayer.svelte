<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import {
        X,
        Sparkles,
        TriangleAlert,
        Info,
        FileText,
        CircleCheck,
        ScanSearch,
    } from "lucide-svelte";
    import {
        analyzeLegalDoc,
        type AnalyzedLegalese,
    } from "$lib/services/legalService";
    import { fade, slide, scale } from "svelte/transition";

    export let docName: string;
    export let docType: string;

    const dispatch = createEventDispatcher();

    let status: "scanning" | "ready" = "scanning";
    let analysis: AnalyzedLegalese | null = null;
    let selectedTerm: {
        term: string;
        definition: string;
        severity: "info" | "warning";
    } | null = null;

    onMount(async () => {
        try {
            analysis = await analyzeLegalDoc(docType);
            status = "ready";
        } catch (e) {
            console.error(e);
        }
    });

    function highlightText(text: string, terms: any[]) {
        let html = text;
        terms.forEach((t) => {
            const regex = new RegExp(`(${t.term})`, "gi");
            // We use a button for interactivity
            html = html.replace(
                regex,
                `<button class="term-highlight ${t.severity}" data-term="${t.term}">$1</button>`,
            );
        });
        return html;
    }

    function handleTextClick(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (target.classList.contains("term-highlight")) {
            const term = target.getAttribute("data-term");
            selectedTerm =
                analysis?.terms.find(
                    (t) => t.term.toLowerCase() === term?.toLowerCase(),
                ) || null;
        } else {
            selectedTerm = null;
        }
    }
</script>

<div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
    transition:fade
>
    <div
        class="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] flex overflow-hidden relative"
        in:scale={{ start: 0.95 }}
    >
        <!-- Header -->
        <button
            on:click={() => dispatch("close")}
            class="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full z-10 transition-colors"
        >
            <X size={20} />
        </button>

        {#if status === "scanning"}
            <div
                class="w-full h-full flex flex-col items-center justify-center text-center p-8 space-y-8"
            >
                <div class="relative">
                    <div
                        class="absolute inset-0 bg-[#4A7C74] blur-3xl opacity-20 animate-pulse"
                    ></div>
                    <ScanSearch
                        size={64}
                        class="text-[#4A7C74] relative z-10 animate-bounce"
                    />
                </div>
                <div>
                    <h3
                        class="text-2xl font-black text-slate-900 font-serif mb-2"
                    >
                        Analyzing Document...
                    </h3>
                    <p class="text-slate-500 font-medium animate-pulse">
                        Scanning "{docName}" for complex clauses and legal
                        jargon.
                    </p>
                </div>
                <div class="w-64 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-[#4A7C74] animate-progress"></div>
                </div>
            </div>
        {:else if analysis}
            <!-- Viewer -->
            <div class="flex-1 flex flex-col h-full">
                <div
                    class="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50"
                >
                    <div>
                        <div
                            class="flex items-center gap-2 text-[#4A7C74] font-black text-xs uppercase tracking-widest mb-1"
                        >
                            <Sparkles size={14} /> Jargon Slayer Active
                        </div>
                        <h3
                            class="text-2xl font-bold font-serif text-slate-900"
                        >
                            {docName}
                        </h3>
                    </div>
                </div>

                <div
                    class="flex-1 overflow-y-auto p-12 bg-[#FDFBF7] relative paper-texture"
                >
                    <div
                        class="prose prose-lg max-w-none font-serif text-slate-800 leading-loose whitespace-pre-wrap"
                        on:click={handleTextClick}
                    >
                        {@html highlightText(analysis.fullText, analysis.terms)}
                    </div>
                </div>
            </div>

            <!-- Sidebar -->
            <div
                class="w-80 bg-white border-l border-slate-200 p-6 flex flex-col"
            >
                <div class="mb-6">
                    <h4
                        class="font-bold text-slate-900 text-sm uppercase tracking-wider mb-4"
                    >
                        Analysis Report
                    </h4>
                    <div class="space-y-3">
                        <div
                            class="p-3 bg-blue-50 rounded-xl flex items-center gap-3"
                        >
                            <Info size={18} class="text-blue-600" />
                            <div>
                                <p class="text-xs font-bold text-blue-900">
                                    {analysis.terms.length} Terms Found
                                </p>
                                <p class="text-[10px] text-blue-700">
                                    Tap highlighted text to explain
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {#if selectedTerm}
                    <div class="flex-1" transition:slide>
                        <div
                            class="p-6 bg-slate-900 text-white rounded-2xl shadow-xl"
                        >
                            <div
                                class="flex items-center gap-2 mb-3 text-emerald-400 text-xs font-bold uppercase tracking-widest"
                            >
                                <CircleCheck size={14} /> Translated
                            </div>
                            <h5
                                class="text-xl font-bold font-serif mb-4 border-b border-white/10 pb-4"
                            >
                                "{selectedTerm.term}"
                            </h5>
                            <p class="text-slate-300 leading-relaxed text-sm">
                                {selectedTerm.definition}
                            </p>
                            {#if selectedTerm.severity === "warning"}
                                <div
                                    class="mt-4 p-3 bg-amber-500/20 border border-amber-500/50 rounded-lg flex gap-2"
                                >
                                    <TriangleAlert
                                        size={16}
                                        class="text-amber-400 shrink-0"
                                    />
                                    <p
                                        class="text-[10px] text-amber-200 font-medium"
                                    >
                                        This clause typically requires careful
                                        review.
                                    </p>
                                </div>
                            {/if}
                        </div>
                    </div>
                {:else}
                    <div
                        class="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-4 border-2 border-dashed border-slate-100 rounded-2xl"
                    >
                        <ScanSearch size={32} class="mb-3 opacity-50" />
                        <p class="text-sm font-medium">
                            Select a highlighted term to view its plain English
                            explanation.
                        </p>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    @keyframes progress {
        0% {
            width: 0%;
        }
        100% {
            width: 100%;
        }
    }
    .animate-progress {
        animation: progress 2s ease-out forwards;
    }

    :global(.term-highlight) {
        border-bottom: 2px solid;
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 600;
        background: rgba(0, 0, 0, 0.02);
        padding: 0 4px;
        border-radius: 4px;
    }

    :global(.term-highlight.info) {
        border-color: #3b82f6;
        color: #1e40af;
    }

    :global(.term-highlight.info:hover) {
        background-color: #eff6ff;
    }

    :global(.term-highlight.warning) {
        border-color: #f59e0b;
        color: #92400e;
    }

    :global(.term-highlight.warning:hover) {
        background-color: #fef3c7;
    }
</style>
