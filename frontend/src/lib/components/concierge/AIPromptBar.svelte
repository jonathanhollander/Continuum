<script lang="ts">
    import { slide } from "svelte/transition";
    import { onMount, onDestroy } from "svelte";
    import { Sparkles, ArrowRight, Loader2, Copy } from "lucide-svelte";
    import { logInteraction } from "$lib/stores/conciergeStore.svelte";
    import { auth } from "$lib/stores/auth";
    import { aiConciergeService } from "$lib/services/aiConciergeService";
    import { aiRuntimeAssets, aiAssets, assetStrings, observeAIConfig, currentAIJob, aiJobChanges, type AIModuleVariant, type AIWritingJob, type AIHistoryMessage } from "$lib/services/aiCapabilities";
    import { captureSession, isCurrentSession } from "$lib/services/sessionOwnership";

    export let context: AIModuleVariant = "obituary";
    export let promptSource = "";
    export let promptPoolSource = "";
    export let job: AIWritingJob | undefined = undefined;
    let prompt = "";
    let isGenerating = false;
    let result = "";
    let isNotice = false;
    let copyStatus: "" | "copied" | "failed" = "";
    let history: AIHistoryMessage[] = [];
    let workingDraft = "";
    let owner = captureSession();
    let identity = "";
    let sequence = 0;
    let alive = true;
    let poolIdeas: string[] = [];
    const currentJob = () => job ?? currentAIJob();
    const jobKey = () => JSON.stringify([context, typeof location === 'undefined' ? '' : location.pathname, currentJob()?.job_id ?? '']);
    function followJob() {
        const key = jobKey();
        if (key === identity && isCurrentSession(owner)) return;
        identity = key;
        owner = captureSession();
        sequence++;
        history = [];
        workingDraft = result = prompt = "";
        isGenerating = false;
        copyStatus = "";
    }
    $: { $aiJobChanges; if (typeof window !== 'undefined' && (context || job)) followJob(); }
    onMount(() => {
        const stopAuth = auth.subscribe(followJob);
        const stopConfig = observeAIConfig({ purpose: 'concierge.module_prompt', variant: context });
        return () => { stopAuth(); stopConfig(); };
    });
    onDestroy(() => { alive = false; sequence++; });
    $: assets = aiAssets({purpose:'concierge.module_prompt',variant:context}, $aiRuntimeAssets);
    $: chips = promptPoolSource ? [] : assetStrings(promptSource ? assets[promptSource] : (assets['lib/components/concierge/AIPromptBar.svelte:quickPrompts'] as Record<string, unknown> | undefined)?.[context]);
    $: pool = assetStrings(promptPoolSource ? assets[promptPoolSource] : []);
    $: poolIdeas = pickIdeas(pool);
    function pickIdeas(values: string[], current: string[] = []): string[] {
        const fresh = values.filter((p) => !current.includes(p));
        return [...(fresh.length >= 3 ? fresh : values)].sort(() => Math.random() - 0.5).slice(0, 3);
    }
    async function runPrompt(text: string) {
        followJob();
        if (isGenerating || !text.trim() || !isCurrentSession(owner)) return;
        const startedBy = owner, key = identity, version = ++sequence;
        const record = currentJob();
        const fingerprint = JSON.stringify(record);
        prompt = text;
        isGenerating = true;
        copyStatus = "";
        logInteraction("AI Prompt", `Context: ${context} | Prompt: ${text}`);
        const current: AIWritingJob = { ...record, job_id: record?.job_id ?? key,
            job_brief: record?.job_brief ?? history.find((m) => m.role === 'user')?.content ?? text,
            current_draft: workingDraft || record?.current_draft || "",
            current_draft_source: workingDraft ? 'proposed' : 'edited' };
        try {
            const response = await aiConciergeService.modulePrompt(text, context, history, current);
            if (!alive || version !== sequence || key !== jobKey() || !isCurrentSession(startedBy) || fingerprint !== JSON.stringify(currentJob())) return;
            isNotice = response.failed === true;
            result = isNotice ? response.content : `[Draft based on: "${text}"]\n\n${response.content}`;
            if (!response.failed) {
                history = [...history, { role: 'user', content: text, source: 'user' }, { role: 'assistant', content: response.historyContent ?? response.content, source: 'model' }];
                workingDraft = response.content;
            }
        } finally { if (alive && version === sequence && isCurrentSession(startedBy)) isGenerating = false; }
    }
    function startOver() { sequence++; history = []; workingDraft = result = ""; copyStatus = ""; isGenerating = false; }
    async function copyResult() {
        try { await navigator.clipboard.writeText(result); copyStatus = "copied"; logInteraction("AI Copy", context); }
        catch { copyStatus = "failed"; }
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
            class="w-full p-4 pr-14 rounded-xl border transition-all shadow-sm bg-card text-foreground placeholder:text-muted-foreground border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary"
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
                    class="px-3 py-1.5 bg-card text-xs font-medium text-primary-hover rounded-full border border-primary/20 hover:border-primary/40 hover:bg-primary-soft transition-colors"
                    on:click={() => runPrompt(qp)}
                >
                    {qp}
                </button>
            {/each}
            {#each poolIdeas as idea}
                <button
                    class="px-3 py-1.5 bg-card text-xs font-medium text-primary-hover rounded-full border border-primary/20 hover:border-primary/40 hover:bg-primary-soft transition-colors"
                    on:click={() => runPrompt(idea)}
                >
                    {idea}
                </button>
            {/each}
            {#if pool.length > 3}
                <button
                    class="px-3 py-1.5 text-xs text-primary-hover hover:underline"
                    on:click={() => (poolIdeas = pickIdeas(pool, poolIdeas))}
                >
                    Show other ideas
                </button>
            {/if}
        </div>
    {/if}

    <!-- Result Area -->
    {#if result}
        <div
            class="mt-4 bg-card rounded-xl p-4 border border-primary/20 shadow-sm relative group"
            transition:slide
        >
            <div
                class="text-sm text-foreground whitespace-pre-wrap {isNotice ? '' : 'font-mono'}"
            >
                {result}
            </div>
            {#if !isNotice}
                <button
                    class="absolute top-2 right-2 p-2 bg-muted text-muted-foreground rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-primary-soft hover:text-primary-hover"
                    on:click={copyResult}
                    title="Copy to clipboard"
                    aria-label="Copy to clipboard"
                >
                    <Copy size={16} />
                </button>
                {#if copyStatus}
                    <p class="mt-2 text-xs text-muted-foreground" role="status">
                        {copyStatus === "copied"
                            ? "Copied."
                            : "Selecting the text will let you copy it yourself."}
                    </p>
                {/if}
            {/if}
            <button
                class="block w-full text-center text-xs text-primary-hover mt-4 hover:underline"
                on:click={startOver}
            >
                Start Over
            </button>
        </div>
    {/if}
</div>
