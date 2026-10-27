<script lang="ts">
    import { prepareAIRequest } from '$lib/services/aiConciergeService';
    import type { AICapability, AIInputs, AIHistoryMessage } from '$lib/services/aiCapabilities';
    import { captureSession, isCurrentSession, SessionChangedError } from '$lib/services/sessionOwnership';
    import { previewAIRequest, type AIInputSlot, type AIPreparedRequest, type AIRequestInput } from '$lib/services/aiSettingsService';
    let { purpose, variant, scope, revision, slots, variants, inputText = $bindable(''), lastActual, disabled = false }: {
        purpose: string; variant: string; scope: string; revision: number; slots: AIInputSlot[]; variants: string[];
        inputText: string; lastActual: AIPreparedRequest | null; disabled?: boolean;
    } = $props();
    let result = $state<AIPreparedRequest | null>(null);
    let error = $state('');
    let busy = $state(false);
    let initialized = $state(false);
    let seenRevision = $state<number | null>(null);
    const control = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground';
    const display = (value: unknown) => typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    function sample() {
        const values: Record<string, string | string[] | number> = {
            user_text: 'Make the example passage warmer while keeping its facts.',
            notes: ['We took an example walk together and talked about kindness.'],
            current_draft: 'I remember our walk and the kindness you showed.', current_draft_source: 'edited',
            job_brief: 'Write a personal family memory for Example Son.',
            document_title: 'An example family memory', document_type: 'story',
            recipient_name: 'Example Son', recipient_relationship: 'son',
            source_facts: ['The example walk happened in a local park.'],
            context_name: variant || purpose, user_role: 'owner', emotional_state: 'healthy', warmth: 50,
            job_id: 'synthetic-admin-example'
        };
        return JSON.stringify({ inputs: Object.fromEntries(slots.map(slot => [slot.key, values[slot.key] ?? (slot.options?.[0] ?? (slot.type === 'text_list' ? ['Example fact.'] : slot.type === 'number' ? 50 : 'Example value.'))])),
            history: [{ role: 'user', content: 'Please help me write this example memory.', source: 'user' },
                { role: 'assistant', content: 'Here is an earlier example passage to revise.', source: 'model' }] }, null, 2);
    }
    async function inspect() {
        if (busy || disabled || purpose === 'shared' || (variants.length > 0 && !variant)) return;
        const owner = captureSession(), initiatingScope = scope, initiatingRevision = revision, text = inputText;
        error = ''; busy = true;
        try {
            let parsed: Record<string, unknown>;
            try { parsed = JSON.parse(text); }
            catch { throw new Error('Enter valid JSON. Your example stays here.'); }
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || Object.keys(parsed).some(key => !['inputs', 'history'].includes(key))) throw new Error('Use inputs and history as the two example fields. Your draft stays here.');
            if (!parsed.inputs || typeof parsed.inputs !== 'object' || Array.isArray(parsed.inputs) || !Array.isArray(parsed.history)) throw new Error('Enter an inputs object and a history list. Your example stays here.');
            const body = prepareAIRequest({ purpose, variant } as AICapability, parsed.inputs as AIInputs, parsed.history as AIHistoryMessage[]).body;
            const prepared = await previewAIRequest(body as AIRequestInput, owner);
            if (!isCurrentSession(owner) || scope !== initiatingScope || revision !== initiatingRevision || inputText !== text) return;
            result = prepared;
        } catch (failure) {
            if (isCurrentSession(owner) && scope === initiatingScope && revision === initiatingRevision && inputText === text && !(failure instanceof SessionChangedError)) error = failure instanceof Error ? failure.message : 'Try preparing the request again.';
        } finally {
            if (isCurrentSession(owner) && scope === initiatingScope) busy = false;
        }
    }
    $effect(() => {
        if (!initialized) { if (!inputText) inputText = sample(); initialized = true; }
        if (seenRevision !== revision) { result = null; error = ''; seenRevision = revision; }
    });
</script>

