<script lang="ts">
    import { onMount } from "svelte";
    import { conciergeEngine } from "$lib/stores/conciergeEngine";
    import { fade, fly } from "svelte/transition";
    import { Sparkles, ArrowRight, ShieldCheck } from "lucide-svelte";
    import logo from "$lib/assets/logo.png";
    import { accessibilityStore } from "$lib/stores/accessibilityStore";

    // Accessibility scale
    $: fontSizeClass =
        $accessibilityStore.fontSize === "normal"
            ? "text-lg"
            : $accessibilityStore.fontSize === "large"
              ? "text-xl"
              : $accessibilityStore.fontSize === "xlarge"
                ? "text-2xl"
                : "text-3xl";

    onMount(() => {
        // Concierge is opened via explicit user action now
    });
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
        {#if !$conciergeEngine.isOpen}
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
                    >Initializing AI Concierge</span
                >
            </div>
        {:else}
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
                        <h3 class="text-white font-bold">Privacy First</h3>
                        <p class="text-sm text-slate-400">
                            Your sensitive data is encrypted locally. I never
                            see your actual account numbers.
                        </p>
                    </div>
                </div>

                <div class="flex flex-col gap-4">
                    <button
                        on:click={() => conciergeEngine.open()}
                        class="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20"
                    >
                        <span>Start Talking</span>
                        <ArrowRight size={24} />
                    </button>

                    <a
                        href="/"
                        class="text-sm font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                    >
                        I'd like to look around first
                    </a>
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
