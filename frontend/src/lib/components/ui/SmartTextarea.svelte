<script lang="ts">
    import {
        Sparkles,
        Wand2,
        RefreshCw,
        X,
        Check,
        Lightbulb,
    } from "lucide-svelte";
    import {
        aiDraftText,
        aiSoftenText,
        type WriterContext,
    } from "$lib/services/writerService";
    import { aiRuntimeAssets, aiAssets, assetStrings, observeAIConfig, registerAIJob, notifyAIJobChanged, type AIWritingJob } from "$lib/services/aiCapabilities";
    import { AI_UNAVAILABLE } from "$lib/services/aiConciergeService";
    import { auth } from "$lib/stores/auth";
    import { captureSession, isCurrentSession, type SessionOwnership } from "$lib/services/sessionOwnership";
    import { onDestroy } from "svelte";
    import { fade, slide } from "svelte/transition";

    let {
        value = $bindable(""),
        placeholder = "",
        context = "letter",
        minHeight = "120px",
        label = "",
        hideLabel = false,
        id = undefined,
        suggestions = [],
        minimal = false,
        oninput,
        onchange,
        job,
    } = $props<{
        value?: string;
        placeholder?: string;
        context?: WriterContext;
        minHeight?: string;
        label?: string;
        hideLabel?: boolean;
        id?: string;
        suggestions?: string[];
        minimal?: boolean;
        oninput?: (val: string) => void;
        onchange?: (val: string) => void;
        job?: AIWritingJob;
    }>();

    const ownId = $props.id();
    // A caller-given id lets a label outside this component name the field.
    const fieldId = $derived(id ?? ownId);
    let textareaEl = $state<HTMLTextAreaElement | null>(null);

    let isDrawerOpen = $state(false);
    let mode = $state<"polish" | "draft">("polish");
    let isProcessing = $state(false);

    // The AI's version waits here until the person chooses it; the field changes only then.
    let suggestion = $state<string | null>(null);
    let notice = $state("");

    // Inputs
    let bullets = $state(["", "", ""]);
    let sentimentValue = $state(50);
    let owner = captureSession();
    let requestVersion = 0;
    let suggestionOwner: SessionOwnership | null = null;
    let suggestionSource: string | null = null;

    const currentJob = (): AIWritingJob => ({ ...job, job_id: job?.job_id ?? `${context}:${ownId}`, document_type: job?.document_type ?? context, current_draft: value });
    const sourceFingerprint = () => JSON.stringify([context, mode, value, bullets, sentimentValue, currentJob()]);
    let observedSource = $state("");
    $effect(() => {
        const source = sourceFingerprint();
        if (source !== observedSource) {
            observedSource = source;
            requestVersion++;
            isProcessing = false;
            discardSuggestion();
        }
    });
    $effect(() => observeAIConfig({ purpose: 'writer.rewrite_text', variant: context }));
    let releaseJob: (() => void) | undefined;
    function engageJob() { releaseJob?.(); releaseJob = registerAIJob(currentJob); }
    $effect(() => { sourceFingerprint(); if (releaseJob) notifyAIJobChanged(); });
    function discardSuggestion() {
        suggestionOwner = null;
        suggestionSource = null;
        suggestion = null;
    }
    $effect(() => {
        // An auth transition also invalidates a preview already waiting for acceptance.
        $auth;
        if (!isCurrentSession(owner)) {
            owner = captureSession();
            closeDrawer();
            releaseJob?.(); releaseJob = undefined;
        }
        if (suggestion && suggestionSource !== sourceFingerprint()) discardSuggestion();
    });
    onDestroy(() => { requestVersion++; releaseJob?.(); });

    const assets = $derived(aiAssets({purpose:mode === 'draft' ? 'writer.draft_text' : 'writer.rewrite_text',variant:context}, $aiRuntimeAssets));
    $effect(() => observeAIConfig({ purpose: 'writer.draft_text', variant: context }));
    const activeSuggestions = $derived(
        (suggestions && suggestions.length > 0
            ? suggestions
            : assetStrings((assets["lib/services/writerService.ts:CONTEXT_SUGGESTIONS"] as Record<string, unknown> | undefined)?.[context])) as string[],
    );

    async function handleGenerate() {
        if (isProcessing) return;
        if (mode === "draft" && bullets.every((b) => !b.trim())) return;
        if (mode === "polish" && !value?.trim()) return;

        const startedBy = captureSession();
        if (!isCurrentSession(startedBy)) return;
        const version = ++requestVersion;
        const source = sourceFingerprint();
        isProcessing = true;
        notice = "";
        discardSuggestion();
        try {
            const result =
                mode === "draft"
                    ? await aiDraftText(bullets, context, currentJob())
                    : await aiSoftenText(value, sentimentValue, context, currentJob());
            if (version !== requestVersion || !isCurrentSession(startedBy) || source !== sourceFingerprint()) return;
            if (result) {
                suggestionOwner = startedBy;
                suggestionSource = source;
                suggestion = result;
            }
            else notice = AI_UNAVAILABLE;
        } catch (e) {
            if (version !== requestVersion || !isCurrentSession(startedBy) || source !== sourceFingerprint()) return;
            console.error(e);
            notice = (e as any)?.gentle && e instanceof Error && e.message ? e.message : AI_UNAVAILABLE;
        } finally {
            if (version === requestVersion && isCurrentSession(startedBy)) isProcessing = false;
        }
    }

    function acceptSuggestion() {
        if (suggestion && suggestionOwner && isCurrentSession(suggestionOwner) && suggestionSource === sourceFingerprint()) {
            value = suggestion;
            oninput?.(value);
            onchange?.(value);
            closeDrawer();
        } else discardSuggestion();
    }

    // A starter becomes the opening words of the field; the cursor lands after it.
    function useStarter(starter: string) {
        const suffixes = assets["lib/components/ui/SmartTextarea.svelte:starter_suffixes"] as Record<string, string> | undefined;
        const end = suffixes?.[/[?]$/.test(starter) ? 'question' : /[\p{L}\p{N}]$/u.test(starter) ? 'word' : 'other'] ?? '';
        value = starter + end;
        oninput?.(value);
        onchange?.(value);
        const el = textareaEl;
        if (el) {
            requestAnimationFrame(() => {
                el.focus();
                el.setSelectionRange(el.value.length, el.value.length);
            });
        }
    }

    function closeDrawer() {
        requestVersion++;
        isProcessing = false;
        isDrawerOpen = false;
        discardSuggestion();
        notice = "";
        bullets = ["", "", ""];
        sentimentValue = 50;
    }

    function handleInput() {
        oninput?.(value);
    }

    function handleChange() {
        onchange?.(value);
    }
