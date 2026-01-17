<script lang="ts">
    import { onMount } from "svelte";
    import { conciergeEngine } from "$lib/stores/conciergeEngine";
    import { fade, fly } from "svelte/transition";
    import {
        Sparkles,
        ArrowRight,
        ShieldCheck,
        UserCog,
        BrainCircuit,
    } from "lucide-svelte";
    import logo from "$lib/assets/logo.png";
    import { accessibilityStore } from "$lib/stores/accessibilityStore";
    import { preferenceStore } from "$lib/stores/preferenceStore";
    import { goto } from "$app/navigation";

    // Accessibility scale
    const fontSizeClass = $derived(
        $accessibilityStore.fontSize === "normal"
            ? "text-lg"
            : $accessibilityStore.fontSize === "large"
              ? "text-xl"
              : $accessibilityStore.fontSize === "xlarge"
                ? "text-2xl"
                : "text-3xl",
    );

    let ready = $state(false);

    onMount(() => {
        // Simple boot sequence for visual polish
        setTimeout(() => {
            ready = true;
        }, 1200);
    });

    function startGuided() {
        preferenceStore.setExpertMode(false);
        conciergeEngine.open();
    }

    function startExpert() {
        preferenceStore.setExpertMode(true);
        preferenceStore.setOnboardingComplete(true);
        goto("/dashboard");
    }
</script>

<div
    class="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden"
>
    <!-- Ambient Background -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div
            class="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"
        ></div>
        <div
            class="absolute -bottom-24 -right-24 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl"
        ></div>
    </div>

    <!-- Content -->
    <div
        class="max-w-2xl w-full text-center space-y-12 relative z-10"
        in:fade={{ duration: 1000 }}
    >
        <img src={logo} alt="Continuum Logo" class="h-16 w-auto mx-auto mb-8" />

        <div class="space-y-4">
            <h1
                class="text-4xl md:text-6xl font-serif font-bold text-white leading-tight"
            >
                Secure your legacy, <br />
                <span class="text-indigo-400">one conversation at a time.</span>
            </h1>
            <p
                class="{fontSizeClass} text-slate-400 max-w-lg mx-auto leading-relaxed"
            >
                Welcome to Continuum. I am your AI Concierge, here to guide you
                through protecting your family's future with total privacy.
            </p>
        </div>

        <!-- Initializing Indicator -->
        {#if !ready}
            <div class="flex flex-col items-center gap-4" transition:fade>
                <div class="flex gap-2">
                    <div
                        class="w-3 h-3 rounded-full bg-indigo-500 animate-bounce"
                        style="animation-delay: 0s"
                    ></div>
                    <div
                        class="w-3 h-3 rounded-full bg-indigo-500 animate-bounce"
                        style="animation-delay: 0.1s"
                    ></div>
                    <div
                        class="w-3 h-3 rounded-full bg-indigo-500 animate-bounce"
                        style="animation-delay: 0.2s"
                    ></div>
                </div>
                <span
                    class="text-xs font-bold uppercase tracking-[0.3em] text-indigo-400/60"
                    >System Booting</span
                >
            </div>
        {:else if !$conciergeEngine.isOpen}
            <div
                class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full"
                transition:fly={{ y: 20 }}
            >
                <!-- Guided Choice -->
                <button
                    onclick={startGuided}
                    class="group relative p-8 bg-indigo-600/10 border border-indigo-500/30 rounded-3xl text-left hover:bg-indigo-600/20 transition-all hover:scale-[1.02] active:scale-95 overflow-hidden"
                >
                    <div class="flex flex-col h-full space-y-4 relative z-10">
                        <div
                            class="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/40"
                        >
                            <BrainCircuit size={24} />
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-white">
                                Guided Journey
                            </h3>
                            <p class="text-sm text-slate-400 mt-2">
                                Talk with the AI Concierge to build your estate
                                plan through conversation.
                            </p>
                        </div>
                        <div
                            class="mt-auto flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest pt-4"
                        >
                            <span>Begin Intro</span>
                            <ArrowRight
                                size={14}
                                class="group-hover:translate-x-1 transition-transform"
                            />
                        </div>
                    </div>
                </button>

                <!-- Expert Choice -->
                <button
                    onclick={startExpert}
                    class="group relative p-8 bg-white/5 border border-white/10 rounded-3xl text-left hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-95"
                >
                    <div class="flex flex-col h-full space-y-4">
                        <div
                            class="w-12 h-12 bg-slate-700 rounded-2xl flex items-center justify-center text-slate-300"
                        >
                            <UserCog size={24} />
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-white">
                                Expert Control
                            </h3>
                            <p class="text-sm text-slate-400 mt-2">
                                Bypass the guide and go straight to the
                                Dashboard. Best for returning experts.
                            </p>
                        </div>
                        <div
                            class="mt-auto flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest pt-4 group-hover:text-white transition-colors"
                        >
                            <span>Skip to Dashboard</span>
                            <ArrowRight
                                size={14}
                                class="group-hover:translate-x-1 transition-transform"
                            />
                        </div>
                    </div>
                </button>
            </div>
        {:else}
            <!-- AI Concierge Active States -->
            <div class="space-y-6" transition:fly={{ y: 20 }}>
                <div
                    class="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4 text-left"
                >
                    <div
                        class="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400"
                    >
                        <ShieldCheck size={32} />
                    </div>
                    <div>
                        <h3 class="text-white font-bold">Privacy Secured</h3>
                        <p class="text-sm text-slate-400">
                            Your session is now active. I am ready to document
                            your family and core estate details.
                        </p>
                    </div>
                </div>

                <div class="flex justify-center">
                    <p class="text-slate-500 text-sm italic">
                        The AI Concierge panel is open. Speak or type to begin.
                    </p>
                </div>
            </div>
        {/if}
    </div>

    <!-- Footer Tagline -->
    <div class="absolute bottom-8 left-0 w-full text-center">
        <div
            class="flex items-center justify-center gap-2 text-white/20 text-[10px] font-bold uppercase tracking-[0.4em]"
        >
            <Sparkles size={12} />
            <span>Powered by Continuum EQ</span>
        </div>
    </div>
</div>

<style>
    :global(body) {
        background-color: #0f172a; /* Force dark bg for start page */
    }
</style>
