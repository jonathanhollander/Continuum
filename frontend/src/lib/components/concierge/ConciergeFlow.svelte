<script lang="ts">
    import { ArrowRight, Check, ArrowLeft } from "lucide-svelte";
    import { fade, fly } from "svelte/transition";
    import { createEventDispatcher } from "svelte";

    export let steps: {
        id: string;
        question: string;
        placeholder?: string;
        type?: "text" | "textarea" | "select";
        options?: string[]; // for Select
        required?: boolean;
    }[] = [];

    const dispatch = createEventDispatcher();

    let currentStepIndex = 0;
    let answers: Record<string, any> = {};
    let currentInput = "";

    $: currentStep = steps[currentStepIndex];
    $: progress = (currentStepIndex / steps.length) * 100;

    function nextStep() {
        if (currentStep.required && !currentInput) return;

        // Save Answer
        answers[currentStep.id] = currentInput;
        dispatch("answer", { id: currentStep.id, value: currentInput });

        // Move On
        if (currentStepIndex < steps.length - 1) {
            currentStepIndex++;
            currentInput = answers[steps[currentStepIndex].id] || ""; // Restore if navigating back
        } else {
            complete();
        }
    }

    function prevStep() {
        if (currentStepIndex > 0) {
            currentStepIndex--;
            currentInput = answers[steps[currentStepIndex].id] || "";
        }
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
                {currentStep.question}
            </h2>

            <!-- Input Area -->
            <div class="relative">
                {#if currentStep.type === "textarea"}
                    <textarea
                        bind:value={currentInput}
                        on:keydown={handleKeydown}
                        placeholder={currentStep.placeholder}
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
                        placeholder={currentStep.placeholder}
                        class="w-full text-3xl bg-transparent border-b-2 border-slate-200 focus:border-indigo-500 outline-none py-2 placeholder:text-slate-300"
                        autofocus
                    />
                {/if}
            </div>

            <!-- Action Button -->
            <div class="pt-4 flex items-center gap-4">
                <button
                    on:click={nextStep}
                    disabled={currentStep.required && !currentInput}
                    class="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
                >
                    {#if currentStepIndex === steps.length - 1}
                        <span>Finish</span>
                        <Check size={20} />
                    {:else}
                        <span>Next</span>
                        <ArrowRight size={20} />
                    {/if}
                </button>
                <span
                    class="text-xs text-slate-400 font-medium uppercase tracking-wider"
                >
                    Press Enter ↵
                </span>
            </div>
        </div>
    {/key}
</div>
