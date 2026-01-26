<script lang="ts">
    import { Check, Users, Files, Heart, ArrowRight, Sparkles } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";
    import { familyStore } from "$lib/stores/familyStore.svelte";
    import { browser } from "$app/environment";

    // Props
    interface Props {
        variant?: "sidebar" | "card" | "minimal";
        onDismiss?: () => void;
    }

    let { variant = "card", onDismiss }: Props = $props();

    // Track completion of core actions
    // In a real app, these would come from stores
    let hasContacts = $derived(familyStore.members.length > 0);

    // Check localStorage for documents and pulse setup
    let hasDocuments = $state(false);
    let hasPulse = $state(false);

    $effect(() => {
        if (browser) {
            // Check if user has added any documents
            const docs = localStorage.getItem("continuum_documents");
            hasDocuments = docs ? JSON.parse(docs).length > 0 : false;

            // Check if Pulse is set up
            const pulse = localStorage.getItem("continuum_pulse_setup");
            hasPulse = pulse === "true";
        }
    });

    let steps = $derived([
        {
            id: "contacts",
            label: "Someone you trust",
            description: "The people who matter most to your family",
            href: "/modules/contacts",
            icon: Users,
            complete: hasContacts,
        },
        {
            id: "documents",
            label: "One important document",
            description: "Whatever feels right to start with",
            href: "/modules/legal-documents",
            icon: Files,
            complete: hasDocuments,
        },
        {
            id: "pulse",
            label: "A way to stay connected",
            description: "Peace of mind for you and your loved ones",
            href: "/modules/pulse",
            icon: Heart,
            complete: hasPulse,
        },
    ]);

    let completedCount = $derived(steps.filter((s) => s.complete).length);
    let allComplete = $derived(completedCount === steps.length);
    let progressPercent = $derived(Math.round((completedCount / steps.length) * 100));

    // Don't show if dismissed or all complete
    let dismissed = $state(false);

    $effect(() => {
        if (browser) {
            dismissed = localStorage.getItem("continuum_getting_started_dismissed") === "true";
        }
    });

    function dismiss() {
        if (browser) {
            localStorage.setItem("continuum_getting_started_dismissed", "true");
        }
        dismissed = true;
        onDismiss?.();
    }

    // Find next incomplete step
    let nextStep = $derived(steps.find((s) => !s.complete));
</script>

{#if !dismissed && !allComplete}
    {#if variant === "sidebar"}
        <!-- Compact sidebar version -->
        <div
            class="mx-3 mb-4 p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl"
            transition:slide
        >
            <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-amber-400 uppercase tracking-widest">
                    Building Your Foundation
                </span>
                <div class="flex gap-1">
                    {#each steps as step}
                        <div class="w-2 h-2 rounded-full {step.complete ? 'bg-amber-400' : 'bg-amber-400/20'}"></div>
                    {/each}
                </div>
            </div>

            <!-- Progress bar -->
            <div class="h-1.5 bg-black/20 rounded-full mb-3 overflow-hidden">
                <div
                    class="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
                    style="width: {progressPercent}%"
                ></div>
            </div>

            <!-- Next step -->
            {#if nextStep}
                <a
                    href={nextStep.href}
                    class="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-white/5 transition-colors group"
                >
                    <div class="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                        <svelte:component this={nextStep.icon} size={16} />
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-white truncate">
                            {nextStep.label}
                        </p>
                    </div>
                    <ArrowRight
                        size={14}
                        class="text-amber-400/60 group-hover:translate-x-1 transition-transform"
                    />
                </a>
            {/if}

            <button
                onclick={dismiss}
                class="mt-2 w-full text-xs text-primary-foreground/40 hover:text-primary-foreground/60 transition-colors"
            >
                I'll explore on my own
            </button>
        </div>

    {:else if variant === "card"}
        <!-- Full card version for dashboard -->
        <div
            class="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
            transition:fade
        >
            <!-- Header -->
            <div class="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-100">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-amber-100 rounded-xl">
                            <Sparkles class="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h3 class="font-bold text-slate-800">Building Your Foundation</h3>
                            <p class="text-sm text-slate-500">
                                Small steps that make a meaningful difference
                            </p>
                        </div>
                    </div>
                    <button
                        onclick={dismiss}
                        class="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2"
                    >
                        Explore on my own
                    </button>
                </div>

                <!-- Progress bar -->
                <div class="mt-4 h-2 bg-amber-100 rounded-full overflow-hidden">
                    <div
                        class="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
                        style="width: {progressPercent}%"
                    ></div>
                </div>
            </div>

            <!-- Steps -->
            <div class="p-4 space-y-2">
                {#each steps as step}
                    <a
                        href={step.href}
                        class="flex items-center gap-4 p-3 rounded-2xl transition-all
                            {step.complete
                                ? 'bg-green-50 border border-green-100'
                                : 'bg-slate-50 border border-slate-100 hover:border-amber-200 hover:bg-amber-50'}"
                    >
                        <div
                            class="p-2 rounded-xl
                                {step.complete
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-slate-200 text-slate-500'}"
                        >
                            {#if step.complete}
                                <Check size={20} />
                            {:else}
                                <svelte:component this={step.icon} size={20} />
                            {/if}
                        </div>

                        <div class="flex-1">
                            <p
                                class="font-medium
                                    {step.complete ? 'text-green-700 line-through' : 'text-slate-800'}"
                            >
                                {step.label}
                            </p>
                            <p class="text-sm text-slate-500">
                                {step.description}
                            </p>
                        </div>

                        {#if !step.complete}
                            <ArrowRight size={18} class="text-slate-400" />
                        {/if}
                    </a>
                {/each}
            </div>
        </div>

    {:else}
        <!-- Minimal inline version -->
        <div class="flex items-center gap-3 text-sm" transition:fade>
            <div class="flex gap-1">
                {#each steps as step}
                    <div
                        class="w-2 h-2 rounded-full transition-colors
                            {step.complete ? 'bg-green-500' : 'bg-slate-300'}"
                    ></div>
                {/each}
            </div>
            <span class="text-slate-500">
                {completedCount}/{steps.length} steps complete
            </span>
            {#if nextStep}
                <a href={nextStep.href} class="text-amber-600 hover:underline">
                    Next: {nextStep.label}
                </a>
            {/if}
        </div>
    {/if}
{:else if allComplete && !dismissed}
    <!-- Completion state - affirming without celebrating -->
    <div
        class="mx-3 mb-4 p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl text-center"
        transition:slide
    >
        <div class="text-2xl mb-2">✨</div>
        <p class="text-sm font-medium text-green-400">
            You've laid a strong foundation
        </p>
        <p class="text-xs text-green-400/60 mt-1">
            This is meaningful work. Continue when you're ready.
        </p>
        <button
            onclick={dismiss}
            class="mt-3 text-xs text-green-400/40 hover:text-green-400/60"
        >
            Continue exploring
        </button>
    </div>
{/if}
