<script lang="ts">
    /**
     * Executor Welcome Component
     *
     * Gentle, compassionate first-time experience for executors
     */

    import { Heart, Clock, Shield, CheckCircle } from 'lucide-svelte';
    import { fade, fly } from 'svelte/transition';
    import { contextStore } from "$lib/stores/contextStore.svelte";

    interface Props {
        onComplete?: () => void;
    }

    let { onComplete = () => {} }: Props = $props();

    let step = $state(0);
    let deceasedName = $state('');

    const steps = [
        {
            title: 'Welcome',
            description: 'We understand this is a difficult time'
        },
        {
            title: 'Take Your Time',
            description: 'There are no deadlines here'
        },
        {
            title: 'Get Started',
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

    function handleComplete() {
        // Save deceased name if provided
        if (deceasedName.trim()) {
            contextStore.setDeceasedName(deceasedName.trim());
        }
        contextStore.setEmotionalContext('grieving');

        // Mark welcome as seen
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('continuum_executor_welcome_seen', 'true');
        }

        onComplete();
    }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" in:fade>
    <div
        class="max-w-2xl w-full bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
        in:fly={{ y: 20, duration: 500 }}
    >
        {#if step === 0}
            <!-- Step 1: Welcome -->
            <div class="p-8 md:p-12" in:fade>
                <div class="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mb-6">
                    <Heart size={32} class="text-rose-400" />
                </div>

                <h1 class="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
                    We're here to help
                </h1>

                <p class="text-lg text-slate-300 mb-6 leading-relaxed">
                    You're here because someone you care about has passed away, and you've been entrusted
                    with managing their estate. This is meaningful, important work—and we understand it's
                    also difficult.
                </p>

                <p class="text-slate-400 mb-8">
                    Continuum is designed to help you organize and manage estate information at your own pace,
                    with compassion and without pressure.
                </p>

                <div class="flex flex-col sm:flex-row gap-3">
                    <button
                        onclick={handleNext}
                        class="px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold
                               hover:bg-slate-100 transition-colors"
                    >
                        Continue
                    </button>
                    <button
                        onclick={handleComplete}
                        class="px-6 py-3 text-slate-400 hover:text-white transition-colors"
                    >
                        Skip introduction
                    </button>
                </div>
            </div>
        {:else if step === 1}
            <!-- Step 2: Take Your Time -->
            <div class="p-8 md:p-12" in:fade>
                <div class="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-6">
                    <Clock size={32} class="text-indigo-400" />
                </div>

                <h1 class="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
                    There's no rush
                </h1>

                <div class="space-y-4 mb-8">
                    <div class="flex items-start gap-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                        <CheckCircle size={20} class="text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <div class="font-medium text-white mb-1">Work at your own pace</div>
                            <div class="text-sm text-slate-400">
                                You can save your progress at any time and come back when you're ready.
                            </div>
                        </div>
                    </div>

                    <div class="flex items-start gap-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                        <CheckCircle size={20} class="text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <div class="font-medium text-white mb-1">Skip what you don't know</div>
                            <div class="text-sm text-slate-400">
                                Leave sections blank if you don't have the information yet. You can fill them in later.
                            </div>
                        </div>
                    </div>

                    <div class="flex items-start gap-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                        <CheckCircle size={20} class="text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <div class="font-medium text-white mb-1">Take breaks when needed</div>
                            <div class="text-sm text-slate-400">
                                This work can be emotionally taxing. Rest is important.
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row gap-3">
                    <button
                        onclick={handleNext}
                        class="px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold
                               hover:bg-slate-100 transition-colors"
                    >
                        Continue
                    </button>
                    <button
                        onclick={() => step--}
                        class="px-6 py-3 text-slate-400 hover:text-white transition-colors"
                    >
                        Back
                    </button>
                </div>
            </div>
        {:else}
            <!-- Step 3: Personalization (Optional) -->
            <div class="p-8 md:p-12" in:fade>
                <div class="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-6">
                    <Shield size={32} class="text-purple-400" />
                </div>

                <h1 class="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
                    One last thing
                </h1>

                <p class="text-slate-300 mb-6">
                    If you'd like, you can provide the name of the person who passed away. This helps us
                    personalize the experience (e.g., "their estate" becomes "John's estate"). This is
                    completely optional.
                </p>

                <div class="mb-8">
                    <label for="deceased-name" class="block text-sm font-medium text-slate-400 mb-2">
                        Their name (optional)
                    </label>
                    <input
                        id="deceased-name"
                        type="text"
                        bind:value={deceasedName}
                        placeholder="e.g., John Smith"
                        class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl
                               text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500
                               transition-colors"
                    />
                    <p class="text-xs text-slate-500 mt-2">
                        This information is stored locally and privately.
                    </p>
                </div>

                <div class="flex flex-col sm:flex-row gap-3">
                    <button
                        onclick={handleComplete}
                        class="px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold
                               hover:bg-slate-100 transition-colors"
                    >
                        Get started
                    </button>
                    <button
                        onclick={() => step--}
                        class="px-6 py-3 text-slate-400 hover:text-white transition-colors"
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
                           {i === step ? 'bg-white w-6' : 'bg-slate-600'}"
                ></div>
            {/each}
        </div>
    </div>
</div>
