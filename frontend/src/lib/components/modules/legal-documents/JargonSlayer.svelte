<script lang="ts">
    import {
        X,
        TriangleAlert,
        Info,
        CircleCheck,
        BookOpenText,
    } from "lucide-svelte";
    import { EXAMPLE_WILL, type ExplainedTerm } from "$lib/services/legalService";
    import { fade, slide, scale } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import { focusTrap } from "$lib/actions/focusTrap";

    let { onclose }: { onclose: () => void } = $props();

    const analysis = EXAMPLE_WILL;
    let selectedTerm = $state<ExplainedTerm | null>(null);

    function highlightText(text: string, terms: ExplainedTerm[]) {
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
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    role="dialog"
    aria-modal="true"
    aria-labelledby="jargon-dialog-title"
    use:focusTrap={{ onEscape: onclose }}
>
    <!-- Backdrop -->
    <div
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        transition:fade={{ duration: 200 }}
        onclick={onclose}
        role="presentation"
    ></div>

    <!-- Panel -->
    <div
        class="relative bg-card rounded-2xl shadow-2xl ring-1 ring-slate-900/5 w-full max-w-4xl h-[80vh] flex overflow-hidden"
        transition:scale={{ duration: 250, start: 0.95, easing: cubicOut }}
    >
        <!-- Header Close Button -->
        <button
            onclick={onclose}
            class="absolute top-4 right-4 p-2 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-full z-10 transition-colors"
            aria-label="Close"
        >
            <X class="w-5 h-5" />
        </button>

            <!-- Viewer -->
            <div class="flex-1 flex flex-col h-full">
                <div
                    class="p-8 border-b border-border flex items-center justify-between bg-background/50"
                >
                    <div>
                        <div
                            class="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest mb-1"
                        >
                            <BookOpenText size={14} /> Example
                        </div>
                        <h3
                            id="jargon-dialog-title"
                            class="text-2xl font-bold font-serif text-foreground"
                        >
                            An example will, explained
                        </h3>
                    </div>
                </div>

                <div
                    class="flex-1 overflow-y-auto p-12 bg-muted relative paper-texture"
                >
                    <div
                        role="presentation"
                        class="w-full text-left prose prose-lg max-w-none font-serif text-foreground leading-loose whitespace-pre-wrap appearance-none block bg-transparent border-none p-0"
                        onclick={handleTextClick}
                    >
                        {@html highlightText(analysis.fullText, analysis.terms)}
                    </div>
                </div>
            </div>

            <!-- Sidebar -->
            <div
                class="w-80 bg-card border-l border-border p-6 flex flex-col"
            >
                <div class="mb-6">
                    <h4
                        class="font-bold text-foreground text-sm uppercase tracking-wider mb-4"
                    >
                        Terms explained
                    </h4>
                    <div class="space-y-3">
                        <div
                            class="p-3 bg-info/10 rounded-xl flex items-center gap-3"
                        >
                            <Info size={18} class="text-info" />
                            <div>
                                <p class="text-xs font-bold text-foreground">
                                    {analysis.terms.length} terms highlighted
                                </p>
                                <p class="text-[10px] text-muted-foreground">
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
                                class="text-xl font-bold font-serif mb-4 border-b border-white/10 pb-4 text-white"
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
                        class="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-4 border-2 border-dashed border-border rounded-2xl"
                    >
                        <BookOpenText size={32} class="mb-3 opacity-50" />
                        <p class="text-sm font-medium">
                            Select a highlighted term to view its plain English
                            explanation.
                        </p>
                    </div>
                {/if}
            </div>
    </div>
</div>

<style>
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
        border-color: var(--color-info);
        color: var(--color-info);
    }

    :global(.term-highlight.info:hover) {
        background-color: color-mix(in srgb, var(--color-info) 10%, transparent);
    }

    :global(.term-highlight.warning) {
        border-color: var(--color-warning);
        color: var(--color-warning);
    }

    :global(.term-highlight.warning:hover) {
        background-color: var(--color-warning-soft);
    }
</style>
