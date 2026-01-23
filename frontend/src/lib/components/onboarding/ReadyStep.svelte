<script lang="ts">
    import { fade, fly } from "svelte/transition";
    import {
        Sparkles,
        MessageCircle,
        LayoutGrid,
        ArrowLeft,
        Check,
    } from "lucide-svelte";
    import { onboardingFlowStore } from "$lib/stores/onboardingFlowStore.svelte.ts";
    import { goto } from "$app/navigation";
    import { conciergeEngine } from "$lib/stores/conciergeEngine.ts";
    import { preferenceStore } from "$lib/stores/preferenceStore.ts";
    import { contextStore } from "$lib/stores/contextStore.svelte.ts";

    let isCompleting = $state(false);

    // Personalized messaging based on collected data
    let personalizedMessage = $derived.by(() => {
        const data = onboardingFlowStore.data;
        const name = data.deceasedName;

        if (data.emotionalContext === "grieving" && name) {
            return `We're here to help you honor ${name}'s memory while taking care of the practical matters.`;
        } else if (data.role === "executor" && name) {
            return `We'll help you manage ${name}'s estate with care and clarity.`;
        } else if (data.emotionalContext === "preparing") {
            return "We'll help you organize everything so your loved ones have less to worry about.";
        } else {
            return "You're giving your loved ones an incredible gift by preparing ahead.";
        }
    });

    async function startWithConcierge() {
        await completeOnboarding();
        conciergeEngine.open();
        goto("/dashboard");
    }

    async function startWithDashboard() {
        await completeOnboarding();
        goto("/dashboard");
    }

    async function completeOnboarding() {
        if (isCompleting) return;
        isCompleting = true;

        // Update context store with collected data
        contextStore.setRole(onboardingFlowStore.data.role);
        contextStore.setEmotionalContext(
            onboardingFlowStore.data.emotionalContext,
        );
        if (onboardingFlowStore.data.deceasedName) {
            contextStore.setDeceasedName(onboardingFlowStore.data.deceasedName);
        }

        // Mark onboarding complete in preference store
        preferenceStore.setOnboardingComplete(true);

        // Mark complete in flow store (persists to backend)
        await onboardingFlowStore.complete();
    }

    function goBack() {
        onboardingFlowStore.previousStep();
    }
</script>

<div class="space-y-8" in:fade={{ duration: 400 }}>
    <div class="text-center space-y-4">
        <div
            class="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 mb-2"
        >
            <Sparkles size={32} />
        </div>
        <h2 class="text-2xl md:text-3xl font-serif font-bold text-white">
            You're all set
        </h2>
        <p class="text-slate-300 max-w-md mx-auto text-lg">
            {personalizedMessage}
        </p>
    </div>

    <div
        class="max-w-lg mx-auto space-y-4"
        in:fly={{ y: 20, duration: 400, delay: 100 }}
    >
        <!-- Summary of choices -->
        <div
            class="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3"
        >
            <h3
                class="text-sm font-medium text-slate-400 uppercase tracking-wider"
            >
                Your setup
            </h3>
            <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                    <span class="text-slate-400">Role</span>
                    <span class="text-white capitalize"
                        >{onboardingFlowStore.data.role.replace("_", " ")}</span
                    >
                </div>
                {#if onboardingFlowStore.data.emotionalContext}
                    <div class="flex justify-between">
                        <span class="text-slate-400">Situation</span>
                        <span class="text-white capitalize"
                            >{onboardingFlowStore.data.emotionalContext}</span
                        >
                    </div>
                {/if}
                {#if onboardingFlowStore.data.deceasedName}
                    <div class="flex justify-between">
                        <span class="text-slate-400">Honoring</span>
                        <span class="text-white"
                            >{onboardingFlowStore.data.deceasedName}</span
                        >
                    </div>
                {/if}
            </div>
        </div>

        <p class="text-center text-slate-400 text-sm py-2">
            How would you like to begin?
        </p>

        <!-- Choice cards -->
        <div class="grid gap-3">
            <button
                onclick={startWithConcierge}
                disabled={isCompleting}
                class="group relative p-5 bg-indigo-600/20 border-2 border-indigo-500/50 rounded-2xl text-left hover:bg-indigo-600/30 transition-all disabled:opacity-70"
            >
                <div class="flex items-start gap-4">
                    <div
                        class="p-2.5 bg-indigo-500 rounded-xl text-white shrink-0"
                    >
                        <MessageCircle size={22} />
                    </div>
                    <div class="space-y-1">
                        <h3
                            class="font-medium text-white flex items-center gap-2"
                        >
                            Start with AI Guide
                            <span
                                class="text-xs bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full"
                                >Recommended</span
                            >
                        </h3>
                        <p class="text-sm text-slate-400">
                            Have a conversation to gently capture your important
                            information.
                        </p>
                    </div>
                </div>
            </button>

            <button
                onclick={startWithDashboard}
                disabled={isCompleting}
                class="group p-5 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/10 transition-all disabled:opacity-70"
            >
                <div class="flex items-start gap-4">
                    <div
                        class="p-2.5 bg-slate-700 rounded-xl text-slate-300 shrink-0 group-hover:bg-slate-600"
                    >
                        <LayoutGrid size={22} />
                    </div>
                    <div class="space-y-1">
                        <h3 class="font-medium text-white">
                            Explore on my own
                        </h3>
                        <p class="text-sm text-slate-400">
                            Go to the dashboard and browse modules at your own
                            pace.
                        </p>
                    </div>
                </div>
            </button>
        </div>
    </div>

    <div class="flex justify-start max-w-lg mx-auto pt-2">
        <button
            onclick={goBack}
            disabled={isCompleting}
            class="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
        >
            <ArrowLeft size={16} />
            <span>Back</span>
        </button>
    </div>
</div>
