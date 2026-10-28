<script lang="ts">
    import type { AIModel, AIModelCatalogue } from '$lib/services/aiSettingsService';
    // Port of ClaimsChat _model_select.html's single-radio picker and model-select.js
    // token filtering; metadata filters/sorts follow admin/model_catalog_rendering.py.
    // Source: claimschat commit 1b7cb5fb6381e15c0b46f939291ae287b405d63b.
    // Selection remains independent of the filtered catalogue, including its default row.
    let { models, status, value = $bindable(null), effectiveModel, disabled = false }: {
        models: AIModel[]; status: AIModelCatalogue['status']; value: string | null;
        effectiveModel: string; disabled?: boolean;
    } = $props();
    const uid = $props.id();
    let search = $state('');
    let provider = $state('');
    let capability = $state('');
    let minContext = $state<number | undefined>();
    let maxInput = $state<number | undefined>();
    let maxOutput = $state<number | undefined>();
    let sort = $state('name');
    const providers = $derived([...new Set(models.map(m => m.provider).filter(Boolean))].sort());
    const capabilities = $derived([...new Set(models.flatMap(m => m.capabilities))].sort());
    const selected = $derived(models.find(m => m.id === value));
    const price = (raw: string | null) => raw !== null && raw.trim() !== '' && Number.isFinite(Number(raw)) ? Number(raw) * 1_000_000 : null;
    const money = (raw: string | null) => { const n = price(raw); return n === null ? 'Unknown' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 4 }).format(n); };
    const compare = (a: AIModel, b: AIModel) => {
        const identity = (a.name || a.id).localeCompare(b.name || b.id);
        if (sort === 'provider') return a.provider.localeCompare(b.provider) || identity;
        const av = sort === 'context' ? a.context_length : sort === 'output' ? a.max_output_tokens : sort === 'newest' ? a.created : sort === 'input-price' ? price(a.input_price_per_token) : price(a.output_price_per_token);
        const bv = sort === 'context' ? b.context_length : sort === 'output' ? b.max_output_tokens : sort === 'newest' ? b.created : sort === 'input-price' ? price(b.input_price_per_token) : price(b.output_price_per_token);
        if (sort === 'name') return identity;
        return (av === null ? 1 : 0) - (bv === null ? 1 : 0) || (av === null || bv === null ? 0 : (sort.endsWith('price') ? av - bv : bv - av)) || identity;
    };
    const filtered = $derived(models.filter(m => {
        const haystack = `${m.id} ${m.name || ''} ${m.provider}`.toLowerCase();
        return search.toLowerCase().split(/\s+/).filter(Boolean).every(token => haystack.includes(token))
            && (!provider || m.provider === provider)
            && (!capability || (capability === 'unknown' ? !m.capabilities.length : m.capabilities.includes(capability)))
            && (minContext === undefined || (m.context_length !== null && m.context_length >= Number(minContext)))
            && (maxInput === undefined || (price(m.input_price_per_token) !== null && price(m.input_price_per_token)! <= Number(maxInput)))
            && (maxOutput === undefined || (price(m.output_price_per_token) !== null && price(m.output_price_per_token)! <= Number(maxOutput)));
    }).sort(compare));
</script>

