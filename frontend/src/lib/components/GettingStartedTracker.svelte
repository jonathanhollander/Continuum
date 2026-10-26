<script lang="ts">
    import { Check, Users, Files, Heart, ArrowRight, Sparkles } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";
    import { familyStore } from "$lib/stores/familyStore.svelte";
    import { documentStore } from "$lib/stores/documentStore.svelte";
    import { pulse } from "$lib/stores/pulse.svelte";
    import { browser } from "$app/environment";
    import { dict } from "$lib/stores/conciergeStore.svelte";

    // Props
    interface Props {
        variant?: "sidebar" | "card" | "minimal";
        onDismiss?: () => void;
    }

    let { variant = "card", onDismiss }: Props = $props();

    // Each step reads the store that holds its records: contacts, the Document Vault
    // (documentStore) and the Pulse settings saved with the account.
    let hasContacts = $derived(familyStore.members.length > 0);
    let hasDocuments = $derived(documentStore.items.length > 0);
    let hasPulse = $derived(pulse.enabled);

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
            class="mx-3 mb-4 p-4 bg-black/15 border border-gold/30 rounded-2xl"
            transition:slide
        >
            <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-gold uppercase tracking-widest">
                    {$dict.gsTitle}
                </span>
                <div class="flex gap-1">
                    {#each steps as step}
                        <div class="w-2 h-2 rounded-full {step.complete ? 'bg-gold' : 'bg-gold/30'}"></div>
                    {/each}
                </div>
            </div>

            <!-- Progress bar -->
            <div class="h-1.5 bg-black/20 rounded-full mb-3 overflow-hidden">
                <div
                    class="h-full bg-gold rounded-full transition-all duration-500"
                    style="width: {progressPercent}%"
                ></div>
            </div>

            <!-- Next step -->
            {#if nextStep}
                <a
                    href={nextStep.href}
                    class="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-white/5 transition-colors group"
                >
                    <div class="p-2 bg-gold/15 rounded-lg text-gold">
                        <nextStep.icon size={16} />
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-white truncate">
                            {($dict.gsStep as Record<string, string>)[nextStep.id] ?? nextStep.label}
                        </p>
                    </div>
                    <ArrowRight
                        size={14}
                        class="text-gold group-hover:translate-x-1 transition-transform"
                    />
                </a>
            {/if}

            <button
                onclick={dismiss}
                class="mt-2 w-full text-xs text-white/70 hover:text-white transition-colors"
            >
                {$dict.gsDismiss}
            </button>
        </div>

    {:else if variant === "card"}
        <!-- Full card version for dashboard -->
        <div
            class="bg-card rounded-2xl shadow-xl shadow-slate-200/50 border border-border overflow-hidden"
            transition:fade
        >
            <!-- Header -->
            <div class="bg-primary-soft px-6 py-4 border-b border-border">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-card rounded-xl">
                            <Sparkles class="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 class="font-bold text-foreground">Building Your Foundation</h3>
                            <p class="text-sm text-muted-foreground">
                                Small steps that make a meaningful difference
                            </p>
                        </div>
                    </div>
                    <button
                        onclick={dismiss}
                        class="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                    >
                        Explore on my own
                    </button>
                </div>

                <!-- Progress bar -->
                <div class="mt-4 h-2 bg-card rounded-full overflow-hidden">
                    <div
                        class="h-full bg-primary rounded-full transition-all duration-500"
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
                                ? 'bg-muted border border-border'
                                : 'bg-card border border-border hover:border-primary/40 hover:bg-primary-soft'}"
                    >
                        <div
                            class="p-2 rounded-xl
                                {step.complete
                                    ? 'bg-primary-soft text-success'
                                    : 'bg-muted text-muted-foreground'}"
                        >
                            {#if step.complete}
                                <Check size={20} />
                            {:else}
                                <step.icon size={20} />
                            {/if}
                        </div>

                        <div class="flex-1">
                            <p
                                class="font-medium
                                    {step.complete ? 'text-muted-foreground line-through' : 'text-foreground'}"
                            >
                                {step.label}
                            </p>
                            <p class="text-sm text-muted-foreground">
                                {step.description}
                            </p>
                        </div>

                        {#if !step.complete}
                            <ArrowRight size={18} class="text-muted-foreground" />
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
                            {step.complete ? 'bg-primary' : 'bg-border'}"
                    ></div>
                {/each}
            </div>
            <span class="text-muted-foreground">
                {completedCount}/{steps.length} steps complete
            </span>
            {#if nextStep}
                <a href={nextStep.href} class="text-primary-hover hover:underline">
                    Next: {nextStep.label}
                </a>
            {/if}
        </div>
    {/if}
{:else if allComplete && !dismissed}
    <!-- Completion state - affirming without celebrating -->
    <div
        class="mx-3 mb-4 p-4 bg-black/15 border border-gold/30 rounded-2xl text-center"
        transition:slide
    >
        <div class="text-2xl mb-2">✨</div>
        <p class="text-sm font-medium text-gold">
            You've laid a strong foundation
        </p>
        <p class="text-xs text-white/70 mt-1">
            This is meaningful work. Continue when you're ready.
        </p>
        <button
            onclick={dismiss}
            class="mt-3 text-xs text-white/70 hover:text-white"
        >
            Continue exploring
        </button>
    </div>
{/if}
