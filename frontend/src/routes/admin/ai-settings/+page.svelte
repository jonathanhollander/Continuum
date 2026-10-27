<script lang="ts">
    import { untrack } from 'svelte';
    import { auth } from '$lib/stores/auth';
    import { captureSession, isCurrentSession, SessionChangedError } from '$lib/services/sessionOwnership';
    import { loadAISettings, loadAIModels, saveAISetting, resetAISetting, type AISettings, type AISettingInput, type AIModelCatalogue, type AIPreparedRequest } from '$lib/services/aiSettingsService';
    import { invalidateAIConfig } from '$lib/services/aiCapabilities';
    import { lastAIRequest } from '$lib/services/aiConciergeService';
    import AIConfigurationEditor from '$lib/components/admin/AIConfigurationEditor.svelte';
    import AIRequestPreview from '$lib/components/admin/AIRequestPreview.svelte';
    import ModelSelector from '$lib/components/admin/ModelSelector.svelte';

    // ClaimsChat admin_settings.html (1b7cb5fb): shared instruction, then purpose-specific context.
    // The server supplies the actual purpose/context inventory and saved overrides.
    let settings = $state<AISettings | null>(null);
    let catalogue = $state<AIModelCatalogue>({ status: 'unavailable', models: [], fetched_at: null });
    let views = $state<Record<string, AISettings>>({});
    let buffers = $state<Record<string, { raw: Record<string, string>; errors: Record<string, string> }>>({});
    let examples = $state<Record<string, string>>({});
    let configRevision = $state(0);
    let drafts = $state<Record<string, AISettingInput>>({});
    let notices = $state<Record<string, string>>({});
    let failures = $state<Record<string, boolean>>({});
    let failedReset = $state<Record<string, boolean>>({});
    let purpose = $state('shared');
    let variant = $state('');
    let loading = $state(false);
    let refreshing = $state(false);
    let saving = $state('');
    let loadError = $state('');
    let catalogueError = $state('');
    let account = $state('');
    let loadSequence = 0;
    const isAdmin = $derived($auth.user?.is_admin === true);
    const keyFor = (p: string, v: string) => JSON.stringify([p, v]);
    const currentKey = $derived(keyFor(purpose, variant));
    const definition = $derived(settings?.purposes.find(p => p.id === purpose));
    const draft = $derived(drafts[currentKey]);
    const view = $derived(views[currentKey]);
    const configValid = $derived(!Object.keys(buffers[currentKey]?.errors || {}).length);
    const actualRequest = $derived($lastAIRequest as AIPreparedRequest | null);
    const canonical = (value: unknown) => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
    const saved = $derived(settings && (purpose === 'shared' ? settings.shared : settings.overrides.find(r => r.purpose === purpose && r.variant === variant)));
    const parent = $derived(settings?.overrides.find(r => r.purpose === purpose && r.variant === ''));
    const inheritedModel = $derived(purpose === 'shared' ? settings?.shipped_model_id || '' : variant && parent?.model_id ? parent.effective_model_id : settings?.shared.effective_model_id || '');
    const effectiveModel = $derived(saved?.effective_model_id || inheritedModel);
    const appliedContext = $derived(settings ? [settings.shared.additional_context,
        ...(purpose === 'shared' ? [] : [parent?.additional_context || '', ...(variant ? [saved?.additional_context || ''] : [])])].filter(Boolean).join('\n\n') : '');
    const label = (value: string) => value.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const changed = $derived(!!draft && (draft.model_id !== (saved?.model_id ?? null) || draft.additional_context !== (saved?.additional_context ?? '') || canonical(draft.request_config) !== canonical(view?.selected.request_config || {}) || !configValid));

    function blankDraft(p: string, v: string, source: AISettings): AISettingInput {
        const row = p === 'shared' ? source.shared : source.overrides.find(r => r.purpose === p && r.variant === v);
        return { purpose: p, variant: v, model_id: row?.model_id ?? null, additional_context: row?.additional_context ?? '', request_config: JSON.parse(JSON.stringify(source.selected.request_config)) };
    }
    function choose(p: string, v = '') {
        purpose = p; variant = v;
        loadSequence++; loadError = '';
        if (!views[keyFor(p, v)]) void load(p, v);
        else loading = false;
    }
    async function load(p = purpose, v = variant) {
        const owner = captureSession(), initiatingAccount = account, sequence = ++loadSequence, key = keyFor(p, v);
        loading = true; loadError = '';
        try {
            const value = await loadAISettings(owner, p, v);
            if (!isCurrentSession(owner) || account !== initiatingAccount || sequence !== loadSequence) return;
            settings = value; views[key] = value;
            if (!drafts[key]) drafts[key] = blankDraft(p, v, value);
            if (!buffers[key]) buffers[key] = { raw: {}, errors: {} };
            if (examples[key] === undefined) examples[key] = '';
        } catch (error) {
            if (isCurrentSession(owner) && account === initiatingAccount && sequence === loadSequence && !(error instanceof SessionChangedError)) loadError = error instanceof Error ? error.message : 'Try loading settings again.';
        } finally {
            if (isCurrentSession(owner) && account === initiatingAccount && sequence === loadSequence) loading = false;
        }
    }
    async function refreshModels(refresh = true) {
        if (refreshing) return;
        const owner = captureSession(), initiatingAccount = account;
        refreshing = true; catalogueError = '';
        try {
            const value = await loadAIModels(refresh, owner);
            if (!isCurrentSession(owner) || account !== initiatingAccount) return;
            // A failed catalogue refresh may include the last safe projection. Keep our
            // previous projection too when the response has no rows; drafts never depend on it.
            const retained = value.status !== 'ready' && !value.models.length;
            catalogue = { ...value, models: retained ? catalogue.models : value.models, fetched_at: retained ? catalogue.fetched_at : value.fetched_at };
            if (value.status === 'unavailable') catalogueError = value.message || 'Try refreshing the catalogue again.';
        } catch (error) {
            if (isCurrentSession(owner) && account === initiatingAccount && !(error instanceof SessionChangedError)) {
                catalogue = { ...catalogue, status: 'unavailable' };
                catalogueError = error instanceof Error ? error.message : 'Try refreshing the catalogue again.';
            }
        } finally {
            if (isCurrentSession(owner) && account === initiatingAccount) refreshing = false;
        }
    }
    async function persist(reset = false) {
        if (!draft || saving || !settings || !view || (!reset && !configValid)) return;
        const owner = captureSession(), initiatingAccount = account, key = currentKey;
        const value: AISettingInput = JSON.parse(JSON.stringify(draft));
        saving = key; notices[key] = ''; failures[key] = false;
        try {
            const result = reset ? await resetAISetting(value.purpose, value.variant, owner) : await saveAISetting(value, owner);
            if (!isCurrentSession(owner) || account !== initiatingAccount) return;
            const confirmed = blankDraft(value.purpose, value.variant, result);
            if (!reset && (confirmed.model_id !== value.model_id || confirmed.additional_context !== value.additional_context || canonical(confirmed.request_config) !== canonical(value.request_config))) throw new Error('Review the returned settings and try saving again.');
            if (reset && (confirmed.model_id !== null || confirmed.additional_context !== '' || Object.keys(confirmed.request_config).length)) throw new Error('Review the returned default settings and try again.');
            settings = result; views = { [key]: result }; drafts[key] = confirmed; buffers[key] = { raw: {}, errors: {} };
            configRevision++;
            invalidateAIConfig();
            if (currentKey !== key) void load(purpose, variant);
            notices[key] = reset ? 'Default restored. Read back from the server.' : 'Saved. Read back from the server.';
        } catch (error) {
            if (isCurrentSession(owner) && account === initiatingAccount && !(error instanceof SessionChangedError)) {
                notices[key] = error instanceof Error ? error.message : 'Try saving again.';
                failures[key] = true; failedReset[key] = reset;
            }
        } finally {
            if (isCurrentSession(owner) && account === initiatingAccount) saving = '';
        }
    }
    $effect(() => {
        const user = $auth.user, authenticated = $auth.isAuthenticated, authLoading = $auth.loading;
        if (authLoading) return;
        const scope = user && authenticated && user.is_admin ? `${user.id}:${captureSession().generation}` : '';
        untrack(() => {
            if (scope === account) return;
            account = scope; loadSequence++;
            settings = null; views = {}; buffers = {}; examples = {}; drafts = {}; notices = {}; failures = {}; failedReset = {}; configRevision++;
            catalogue = { status: 'unavailable', models: [], fetched_at: null };
            purpose = 'shared'; variant = ''; saving = ''; loading = false; refreshing = false; loadError = ''; catalogueError = '';
            if (scope) { void load(); void refreshModels(false); }
        });
    });
