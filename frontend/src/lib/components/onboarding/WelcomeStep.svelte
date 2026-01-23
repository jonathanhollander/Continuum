<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    import { Heart, Shield, Clock, ArrowRight } from 'lucide-svelte';
    import { onboardingFlowStore } from '$lib/stores/onboardingFlowStore.svelte';

    let ready = $state(false);

    $effect(() => {
        // Start timing when user sees this step
        onboardingFlowStore.start();
        setTimeout(() => (ready = true), 500);
    });

    function proceed() {
        onboardingFlowStore.nextStep();
    }
</script>

<div class="text-center space-y-8" in:fade={{ duration: 600 }}>
    <div class="space-y-4">
        <h1 class="text-3xl md:text-4xl font-serif font-bold text-white leading-tight">
            Welcome to Continuum
        </h1>
        <p class="text-lg text-slate-300 max-w-lg mx-auto leading-relaxed">
            We're honored you're here. Taking this step shows tremendous care
            for the people you love.
        </p>
    </div>

    {#if ready}
        <div class="space-y-6" in:fly={{ y: 20, duration: 400 }}>
            <!-- Value propositions -->
            <div class="grid gap-4 max-w-md mx-auto text-left">
                <div class="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div class="p-2 bg-rose-500/20 rounded-xl text-rose-400 shrink-0">
                        <Heart size={20} />
                    </div>
                    <div>
                        <h3 class="font-medium text-white">Your pace, your way</h3>
                        <p class="text-sm text-slate-400 mt-1">
                            There's no rush. We'll guide you gently through each step.
                        </p>
                    </div>
                </div>

                <div class="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div class="p-2 bg-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h3 class="font-medium text-white">Complete privacy</h3>
                        <p class="text-sm text-slate-400 mt-1">
                            Your information stays secure. We never share or sell your data.
                        </p>
                    </div>
                </div>

                <div class="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div class="p-2 bg-amber-500/20 rounded-xl text-amber-400 shrink-0">
                        <Clock size={20} />
                    </div>
                    <div>
                        <h3 class="font-medium text-white">Save anytime</h3>
                        <p class="text-sm text-slate-400 mt-1">
                            Your progress saves automatically. Return whenever you're ready.
                        </p>
                    </div>
                </div>
            </div>

            <p class="text-sm text-slate-500 italic">
                Let's start with a few questions to personalize your experience.
            </p>

            <button
                onclick={proceed}
                class="group inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-2xl transition-all hover:scale-105 active:scale-95"
            >
                <span>Let's begin</span>
                <ArrowRight size={18} class="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    {/if}
</div>
