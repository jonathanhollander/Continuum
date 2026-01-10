<script lang="ts">
    import { fly } from "svelte/transition";
    import { Lightbulb, X } from "lucide-svelte";
    import {
        encouragementMode,
        shouldShowPrompt,
        logInteraction,
    } from "$lib/stores/concierge";

    export let type: "hint" | "insight" | "action" = "hint";
    export let text: string;
    export let sensitivity: "Low" | "High" = "Low";

    let visible = true;

    $: show = visible && shouldShowPrompt($encouragementMode, sensitivity);

    function dismiss() {
        visible = false;
        logInteraction("Encouragement Dismissed", text);
    }
</script>

{#if show}
    <div
        class="flex items-start gap-3 p-4 my-4 rounded-xl border border-l-4 shadow-sm transition-all
        {type === 'hint'
            ? 'bg-blue-50 border-blue-100 border-l-blue-400 text-blue-900'
            : ''}
        {type === 'insight'
            ? 'bg-purple-50 border-purple-100 border-l-purple-400 text-purple-900'
            : ''}
        {type === 'action'
            ? 'bg-teal-50 border-teal-100 border-l-teal-400 text-teal-900'
            : ''}"
        in:fly={{ y: 10, duration: 300 }}
    >
        <div class="shrink-0 mt-0.5 opacity-70">
            <Lightbulb size={18} />
        </div>

        <div class="flex-1 text-sm leading-relaxed">
            <p class="font-medium opacity-90">{text}</p>
        </div>

        <button
            class="shrink-0 opacity-40 hover:opacity-100 transition-opacity"
            on:click={dismiss}
        >
            <X size={16} />
        </button>
    </div>
{/if}
