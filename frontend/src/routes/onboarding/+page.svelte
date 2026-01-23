<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import { Sparkles } from 'lucide-svelte';
    import logo from '$lib/assets/logo.png';
    import { auth } from '$lib/stores/auth';
    import { onboardingFlowStore } from '$lib/stores/onboardingFlowStore.svelte';
    import { preferenceStore } from '$lib/stores/preferenceStore';

    // Step components
    import WelcomeStep from '$lib/components/onboarding/WelcomeStep.svelte';
    import RoleStep from '$lib/components/onboarding/RoleStep.svelte';
    import SituationStep from '$lib/components/onboarding/SituationStep.svelte';
    import LovedOneStep from '$lib/components/onboarding/LovedOneStep.svelte';
    import PreferencesStep from '$lib/components/onboarding/PreferencesStep.svelte';
    import ReadyStep from '$lib/components/onboarding/ReadyStep.svelte';

    let ready = $state(false);

    // Redirect if not authenticated or already completed onboarding
    onMount(() => {
        if (!$auth.isAuthenticated) {
            goto('/login');
            return;
        }

        // If onboarding already completed, go to dashboard
        if ($preferenceStore.onboardingComplete || onboardingFlowStore.isComplete) {
            goto('/dashboard');
            return;
        }

        // Short delay for smooth entrance
        setTimeout(() => {
            ready = true;
        }, 300);
    });

    // Progress bar calculation
    let progress = $derived(onboardingFlowStore.progress);

    // Current step
    let currentStep = $derived(onboardingFlowStore.currentStep);
</script>

<svelte:head>
    <title>Welcome to Continuum</title>
</svelte:head>

<div class="min-h-screen bg-slate-900 flex flex-col relative overflow-hidden">
    <!-- Ambient Background -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl"></div>
    </div>

    <!-- Header -->
    <header class="relative z-10 p-6 flex items-center justify-between">
        <img src={logo} alt="Continuum" class="h-8 w-auto opacity-80" />

        <!-- Progress indicator -->
        {#if ready && currentStep !== 'welcome'}
            <div class="flex items-center gap-3" in:fade={{ duration: 300 }}>
                <div class="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                        class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                        style="width: {progress}%"
                    ></div>
                </div>
                <span class="text-xs text-slate-500 font-medium">{progress}%</span>
            </div>
        {/if}
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex items-center justify-center p-6 relative z-10">
        {#if ready}
            <div class="w-full max-w-2xl" in:fade={{ duration: 400 }}>
                {#if currentStep === 'welcome'}
                    <WelcomeStep />
                {:else if currentStep === 'role'}
                    <RoleStep />
                {:else if currentStep === 'situation'}
                    <SituationStep />
                {:else if currentStep === 'loved-one'}
                    <LovedOneStep />
                {:else if currentStep === 'preferences'}
                    <PreferencesStep />
                {:else if currentStep === 'ready'}
                    <ReadyStep />
                {:else}
                    <!-- Fallback / Complete state - shouldn't normally render -->
                    <div class="text-center">
                        <p class="text-slate-400">Redirecting to dashboard...</p>
                    </div>
                {/if}
            </div>
        {:else}
            <!-- Loading state -->
            <div class="flex flex-col items-center gap-4">
                <div class="flex gap-2">
                    <div class="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style="animation-delay: 0s"></div>
                    <div class="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style="animation-delay: 0.1s"></div>
                    <div class="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style="animation-delay: 0.2s"></div>
                </div>
            </div>
        {/if}
    </main>

    <!-- Footer -->
    <footer class="relative z-10 p-6 text-center">
        <div class="flex items-center justify-center gap-2 text-white/20 text-[10px] font-bold uppercase tracking-[0.3em]">
            <Sparkles size={10} />
            <span>Continuum</span>
        </div>
    </footer>
</div>

<style>
    :global(body) {
        background-color: #0f172a;
    }
</style>
