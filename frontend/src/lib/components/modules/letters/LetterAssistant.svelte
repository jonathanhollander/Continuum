<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import {
        Sparkles,
        Wand2,
        AlignLeft,
        RefreshCw,
        Feather,
    } from "lucide-svelte";
    import { draftFromBullets, softenTone } from "$lib/services/writerService";

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

    async function handleDraft() {
        if (bullets.every((b) => !b)) return;

        isProcessing = true;
        try {
            const result = await draftFromBullets(bullets);
            if (onupdate) onupdate(result);
        } catch (e) {
            console.error(e);
        } finally {
            isProcessing = false;
        }
    }

    async function handleRefine() {
        if (!currentContent) return;

        isProcessing = true;
        try {
            // Mock logic: if high sentiment, soften tone
            const result = await softenTone(currentContent);
            if (onupdate) onupdate(result);
        } catch (e) {
            console.error(e);
        } finally {
            isProcessing = false;
        }
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
            <h3 class="font-bold font-serif text-lg">Empathy Engine</h3>
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
                        class="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400 mb-4"
                    >
                        <span>Tone Softener</span>
                        <span class="text-[#4A7C74]"
                            >{sentimentValue}% Warmth</span
                        >
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        bind:value={sentimentValue}
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
                        Adjusting the slider will rewrite your current draft to
                        be more empathetic, focusing on emotional resonance.
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
    </div>
</div>
