<script lang="ts">
    import { compassStore } from "$lib/stores/compassStore";
    import { page } from "$app/stores";
    import { fly, fade } from "svelte/transition";
    import {
        X,
        Heart,
        Lightbulb,
        MessageCircle,
        Map,
        CircleCheck,
    } from "lucide-svelte";
    import { onMount } from "svelte";

    export let isOpen = false;
    export let onClose: () => void;

    // Reactively update store when page changes
    $: {
        if ($page.url.pathname) {
            compassStore.updateContext($page.url.pathname);
        }
    }

    // Copy script function
    function copyScript(text: string) {
        navigator.clipboard.writeText(text);
        // Could show a toast here
    }
</script>

{#if isOpen}
    <!-- Backdrop -->
    <div
        class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity"
        on:click={onClose}
        transition:fade={{ duration: 200 }}
    ></div>

    <!-- Panel -->
    <div
        class="fixed top-0 right-0 h-full w-full md:w-[480px] bg-primary border-l border-primary-foreground/10 shadow-2xl z-50 flex flex-col overflow-hidden"
        transition:fly={{ x: 400, duration: 400, opacity: 1 }}
    >
        <!-- Header -->
        <div
            class="p-6 border-b border-primary-foreground/10 bg-black/10 backdrop-blur shrink-0 flex items-start justify-between"
        >
            <div>
                <div class="flex items-center gap-2 mb-2">
                    <div
                        class="p-1.5 bg-amber-500/10 rounded-lg text-amber-500"
                    >
                        <Map size={18} />
                    </div>
                    <span
                        class="text-xs font-bold uppercase tracking-widest text-amber-500/80"
                        >The Compass</span
                    >
                </div>
                <h2
                    class="text-2xl font-serif font-bold text-white leading-tight"
                >
                    {$compassStore.title}
                </h2>
                <p class="text-primary-foreground/80 text-sm mt-1">
                    {$compassStore.mission}
                </p>
            </div>
            <button
                on:click={onClose}
                class="p-2 text-primary-foreground/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        <!-- Scrollable Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-8">
            <!-- Emotional Context (The EQ Layer) -->
            <div class="relative pl-6 py-1">
                <div
                    class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-500 to-rose-500/20 rounded-full"
                ></div>
                <div class="flex items-start gap-3">
                    <Heart class="text-rose-400 shrink-0 mt-1" size={18} />
                    <div>
                        <h3
                            class="text-sm font-bold text-rose-200 uppercase tracking-wide mb-1"
                        >
                            Emotional Context
                        </h3>
                        <p
                            class="text-primary-foreground/80 leading-relaxed italic"
                        >
                            "{$compassStore.emotional_context}"
                        </p>
                    </div>
                </div>
            </div>

            <!-- Human Impact -->
            <div
                class="bg-indigo-500/5 rounded-2xl p-6 border border-indigo-500/10"
            >
                <h3
                    class="text-sm font-bold text-indigo-300 uppercase tracking-wide mb-3 flex items-center gap-2"
                >
                    <Lightbulb size={16} /> Why This Matters
                </h3>
                <p class="text-primary-foreground/80 text-sm leading-relaxed">
                    {$compassStore.human_impact}
                </p>
            </div>

            <!-- Key Deliverables -->
            <div>
                <h3
                    class="text-sm font-bold text-primary-foreground/60 uppercase tracking-widest mb-4 flex items-center gap-2"
                >
                    <CircleCheck size={16} /> Mission Deliverables
                </h3>
                <ul class="space-y-3">
                    {#each $compassStore.key_deliverables as item}
                        <li class="flex items-start gap-3 group">
                            <div
                                class="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0 group-hover:scale-125 transition-transform"
                            ></div>
                            <span class="text-primary-foreground/90 text-sm"
                                >{item}</span
                            >
                        </li>
                    {/each}
                </ul>
            </div>

            <!-- Pro Tips -->
            {#if $compassStore.pro_tips.length > 0}
                <div class="border-t border-primary-foreground/10 pt-6">
                    <h3
                        class="text-xs font-bold text-primary-foreground/50 uppercase tracking-widest mb-4"
                    >
                        Pro Tips
                    </h3>
                    <ul class="space-y-3">
                        {#each $compassStore.pro_tips as tip}
                            <li
                                class="text-xs text-primary-foreground/70 flex gap-2"
                            >
                                <span class="text-amber-400 font-bold">></span>
                                {tip}
                            </li>
                        {/each}
                    </ul>
                </div>
            {/if}

            <!-- Scripts (If any) -->
            {#if $compassStore.conversation_scripts && $compassStore.conversation_scripts.length > 0}
                <div class="mt-8">
                    <div class="flex items-center gap-2 mb-4">
                        <MessageCircle size={16} class="text-cyan-400" />
                        <h3
                            class="text-sm font-bold text-cyan-200 uppercase tracking-wide"
                        >
                            Conversation Scripts
                        </h3>
                    </div>

                    {#each $compassStore.conversation_scripts as script}
                        <div
                            class="bg-black/20 rounded-xl p-4 border border-primary-foreground/10 relative group"
                        >
                            <div
                                class="text-xs font-bold text-primary-foreground/60 mb-2"
                            >
                                {script.title}
                            </div>
                            <div
                                class="text-primary-foreground/90 font-serif italic mb-4 pr-8"
                            >
                                "{script.text}"
                            </div>
                            <button
                                on:click={() => copyScript(script.text)}
                                class="absolute top-4 right-4 p-1.5 text-primary-foreground/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="Copy to clipboard"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    ><rect
                                        width="14"
                                        height="14"
                                        x="8"
                                        y="8"
                                        rx="2"
                                        ry="2"
                                    /><path
                                        d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
                                    /></svg
                                >
                            </button>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
{/if}
