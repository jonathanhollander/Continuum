<script lang="ts">
    import {
        ArrowRight,
        Check,
        ArrowLeft,
        ThumbsUp,
        ThumbsDown,
    } from "lucide-svelte";
    import { fade, fly } from "svelte/transition";
    import { createEventDispatcher } from "svelte";
    import { t } from "$lib/stores/localization";
    let {
        steps = [],
        oncomplete,
        onanswer,
    } = $props<{
        steps: {
            id: string;
            question: string;
            placeholder?: string;
            type?: "text" | "textarea" | "select" | "boolean";
            options?: string[];
            required?: boolean;
            logic?: {
                yes?: string;
                no?: string;
                next?: string;
            };
        }[];
        oncomplete?: (answers: Record<string, any>) => void;
        onanswer?: (detail: { id: string; value: any }) => void;
    }>();

    const dispatch = createEventDispatcher<{
        answer: { id: string; value: any };
    }>();

    let currentStepIndex = $state(0);
    let answers = $state<Record<string, any>>({});
    let currentInput = $state<any>("");

    const currentStep = $derived(steps[currentStepIndex]);
    const progress = $derived(((currentStepIndex + 1) / steps.length) * 100);

    function nextStep() {
        if (
            currentStep.required &&
            (currentInput === "" || currentInput === null)
        )
            return;

        // Track History before moving (unless it's just a validation failure)
        // But wait, if validation fails we return. So we should record only if we proceed?
        // The original code wrapped it, so it recorded history *before* calling originalNext.
        // But originalNext had the validation check at the top.
        // So it recorded history even if validation failed?
        // No, if validation failed, originalNext returned early.
        // But the history push happened *before* calling originalNext.
        // So it pushed current index even if we didn't move? That seems like a bug in the original code too.
        // Let's assume we want to push history only if we are actually moving.

        // However, to be safe and strictly follow the "fix crash" goal, let's put it where it executes.

        recordHistory();

        // Save Answer
        answers[currentStep.id] = currentInput;
        onanswer?.({ id: currentStep.id, value: currentInput });
        dispatch("answer", { id: currentStep.id, value: currentInput });

        // Logic Implementation
        let nextId = null;

        if (currentStep.logic) {
            if (currentStep.type === "boolean") {
                if (currentInput === true && currentStep.logic.yes)
                    nextId = currentStep.logic.yes;
                else if (currentInput === false && currentStep.logic.no)
                    nextId = currentStep.logic.no;
            }

            if (!nextId && currentStep.logic.next) {
                nextId = currentStep.logic.next;
            }
        }

        // Navigate
        if (nextId) {
            // A step that leads back to itself (financial-accounts' last step) ends the flow.
            if (nextId === "EXIT" || nextId === currentStep.id) {
                complete();
                return;
            }
            const nextIndex = steps.findIndex((s: any) => s.id === nextId);
            if (nextIndex !== -1) {
                currentStepIndex = nextIndex;
                restoreInput();
                return;
            }
        }

        // Fallback: Linear
        if (currentStepIndex < steps.length - 1) {
            currentStepIndex++;
            restoreInput();
        } else {
            complete();
        }
    }

    function restoreInput() {
        currentInput =
            answers[steps[currentStepIndex].id] !== undefined
                ? answers[steps[currentStepIndex].id]
                : "";
    }

    function prevStep() {
        // Simple history stack could be better, but for now simple decrement/linear back is tricky with branching.
        // We will assume linear back for safety or find previous index.
        // Ideally we track history.
        if (historyStack.length > 0) {
            currentStepIndex = historyStack.pop()!;
            restoreInput();
        } else if (currentStepIndex > 0) {
            currentStepIndex--;
            restoreInput();
        }
    }

    let historyStack: number[] = [];

    // Wrap nextStep to track history
    // NOTE: Refactored to avoid function reassignment which breaks Svelte 5 hydration

    function recordHistory() {
        historyStack.push(currentStepIndex);
    }

    function complete() {
        oncomplete?.({ ...answers });
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            nextStep();
        }
    }
</script>

<div
    class="w-full h-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-muted rounded-2xl border border-border relative overflow-hidden"
