<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    import { Sun, CloudRain, Heart, ArrowLeft, ArrowRight } from 'lucide-svelte';
    import { onboardingFlowStore, type EmotionalContext } from "$lib/stores/onboardingFlowStore.svelte";

    const situations: { id: EmotionalContext; icon: typeof Sun; title: string; description: string; color: string }[] = [
        {
            id: 'healthy',
            icon: Sun,
            title: "Planning ahead while life is good",
            description: "You're being proactive about the future. That's a wonderful gift to your loved ones.",
            color: 'emerald'
        },
        {
            id: 'preparing',
            icon: CloudRain,
            title: "Facing a health situation",
            description: "You or someone you love is dealing with a diagnosis. We're here to help during this time.",
            color: 'amber'
        },
        {
            id: 'grieving',
            icon: Heart,
            title: "Processing a loss",
            description: "You're navigating loss and its practical demands. We'll move at your pace with care.",
            color: 'rose'
        }
    ];

    let selectedContext = $state<EmotionalContext>(onboardingFlowStore.data.emotionalContext);

    // Contextual messaging based on role
    let roleContext = $derived.by(() => {
        const role = onboardingFlowStore.data.role;
        if (role === 'executor') {
            return {
                title: "How would you describe your current situation?",
                subtitle: "This helps us adjust our tone and pacing to support you better."
            };
        } else if (role === 'family') {
            return {
                title: "What's your family going through right now?",
                subtitle: "Understanding your situation helps us be more supportive."
            };
        } else if (role === 'advisor') {
            return {
                title: "What's the typical context for your clients?",
                subtitle: "This helps us calibrate the default experience."
            };
        }
        return {
            title: "How are you approaching this?",
            subtitle: "There's no right answer. This helps us adjust our pace and tone."
        };
    });

    function selectContext(context: EmotionalContext) {
        selectedContext = context;
        onboardingFlowStore.setEmotionalContext(context);
    }

    function proceed() {
        onboardingFlowStore.nextStep();
    }

    function goBack() {
        onboardingFlowStore.previousStep();
    }

    const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
        emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400' },
        amber: { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400' },
        rose: { bg: 'bg-rose-500/20', border: 'border-rose-500/50', text: 'text-rose-400' }
    };
</script>

<div class="space-y-8" in:fade={{ duration: 400 }}>
    <div class="text-center space-y-3">
        <h2 class="text-2xl md:text-3xl font-serif font-bold text-white">
            {roleContext.title}
        </h2>
        <p class="text-slate-400 max-w-md mx-auto">
            {roleContext.subtitle}
        </p>
    </div>

    <div class="space-y-3 max-w-lg mx-auto" in:fly={{ y: 20, duration: 400, delay: 100 }}>
        {#each situations as situation}
            {@const colors = colorClasses[situation.color]}
            <button
                onclick={() => selectContext(situation.id)}
                class="group w-full relative p-5 rounded-2xl text-left transition-all duration-200 {selectedContext === situation.id
                    ? `${colors.bg} border-2 ${colors.border} scale-[1.02]`
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'}"
            >
                <div class="flex items-start gap-4">
                    <div
                        class="p-2.5 rounded-xl shrink-0 transition-colors {selectedContext === situation.id
                            ? `${colors.bg} ${colors.text}`
                            : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'}"
                    >
                        <situation.icon size={22} />
                    </div>
                    <div class="space-y-1">
                        <h3 class="font-medium text-white">{situation.title}</h3>
                        <p class="text-sm text-slate-400 leading-relaxed">{situation.description}</p>
                    </div>
                </div>

                {#if selectedContext === situation.id}
                    <div
                        class="absolute top-4 right-4 w-3 h-3 rounded-full {colors.bg.replace('/20', '')}"
                        in:fade={{ duration: 200 }}
                    ></div>
                {/if}
            </button>
        {/each}
    </div>

    <p class="text-center text-sm text-slate-500">
        You can always change this later in Settings.
    </p>

    <div class="flex items-center justify-between max-w-lg mx-auto pt-2">
        <button
            onclick={goBack}
            class="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors"
        >
            <ArrowLeft size={16} />
            <span>Back</span>
        </button>

        <button
            onclick={proceed}
            disabled={!selectedContext}
            class="group flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
        >
            <span>Continue</span>
            <ArrowRight size={16} class="group-hover:translate-x-1 transition-transform" />
        </button>
    </div>
</div>