{#snippet preparedView(prepared: AIPreparedRequest)}
    <div class="space-y-4" data-testid="resolved-ai-request">
        <p class="text-sm font-semibold">{prepared.can_send ? 'Prepared for the configured transport' : prepared.limits.exceeded ? 'Prepared · review input limits' : 'Prepared · review transport availability'}</p>
        <p class="text-sm text-muted-foreground">Bifrost or the provider may serialize or convert this request. <a class="text-primary underline" href="https://llm.jch.guru" target="_blank" rel="noreferrer">Bifrost console ↗</a></p>
        <dl class="grid grid-cols-2 gap-x-5 gap-y-2 text-sm rounded-lg bg-background p-4">
<dt class="text-muted-foreground">AI purpose</dt><dd>{prepared.purpose}{prepared.variant ? ` · ${prepared.variant}` : ''}</dd>
            <dt class="text-muted-foreground">Selected model</dt><dd class="font-mono break-all">{prepared.selected_model_id}</dd>
            <dt class="text-muted-foreground">Transport</dt><dd>{prepared.transport}</dd>
            <dt class="text-muted-foreground">Application name</dt><dd>{prepared.application_name}</dd>
            <dt class="text-muted-foreground">Outgoing User-Agent</dt><dd class="font-mono break-all">{prepared.user_agent}</dd>
            <dt class="text-muted-foreground">Model sent</dt><dd class="font-mono break-all">{prepared.request.model}</dd>
            <dt class="text-muted-foreground">Maximum output tokens</dt><dd>{prepared.request.max_tokens}</dd>
            <dt class="text-muted-foreground">Temperature</dt><dd>{prepared.request.temperature ?? 'Provider default'}</dd>
<dt class="text-muted-foreground">Local capture time</dt><dd>{prepared.captured_at ? new Date(prepared.captured_at).toLocaleString() : prepared.attempt_status ? 'Capture time unavailable' : 'Saved-configuration preview'}</dd>
            {#if prepared.attempt_status}<dt class="text-muted-foreground">Request status</dt><dd>{prepared.attempt_status === 'completed' ? 'Provider response received' : 'Attempted · provider receipt unconfirmed'}</dd>{/if}
        </dl>
        <section class="space-y-3" aria-label="Ordered messages">
            <h4 class="font-semibold">Continuum final request · messages in send order</h4>
            {#each prepared.request.messages as message, index}<article class="rounded-lg border border-border p-4"><h5 class="text-sm font-semibold mb-2">{index + 1} · {message.role}</h5><pre class="whitespace-pre-wrap break-words text-sm font-mono">{message.content}</pre></article>{/each}
        </section>
        <details class="rounded-lg border border-border p-3"><summary class="cursor-pointer font-semibold">Configuration sources</summary><dl class="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 text-xs">{#each Object.entries(prepared.sources) as [key, source]}<dt class="break-all">{key}</dt><dd class="break-all text-muted-foreground">{source}</dd>{/each}</dl></details>
        <details class="rounded-lg border border-border p-3"><summary class="cursor-pointer font-semibold">Included inputs · {prepared.included_inputs.length}</summary><dl class="mt-3 space-y-2 text-sm">{#each prepared.included_inputs as input}<dt class="font-semibold">{input.key}</dt><dd><pre class="whitespace-pre-wrap break-words">{display(input.value)}</pre></dd>{/each}</dl></details>
        <details class="rounded-lg border border-border p-3"><summary class="cursor-pointer font-semibold">Omitted inputs · {prepared.omitted_inputs.length}</summary><dl class="mt-3 space-y-2 text-sm">{#each prepared.omitted_inputs as input}<dt class="font-semibold">{input.key}</dt><dd class="text-muted-foreground">{input.reason}</dd>{/each}</dl></details>
        <section class="rounded-lg border border-border p-4 space-y-2 text-sm" aria-label="Request limits"><h4 class="font-semibold">{prepared.limits.exceeded ? 'Review request limits' : 'Within request limits'}</h4><p>Input characters: {prepared.limits.input_chars.toLocaleString()} / {prepared.limits.max_input_chars.toLocaleString()}</p><p>History messages: {prepared.limits.history_messages} / {prepared.limits.max_history_messages ?? 'Full history'}</p><p>Overflow behavior: {prepared.limits.overflow}</p><p>Character counting: {prepared.limits.character_counting}</p>{#each prepared.limits.reasons as reason}<p>{reason}</p>{/each}</section>
        <details class="rounded-lg border border-border p-3"><summary class="cursor-pointer font-semibold">Transport input bounds</summary><dl class="mt-3 space-y-2 text-sm">{#each Object.entries(prepared.limits.transport_limits) as [key, value]}<dt class="font-semibold break-all">{key}</dt><dd><pre class="whitespace-pre-wrap break-words">{display(value)}</pre></dd>{/each}</dl></details>
        <details class="rounded-lg border border-border p-3"><summary class="cursor-pointer font-semibold">Continuum final request JSON</summary><pre class="mt-3 whitespace-pre-wrap break-words font-mono text-xs" data-testid="raw-ai-request">{JSON.stringify(prepared.request, null, 2)}</pre></details>
    </div>
{/snippet}

<div class="space-y-4">
    <details class="rounded-lg border border-border p-4" data-testid="saved-ai-preview" open>
        <summary class="cursor-pointer font-semibold">Preview saved settings with example input</summary>
        <div class="mt-4 space-y-4">
            {#if purpose === 'shared'}<p class="text-sm text-muted-foreground">Choose an AI purpose to preview its saved request.</p>{:else if variants.length && !variant}<p class="text-sm text-muted-foreground">Choose a specific context to preview its saved request.</p>{:else}
            <p class="text-sm text-muted-foreground">The server resolves saved settings using these example values. Save configuration changes before preparing a new preview.</p>
            <label class="block"><span class="block font-semibold text-sm mb-2">Example job and conversation JSON</span><textarea spellcheck="false" autocomplete="off" aria-label="Example job and conversation JSON" class={`${control} font-mono text-sm`} rows="10" bind:value={inputText} oninput={() => { result = null; error = ''; }} disabled={busy || disabled}></textarea></label>
            <div class="flex gap-3"><button type="button" class="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold disabled:opacity-50" onclick={inspect} disabled={busy || disabled}>{busy ? 'Preparing request…' : error ? 'Retry saved preview' : 'Preview saved settings'}</button><button type="button" class="rounded-lg border border-border px-4 py-2 text-sm" disabled={busy || disabled} onclick={() => { inputText = sample(); result = null; error = ''; }}>Use example values</button></div>
            {#if error}<p role="alert" class="whitespace-pre-wrap rounded-lg border border-amber-500/40 p-3 text-sm">{error}</p>{/if}
            <details class="text-sm"><summary class="cursor-pointer text-primary">Allowed input slots</summary><dl class="mt-3 space-y-2">{#each slots as slot}<dt class="font-mono">{slot.key} · {slot.type}</dt><dd class="text-muted-foreground">{slot.label}: {slot.description}{slot.max_length !== undefined ? ` · Maximum length ${slot.max_length}` : ''}{slot.max_items !== undefined ? ` · Maximum items ${slot.max_items}` : ''}{slot.min !== undefined ? ` · Minimum ${slot.min}` : ''}{slot.max !== undefined ? ` · Maximum ${slot.max}` : ''}{slot.options?.length ? ` · Choices: ${slot.options.join(', ')}` : ''}{slot.nullable ? ' · Optional' : ''}</dd>{/each}</dl></details>
            {#if result}{@render preparedView(result)}{/if}
            {/if}
        </div>
    </details>
    <details class="rounded-lg border border-border p-4" data-testid="last-own-ai-request">
        <summary class="cursor-pointer font-semibold">Last actual Continuum request from your session</summary>
        <div class="mt-4">{#if lastActual}{@render preparedView(lastActual)}{:else}<p class="text-sm text-muted-foreground">Run an AI task in your account to inspect its latest request here.</p>{/if}</div>
    </details>
</div>
