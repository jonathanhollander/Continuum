<script lang="ts">
    import { slide } from "svelte/transition";
    import { Sparkles, ArrowRight, Loader2, Copy, Mic } from "lucide-svelte";
    import { logInteraction } from "$lib/stores/concierge";

    export let context:
        | "obituary"
        | "letters"
        | "executor"
        | "heirlooms"
        | "legal_explainer" = "obituary";
    export let prompts: string[] = [];
    export let promptPool: string[] = []; // NEW: Dynamic pool support

    let prompt = "";
    let isGenerating = false;
    let isListening = false;
    let result = "";
    let visiblePrompts: string[] = [];

    const quickPrompts = {
        obituary: [
            "Draft a standard obituary based on these notes...",
            "Write a warm, humorous eulogy...",
            "Create a short death notice for the newspaper...",
        ],
        letters: [
            "Help me start a letter to my daughter...",
            "Write a note of forgiveness...",
            "Draft a 'ethical will' listing my values...",
        ],
        executor: [
            "Summarize the immediate next steps...",
            "Draft an email to the bank...",
            "How do I get a death certificate?",
        ],
        heirlooms: [
            "Help me describe why this means so much...",
            "Draft a letter to accompany this gift...",
            "Explain the history of this item...",
        ],
        legal_explainer: [
            "Explain what a Living Will is...",
            "Summarize the role of a Healthcare Proxy...",
            "What is a Power of Attorney?",
        ],
    };

    function shufflePrompts() {
        if (promptPool.length === 0) return;
        // Pick 3 random prompts
        const shuffled = [...promptPool].sort(() => 0.5 - Math.random());
        visiblePrompts = shuffled.slice(0, 3);
    }

    $: if (promptPool.length > 0 && visiblePrompts.length === 0) {
        shufflePrompts();
    }

    function runPrompt(text: string) {
        prompt = text;
        isGenerating = true;
        logInteraction("AI Prompt", `Context: ${context} | Prompt: ${text}`);

        // Simulate AI Delay
        setTimeout(() => {
            isGenerating = false;
            result = `[AI Generated Draft based on: "${text}"]\n\nHere is a draft for you to review. Remember to add your personal touch.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam...`;
        }, 1500);
    }

    function toggleDictation() {
        if (isListening) {
            isListening = false;
            return;
        }

        isListening = true;
        prompt = ""; // Clear current prompt

        // Simulated dictated text
        const simulatedText =
            "Draft a warm letter to my family explaining where I kept the safe deposit box key and that I love them very much.";
        let i = 0;

        const typeInterval = setInterval(() => {
            if (!isListening) {
                clearInterval(typeInterval);
                return;
            }

            prompt += simulatedText.charAt(i);
            i++;

            if (i >= simulatedText.length) {
                clearInterval(typeInterval);
                isListening = false;
            }
        }, 50); // Typing speed
    }

    function copyResult() {
        navigator.clipboard.writeText(result);
        logInteraction("AI Copy", context);
        alert("Copied to clipboard!");
    }
</script>

<div
    class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6 my-8"
>
    <div class="flex items-center gap-2 mb-4 text-indigo-900 font-bold">
        <Sparkles size={18} class="text-indigo-500" />
        <span>Concierge Drafting Assistant</span>
    </div>

    <!-- Input Area -->
    <div class="relative">
        <input
            type="text"
            bind:value={prompt}
            placeholder={isListening
                ? "Listening..."
                : "Ask me to draft, summarize, or explain..."}
            class="w-full p-4 pr-24 rounded-xl border transition-all shadow-sm
            {isListening
                ? 'border-red-400 ring-2 ring-red-100 bg-red-50'
                : 'border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500'}"
            on:keydown={(e) => e.key === "Enter" && runPrompt(prompt)}
            disabled={isListening}
        />

        <div class="absolute right-2 top-2 flex gap-1">
            <!-- Mic Button -->
            <button
                class="p-2 rounded-lg transition-colors {isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}"
                on:click={toggleDictation}
                title="Dictate (Simulation)"
            >
                <Mic size={18} />
            </button>

            <!-- Send Button -->
            <button
                class="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                disabled={!prompt || isGenerating || isListening}
                on:click={() => runPrompt(prompt)}
            >
                {#if isGenerating}
                    <Loader2 size={18} class="animate-spin" />
                {:else}
                    <ArrowRight size={18} />
                {/if}
            </button>
        </div>
    </div>

    <!-- Quick Prompts -->
    {#if !result && !isGenerating}
        <div class="flex flex-wrap gap-2 mt-4" transition:slide>
            {#each [...(quickPrompts[context] || []), ...prompts] as qp}
                <button
                    class="px-3 py-1.5 bg-white text-xs font-medium text-indigo-700 rounded-full border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                    on:click={() => runPrompt(qp)}
                >
                    {qp}
                </button>
            {/each}
        </div>
    {/if}

    <!-- Result Area -->
    {#if result}
        <div
            class="mt-4 bg-white rounded-xl p-4 border border-indigo-100 shadow-sm relative group"
            transition:slide
        >
            <div class="font-mono text-sm text-gray-700 whitespace-pre-wrap">
                {result}
            </div>
            <button
                class="absolute top-2 right-2 p-2 bg-gray-100 text-gray-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-100 hover:text-indigo-600"
                on:click={copyResult}
                title="Copy to Clipboard"
            >
                <Copy size={16} />
            </button>
            <button
                class="block w-full text-center text-xs text-indigo-400 mt-4 hover:text-indigo-600 hover:underline"
                on:click={() => (result = "")}
            >
                Start Over
            </button>
        </div>
    {/if}
</div>
