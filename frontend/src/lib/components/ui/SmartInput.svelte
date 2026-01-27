<script lang="ts">
    import { Sparkles } from "lucide-svelte";
    import { fade } from "svelte/transition";

    let {
        value = $bindable(""),
        placeholder = "",
        label = "",
        isAIPopulated = false,
        type = "text",
    } = $props<{
        value?: string;
        placeholder?: string;
        label?: string;
        isAIPopulated?: boolean;
        type?: string;
    }>();

    let glowClass = $derived(
        isAIPopulated
            ? "border-amber-500/50 shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)] bg-amber-50/5"
            : "border-slate-200 bg-slate-50",
    );
</script>

<div class="space-y-1.5">
    {#if label}
        <div class="flex items-center justify-between px-1">
            <label
                class="text-xs font-bold text-slate-500 uppercase tracking-wide"
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
            class="w-full {glowClass} border focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-all"
        />
    </div>
</div>
