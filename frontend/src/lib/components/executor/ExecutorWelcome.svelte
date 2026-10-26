<script lang="ts">
    import { focusTrap } from "$lib/actions/focusTrap";
    /**
     * Executor Welcome Component
     *
     * Gentle, compassionate first-time experience for executors
     */

    import { Heart, Clock, Shield, CheckCircle } from 'lucide-svelte';
    import { fade, fly } from 'svelte/transition';
    import { contextStore } from "$lib/stores/contextStore.svelte";
    import { logger } from "$lib/utils/logger";
    import { captureSession, isCurrentSession } from "$lib/services/sessionOwnership";

    interface Props {
        onComplete?: () => void;
    }

    let { onComplete = () => {} }: Props = $props();

    let step = $state(0);
    let deceasedName = $state(contextStore.deceasedName || '');
    let saving = $state(false);
    let saveError = $state(false);

    const steps = [
        {
            title: 'Welcome',
            description: 'We understand this is a difficult time'
        },
        {
            title: 'Take Your Time',
            description: 'Take all the time you need.'
        },
        {
            title: "Begin when you're ready",
            description: 'When you\'re ready'
        }
    ];

    function handleNext() {
        if (step < steps.length - 1) {
            step++;
        } else {
            handleComplete();
        }
    }

    async function handleComplete() {
        if (saving) return;
        const owner = captureSession();
        saving = true;
        saveError = false;
        try {
            await contextStore.saveExecutorWelcome(deceasedName);
            if (isCurrentSession(owner)) onComplete();
        } catch (e) {
            logger.error('[ExecutorWelcome] Saving the welcome details failed', e);
            if (isCurrentSession(owner)) saveError = true;
        } finally {
            saving = false;
        }
    }
</script>

<div role="dialog" aria-modal="true" aria-labelledby="executor-welcome-title" aria-busy={saving} use:focusTrap class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" in:fade>
    <div
        class="surface-dark max-w-2xl w-full bg-background text-foreground rounded-2xl border border-border shadow-2xl overflow-hidden"
        in:fly={{ y: 20, duration: 500 }}
    >
        {#if step === 0}
            <!-- Step 1: Welcome -->
            <div class="p-8 md:p-12" in:fade>
                <div class="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                    <Heart size={32} class="text-primary" />
                </div>

                <h1 id="executor-welcome-title" class="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
                    We're here to help
                </h1>

                <p class="text-lg text-muted-foreground mb-6 leading-relaxed">
                    You're here because someone you care about has passed away, and you've been entrusted
                    with managing their estate. This is meaningful, important work—and we understand it's
                    also difficult.
                </p>

                <p class="text-muted-foreground mb-8">
                    Continuum is designed to help you organize and manage estate information at your own pace,
                    with compassion and room to breathe.
                </p>

                <div class="flex flex-col sm:flex-row gap-3">
                    <button
                        onclick={handleNext}
                        class="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold
                               hover:bg-primary-hover transition-colors"
                    >
                        Continue
                    </button>
                    <!-- Closes for now; the welcome returns on the next visit to the dashboard -->
                    <button
                        onclick={() => onComplete()}
                        class="px-6 py-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Come back to this later
                    </button>
                </div>
            </div>
        {:else if step === 1}
            <!-- Step 2: Take Your Time -->
            <div class="p-8 md:p-12" in:fade>
                <div class="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                    <Clock size={32} class="text-primary" />
                </div>

                <h1 id="executor-welcome-title" class="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
                    Take your time
                </h1>

                <div class="space-y-4 mb-8">
                    <div class="flex items-start gap-3 p-4 rounded-xl bg-card/40 border border-border/50">
                        <CheckCircle size={20} class="text-success flex-shrink-0 mt-0.5" />
                        <div>
                            <div class="font-medium text-foreground mb-1">Work at your own pace</div>
                            <div class="text-sm text-muted-foreground">
                                You can save your progress at any time and come back when you're ready.
                            </div>
                        </div>
                    </div>

                    <div class="flex items-start gap-3 p-4 rounded-xl bg-card/40 border border-border/50">
                        <CheckCircle size={20} class="text-success flex-shrink-0 mt-0.5" />
                        <div>
                            <div class="font-medium text-foreground mb-1">Fill in what you know</div>
                            <div class="text-sm text-muted-foreground">
                                Leave a section for later, and fill it in whenever the details come.
                            </div>
                        </div>
                    </div>

                    <div class="flex items-start gap-3 p-4 rounded-xl bg-card/40 border border-border/50">
                        <CheckCircle size={20} class="text-success flex-shrink-0 mt-0.5" />
                        <div>
                            <div class="font-medium text-foreground mb-1">Take breaks when needed</div>
                            <div class="text-sm text-muted-foreground">
                                This work is tender. Rest is part of it.
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row gap-3">
                    <button
                        onclick={handleNext}
                        class="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold
                               hover:bg-primary-hover transition-colors"
                    >
                        Continue
                    </button>
                    <button
                        onclick={() => step--}
                        class="px-6 py-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Back
                    </button>
                </div>
            </div>
        {:else}
            <!-- Step 3: Personalization (Optional) -->
            <div class="p-8 md:p-12" in:fade>
                <div class="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                    <Shield size={32} class="text-primary" />
                </div>

                <h1 id="executor-welcome-title" class="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
                    One last thing
                </h1>

                <p class="text-muted-foreground mb-6">
                    If you'd like, you can provide the name of the person who passed away. This helps us
                    personalize the experience (e.g., "their estate" becomes "John's estate"). Share it
                    only if you wish.
                </p>

                <div class="mb-8">
                    <label for="deceased-name" class="block text-sm font-medium text-muted-foreground mb-2">
                        Their name (optional)
                    </label>
                    <input
                        id="deceased-name"
                        type="text"
                        bind:value={deceasedName}
                        disabled={saving}
                        placeholder="e.g., John Smith"
                        class="w-full px-4 py-3 bg-card border border-border rounded-xl
                               text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary
                               transition-colors"
                    />
                    <p class="text-xs text-muted-foreground mt-2">
                        This is kept privately with your account.
                    </p>
                </div>

                {#if saveError}
                    <p class="mb-4 text-sm text-warning" role="alert">Your draft is kept. We can save it again whenever you're ready.</p>
                {/if}
                <div class="flex flex-col sm:flex-row gap-3">
                    <button
                        onclick={handleComplete}
                        disabled={saving}
                        class="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold
                               hover:bg-primary-hover transition-colors disabled:opacity-60"
                    >
                        {saving ? 'Saving...' : saveError ? 'Try Again' : "Begin when you're ready"}
                    </button>
                    <button
                        onclick={() => step--}
                        disabled={saving}
                        class="px-6 py-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Back
                    </button>
                </div>
            </div>
        {/if}

        <!-- Progress Dots -->
        <div class="flex items-center justify-center gap-2 pb-8">
            {#each steps as _, i}
                <div
                    class="w-2 h-2 rounded-full transition-all duration-300
                           {i === step ? 'bg-primary w-6' : 'bg-muted-foreground/50'}"
                ></div>
            {/each}
        </div>
    </div>
</div>
