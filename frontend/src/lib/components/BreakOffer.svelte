<script lang="ts">
    import { focusTrap } from "$lib/actions/focusTrap";
    import {
        overwhelmDetector,
        type OverwhelmState,
    } from "$lib/services/overwhelmDetection";
    import { fade, blur, fly } from "svelte/transition";
    import { logger } from "$lib/utils/logger";
    import {
        Heart,
        Pause,
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

    function closeOffer() {
        showModal = false;
        dismiss();
    }

    function takeBreak() {
        logger.info("User accepted full break experience", { signals });
        showBreakScreen = true;
        startBreakTimer();
    }

    function getHelp() {
        logger.info("User requested help from overwhelm prompt", { signals });
        showModal = false;
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
            return "You've been exploring a lot. A pause is always here for you.";
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
    <div aria-modal="true" use:focusTrap={{ onEscape: closeOffer }}
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        transition:fade={{ duration: 300 }}
        role="dialog"
        aria-labelledby="overwhelm-title"
        aria-describedby="overwhelm-description"
    >
        <div
            class="max-w-lg w-full bg-card rounded-2xl p-8 shadow-2xl border border-border"
            transition:fly={{ y: 20, duration: 400, easing: quintOut }}
        >
            <!-- Icon -->
            <div
                class="w-16 h-16 bg-primary-soft text-primary rounded-full flex items-center justify-center mx-auto mb-6"
            >
                <Heart class="w-8 h-8" />
            </div>

            <!-- Title -->
            <h2
                id="overwhelm-title"
                class="text-2xl font-semibold mb-4 text-foreground text-center"
            >
                Would you like some support?
            </h2>

            <!-- Contextual message -->
            <p
                id="overwhelm-description"
                class="text-muted-foreground mb-8 leading-relaxed text-center"
            >
                {getMessage()}
                <span class="block mt-2 text-sm">
                    It's perfectly okay to pause. You can return when you're ready.
                </span>
            </p>

            <!-- Action buttons -->
            <div class="flex flex-col gap-3">
                <!-- Take a break (full experience) -->
                <button
                    onclick={takeBreak}
                    class="w-full py-3.5 px-4 bg-primary hover:bg-primary-hover text-primary-foreground rounded-2xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                    <Pause class="w-5 h-5" />
                    Take a mindful break
                </button>

                <!-- Get help -->
                <button
                    onclick={getHelp}
                    class="w-full py-3.5 px-4 bg-muted hover:bg-border border border-border text-foreground rounded-2xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                    <HelpCircle class="w-5 h-5" />
                    I need some guidance
                </button>

                <!-- Dismiss -->
                <button
                    onclick={closeOffer}
                    class="w-full py-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                    I'm okay to continue
                </button>

                <!-- Do Not Show Again Checkbox -->
                <div class="flex items-center justify-center gap-2 mt-2">
                    <input
                        type="checkbox"
                        id="dont-show-again"
                        bind:checked={dontShowAgain}
                        class="w-4 h-4 accent-primary border-border rounded focus:ring-primary"
                    />
                    <label
                        for="dont-show-again"
                        class="text-xs text-muted-foreground cursor-pointer select-none"
                    >
                        Hide these notes
                    </label>
                </div>
            </div>
        </div>
    </div>
{:else if showBreakScreen}
    <!-- Full Break Experience Screen -->
    <div role="dialog" aria-modal="true" aria-labelledby="break-title" use:focusTrap={{ onEscape: endBreak }}
        class="fixed inset-0 z-[100] bg-background bg-gradient-to-br from-primary-soft via-background to-primary-soft flex items-center justify-center p-6"
        transition:fade={{ duration: 500 }}
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
                id="break-title"
                class="text-3xl font-semibold mb-4 text-foreground"
            >
                You're taking a break
            </h2>

            <p class="text-lg text-muted-foreground mb-8">
                Breathe slowly. You can return when you're ready.
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
                    class="mb-6 p-4 bg-card rounded-2xl border border-border"
                    transition:fly={{ y: 10, duration: 400 }}
                >
                    <p class="text-sm text-foreground">
                        Feeling refreshed? You can return when you're ready.
                    </p>
                </div>
            {/if}

            <!-- Return button -->
            <button
                onclick={endBreak}
                class="py-4 px-8 bg-primary hover:bg-primary-hover text-primary-foreground rounded-2xl font-medium transition-colors inline-flex items-center gap-2"
            >
                Ready to continue
                <ChevronRight class="w-5 h-5" />
            </button>

            <!-- Optional: Breathing guide -->
            <div class="mt-12 text-sm text-muted-foreground">
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