<fieldset class="space-y-3" {disabled}>
    <legend class="font-semibold mb-2">Model</legend>
    <div class="rounded-lg border border-primary/40 bg-primary/10 p-4 space-y-3" data-testid="current-model">
        <label class="flex gap-3 items-start cursor-pointer">
            <input class="mt-1" type="radio" name={uid} checked={value === null} onchange={() => value = null} />
            <span><strong>Use inherited default</strong><span class="block text-sm text-muted-foreground break-all">{effectiveModel}</span></span>
        </label>
        {#if value}
            <div class="flex gap-3 items-start">
                {#if !selected}<input class="mt-1" type="radio" name={uid} checked onchange={() => {}} aria-label={value} />{/if}
                <span><strong>{selected?.name || value}</strong><code class="block text-xs break-all">{value}</code>
                    <span class="block text-sm text-muted-foreground">{selected ? 'Selected model' : status === 'ready' ? 'Current selection · outside the current catalogue' : 'Current selection · catalogue check pending'}</span>
                </span>
            </div>
        {/if}
    </div>
    <div class="grid grid-cols-[2fr_1fr_1fr] gap-3">
        <label class="space-y-1"><span class="text-sm">Search models</span><input type="search" bind:value={search} placeholder="Model ID, name or provider" class="control" /></label>
        <label class="space-y-1"><span class="text-sm">Provider</span><select aria-label="Provider" class="control" bind:value={provider}><option value="">All providers</option>{#each providers as p}<option value={p}>{p}</option>{/each}</select></label>
        <label class="space-y-1"><span class="text-sm">Sort</span><select aria-label="Sort" class="control" bind:value={sort}><option value="name">Name</option><option value="provider">Provider</option><option value="newest">Newest</option><option value="context">Largest context</option><option value="output">Largest output</option><option value="input-price">Input price</option><option value="output-price">Output price</option></select></label>
    </div>
    <details class="rounded-lg border border-border p-3">
        <summary class="cursor-pointer text-sm">More filters</summary>
        <div class="grid grid-cols-4 gap-3 mt-3">
            <label class="space-y-1"><span class="text-sm">Capability</span><select aria-label="Capability" class="control" bind:value={capability}><option value="">All</option>{#each capabilities as c}<option value={c}>{c}</option>{/each}<option value="unknown">Unknown</option></select></label>
            <label class="space-y-1"><span class="text-sm">Minimum context</span><input class="control" type="number" min="0" step="1" bind:value={minContext} /></label>
            <label class="space-y-1"><span class="text-sm">Max input $ / 1M</span><input class="control" type="number" min="0" step="0.01" bind:value={maxInput} /></label>
            <label class="space-y-1"><span class="text-sm">Max output $ / 1M</span><input class="control" type="number" min="0" step="0.01" bind:value={maxOutput} /></label>
        </div>
    </details>
    <button type="button" class="text-sm text-primary underline" onclick={() => { search = ''; provider = ''; capability = ''; minContext = undefined; maxInput = undefined; maxOutput = undefined; sort = 'name'; }}>Reset filters</button>
    <p class="text-sm text-muted-foreground" aria-live="polite">{value ? 1 : 0} selected · {filtered.length} of {models.length} catalogue models shown</p>
    <div class="max-h-80 overflow-auto rounded-lg border border-border">
        <table class="w-full text-sm text-left">
            <thead class="sticky top-0 bg-card"><tr><th class="p-3">Choose model</th><th class="p-3">Provider</th><th class="p-3">Context / output</th><th class="p-3">Input / output per 1M</th></tr></thead>
            <tbody>{#each filtered as model (model.id)}
                <tr class="border-t border-border" data-model-id={model.id}>
                    <td class="p-3"><label class="flex items-start gap-3 cursor-pointer"><input class="mt-1" type="radio" name={uid} checked={value === model.id} onchange={() => value = model.id} aria-label={model.id} /><span><strong>{model.name || model.id}</strong><code class="block text-xs break-all text-muted-foreground">{model.id}</code></span></label></td>
                    <td class="p-3">{model.provider || 'Unknown'}<span class="block text-xs text-muted-foreground">{model.capabilities.join(', ') || 'Unknown'}</span></td><td class="p-3">{model.context_length?.toLocaleString() ?? 'Unknown'} / {model.max_output_tokens?.toLocaleString() ?? 'Unknown'}</td><td class="p-3">{money(model.input_price_per_token)} / {money(model.output_price_per_token)}</td>
                </tr>
            {/each}</tbody>
        </table>
        {#if !filtered.length}<p class="p-4 text-sm text-muted-foreground">{models.length ? 'Adjust the filters to explore the catalogue.' : 'Refresh the catalogue to explore models.'}</p>{/if}
    </div>
</fieldset>

<style>
    .control { width: 100%; border: 1px solid var(--color-border); border-radius: .5rem; background: var(--color-background); padding: .6rem .75rem; color: inherit; }
</style>
