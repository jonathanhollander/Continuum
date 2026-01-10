<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import {
        Sparkles,
        Wand2,
        RefreshCw,
        X,
        Check,
        Undo2,
        Lightbulb,
    } from "lucide-svelte";

    const dispatch = createEventDispatcher<{
        input: string;
        change: string;
    }>();
    import {
        draftFromBullets,
        softenTone,
        type WriterContext,
        CONTEXT_SUGGESTIONS,
    } from "$lib/services/writerService";
    import { fade, slide } from "svelte/transition";

    export let value: string = "";
    export let placeholder: string = "";
    export let context: WriterContext = "letter";
    export let minHeight: string = "120px";
    export let label: string = "";
    export let suggestions: string[] = [];

    export let minimal: boolean = false;

    let isDrawerOpen = false;
    let mode: "polish" | "draft" = "polish";
    let isProcessing = false;

    // Suggestion State
    let suggestion: string | null = null;

    // Inputs
    let bullets = ["", "", ""];
    let sentimentValue = 50;

    $: activeSuggestions = (
        suggestions && suggestions.length > 0
            ? suggestions
            : CONTEXT_SUGGESTIONS[context] || []
    ) as string[];

    async function handleGenerate() {
        if (mode === "draft" && bullets.every((b) => !b)) return;
        if (mode === "polish" && !value) return;

        isProcessing = true;
        try {
            if (mode === "draft") {
                suggestion = await draftFromBullets(bullets, context);
            } else {
                suggestion = await softenTone(value, context);
            }
        } catch (e) {
            console.error(e);
        } finally {
            isProcessing = false;
        }
    }

    function acceptSuggestion() {
        if (suggestion) {
            value = suggestion;
            dispatch("input", value);
            dispatch("change", value);
            closeDrawer();
        }
    }

    function useStarter(starter: string) {
        mode = "draft";
        bullets[0] = starter;
        isDrawerOpen = true;
    }

    function closeDrawer() {
        isDrawerOpen = false;
        suggestion = null;
        bullets = ["", "", ""];
        sentimentValue = 50;
    }
</script>

<div class="space-y-2 h-full">
    {#if label}
        <label
            class="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1"
            >{label}</label
        >
    {/if}

    <div class="relative group h-full">
        <textarea
            bind:value
            {placeholder}
            on:input={() => dispatch("input", value)}
            on:change={() => dispatch("change", value)}
            class="w-full outline-none resize-none transition-all relative z-10 {minimal
                ? 'bg-transparent border-none p-0 focus:ring-0 shadow-none'
                : 'bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-[#4A7C74]/20 focus:bg-white'}"
            style="min-height: {minHeight}; height: {minimal ? '100%' : 'auto'}"
        ></textarea>

        <!-- Empty State Suggestions (Behind Textarea, but clickable via absolute positioning tricks or just overlay if empty) -->
        {#if !value && !isDrawerOpen}
            <div
                class="absolute top-12 left-4 right-12 z-0 opacity-50 pointer-events-none"
            >
                <div class="flex flex-wrap gap-2">
                    {#each activeSuggestions as suggestion}
                        <button
                            class="pointer-events-auto text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-200 px-2 py-1 rounded-md text-[#4A7C74] hover:bg-[#4A7C74] hover:text-white transition-colors flex items-center gap-1"
                            on:click={() => useStarter(suggestion)}
                        >
                            <Lightbulb size={10} />
                            {suggestion}
                        </button>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- Toggle Button -->
        <button
            on:click={() => (isDrawerOpen = !isDrawerOpen)}
            class="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur shadow-sm border border-slate-100 rounded-xl text-[#4A7C74] hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100 {isDrawerOpen
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
                            <Sparkles size={14} /> AI Suggestion
                        </div>

                        <div
                            class="p-4 bg-white border border-slate-200 rounded-xl text-sm leading-relaxed text-slate-700 italic mb-6 shadow-sm"
                        >
                            {suggestion}
                        </div>

                        <div class="flex items-center gap-2">
                            <button
                                on:click={() => (suggestion = null)}
                                class="flex-1 py-2 px-4 bg-white border border-slate-200 rounded-lg text-slate-500 font-bold text-xs hover:bg-slate-50 flex items-center justify-center gap-2"
                            >
                                <X size={14} /> Discard
                            </button>
                            <button
                                on:click={handleGenerate}
                                class="flex-1 py-2 px-4 bg-white border border-slate-200 rounded-lg text-[#4A7C74] font-bold text-xs hover:bg-slate-50 flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={14} /> Try Again
                            </button>
                            <button
                                on:click={acceptSuggestion}
                                class="flex-1 py-2 px-4 bg-[#4A7C74] text-white rounded-lg font-bold text-xs hover:bg-[#3b635d] flex items-center justify-center gap-2 shadow-sm"
                            >
                                <Check size={14} /> Insert
                            </button>
                        </div>
                    </div>
                {:else}
                    <!-- Controls State -->
                    <div>
                        <!-- Tabs -->
                        <div class="flex border-b border-slate-100">
                            <button
                                class="flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors {mode ===
                                'polish'
                                    ? 'bg-[#FBF9EB] text-[#4A7C74]'
                                    : 'text-slate-400 hover:text-slate-600'}"
                                on:click={() => (mode = "polish")}
                            >
                                Polish Tone
                            </button>
                            <button
                                class="flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors {mode ===
                                'draft'
                                    ? 'bg-[#FBF9EB] text-[#4A7C74]'
                                    : 'text-slate-400 hover:text-slate-600'}"
                                on:click={() => (mode = "draft")}
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
                                        on:click={handleGenerate}
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
                                        on:click={handleGenerate}
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
                        </div>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>
