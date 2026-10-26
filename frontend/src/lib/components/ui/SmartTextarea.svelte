<script lang="ts">
    import {
        Sparkles,
        Wand2,
        RefreshCw,
        X,
        Check,
        Lightbulb,
    } from "lucide-svelte";
    import {
        aiDraftText,
        aiSoftenText,
        type WriterContext,
        CONTEXT_SUGGESTIONS,
    } from "$lib/services/writerService";
    import { AI_UNAVAILABLE } from "$lib/services/aiConciergeService";
    import { fade, slide } from "svelte/transition";

    let {
        value = $bindable(""),
        placeholder = "",
        context = "letter",
        minHeight = "120px",
        label = "",
        hideLabel = false,
        id = undefined,
        suggestions = [],
        minimal = false,
        oninput,
        onchange,
    } = $props<{
        value?: string;
        placeholder?: string;
        context?: WriterContext;
        minHeight?: string;
        label?: string;
        hideLabel?: boolean;
        id?: string;
        suggestions?: string[];
        minimal?: boolean;
        oninput?: (val: string) => void;
        onchange?: (val: string) => void;
    }>();

    const ownId = $props.id();
    // A caller-given id lets a label outside this component name the field.
    const fieldId = $derived(id ?? ownId);
    let textareaEl = $state<HTMLTextAreaElement | null>(null);

    let isDrawerOpen = $state(false);
    let mode = $state<"polish" | "draft">("polish");
    let isProcessing = $state(false);

    // The AI's version waits here until the person chooses it; the field changes only then.
    let suggestion = $state<string | null>(null);
    let notice = $state("");

    // Inputs
    let bullets = $state(["", "", ""]);
    let sentimentValue = $state(50);

    const activeSuggestions = $derived(
        (suggestions && suggestions.length > 0
            ? suggestions
            : CONTEXT_SUGGESTIONS[context as WriterContext] || []) as string[],
    );

    async function handleGenerate() {
        if (isProcessing) return;
        if (mode === "draft" && bullets.every((b) => !b.trim())) return;
        if (mode === "polish" && !value?.trim()) return;

        isProcessing = true;
        notice = "";
        suggestion = null;
        try {
            const result =
                mode === "draft"
                    ? await aiDraftText(bullets, context)
                    : await aiSoftenText(value, sentimentValue, context);
            if (result) suggestion = result;
            else notice = AI_UNAVAILABLE;
        } catch (e) {
            console.error(e);
            notice = (e as any)?.gentle && e instanceof Error && e.message ? e.message : AI_UNAVAILABLE;
        } finally {
            isProcessing = false;
        }
    }

    function acceptSuggestion() {
        if (suggestion) {
            value = suggestion;
            oninput?.(value);
            onchange?.(value);
            closeDrawer();
        }
    }

    // A starter becomes the opening words of the field; the cursor lands after it.
    function useStarter(starter: string) {
        const end = /[?]$/.test(starter) ? "\n" : /[\p{L}\p{N}]$/u.test(starter) ? ": " : " ";
        value = starter + end;
        oninput?.(value);
        onchange?.(value);
        const el = textareaEl;
        if (el) {
            requestAnimationFrame(() => {
                el.focus();
                el.setSelectionRange(el.value.length, el.value.length);
            });
        }
    }

    function closeDrawer() {
        isDrawerOpen = false;
        suggestion = null;
        notice = "";
        bullets = ["", "", ""];
        sentimentValue = 50;
    }

    function handleInput() {
        oninput?.(value);
    }

    function handleChange() {
        onchange?.(value);
    }
</script>

