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

    export let steps: {
        id: string;
        question: string; // Translation Key
        placeholder?: string;
        type?: "text" | "textarea" | "select" | "boolean";
        options?: string[]; // for Select
        required?: boolean;
        logic?: {
            yes?: string; // ID to jump to
            no?: string; // ID to jump to
            next?: string; // ID to jump to
        };
    }[] = [];

    const dispatch = createEventDispatcher();

    let currentStepIndex = 0;
    let answers: Record<string, any> = {};
    let currentInput: any = "";

    $: currentStep = steps[currentStepIndex];
    $: progress = ((currentStepIndex + 1) / steps.length) * 100;

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
            if (nextId === "EXIT") {
                complete();
                return;
            }
            const nextIndex = steps.findIndex((s) => s.id === nextId);
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
        dispatch("complete", answers);
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            nextStep();
        }
    }
</script>

<div
    class="w-full h-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-slate-50 rounded-3xl border border-slate-200 relative overflow-hidden"
>
    <!-- Progress Bar -->
    <div class="absolute top-0 left-0 w-full h-2 bg-slate-200">
        <div
            class="h-full bg-indigo-500 transition-all duration-500"
            style="width: {progress}%"
        ></div>
    </div>

    <!-- Navigation (Back) -->
    {#if currentStepIndex > 0}
        <button
            on:click={prevStep}
            class="absolute top-6 left-6 text-slate-400 hover:text-slate-600 transition-colors"
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
                class="font-serif text-3xl md:text-4xl text-slate-800 font-bold leading-tight"
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
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-slate-200 hover:border-green-200 bg-white'}"
                            on:click={() => {
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
                                ? 'border-red-500 bg-red-50 text-red-700'
                                : 'border-slate-200 hover:border-red-200 bg-white'}"
                            on:click={() => {
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
                    <textarea
                        bind:value={currentInput}
                        on:keydown={handleKeydown}
                        placeholder={$t(currentStep.placeholder || "")}
                        class="w-full text-2xl bg-transparent border-b-2 border-slate-200 focus:border-indigo-500 outline-none py-2 placeholder:text-slate-300 min-h-[100px] resize-none"
                        autofocus
                    ></textarea>
                {:else if currentStep.type === "select"}
                    <div class="grid grid-cols-1 gap-3">
                        {#each currentStep.options || [] as option}
                            <button
                                class="text-left p-4 rounded-xl border-2 transition-all {currentInput ===
                                option
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                    : 'border-slate-200 hover:border-indigo-200 bg-white'}"
                                on:click={() => {
                                    currentInput = option;
                                    nextStep();
                                }}
                            >
                                <span class="font-bold text-lg">{option}</span>
                            </button>
                        {/each}
                    </div>
                {:else}
                    <input
                        type="text"
                        bind:value={currentInput}
                        on:keydown={handleKeydown}
                        placeholder={$t(currentStep.placeholder || "")}
                        class="w-full text-3xl bg-transparent border-b-2 border-slate-200 focus:border-indigo-500 outline-none py-2 placeholder:text-slate-300"
                        autofocus
                    />
                {/if}
            </div>

            <!-- Action Button (Hidden for Boolean as click auto-advances, but kept for text) -->
            {#if currentStep.type !== "boolean"}
                <div class="pt-4 flex items-center gap-4">
                    <button
                        on:click={nextStep}
                        disabled={currentStep.required && !currentInput}
                        class="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
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
                        class="text-xs text-slate-400 font-medium uppercase tracking-wider"
                    >
                        Press Enter ↵
                    </span>
                </div>
            {/if}
        </div>
    {/key}
</div>
