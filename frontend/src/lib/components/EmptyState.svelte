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
        icon: Icon = Heart,
        iconClass = "text-primary",
        ctaLabel = "Explore this step",
        onAction,
        showSkipOption = true,
        skipMessage = "It's okay to skip this for now and come back later.",
    }: Props = $props();
</script>

<div class="empty-state py-12 px-6 max-w-2xl mx-auto text-center" in:fade>
    <!-- Icon -->
    <div class="mb-6 flex justify-center">
        <div
            class="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center shadow-sm"
        >
            <Icon size={36} class={iconClass} />
        </div>
    </div>

    <!-- Title -->
    <h3 class="font-serif font-bold text-2xl text-foreground mb-4">
        {title}
    </h3>

    <!-- Why This Matters (Emotional Connection) -->
    <div class="mb-6 bg-primary/5 rounded-xl p-5 border border-primary/10">
        <div class="flex items-start gap-3 text-left">
            <Info size={20} class="text-primary shrink-0 mt-0.5" />
            <div class="text-foreground leading-relaxed">
                {@html whyMatters}
            </div>
        </div>
    </div>

    <!-- Encouragement -->
    <p class="text-muted-foreground mb-6 text-base leading-relaxed italic">
        {encouragement}
    </p>

    <!-- CTA -->
    {#if onAction}
        <button
            onclick={onAction}
            class="bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-semibold hover:bg-primary-hover transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 mb-4"
        >
            {ctaLabel}
        </button>
    {/if}

    <!-- Skip Option -->
    {#if showSkipOption}
        <p class="text-xs text-muted-foreground mt-4">
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