<div class="space-y-2 h-full">
    {#if label}
        <label
            for={fieldId}
            class={hideLabel
                ? "sr-only"
                : "block text-xs font-bold uppercase tracking-widest text-slate-500 ml-1"}
            >{label}</label
        >
    {/if}

    <div class="relative group h-full">
        <textarea
            id={fieldId}
            bind:this={textareaEl}
            bind:value
            {placeholder}
            oninput={handleInput}
            onchange={handleChange}
            class="w-full outline-none resize-none transition-all relative z-10 {minimal
                ? 'bg-transparent border-none p-0 focus:ring-0 shadow-none'
                : 'bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-[#4A7C74]/20 focus:bg-white'}"
            style="min-height: {minHeight}; height: {minimal ? '100%' : 'auto'}"
        ></textarea>

        <!-- Starters while empty: laid over the foot of a minimal (borderless) field, beneath a boxed one -->
        {#if minimal && !value && !isDrawerOpen && activeSuggestions.length > 0}
            <div class="absolute bottom-0 left-0 right-12 z-20">
                {@render starters()}
            </div>
        {/if}

        <!-- Toggle Button -->
        <button
            type="button"
            aria-label="Writing help"
            onclick={() => (isDrawerOpen = !isDrawerOpen)}
            class="absolute top-3 right-3 z-20 p-2 bg-white/80 backdrop-blur shadow-sm border border-slate-100 rounded-xl text-[#4A7C74] hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100 {isDrawerOpen
                ? '!opacity-100 bg-[#4A7C74] !text-white'
                : ''}"
        >
            <Sparkles size={16} />
        </button>

        <!-- AI Drawer -->
        {#if isDrawerOpen}
            <div
                transition:slide
                class="absolute top-full left-0 right-0 z-20 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
            >
                {#if suggestion}
                    <!-- Review State -->
                    <div class="p-6 bg-[#FBF9EB]/50">
                        <div
                            class="flex items-center gap-2 mb-4 text-[#4A7C74] font-bold text-xs uppercase tracking-widest"
                        >
                            <Sparkles size={14} /> A version for you to consider
                        </div>

                        <div
                            class="max-h-64 overflow-y-auto whitespace-pre-wrap p-4 bg-white border border-slate-200 rounded-xl text-sm leading-relaxed text-slate-700 italic mb-6 shadow-sm"
                            data-testid="writer-suggestion"
                        >
                            {suggestion}
                        </div>

                        <div class="flex items-center gap-2">
                            <button
                                type="button"
                                onclick={() => (suggestion = null)}
                                class="flex-1 py-2 px-2 whitespace-nowrap bg-white border border-slate-200 rounded-lg text-slate-500 font-bold text-xs hover:bg-slate-50 flex items-center justify-center gap-2"
                            >
                                <X size={14} /> Keep my words
                            </button>
                            <button
                                type="button"
                                onclick={handleGenerate}
                                disabled={isProcessing}
                                class="flex-1 py-2 px-2 whitespace-nowrap bg-white border border-slate-200 rounded-lg text-[#4A7C74] font-bold text-xs hover:bg-slate-50 flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={14} /> Try Again
                            </button>
                            <button
                                type="button"
                                onclick={acceptSuggestion}
                                class="flex-1 py-2 px-2 whitespace-nowrap bg-[#4A7C74] text-white rounded-lg font-bold text-xs hover:bg-[#3b635d] flex items-center justify-center gap-2 shadow-sm"
                            >
                                <Check size={14} /> Use this version
                            </button>
                        </div>
                    </div>
                {:else}
                    <!-- Controls State -->
                    <div>
                        <!-- Tabs -->
                        <div class="flex border-b border-slate-100">
                            <button
                                type="button"
                                class="flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors {mode ===
                                'polish'
                                    ? 'bg-[#FBF9EB] text-[#4A7C74]'
                                    : 'text-slate-400 hover:text-slate-600'}"
                                onclick={() => (mode = "polish")}
                            >
                                Polish Tone
                            </button>
                            <button
                                type="button"
                                class="flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors {mode ===
                                'draft'
                                    ? 'bg-[#FBF9EB] text-[#4A7C74]'
                                    : 'text-slate-400 hover:text-slate-600'}"
                                onclick={() => (mode = "draft")}
                            >
                                Draft from Bullets
                            </button>
                        </div>

                        <div class="p-6 bg-[#FBF9EB]/30">
                            {#if mode === "polish"}
                                <div class="space-y-4">
                                    <div
                                        class="flex justify-between text-xs font-bold text-slate-400 uppercase"
                                    >
                                        <span>Professional</span>
                                        <span>Warm & Human</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        bind:value={sentimentValue}
                                        class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#4A7C74]"
                                    />
                                    <button
                                        type="button"
                                        onclick={handleGenerate}
                                        disabled={!value || isProcessing}
                                        class="w-full py-2 bg-white border border-slate-200 text-[#4A7C74] rounded-lg font-bold text-xs hover:bg-white/80 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
                                    >
                                        {#if isProcessing}
                                            <RefreshCw
                                                size={14}
                                                class="animate-spin"
                                            /> Refining...
                                        {:else}
                                            <Sparkles size={14} /> Polish this Text
                                        {/if}
                                    </button>
                                </div>
                            {:else}
                                <div class="space-y-3">
                                    {#each bullets as _, i}
                                        <input
                                            type="text"
                                            bind:value={bullets[i]}
                                            class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#4A7C74]"
                                            placeholder="Fact or memory..."
                                        />
                                    {/each}
                                    <button
                                        type="button"
                                        onclick={handleGenerate}
                                        disabled={isProcessing}
                                        class="w-full py-2 bg-[#4A7C74] text-white rounded-lg font-bold text-xs hover:bg-[#3b635d] disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2"
                                    >
                                        {#if isProcessing}
                                            <RefreshCw
                                                size={14}
                                                class="animate-spin"
                                            /> Writing...
                                        {:else}
                                            <Wand2 size={14} /> Generate Paragraph
                                        {/if}
                                    </button>
                                </div>
                            {/if}
                            {#if notice}
                                <p class="mt-4 text-xs text-slate-500" role="status">{notice}</p>
                            {/if}
                        </div>
                    </div>
                {/if}
            </div>
        {/if}
    </div>

    {#if !minimal && !value && !isDrawerOpen && activeSuggestions.length > 0}
        {@render starters()}
    {/if}
</div>

{#snippet starters()}
    <div class="flex flex-wrap gap-2">
        {#each activeSuggestions as sug}
            <button
                type="button"
                class="text-xs font-semibold bg-white border border-slate-200 px-2.5 py-1 rounded-md text-[#3b635d] hover:bg-[#4A7C74] hover:text-white transition-colors flex items-center gap-1"
                onclick={() => useStarter(sug)}
            >
                <Lightbulb size={12} aria-hidden="true" />
                {sug}
            </button>
        {/each}
    </div>
{/snippet}
