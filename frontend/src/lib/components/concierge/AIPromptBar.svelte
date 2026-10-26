<script lang="ts">
    import { slide } from "svelte/transition";
    import { Sparkles, ArrowRight, Loader2, Copy } from "lucide-svelte";
    import { logInteraction } from "$lib/stores/conciergeStore.svelte";
    import { aiConciergeService } from "$lib/services/aiConciergeService";

    export let context:
        | "obituary"
        | "letters"
        | "executor"
        | "heirlooms"
        | "legal_explainer"
        | "contacts"
        | "medical"
        | "pets"
        | "property"
        | "insurance"
        | "digital-guardian"
        | "visual-memories"
        | "financial"
        | "activity-log"
        | "subscriptions"
        | "advanced-registry"
        | "qr-codes"
        | "home-manual"
        | "calendar" = "obituary";
    // A page's own chips replace the context defaults below.
    export let prompts: string[] = [];
    // Page-specific ideas; three are shown at a time and can be reshuffled.
    export let promptPool: string[] = [];

    let prompt = "";
    let isGenerating = false;
    let result = "";
    let isNotice = false; // gentle unavailable message: plain text, no draft framing
    let copyStatus: "" | "copied" | "failed" = "";

    const quickPrompts: Record<string, string[]> = {
        obituary: [
            "Draft a standard obituary based on these notes...",
            "Write a warm, humorous eulogy...",
            "Create a short death notice for the newspaper...",
        ],
        letters: [
            "Help me start a letter to my daughter...",
            "Write a note of forgiveness...",
            "Draft an 'ethical will' listing my values...",
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
        contacts: [
            "Help me organize my emergency contact list...",
            "Draft a message to notify loved ones...",
            "Who should be in my inner circle?",
        ],
        medical: [
            "Explain advance healthcare directives...",
            "Help me document my medical wishes...",
            "What should my healthcare proxy know?",
        ],
        pets: [
            "Help me write care instructions for my pet...",
            "Draft a letter to my pet's future guardian...",
            "What details should I include about my pet?",
        ],
        property: [
            "Help me document property ownership details...",
            "What information do executors need about real estate?",
            "Draft a property description for my records...",
        ],
        insurance: [
            "Help me organize my insurance policies...",
            "What insurance information should I document?",
            "Explain how beneficiaries claim insurance...",
        ],
        "digital-guardian": [
            "Help me document my digital accounts...",
            "What happens to online accounts when I pass?",
            "How do I set up a digital legacy contact?",
        ],
        "visual-memories": [
            "Help me organize my photo archives...",
            "How should I document my memory locations?",
            "Draft notes about my photo collection...",
        ],
        financial: [
            "What should my family know about my accounts?",
            "How do beneficiary designations work on bank accounts?",
            "Help me write a note about where my accounts are held...",
        ],
        "activity-log": [
            "How can a record of changes help my executor?",
            "How often should I revisit my estate plan?",
            "Which life events are a good time to update my plan?",
        ],
        subscriptions: [
            "How can my executor cancel my subscriptions?",
            "What should I record about each subscription?",
            "How do automatic renewals work after someone passes away?",
        ],
        "advanced-registry": [
            "What details belong in a record of a home or car purchase?",
            "Help me plan a yearly home maintenance schedule...",
            "How does an executor follow up on an open insurance claim?",
        ],
        "qr-codes": [
            "Explain how QR access codes work for my estate...",
            "Help me set up secure access for my family...",
            "Where can I keep printed QR codes safe at home?",
        ],
        "home-manual": [
            "Help me document my home's maintenance schedule...",
            "Write instructions for shutting off my home's water, gas and power...",
            "Which home details help my family most?",
        ],
        calendar: [
            "Suggest meaningful ways my family could mark my birthday",
            "What are some unique ways to be remembered on holidays?",
            "Help me write a message for a future anniversary...",
        ],
    };

    function pickIdeas(pool: string[], current: string[] = []): string[] {
        const fresh = pool.filter((p) => !current.includes(p));
        const source = fresh.length >= 3 ? fresh : pool;
        return [...source].sort(() => Math.random() - 0.5).slice(0, 3);
    }

    $: poolIdeas = pickIdeas(promptPool);
    $: chips =
        prompts.length > 0 || promptPool.length > 0
            ? prompts
            : quickPrompts[context] || [];

    async function runPrompt(text: string) {
        prompt = text;
        isGenerating = true;
        copyStatus = "";
        logInteraction("AI Prompt", `Context: ${context} | Prompt: ${text}`);

        try {
            // chat() never throws; on failure it sets `failed` and returns a gentle notice.
            const response = await aiConciergeService.chat(text, [], context);
            isNotice = response.failed === true;
            result = isNotice
                ? response.content
                : `[Draft based on: "${text}"]\n\n${response.content}`;
        } finally {
            isGenerating = false;
        }
    }

    async function copyResult() {
        try {
            await navigator.clipboard.writeText(result);
            copyStatus = "copied";
            logInteraction("AI Copy", context);
        } catch {
            copyStatus = "failed";
        }
    }
</script>

<div
    class="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20 p-6 my-8"
>
    <div class="flex items-center gap-2 mb-4 text-primary font-bold">
        <Sparkles size={18} class="text-primary" />
        <span>Concierge Drafting Assistant</span>
    </div>

    <!-- Input Area -->
    <div class="relative">
        <input
            type="text"
            bind:value={prompt}
            aria-label="Ask the Concierge Drafting Assistant"
            placeholder="Ask me to draft, summarize, or explain..."
            class="w-full p-4 pr-14 rounded-xl border transition-all shadow-sm border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary"
            on:keydown={(e) => e.key === "Enter" && runPrompt(prompt)}
        />

        <div class="absolute right-2 top-2 flex gap-1">
            <!-- Send Button -->
            <button
                class="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
                disabled={!prompt || isGenerating}
                aria-label="Send to the assistant"
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
            {#each chips as qp}
                <button
                    class="px-3 py-1.5 bg-white text-xs font-medium text-primary-700 rounded-full border border-primary-100 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                    on:click={() => runPrompt(qp)}
                >
                    {qp}
                </button>
            {/each}
            {#each poolIdeas as idea}
                <button
                    class="px-3 py-1.5 bg-white text-xs font-medium text-primary-700 rounded-full border border-primary-100 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                    on:click={() => runPrompt(idea)}
                >
                    {idea}
                </button>
            {/each}
            {#if promptPool.length > 3}
                <button
                    class="px-3 py-1.5 text-xs text-primary-400 hover:text-primary-600 hover:underline"
                    on:click={() => (poolIdeas = pickIdeas(promptPool, poolIdeas))}
                >
                    Show other ideas
                </button>
            {/if}
        </div>
    {/if}

    <!-- Result Area -->
    {#if result}
        <div
            class="mt-4 bg-white rounded-xl p-4 border border-primary-100 shadow-sm relative group"
            transition:slide
        >
            <div
                class="text-sm text-gray-700 whitespace-pre-wrap {isNotice ? '' : 'font-mono'}"
            >
                {result}
            </div>
            {#if !isNotice}
                <button
                    class="absolute top-2 right-2 p-2 bg-gray-100 text-gray-500 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-primary-100 hover:text-primary-600"
                    on:click={copyResult}
                    title="Copy to clipboard"
                    aria-label="Copy to clipboard"
                >
                    <Copy size={16} />
                </button>
                {#if copyStatus}
                    <p class="mt-2 text-xs text-gray-500" role="status">
                        {copyStatus === "copied"
                            ? "Copied."
                            : "We couldn't copy that just now. You can select the text and copy it yourself."}
                    </p>
                {/if}
            {/if}
            <button
                class="block w-full text-center text-xs text-primary-400 mt-4 hover:text-primary-600 hover:underline"
                on:click={() => {
                    result = "";
                    copyStatus = "";
                }}
            >
                Start Over
            </button>
        </div>
    {/if}
</div>
