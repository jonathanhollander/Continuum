<script lang="ts">
    import { onMount } from "svelte";
    import { fade, fly } from "svelte/transition";
    import { goto } from "$app/navigation";
    import {
        Sparkles,
        MessageCircle,
        LayoutGrid,
        ArrowRight,
        Check,
    } from "lucide-svelte";
    import logo from "$lib/assets/logo.png";
    import { auth } from "$lib/stores/auth";
    import { preferenceStore } from "$lib/stores/preferenceStore";
    import { conciergeEngine } from "$lib/stores/conciergeEngine";
    import { API_BASE_URL } from "$lib/config";

    // Flow states
    let ready = $state(false);
    let displayName = $state("");
    let nameSubmitted = $state(false);
    let isCompleting = $state(false);

    // Input ref for auto-focus
    let nameInputRef: HTMLInputElement | undefined = $state();

    // Redirect if not authenticated or already completed onboarding
    onMount(() => {
        if (!$auth.isAuthenticated) {
            goto("/login");
            return;
        }

        // Check if already completed from backend
        checkOnboardingStatus();
    });

    async function checkOnboardingStatus() {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/auth/onboarding`,
                {
                    headers: {
                        Authorization: `Bearer ${$auth.token}`,
                    },
                },
            );

            if (response.ok) {
                const data = await response.json();
                if (data.onboarding_completed) {
                    preferenceStore.setOnboardingComplete(true);
                    goto("/dashboard");
                    return;
                }
                // Pre-fill name if exists
                if (data.display_name) {
                    displayName = data.display_name;
                }
            }
        } catch (e) {
            console.warn("Failed to check onboarding status:", e);
        }

        // Short delay for smooth entrance
        setTimeout(() => {
            ready = true;
            // Focus the input after it appears
            setTimeout(() => {
                nameInputRef?.focus();
            }, 500);
        }, 300);
    }

    function handleNameSubmit() {
        if (displayName.trim().length > 0) {
            nameSubmitted = true;
        }
    }

    function handleNameKeydown(event: KeyboardEvent) {
        if (event.key === "Enter" && displayName.trim().length > 0) {
            handleNameSubmit();
        }
    }

    async function completeOnboarding(startWithAI: boolean) {
        if (isCompleting) return;
        isCompleting = true;

        try {
            // Persist to backend
            await fetch(`${API_BASE_URL}/api/auth/onboarding`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${$auth.token}`,
                },
                body: JSON.stringify({
                    display_name: displayName.trim(),
                    onboarding_step: "complete",
                    onboarding_completed: true,
                }),
            });

            // Mark complete in preference store (localStorage)
            preferenceStore.setOnboardingComplete(true);

            // Clear any old onboarding state from localStorage
            localStorage.removeItem("continuum_onboarding_flow");

            // Both paths go to contacts - AI option also opens the concierge
            if (startWithAI) {
                conciergeEngine.open();
            }
            goto("/modules/contacts");
        } catch (e) {
            console.error("Failed to complete onboarding:", e);
            isCompleting = false;
        }
    }

    // Computed
    let nameIsValid = $derived(displayName.trim().length > 0);
</script>

<svelte:head>
    <title>Welcome to Continuum</title>
</svelte:head>

<div class="min-h-screen bg-slate-900 flex flex-col relative overflow-hidden">
    <!-- Ambient Background -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div
            class="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"
        ></div>
        <div
            class="absolute -bottom-24 -right-24 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl"
        ></div>
        <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl"
        ></div>
    </div>

    <!-- Header -->
    <header class="relative z-10 p-6 flex items-center justify-between">
        <img src={logo} alt="Continuum" class="h-8 w-auto opacity-80" />
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex items-center justify-center p-6 relative z-10">
        {#if ready}
            <div class="w-full max-w-xl" in:fade={{ duration: 400 }}>
                <!-- Welcome & Name Section -->
                <div class="text-center space-y-6">
                    <div
                        class="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30"
                    >
                        <Sparkles size={32} />
                    </div>

                    <div class="space-y-3">
                        <h1
                            class="text-3xl md:text-4xl font-serif font-bold text-white"
                        >
                            Welcome to Continuum
                        </h1>
                        <p class="text-slate-400 text-lg max-w-md mx-auto">
                            A gentle space to organize what matters most for the
                            people you love.
                        </p>
                    </div>

                    <!-- Name Input Section -->
                    <div
                        class="pt-4 space-y-4 max-w-sm mx-auto"
                        in:fly={{ y: 20, duration: 400, delay: 200 }}
                    >
                        <div class="space-y-2">
                            <label
                                for="name-input"
                                class="block text-sm text-slate-400 text-left"
                            >
                                What should we call you?
                            </label>
                            <input
                                id="name-input"
                                bind:this={nameInputRef}
                                type="text"
                                bind:value={displayName}
                                onkeydown={handleNameKeydown}
                                placeholder="Your first name"
                                disabled={nameSubmitted}
                                class="w-full px-5 py-4 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-slate-500 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                        </div>

                        {#if !nameSubmitted}
                            <button
                                onclick={handleNameSubmit}
                                disabled={!nameIsValid}
                                class="w-full group flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                            >
                                <span>Continue</span>
                                <ArrowRight
                                    size={18}
                                    class="group-hover:translate-x-1 transition-transform"
                                />
                            </button>
                        {:else}
                            <!-- Confirmed state -->
                            <div
                                class="flex items-center justify-center gap-2 text-emerald-400 py-2"
                                in:fade={{ duration: 200 }}
                            >
                                <Check size={18} />
                                <span class="text-sm"
                                    >Nice to meet you, {displayName}!</span
                                >
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Path Choice Section - appears after name -->
                {#if nameSubmitted}
                    <div
                        class="mt-12 space-y-6"
                        in:fly={{ y: 30, duration: 400, delay: 100 }}
                    >
                        <div class="text-center">
                            <h2 class="text-xl font-medium text-white">
                                How would you like to get started?
                            </h2>
                            <p class="text-slate-400 text-sm mt-1">
                                Choose whichever feels right - you can always
                                change your approach.
                            </p>
                        </div>

                        <div class="grid gap-4">
                            <!-- AI Guide Option -->
                            <button
                                onclick={() => completeOnboarding(true)}
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
                                            Guide me through it
                                            <span
                                                class="text-xs bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full"
                                                >Recommended</span
                                            >
                                        </h3>
                                        <p class="text-sm text-slate-400">
                                            Have a friendly conversation to
                                            capture your important information
                                            step by step.
                                        </p>
                                    </div>
                                </div>
                            </button>

                            <!-- Explore Option -->
                            <button
                                onclick={() => completeOnboarding(false)}
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
                                            I'll explore on my own
                                        </h3>
                                        <p class="text-sm text-slate-400">
                                            Start with your contacts and explore
                                            the modules at your own pace.
                                        </p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                {/if}
            </div>
        {:else}
            <!-- Loading state -->
            <div class="flex flex-col items-center gap-4">
                <div class="flex gap-2">
                    <div
                        class="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                        style="animation-delay: 0s"
                    ></div>
                    <div
                        class="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                        style="animation-delay: 0.1s"
                    ></div>
                    <div
                        class="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                        style="animation-delay: 0.2s"
                    ></div>
                </div>
            </div>
        {/if}
    </main>

    <!-- Footer -->
    <footer class="relative z-10 p-6 text-center">
        <div
            class="flex items-center justify-center gap-2 text-white/20 text-[10px] font-bold uppercase tracking-[0.3em]"
        >
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
