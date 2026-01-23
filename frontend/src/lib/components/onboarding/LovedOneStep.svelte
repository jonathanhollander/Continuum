<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    import { Heart, ArrowLeft, ArrowRight } from 'lucide-svelte';
    import { onboardingFlowStore } from "$lib/stores/onboardingFlowStore.svelte.ts";

    let name = $state(onboardingFlowStore.data.deceasedName || '');

    // Adjust copy based on role and context
    let messaging = $derived.by(() => {
        const role = onboardingFlowStore.data.role;
        const context = onboardingFlowStore.data.emotionalContext;

        if (context === 'grieving') {
            return {
                title: "Who are you honoring?",
                subtitle: "We'll use their name throughout to keep their memory present.",
                placeholder: "Their first name",
                note: "This helps personalize the experience as you work through their affairs."
            };
        } else if (role === 'executor') {
            return {
                title: "Whose estate are you managing?",
                subtitle: "We'll reference them by name to make this feel more personal.",
                placeholder: "Their first name",
                note: "Using their name helps us speak about their legacy respectfully."
            };
        } else {
            return {
                title: "Who are you helping?",
                subtitle: "We'll use their name to personalize your experience.",
                placeholder: "Their first name",
                note: "This helps us reference them naturally throughout the platform."
            };
        }
    });

    function updateName(event: Event) {
        const target = event.target as HTMLInputElement;
        name = target.value;
        onboardingFlowStore.setDeceasedName(name || null);
    }

    function proceed() {
        onboardingFlowStore.nextStep();
    }

    function goBack() {
        onboardingFlowStore.previousStep();
    }

    function skip() {
        onboardingFlowStore.setDeceasedName(null);
        onboardingFlowStore.nextStep();
    }
</script>

<div class="space-y-8" in:fade={{ duration: 400 }}>
    <div class="text-center space-y-3">
        <div class="mx-auto w-14 h-14 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400 mb-4">
            <Heart size={28} />
        </div>
        <h2 class="text-2xl md:text-3xl font-serif font-bold text-white">
            {messaging.title}
        </h2>
        <p class="text-slate-400 max-w-md mx-auto">
            {messaging.subtitle}
        </p>
    </div>

    <div class="max-w-sm mx-auto space-y-4" in:fly={{ y: 20, duration: 400, delay: 100 }}>
        <div class="relative">
            <input
                type="text"
                value={name}
                oninput={updateName}
                placeholder={messaging.placeholder}
                class="w-full px-5 py-4 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-slate-500 text-lg text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            />
        </div>

        <p class="text-sm text-slate-500 text-center">
            {messaging.note}
        </p>
    </div>

    <div class="flex items-center justify-between max-w-lg mx-auto pt-4">
        <button
            onclick={goBack}
            class="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors"
        >
            <ArrowLeft size={16} />
            <span>Back</span>
        </button>

        <div class="flex items-center gap-3">
            <button
                onclick={skip}
                class="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
                Maybe later
            </button>

            <button
                onclick={proceed}
                class="group flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all hover:scale-105 active:scale-95"
            >
                <span>Continue</span>
                <ArrowRight size={16} class="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    </div>
</div>
