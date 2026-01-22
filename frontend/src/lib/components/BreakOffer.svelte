<script lang="ts">
    import {
        overwhelmDetector,
        type OverwhelmState,
    } from "$lib/services/overwhelmDetection";
    import { fade, blur, fly } from "svelte/transition";
    import { logger } from "$lib/utils/logger";
    import {
        Heart,
        Pause,
        Minimize2,
        HelpCircle,
        ChevronRight,
    } from "lucide-svelte";
    import { quintOut } from "svelte/easing";

    interface Props {
        signals?: string[];
    }
    let { signals = [] }: Props = $props();

    let showBreakScreen = $state(false);
    let breakDuration = $state(0); // in seconds
    let breakTimer: number | undefined;

    function dismiss() {
        logger.info("User dismissed break offer", { signals });
        overwhelmDetector.reset();
    }

    function takeBreak() {
        logger.info("User accepted full break experience", { signals });
        showBreakScreen = true;
        startBreakTimer();
    }

    function simplifyView() {
        logger.info("User requested simplified view", { signals });
        // In a real implementation, this would enable a "focus mode" that:
        // - Hides optional fields
        // - Shows only the most essential information
        // - Provides step-by-step guidance

        // For now, we'll just reset and log the intent
        overwhelmDetector.reset();
        // TODO: Emit event for parent components to enter simplified mode
        window.dispatchEvent(new CustomEvent("continuum:simplify-view"));
    }

    function getHelp() {
        logger.info("User requested help from overwhelm prompt", { signals });
        overwhelmDetector.reset();
        // Open AI Concierge or help resources
        window.dispatchEvent(new CustomEvent("continuum:request-help"));
    }

    function startBreakTimer() {
        breakDuration = 0;
        breakTimer = window.setInterval(() => {
            breakDuration++;
        }, 1000);
    }

    function endBreak() {
        if (breakTimer) {
            clearInterval(breakTimer);
        }
        logger.info("User ended break", { duration: breakDuration });
        showBreakScreen = false;
        overwhelmDetector.reset();
    }

    // Auto-suggest returning after 3 minutes
    let suggestReturn = $derived(breakDuration >= 180);

    // Format duration as MM:SS
    function formatDuration(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    // Get contextual message based on signals
    function getMessage(): string {
        if (signals.includes("prolonged_heavy_page")) {
            return "You've been on this emotionally challenging page for a while.";
        }
        if (signals.includes("rapid_navigation")) {
            return "We noticed you've been moving through many pages quickly.";
        }
        if (signals.includes("repeated_back_navigation")) {
            return "It looks like you're searching for something.";
        }
        if (signals.includes("repeated_form_abandonment")) {
            return "This section seems to be giving you pause.";
        }
        if (signals.includes("long_session")) {
            return "You've been planning for quite a while today.";
        }
        if (signals.includes("user_requested_break")) {
            return "Taking a moment for yourself is important.";
        }
        return "This work can be emotionally heavy.";
    }
</script>

{#if !showBreakScreen}
    <!-- Initial Overwhelm Intervention Prompt -->
    <div
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        transition:fade={{ duration: 300 }}
        role="dialog"
        aria-labelledby="overwhelm-title"
        aria-describedby="overwhelm-description"
    >
        <div
            class="max-w-lg w-full bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800"
            transition:fly={{ y: 20, duration: 400, easing: quintOut }}
        >
            <!-- Icon -->
            <div
                class="w-16 h-16 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center mx-auto mb-6"
            >
                <Heart class="w-8 h-8" />
            </div>

            <!-- Title -->
            <h2
                id="overwhelm-title"
                class="text-2xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100 text-center"
            >
                Would you like some support?
            </h2>

            <!-- Contextual message -->
            <p
                id="overwhelm-description"
                class="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed text-center"
            >
                {getMessage()}
                <span class="block mt-2 text-sm">
                    Your progress is always saved. It's perfectly okay to pause.
                </span>
            </p>

            <!-- Action buttons -->
            <div class="flex flex-col gap-3">
                <!-- Take a break (full experience) -->
                <button
                    onclick={takeBreak}
                    class="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                    <Pause class="w-5 h-5" />
                    Take a mindful break
                </button>

                <!-- Simplify view -->
                <button
                    onclick={simplifyView}
                    class="w-full py-3.5 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-2xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                    <Minimize2 class="w-5 h-5" />
                    Show me less at once
                </button>

                <!-- Get help -->
                <button
                    onclick={getHelp}
                    class="w-full py-3.5 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-2xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                    <HelpCircle class="w-5 h-5" />
                    I need some guidance
                </button>

                <!-- Dismiss -->
                <button
                    onclick={dismiss}
                    class="w-full py-3 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                >
                    I'm okay to continue
                </button>
            </div>
        </div>
    </div>
{:else}
    <!-- Full Break Experience Screen -->
    <div
        class="fixed inset-0 z-[100] bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 flex items-center justify-center p-6"
        transition:fade={{ duration: 500 }}
    >
        <div class="max-w-md w-full text-center">
            <!-- Breathing circle animation -->
            <div class="mb-12 relative h-40 flex items-center justify-center">
                <div
                    class="absolute w-32 h-32 rounded-full bg-teal-400/20 dark:bg-teal-500/20 animate-ping"
                    style="animation-duration: 4s;"
                ></div>
                <div
                    class="absolute w-24 h-24 rounded-full bg-teal-500/30 dark:bg-teal-400/30 animate-pulse"
                    style="animation-duration: 4s;"
                ></div>
                <div
                    class="w-16 h-16 rounded-full bg-teal-600 dark:bg-teal-500 flex items-center justify-center"
                >
                    <Heart class="w-8 h-8 text-white" />
                </div>
            </div>

            <h2
                class="text-3xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100"
            >
                You're taking a break
            </h2>

            <p class="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
                Breathe slowly. Your work is safe and waiting for you.
            </p>

            <!-- Timer -->
            <div
                class="text-5xl font-light text-teal-600 dark:text-teal-400 mb-12 font-mono"
            >
                {formatDuration(breakDuration)}
            </div>

            {#if suggestReturn}
                <!-- Gentle suggestion to return after 3 minutes -->
                <div
                    class="mb-6 p-4 bg-white/60 dark:bg-zinc-800/60 backdrop-blur rounded-2xl border border-zinc-200 dark:border-zinc-700"
                    transition:fly={{ y: 10, duration: 400 }}
                >
                    <p class="text-sm text-zinc-700 dark:text-zinc-300">
                        Feeling refreshed? You can return when you're ready.
                    </p>
                </div>
            {/if}

            <!-- Return button -->
            <button
                onclick={endBreak}
                class="py-4 px-8 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-medium transition-colors inline-flex items-center gap-2"
            >
                Ready to continue
                <ChevronRight class="w-5 h-5" />
            </button>

            <!-- Optional: Breathing guide -->
            <div class="mt-12 text-sm text-zinc-500 dark:text-zinc-400">
                <p class="italic">
                    Try breathing in for 4 counts, hold for 4, out for 4.
                </p>
            </div>
        </div>
    </div>
{/if}

<style>
    @keyframes breathe {
        0%,
        100% {
            transform: scale(1);
            opacity: 0.6;
        }
        50% {
            transform: scale(1.2);
            opacity: 0.3;
        }
    }
</style>