</script>

<div class="space-y-2 h-full" onfocusin={engageJob}>
    {#if label}
        <label
            for={fieldId}
            class={hideLabel
                ? "sr-only"
                : "block text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"}
            >{label}</label
        >
    {/if}

    <div class="relative group h-full">
        <textarea
            id={fieldId}
            bind:this={textareaEl}
            bind:value
            {placeholder}
            oninput={handleInput}
            onchange={handleChange}
            class="w-full outline-none resize-none transition-all relative z-10 {minimal
                ? 'bg-transparent border-none p-0 focus:ring-0 shadow-none'
                : 'bg-muted border border-border rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:bg-card'}"
            style="min-height: {minHeight}; height: {minimal ? '100%' : 'auto'}"
        ></textarea>

        <!-- Starters while empty: laid over the foot of a minimal (borderless) field, beneath a boxed one -->
        {#if minimal && !value && !isDrawerOpen && activeSuggestions.length > 0}
            <div class="absolute bottom-0 left-0 right-12 z-20">
                {@render starters()}
            </div>
        {/if}

        <!-- Toggle Button -->
        <button
            type="button"
            aria-label="Writing help"
            onclick={() => isDrawerOpen ? closeDrawer() : (isDrawerOpen = true)}
            class="absolute top-3 right-3 z-20 p-2 bg-card/80 backdrop-blur shadow-sm border border-border rounded-xl text-primary hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100 {isDrawerOpen
                ? '!opacity-100 bg-primary !text-primary-foreground'
                : ''}"
        >
            <Sparkles size={16} />
        </button>

        <!-- AI Drawer: in the flow, so the content below moves down rather than being covered -->
        {#if isDrawerOpen}
            <div
                transition:slide
                class="relative z-20 mt-2 bg-card rounded-2xl shadow-xl border border-border overflow-hidden"
            >
                {#if suggestion}
                    <!-- Review State -->
                    <div class="p-6 bg-gold/5">
                        <div
                            class="flex items-center gap-2 mb-4 text-primary-hover font-bold text-xs uppercase tracking-widest"
                        >
                            <Sparkles size={14} /> A version for you to consider
                        </div>

                        <div
                            class="max-h-64 overflow-y-auto whitespace-pre-wrap p-4 bg-card border border-border rounded-xl text-sm leading-relaxed text-foreground italic mb-6 shadow-sm"
                            data-testid="writer-suggestion"
                        >
                            {suggestion}
                        </div>

                        <div class="flex items-center gap-2">
                            <button
                                type="button"
                                onclick={discardSuggestion}
                                class="flex-1 py-2 px-2 whitespace-nowrap bg-card border border-border rounded-lg text-muted-foreground font-bold text-xs hover:bg-muted flex items-center justify-center gap-2"
                            >
                                <X size={14} /> Keep my words
                            </button>
                            <button
                                type="button"
                                onclick={handleGenerate}
                                disabled={isProcessing}
                                class="flex-1 py-2 px-2 whitespace-nowrap bg-card border border-border rounded-lg text-primary font-bold text-xs hover:bg-muted flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={14} /> Try Again
                            </button>
                            <button
                                type="button"
                                onclick={acceptSuggestion}
                                class="flex-1 py-2 px-2 whitespace-nowrap bg-primary text-primary-foreground rounded-lg font-bold text-xs hover:bg-primary-hover flex items-center justify-center gap-2 shadow-sm"
                            >
                                <Check size={14} /> Use this version
                            </button>
                        </div>
                    </div>
                {:else}
                    <!-- Controls State -->
                    <div>
                        <!-- Tabs -->
                        <div class="flex border-b border-border">
                            <button
                                type="button"
                                class="flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors {mode ===
                                'polish'
                                    ? 'bg-gold/10 text-primary-hover'
                                    : 'text-muted-foreground hover:text-foreground'}"
                                onclick={() => (mode = "polish")}
                            >
                                Polish Tone
                            </button>
                            <button
                                type="button"
                                class="flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors {mode ===
                                'draft'
                                    ? 'bg-gold/10 text-primary-hover'
                                    : 'text-muted-foreground hover:text-foreground'}"
                                onclick={() => (mode = "draft")}
                            >
                                Draft from Bullets
                            </button>
                        </div>

                        <div class="p-6 bg-gold/5">
                            {#if mode === "polish"}
                                <div class="space-y-4">
                                    <div
                                        class="flex justify-between text-xs font-bold text-muted-foreground uppercase"
                                    >
                                        <span>Professional</span>
                                        <span>Warm & Human</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        bind:value={sentimentValue}
                                        class="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <button
                                        type="button"
                                        onclick={handleGenerate}
                                        disabled={!value || isProcessing}
                                        class="w-full py-2 bg-card border border-border text-primary rounded-lg font-bold text-xs hover:bg-card/80 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
                                    >
                                        {#if isProcessing}
                                            <RefreshCw
                                                size={14}
                                                class="animate-spin"
                                            /> Refining...
                                        {:else}
                                            <Sparkles size={14} /> Polish this Text
                                        {/if}
                                    </button>
                                </div>
                            {:else}
                                <div class="space-y-3">
                                    {#each bullets as _, i}
                                        <input
                                            type="text"
                                            bind:value={bullets[i]}
                                            class="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary"
                                            placeholder="Fact or memory..."
                                        />
                                    {/each}
                                    <button
                                        type="button"
                                        onclick={handleGenerate}
                                        disabled={isProcessing}
                                        class="w-full py-2 bg-primary text-primary-foreground rounded-lg font-bold text-xs hover:bg-primary-hover disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2"
                                    >
                                        {#if isProcessing}
                                            <RefreshCw
                                                size={14}
                                                class="animate-spin"
                                            /> Writing...
                                        {:else}
                                            <Wand2 size={14} /> Generate Paragraph
                                        {/if}
                                    </button>
                                </div>
                            {/if}
                            {#if notice}
                                <p class="mt-4 text-xs text-muted-foreground" role="status">{notice}</p>
                            {/if}
                        </div>
                    </div>
                {/if}
            </div>
        {/if}
    </div>

    {#if !minimal && !value && !isDrawerOpen && activeSuggestions.length > 0}
        {@render starters()}
    {/if}
</div>

{#snippet starters()}
    <div class="flex flex-wrap gap-2">
        {#each activeSuggestions as sug}
            <button
                type="button"
                class="text-xs font-semibold bg-card border border-border px-2.5 py-1 rounded-md text-primary-hover hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-1"
                onclick={() => useStarter(sug)}
            >
                <Lightbulb size={12} aria-hidden="true" />
                {sug}
            </button>
        {/each}
    </div>
{/snippet}
