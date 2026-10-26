<script lang="ts">
    import {
        Sparkles,
        Wand2,
        RefreshCw,
        Feather,
    } from "lucide-svelte";
    import { aiDraftLetter, aiSoftenLetter } from "$lib/services/writerService";

    let { currentContent = "", onupdate } = $props<{
        currentContent?: string;
        onupdate?: (content: string) => void;
    }>();

    let isProcessing = $state(false);
    let mode = $state<"refine" | "draft">("refine");

    // Draft Mode
    let bullets = $state(["", "", ""]);

    // Refine Mode
    let sentimentValue = $state(50); // 0 = Direct, 100 = Poetic/Soft

    // The AI's version waits here until the person chooses it; the letter changes only then.
    let suggestion = $state<string | null>(null);
    let notice = $state("");

    async function ask(run: () => Promise<string>) {
        isProcessing = true;
        notice = "";
        suggestion = null;
        try {
            const result = await run();
            if (result) suggestion = result;
            else notice = "Your letter is just as you left it. The helper can try again in a moment.";
        } catch (e) {
            console.error(e);
            notice = "Your letter is just as you left it. The helper can try again in a moment.";
        } finally {
            isProcessing = false;
        }
    }

    function handleDraft() {
        if (bullets.every((b) => !b.trim())) return;
        ask(() => aiDraftLetter(bullets));
    }

    function handleRefine() {
        if (!currentContent.trim()) return;
        ask(() => aiSoftenLetter(currentContent, sentimentValue));
    }

    function useSuggestion() {
        if (suggestion && onupdate) onupdate(suggestion);
        suggestion = null;
    }
</script>

<div
    class="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden"
>
    <div class="p-6 bg-[#4A7C74] text-white flex items-center justify-between">
        <div class="flex items-center gap-3">
            <div class="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Sparkles size={18} />
            </div>
            <h3 class="font-bold font-serif text-lg text-white">Gentle Helper</h3>
        </div>
        <div class="flex bg-black/20 rounded-lg p-1 text-xs font-bold">
            <button
                class="px-3 py-1 rounded-md transition-all {mode === 'draft'
                    ? 'bg-white text-[#4A7C74] shadow-sm'
                    : 'text-white/70 hover:text-white'}"
                onclick={() => (mode = "draft")}
            >
                Draft
            </button>
            <button
                class="px-3 py-1 rounded-md transition-all {mode === 'refine'
                    ? 'bg-white text-[#4A7C74] shadow-sm'
                    : 'text-white/70 hover:text-white'}"
                onclick={() => (mode = "refine")}
            >
                Refine
            </button>
        </div>
    </div>

    <div class="p-6">
        {#if mode === "draft"}
            <div class="space-y-4">
                <p
                    class="text-xs font-bold uppercase tracking-widest text-slate-400"
                >
                    Bullets to Narrative
                </p>
                <div class="space-y-2">
                    {#each bullets as bullet, i}
                        <div class="flex items-center gap-2">
                            <span class="text-slate-300 font-bold text-xs"
                                >{i + 1}</span
                            >
                            <input
                                type="text"
                                bind:value={bullets[i]}
                                class="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-[#4A7C74]/20"
                                placeholder={i === 0
                                    ? "Share a specific memory..."
                                    : i === 1
                                      ? "What did this teach you?"
                                      : "Your wish for them..."}
                            />
                        </div>
                    {/each}
                </div>
                <button
                    onclick={handleDraft}
                    disabled={isProcessing}
                    class="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition-all"
                >
                    {#if isProcessing}
                        <RefreshCw size={14} class="animate-spin" /> Weaving Story...
                    {:else}
                        <Wand2 size={14} /> Generate Draft
                    {/if}
                </button>
            </div>
        {:else}
            <div class="space-y-6">
                <div>
                    <label
                        for="letter-tone-softener"
                        class="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400 mb-4"
                    >
                        <span>Tone Softener</span>
                        <span class="text-[#4A7C74]"
                            >{sentimentValue}% Warmth</span
                        >
                    </label>
                    <input
                        id="letter-tone-softener"
                        type="range"
                        min="0"
                        max="100"
                        bind:value={sentimentValue}
                        aria-label="Tone Softener"
                        class="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#4A7C74]"
                    />
                    <div
                        class="flex justify-between text-[10px] font-bold text-slate-300 mt-2 uppercase"
                    >
                        <span>Direct</span>
                        <span>Poetic</span>
                    </div>
                </div>

                <div class="bg-indigo-50 p-4 rounded-xl flex items-start gap-3">
                    <Feather size={16} class="text-indigo-500 mt-0.5" />
                    <p
                        class="text-xs text-indigo-700 font-medium leading-relaxed"
                    >
                        When you choose Polish & Soften, we'll offer a gentler
                        version of your draft, and your words stay yours to keep
                        or change.
                    </p>
                </div>

                <button
                    onclick={handleRefine}
                    disabled={isProcessing || !currentContent}
                    class="w-full py-3 bg-[#4A7C74] text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#3b635d] disabled:opacity-50 transition-all"
                >
                    {#if isProcessing}
                        <RefreshCw size={14} class="animate-spin" /> Refining...
                    {:else}
                        <Sparkles size={14} /> Polish & Soften
                    {/if}
                </button>
            </div>
        {/if}

        {#if suggestion}
            <div class="mt-6 space-y-3" data-testid="assistant-suggestion">
                <p class="text-xs font-bold uppercase tracking-widest text-slate-400">
                    A version for you to consider
                </p>
                <div
                    class="max-h-64 overflow-y-auto whitespace-pre-wrap bg-[#FDFBF7] border border-stone-200 rounded-xl p-4 text-sm text-stone-700 font-serif leading-relaxed"
                >
                    {suggestion}
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <button
                        onclick={useSuggestion}
                        class="py-2.5 bg-[#4A7C74] text-white rounded-xl font-bold text-xs hover:bg-[#3b635d] transition-all"
                    >
                        Use this version
                    </button>
                    <button
                        onclick={() => (suggestion = null)}
                        class="py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all"
                    >
                        Keep my words
                    </button>
                </div>
            </div>
        {/if}
        {#if notice}
            <p class="mt-4 text-xs text-slate-500" role="status">{notice}</p>
        {/if}
    </div>
</div>
