<script lang="ts">
    import { fade } from "svelte/transition";
    import { Heart, Info } from "lucide-svelte";

    interface Props {
        // Core content
        title: string;
        whyMatters: string;
        encouragement?: string;

        // Visual
        icon?: any;
        iconClass?: string;

        // Action
        ctaLabel?: string;
        onAction?: () => void;

        // Optional skip message
        showSkipOption?: boolean;
        skipMessage?: string;
    }

    let {
        title,
        whyMatters,
        encouragement = "Take your time. This will be here when you're ready.",
        icon = Heart,
        iconClass = "text-rose-400",
        ctaLabel = "Start when ready",
        onAction,
        showSkipOption = true,
        skipMessage = "It's okay to skip this for now and come back later."
    }: Props = $props();
</script>

<div class="empty-state py-12 px-6 max-w-2xl mx-auto text-center" in:fade>
    <!-- Icon -->
    <div class="mb-6 flex justify-center">
        <div
            class="w-20 h-20 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl flex items-center justify-center shadow-sm"
        >
            <svelte:component this={icon} size={36} class={iconClass} />
        </div>
    </div>

    <!-- Title -->
    <h3 class="font-serif font-bold text-2xl text-slate-800 mb-4">
        {title}
    </h3>

    <!-- Why This Matters (Emotional Connection) -->
    <div class="mb-6 bg-blue-50/50 rounded-xl p-5 border border-blue-100">
        <div class="flex items-start gap-3 text-left">
            <Info size={20} class="text-blue-500 shrink-0 mt-0.5" />
            <div class="text-slate-700 leading-relaxed">
                {@html whyMatters}
            </div>
        </div>
    </div>

    <!-- Encouragement -->
    <p class="text-slate-600 mb-6 text-base leading-relaxed italic">
        {encouragement}
    </p>

    <!-- CTA -->
    {#if onAction}
        <button
            onclick={onAction}
            class="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 mb-4"
        >
            {ctaLabel}
        </button>
    {/if}

    <!-- Skip Option -->
    {#if showSkipOption}
        <p class="text-xs text-slate-400 mt-4">
            {skipMessage}
        </p>
    {/if}
</div>

<style>
    .empty-state {
        animation: fadeIn 0.6s ease-out;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