>
    <!-- Progress Bar -->
    <div class="absolute top-0 left-0 w-full h-2 bg-border">
        <div
            class="h-full bg-primary transition-all duration-500"
            style="width: {progress}%"
        ></div>
    </div>

    <!-- Navigation (Back) -->
    {#if currentStepIndex > 0}
        <button aria-label="Back"
            onclick={prevStep}
            class="absolute top-6 left-6 text-muted-foreground hover:text-foreground transition-colors"
        >
            <ArrowLeft size={24} />
        </button>
    {/if}

    <!-- Question Container -->
    {#key currentStepIndex}
        <div
            in:fly={{ x: 50, duration: 400 }}
            class="max-w-xl w-full space-y-8"
        >
            <h2
                class="font-serif text-3xl md:text-4xl text-foreground font-bold leading-tight"
            >
                {$t(currentStep.question)}
            </h2>

            <!-- Input Area -->
            <div class="relative">
                {#if currentStep.type === "boolean"}
                    <div class="grid grid-cols-2 gap-4">
                        <button
                            class="p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 {currentInput ===
                            true
                                ? 'border-primary bg-primary-soft text-primary-hover'
                                : 'border-border hover:border-primary/40 bg-card text-foreground'}"
                            onclick={() => {
                                currentInput = true;
                                nextStep();
                            }}
                        >
                            <ThumbsUp size={32} />
                            <span class="font-bold text-lg"
                                >{$t("wizard.yes")}</span
                            >
                        </button>
                        <button
                            class="p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 {currentInput ===
                            false
                                ? 'border-primary bg-primary-soft text-primary-hover'
                                : 'border-border hover:border-primary/40 bg-card text-foreground'}"
                            onclick={() => {
                                currentInput = false;
                                nextStep();
                            }}
                        >
                            <ThumbsDown size={32} />
                            <span class="font-bold text-lg"
                                >{$t("wizard.no")}</span
                            >
                        </button>
                    </div>
                {:else if currentStep.type === "textarea"}
                    <!-- Focus moves to this field because the person just chose to add something here. -->
                    <!-- svelte-ignore a11y_autofocus -->
                    <textarea
                        bind:value={currentInput}
                        onkeydown={handleKeydown}
                        placeholder={$t(currentStep.placeholder || "")}
                        class="w-full text-2xl bg-transparent border-b-2 border-border focus:border-primary outline-none py-2 placeholder:text-muted-foreground min-h-[100px] resize-none"
                        autofocus
                    ></textarea>
                {:else if currentStep.type === "select"}
                    <div class="grid grid-cols-1 gap-3">
                        {#each currentStep.options || [] as option}
                            <button
                                class="text-left p-4 rounded-xl border-2 transition-all {currentInput ===
                                option
                                    ? 'border-primary bg-primary-soft text-primary-hover'
                                    : 'border-border hover:border-primary/40 bg-card text-foreground'}"
                                onclick={() => {
                                    currentInput = option;
                                    nextStep();
                                }}
                            >
                                <span class="font-bold text-lg">{option}</span>
                            </button>
                        {/each}
                    </div>
                {:else}
                    <!-- Focus moves to this field because the person just chose to add something here. -->
                    <!-- svelte-ignore a11y_autofocus -->
                    <input
                        type="text"
                        bind:value={currentInput}
                        onkeydown={handleKeydown}
                        placeholder={$t(currentStep.placeholder || "")}
                        class="w-full text-3xl bg-transparent border-b-2 border-border focus:border-primary outline-none py-2 placeholder:text-muted-foreground"
                        autofocus
                    />
                {/if}
            </div>

            <!-- Action Button (Hidden for Boolean as click auto-advances, but kept for text) -->
            {#if currentStep.type !== "boolean"}
                <div class="pt-4 flex items-center gap-4">
                    <button
                        onclick={nextStep}
                        disabled={currentStep.required && !currentInput}
                        class="px-8 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-xl text-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                    >
                        {#if currentStepIndex === steps.length - 1 && !currentStep.logic}
                            <span>{$t("wizard.finish")}</span>
                            <Check size={20} />
                        {:else}
                            <span>{$t("wizard.next")}</span>
                            <ArrowRight size={20} />
                        {/if}
                    </button>
                    <span
                        class="text-xs text-muted-foreground font-medium uppercase tracking-wider"
                    >
                        Press Enter ↵
                    </span>
                </div>
            {/if}
        </div>
    {/key}
</div>
