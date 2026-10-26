<script lang="ts">
    import { page } from "$app/stores";
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
    import { auth } from "$lib/stores/auth";
    import { keyringEmails } from "$lib/stores/keyringStore";
    import { get } from "svelte/store";

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
    // The marketing CTA's ?email, and ?path (guided | expert) when a visitor
    // returns here from signup or sign-in with the choice they made
    const startParams = new URLSearchParams(window.location.search);
    const handoffEmail = startParams.get("email");
    const chosenPath = startParams.get("path");

    onMount(() => {
        // Ensure concierge is closed on mount so user must choose
        conciergeEngine.close();

        const force = startParams.get("force");
        const delay = force ? 100 : 1200;

        setTimeout(() => {
            ready = true;
        }, delay);
    });

    // Back from signup or sign-in: continue the path chosen before it
    let pathApplied = false;
    $effect(() => {
        if (pathApplied || !chosenPath || !$auth.user) return;
        pathApplied = true;
        if (chosenPath === "guided") startGuided();
        else if (chosenPath === "expert") startExpert();
    });

    // A visitor without a session signs in (an email this browser already
    // knows) or creates an account first; the email from the marketing CTA
    // fills the form, and the chosen path comes back here afterwards.
    function sendToSignInIfNeeded(path: "guided" | "expert"): boolean {
        if ($auth.user || $auth.token) return false;
        const params = new URLSearchParams({ redirect: `/start?path=${path}` });
        if (handoffEmail) params.set("email", handoffEmail);
        const returning = !!handoffEmail && get(keyringEmails).includes(handoffEmail);
        goto(`${returning ? "/login" : "/signup"}?${params}`);
        return true;
    }

    function startGuided() {
        if (sendToSignInIfNeeded("guided")) return;
        preferenceStore.setExpertMode(false);
        conciergeEngine.open();
    }

    function startExpert() {
        if (sendToSignInIfNeeded("expert")) return;
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
            class="absolute -top-24 -left-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"
        ></div>
        <div
            class="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-400/5 rounded-full blur-3xl"
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
                <span class="text-teal-400">one conversation at a time.</span>
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
                        class="w-3 h-3 rounded-full bg-teal-400 animate-bounce"
                        style="animation-delay: 0s"
                    ></div>
                    <div
                        class="w-3 h-3 rounded-full bg-teal-400 animate-bounce"
                        style="animation-delay: 0.1s"
                    ></div>
                    <div
                        class="w-3 h-3 rounded-full bg-teal-400 animate-bounce"
                        style="animation-delay: 0.2s"
                    ></div>
                </div>
                <span
                    class="text-xs font-bold uppercase tracking-[0.3em] text-teal-400/70"
                    >Opening your space</span
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
                    class="group relative p-8 bg-teal-500/10 border border-teal-500/30 rounded-2xl text-left hover:bg-teal-500/20 transition-all hover:scale-[1.02] active:scale-95 overflow-hidden"
                >
                    <div class="flex flex-col h-full space-y-4 relative z-10">
                        <div
                            class="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/40"
                        >
                            <BrainCircuit size={24} />
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-white">
                                AI Guided Journey
                            </h3>
                            <p class="text-sm text-slate-400 mt-2">
                                Talk with the AI Concierge to build your estate
                                plan through conversation.
                            </p>
                        </div>
                        <div
                            class="mt-auto flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-widest pt-4"
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
                    class="group relative p-8 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-95"
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
                                Go straight to your dashboard, if you know
                                your way around.
                            </p>
                        </div>
                        <div
                            class="mt-auto flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest pt-4 group-hover:text-white transition-colors"
                        >
                            <span>Go to my dashboard</span>
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
                    class="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 text-left"
                >
                    <div
                        class="p-3 bg-teal-500/20 rounded-2xl text-teal-400"
                    >
                        <ShieldCheck size={32} />
                    </div>
                    <div>
                        <h3 class="text-white font-bold">Privacy Secured</h3>
                        <p class="text-sm text-slate-400">
                            I'm here whenever you'd like to begin.
                        </p>
                    </div>
                </div>

                <div class="flex justify-center">
                    <p class="text-slate-400 text-sm italic">
                        The AI Concierge panel is open. Speak or type to begin.
                    </p>
                </div>
            </div>
        {/if}
    </div>

    <!-- Footer Tagline -->
    <div class="absolute bottom-8 left-0 w-full text-center">
        <div
            class="flex items-center justify-center gap-2 text-white/60 text-[10px] font-bold uppercase tracking-[0.4em]"
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
