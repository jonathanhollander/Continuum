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

    const uid = $props.id();

    let glowClass = $derived(
        isAIPopulated
            ? "border-warning/50 bg-warning-soft"
            : "border-border bg-muted",
    );
</script>

<div class="space-y-2">
    {#if label}
        <div class="flex items-center justify-between px-1">
            <label
                for="{uid}-input"
                class="text-[11px] font-black text-foreground uppercase tracking-wider"
                >{label}</label
            >
            {#if isAIPopulated}
                <div
                    transition:fade
                    class="flex items-center gap-1 text-[9px] font-bold text-warning uppercase tracking-widest bg-warning-soft px-1.5 py-0.5 rounded-full border border-warning/20"
                >
                    <Sparkles size={8} />
                    <span>AI Captured</span>
                </div>
            {/if}
        </div>
    {/if}

    <div class="relative">
        <input
            id="{uid}-input"
            {type}
            bind:value
            {placeholder}
            class="w-full {glowClass} border-2 focus:border-primary focus:bg-card text-foreground rounded-2xl p-4 text-sm font-bold outline-none transition-all"
        />
    </div>
</div>