</script>

<svelte:head><title>AI settings · Continuum</title></svelte:head>
{#if isAdmin}
<div class="space-y-6 pb-12">
    <header class="space-y-2">
        <p class="text-xs uppercase tracking-widest text-primary">Administration</p>
        <h1 class="text-3xl font-serif font-bold">AI settings</h1>
        <p class="text-muted-foreground">Edit complete AI instructions, context rules and generation settings across Continuum.</p>
    </header>
    <section class="rounded-xl border border-border bg-card p-5 flex justify-between items-center gap-5" aria-label="Gateway connection">
        <div><h2 class="font-semibold">Bifrost gateway</h2><p class="text-sm text-muted-foreground">{settings ? settings.gateway_configured ? 'Connection configured' : 'Awaiting gateway configuration' : 'Loading connection status…'}</p>{#if settings && !settings.gateway_configured}<p class="text-sm text-muted-foreground mt-2">Set <code>BIFROST_BASE_URL</code> and <code>BIFROST_VIRTUAL_KEY</code> on the server, then configure providers in Bifrost.</p>{/if}</div>
        <a class="text-primary underline" href="https://llm.jch.guru" target="_blank" rel="noreferrer">Configure providers in Bifrost ↗</a>
    </section>
    <div class="flex flex-wrap justify-between items-center gap-3">
        <div class="text-sm text-muted-foreground" role="status">{refreshing ? 'Loading model catalogue…' : catalogue.status === 'ready' ? `${catalogue.models.length} models in the catalogue` : catalogue.status === 'not_configured' ? 'Gateway configuration pending' : 'Catalogue refresh available'}{#if catalogue.status !== 'ready' && catalogue.models.length}<span class="block">Showing the last loaded catalogue.</span>{/if}{#if catalogue.fetched_at}<span class="block">Last catalogue: {new Date(catalogue.fetched_at).toLocaleString()}</span>{/if}</div>
        <button type="button" class="action" onclick={() => refreshModels()} disabled={refreshing || loading}>Refresh catalogue</button>
    </div>
    {#if catalogueError}<p class="rounded-lg border border-amber-500/40 p-3 text-sm" role="status">{catalogueError}</p>{/if}
    {#if loadError}<div role="alert" class="rounded-lg border border-amber-500/40 p-4"><p>{loadError}</p><button type="button" class="action mt-3" onclick={() => load()} disabled={loading}>Retry loading settings</button></div>{/if}
    {#if loading && !view}<p role="status">Loading saved settings…</p>{/if}
    {#if settings}
        <div class="grid grid-cols-[210px_minmax(0,1fr)] gap-5 items-start">
            <nav aria-label="AI purposes" class="rounded-xl border border-border bg-card p-2 space-y-1 sticky top-4">
                <button type="button" class:active={purpose === 'shared'} class="purpose" onclick={() => choose('shared')}>Shared defaults</button>
                {#each settings.purposes as item (item.id)}<button type="button" class:active={purpose === item.id} class="purpose" onclick={() => choose(item.id)}>{item.label}<span class="block text-xs opacity-60 break-all">{item.id}</span></button>{/each}
            </nav>
            <section class="rounded-xl border border-border bg-card p-5 space-y-5 min-w-0" aria-label="Purpose settings">
                <div><h2 class="text-xl font-semibold">{purpose === 'shared' ? 'Shared defaults' : definition?.label}</h2><p class="text-sm text-muted-foreground">Shared instructions apply to every purpose, followed by its purpose and context instructions.</p></div>
                {#if definition?.variants.length}
                    <label class="block space-y-1"><span class="text-sm font-semibold">Context</span><select aria-label="Context" class="control" value={variant} onchange={e => choose(purpose, e.currentTarget.value)}><option value="">All contexts for this purpose</option>{#each definition.variants as v}<option value={v}>{label(v)}</option>{/each}</select></label>
                {/if}
                {#if draft && view && buffers[currentKey]}
                    {#key currentKey}
                        <ModelSelector models={catalogue.models} status={catalogue.status} bind:value={draft.model_id} effectiveModel={inheritedModel} disabled={!!saving || loading || $auth.loading} />
                    {/key}
                    <div class="space-y-2"><label for="ai-context" class="block font-semibold">Additional instructions</label><textarea id="ai-context" aria-describedby="ai-context-count" class="control leading-relaxed" rows="7" maxlength="8000" bind:value={draft.additional_context} disabled={!!saving || loading || $auth.loading} placeholder="Tone, useful background, and guidance for this purpose"></textarea><span id="ai-context-count" class="block text-xs text-muted-foreground">{draft.additional_context.length} / 8,000 characters</span></div>
                    <div class="sticky top-4 z-10 rounded-lg border border-border bg-card p-3 shadow-lg space-y-2">
                    <div class="flex flex-wrap gap-3 items-center"><button class="action primary" type="button" onclick={() => persist()} disabled={!!saving || loading || $auth.loading || !configValid}>{saving === currentKey ? 'Saving…' : failures[currentKey] && !failedReset[currentKey] ? 'Retry save' : 'Save settings'}</button><button class="action" type="button" onclick={() => persist(true)} disabled={!!saving || loading || $auth.loading}>{failures[currentKey] && failedReset[currentKey] ? 'Retry reset' : 'Reset to default'}</button><span class="text-sm text-muted-foreground">{changed ? 'Draft changes' : 'Matches saved settings'}</span></div>
                    {#if notices[currentKey]}<p role={failures[currentKey] ? 'alert' : 'status'} class="text-sm whitespace-pre-wrap rounded-lg border border-border p-3">{notices[currentKey]}</p>{/if}
                    </div>
                    {#key `${account}:${currentKey}`}
                        <AIConfigurationEditor {purpose} {variant} onChooseScope={choose} fields={view.config_fields} assets={view.asset_fields} selected={view.selected} bind:value={draft.request_config} bind:raw={buffers[currentKey].raw} bind:errors={buffers[currentKey].errors} disabled={!!saving || loading || $auth.loading} />
                    {/key}
                    <details class="rounded-lg border border-border p-4" data-testid="saved-readback"><summary class="cursor-pointer font-semibold">Saved model and additional instructions</summary><dl class="mt-3 space-y-2 text-sm"><dt class="text-muted-foreground">Effective model</dt><dd class="break-all font-mono">{effectiveModel}</dd><dt class="text-muted-foreground">Saved additional instructions for this choice</dt><dd class="whitespace-pre-wrap break-words">{saved?.additional_context || 'Inherited guidance'}</dd><dt class="text-muted-foreground">Combined saved additional instructions</dt><dd class="whitespace-pre-wrap break-words">{appliedContext || 'Task instructions supplied by the application'}</dd></dl></details>
                    <details class="rounded-lg border border-border p-4"><summary class="cursor-pointer font-semibold">Assembly order and application constraints</summary><ol class="mt-3 list-decimal pl-5 space-y-1 text-sm">{#each view.assembly_order as part}<li>{part}</li>{/each}</ol><dl class="mt-4 space-y-2 text-sm">{#each Object.entries(view.implementation_constraints) as [key, value]}<dt class="font-semibold">{key}</dt><dd class="whitespace-pre-wrap break-words text-muted-foreground">{typeof value === 'string' ? value : JSON.stringify(value, null, 2)}</dd>{/each}</dl></details>
                    {#key `${account}:${currentKey}`}
                        <AIRequestPreview {purpose} {variant} scope={`${account}:${currentKey}`} revision={configRevision} slots={view.input_slots} variants={definition?.variants || []} bind:inputText={examples[currentKey]} lastActual={actualRequest} disabled={!!saving || loading || $auth.loading} />
                    {/key}
                {/if}
            </section>
        </div>
    {/if}
</div>
{/if}
<style>
    .control { width: 100%; border: 1px solid var(--color-border); border-radius: .5rem; background: var(--color-background); padding: .65rem .8rem; color: inherit; }
    .action { border: 1px solid var(--color-border); border-radius: .5rem; padding: .6rem 1rem; font-size: .875rem; font-weight: 600; }
    .primary, .active { background: var(--color-primary); color: var(--color-primary-foreground); }
    .purpose { width: 100%; padding: .75rem; border-radius: .5rem; text-align: left; font-size: .875rem; }
    button:disabled { opacity: .5; cursor: wait; }
</style>
