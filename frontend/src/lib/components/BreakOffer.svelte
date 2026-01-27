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

    import { notifications } from "$lib/stores/notificationStore";

    interface Props {
        signals?: string[];
    }
    let { signals = [] }: Props = $props();

    let showBreakScreen = $state(false);
    let showModal = $state(false);
    let dontShowAgain = $state(false);
    let breakDuration = $state(0); // in seconds
    let breakTimer: number | undefined;

    // Decide whether to show the modal or just a notification
    $effect(() => {
        if (signals.length > 0) {
            const isMajor =
                signals.includes("user_requested_break") ||
                signals.includes("AI_SUGGESTION") ||
                signals.includes("high_error_rate");

            if (isMajor) {
                showModal = true;
            } else {
                // For minor signals like rapid navigation, just show a gentle reminder
                notifications.showInfo(getMessage(), "Mindful Planning Tip");
                // Reset immediately so the notification doesn't repeat per signal update
                overwhelmDetector.reset();
            }
        }
    });

    function dismiss() {
        if (dontShowAgain) {
            overwhelmDetector.mutePermanently();
        } else {
            logger.info("User dismissed break offer", { signals });
            overwhelmDetector.reset();
        }
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

{#if showModal && !showBreakScreen}
    <!-- Initial Overwhelm Intervention Prompt -->
    <div
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        transition:fade={{ duration: 300 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="overwhelm-title"
        aria-describedby="overwhelm-description"
        onkeydown={(e) => e.key === 'Escape' && (showModal = false, dismiss())}
    >
        <div
            class="max-w-lg w-full bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800"
            transition:fly={{ y: 20, duration: 400, easing: quintOut }}
        >
            <!-- Icon -->
            <div
                class="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6"
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
                    type="button"
                    onclick={takeBreak}
                    aria-label="Take a mindful break"
                    class="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-medium transition-colors flex items-center justify-center gap-2 focus-ring"
                >
                    <Pause class="w-5 h-5" />
                    Take a mindful break
                </button>

                <!-- Simplify view -->
                <button
                    type="button"
                    onclick={simplifyView}
                    aria-label="Show me less at once"
                    class="w-full py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-medium transition-colors flex items-center justify-center gap-2 focus-ring"
                >
                    <Minimize2 class="w-5 h-5" />
                    Show me less at once
                </button>

                <!-- Get help -->
                <button
                    type="button"
                    onclick={getHelp}
                    aria-label="I need some guidance"
                    class="w-full py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-medium transition-colors flex items-center justify-center gap-2 focus-ring"
                >
                    <HelpCircle class="w-5 h-5" />
                    I need some guidance
                </button>

                <!-- Dismiss -->
                <button
                    type="button"
                    onclick={() => {
                        showModal = false;
                        dismiss();
                    }}
                    aria-label="Continue without break"
                    class="w-full py-3 text-slate-500 hover:text-slate-700 transition-colors focus-ring rounded-lg"
                >
                    I'm okay to continue
                </button>

                <!-- Do Not Show Again Checkbox -->
                <div class="flex items-center justify-center gap-2 mt-2">
                    <input
                        type="checkbox"
                        id="dont-show-again"
                        bind:checked={dontShowAgain}
                        class="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
                    />
                    <label
                        for="dont-show-again"
                        class="text-xs text-slate-500 cursor-pointer select-none"
                    >
                        Don't show this support again
                    </label>
                </div>
            </div>
        </div>
    </div>
{#if showBreakScreen}
    <!-- Full Break Experience Screen -->
    <div
        class="fixed inset-0 z-[100] bg-gradient-to-br from-primary/5 via-slate-50 to-primary/10 flex items-center justify-center p-6"
        transition:fade={{ duration: 500 }}
        role="dialog"
        aria-modal="true"
        aria-label="Break experience"
    >
        <div class="max-w-md w-full text-center">
            <!-- Breathing circle animation -->
            <div class="mb-12 relative h-40 flex items-center justify-center">
                <div
                    class="absolute w-32 h-32 rounded-full bg-primary/20 animate-ping"
                    style="animation-duration: 4s;"
                ></div>
                <div
                    class="absolute w-24 h-24 rounded-full bg-primary/30 animate-pulse"
                    style="animation-duration: 4s;"
                ></div>
                <div
                    class="w-16 h-16 rounded-full bg-primary flex items-center justify-center"
                >
                    <Heart class="w-8 h-8 text-primary-foreground" />
                </div>
            </div>

            <h2
                class="text-3xl font-semibold mb-4 text-slate-900"
            >
                You're taking a break
            </h2>

            <p class="text-lg text-slate-600 mb-8">
                Breathe slowly. Your work is safe and waiting for you.
            </p>

            <!-- Timer -->
            <div
                class="text-5xl font-light text-primary mb-12 font-mono"
            >
                {formatDuration(breakDuration)}
            </div>

            {#if suggestReturn}
                <!-- Gentle suggestion to return after 3 minutes -->
                <div
                    class="mb-6 p-4 bg-white/60 backdrop-blur rounded-2xl border border-slate-200"
                    transition:fly={{ y: 10, duration: 400 }}
                >
                    <p class="text-sm text-slate-700">
                        Feeling refreshed? You can return when you're ready.
                    </p>
                </div>
            {/if}

            <!-- Return button -->
            <button
                type="button"
                onclick={endBreak}
                aria-label="Ready to continue"
                class="py-4 px-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-medium transition-colors inline-flex items-center gap-2 focus-ring"
            >
                Ready to continue
                <ChevronRight class="w-5 h-5" />
            </button>

            <!-- Optional: Breathing guide -->
            <div class="mt-12 text-sm text-slate-500">
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
