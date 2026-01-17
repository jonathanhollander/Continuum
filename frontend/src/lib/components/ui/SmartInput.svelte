<script lang="ts">
    import { Sparkles } from "lucide-svelte";
    import { fade } from "svelte/transition";

    export let value: string = "";
    export let placeholder: string = "";
    export let label: string = "";
    export let isAIPopulated: boolean = false;
    export let type: string = "text";

    $: glowClass = isAIPopulated
        ? "border-amber-500/50 shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)] bg-amber-50/5"
        : "border-slate-200 bg-slate-50";
</script>

<div class="space-y-2">
    {#if label}
        <div class="flex items-center justify-between px-1">
            <label
                class="text-[11px] font-black text-slate-800 uppercase tracking-wider"
                >{label}</label
            >
            {#if isAIPopulated}
                <div
                    transition:fade
                    class="flex items-center gap-1 text-[9px] font-bold text-amber-600 uppercase tracking-widest bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20"
                >
                    <Sparkles size={8} />
                    <span>AI Captured</span>
                </div>
            {/if}
        </div>
    {/if}

    <div class="relative">
        <input
            {type}
            bind:value
            {placeholder}
            class="w-full {glowClass} border-2 focus:border-indigo-600 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all"
            on:input
        />
    </div>
</div>
