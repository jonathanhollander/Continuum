<script lang="ts">
    import type { AIAssetField, AIConfigurationField, AIRequestConfig, AISelectedConfiguration } from '$lib/services/aiSettingsService';
    // ClaimsChat's complete text/effective-default/Restore pattern, adapted to
    // this finite backend field registry. This component never builds a prompt.
    let { fields, assets, selected, purpose, variant, onChooseScope, value = $bindable({}), raw = $bindable({}), errors = $bindable({}), disabled = false }: {
        fields: AIConfigurationField[]; assets: AIAssetField[]; selected: AISelectedConfiguration;
        purpose: string; variant: string; onChooseScope: (purpose: string, variant: string) => void;
        value: AIRequestConfig; raw: Record<string, string>; errors: Record<string, string>; disabled?: boolean;
    } = $props();
    const uid = $props.id();
    const control = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground disabled:opacity-60';
    const groups = [
        { label: 'Complete instructions and templates', keys: ['shared_system_template', 'system_template', 'task_template', 'context_template', 'response_instruction', 'placeholder_instruction', 'role_instructions', 'overwhelm_instruction', 'overwhelm_states'] },
        { label: 'Subject and tone', keys: ['subject', 'tone_direct', 'tone_warm', 'tone_tender', 'warmth_low_max', 'warmth_mid_max'] },
        { label: 'Context and conversation history', keys: ['history_enabled', 'history_roles', 'history_sources', 'max_history_messages', 'included_inputs', 'max_input_chars'] },
        { label: 'Generation settings', keys: ['max_tokens', 'temperature'] },
        { label: 'Application messages and writing prompts', keys: ['ui_assets'] }
    ];
    const assigned = new Set(groups.flatMap(group => group.keys));
    const sections = $derived([...groups.map(group => ({ ...group, fields: fields.filter(field => group.keys.includes(field.key)) })),
        { label: 'Additional configuration', keys: [], fields: fields.filter(field => !assigned.has(field.key)) }].filter(group => group.fields.length));
    const object = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
    const own = (key: string, leaf?: string) => leaf === undefined ? Object.hasOwn(value, key) : Object.hasOwn(object(value[key]), leaf);
    const inherited = (key: string, leaf?: string) => leaf === undefined ? selected.inherited_config[key] : object(selected.inherited_config[key])[leaf];
    const current = (key: string, leaf?: string) => own(key, leaf) ? leaf === undefined ? value[key] : object(value[key])[leaf] : inherited(key, leaf);
    const path = (key: string, leaf?: string) => leaf === undefined ? key : `${key}.${leaf}`;
    const display = (v: unknown) => typeof v === 'string' ? v : JSON.stringify(v, null, 2) ?? '';
    const source = (key: string, leaf?: string) => selected.sources[path(key, leaf)] || selected.sources[key] || 'Shipped default';
    const savedOverride = (key: string, leaf?: string) => leaf === undefined ? Object.hasOwn(selected.request_config, key) : Object.hasOwn(object(selected.request_config[key]), leaf);
    function stateLabel(key: string, leaf?: string) {
        if (!own(key, leaf)) return savedOverride(key, leaf) ? 'Inherited value · draft' : `Inherited · ${source(key, leaf)}`;
        const stored = leaf === undefined ? selected.request_config[key] : object(selected.request_config[key])[leaf];
        return savedOverride(key, leaf) && !errors[path(key, leaf)] && JSON.stringify(current(key, leaf)) === JSON.stringify(stored) ? `Saved override · ${source(key, leaf)}` : 'Custom draft';
    }
    const leaves = (field: AIConfigurationField) => [...new Set([
        ...Object.keys(object(selected.default_config[field.key])), ...Object.keys(object(selected.inherited_config[field.key])),
        ...Object.keys(object(selected.effective_config[field.key])), ...Object.keys(object(value[field.key]))
    ])];
    const asset = (key: string) => assets.find(item => item.key === key);
    const editableAsset = (key: string) => purpose === 'shared' || !!asset(key)?.consumers?.some(consumer => consumer.purpose === purpose && (!variant || !consumer.variant || consumer.variant === variant));
    function update(key: string, next: unknown, leaf?: string) {
        value = leaf === undefined ? { ...value, [key]: next } : { ...value, [key]: { ...object(value[key]), [leaf]: next } };
        delete errors[path(key, leaf)];
    }
    function inherit(key: string, leaf?: string) {
        const next = { ...value };
        if (leaf === undefined) delete next[key];
        else { const entries = { ...object(next[key]) }; delete entries[leaf]; if (Object.keys(entries).length) next[key] = entries; else delete next[key]; }
        value = next; delete raw[path(key, leaf)]; delete errors[path(key, leaf)];
    }
    function customize(field: AIConfigurationField, leaf?: string) {
        const next = current(field.key, leaf);
        update(field.key, next === undefined ? field.type === 'text' || leaf !== undefined ? '' : null : JSON.parse(JSON.stringify(next)), leaf);
    }
    function editObject(field: AIConfigurationField, leaf: string, text: string) {
        const id = path(field.key, leaf);
        raw[id] = text;
        const previous = current(field.key, leaf);
        const structured = Array.isArray(previous) || (previous !== null && typeof previous === 'object') || ['list', 'object'].includes(asset(leaf)?.kind || '');
        if (!structured) { update(field.key, text, leaf); return; }
        try { update(field.key, JSON.parse(text), leaf); }
        catch { errors[id] = 'Enter valid JSON for this list or object. Your draft stays here.'; }
    }
    function number(field: AIConfigurationField, text: string) {
        raw[field.key] = text;
        if (!text.trim()) {
            if (field.nullable) update(field.key, null);
            else errors[field.key] = 'Enter a number for this override.';
            return;
        }
        const next = Number(text);
        if (!Number.isFinite(next) || (field.type === 'integer' && !Number.isInteger(next)) || (field.min !== undefined && next < field.min) || (field.max !== undefined && next > field.max)) {
            errors[field.key] = `Enter ${field.type === 'integer' ? 'a whole number' : 'a number'}${field.min !== undefined ? ` from ${field.min}` : ''}${field.max !== undefined ? ` through ${field.max}` : ''}.`;
        } else update(field.key, next);
    }
    function toggle(field: AIConfigurationField, option: string, checked: boolean) {
        const choices = Array.isArray(current(field.key)) ? current(field.key) as string[] : [];
        update(field.key, checked ? [...new Set([...choices, option])] : choices.filter(item => item !== option));
    }
</script>

<div class="space-y-4" data-testid="complete-ai-configuration" data-config-purpose={purpose} data-config-variant={variant}>
    {#each sections as section}
        <details class="rounded-lg border border-border p-4" open={section.label === 'Complete instructions and templates'}>
            <summary class="cursor-pointer font-semibold">{section.label}</summary>
            <div class="mt-4 space-y-5">
                {#each section.fields as field (field.key)}
                    {#if field.type === 'object'}
                        <fieldset class="space-y-3" data-config-field={field.key} {disabled}><legend class="font-semibold">{field.label}</legend>{#if field.key === 'ui_assets'}<p class="text-xs text-muted-foreground">Overrides apply when this scope uses an entry. Shared defaults supply entries across purposes.</p>{/if}
                            {#if field.max_length !== undefined}<p class="text-xs text-muted-foreground">Maximum text length: {field.max_length.toLocaleString()} characters.</p>{/if}
                            {#if field.slots?.length}<p class="text-xs text-muted-foreground">Template slots: {field.slots.map(slot => `{{${slot}}}`).join(', ')}</p>{/if}
                            {#each leaves(field) as leaf (leaf)}
                                {@const editable = field.key !== 'ui_assets' || editableAsset(leaf)}
                                {@const id = path(field.key, leaf)}
                                <div class="rounded-lg border border-border p-3 space-y-2" data-config-leaf={leaf}>
                                    <label for={`${uid}-${id}`} class="block text-sm font-semibold">{asset(leaf)?.label || leaf}</label>
                                    {#if field.key === 'ui_assets' && asset(leaf)}<p class="text-xs text-muted-foreground">Primary use: {asset(leaf)?.purpose}{asset(leaf)?.variant ? ` · ${asset(leaf)?.variant}` : ''} · {asset(leaf)?.surface}</p>{/if}
                                    {#if asset(leaf)?.placeholders.length}<p class="text-xs text-muted-foreground">Template slots: {asset(leaf)?.placeholders.map(slot => `{{${slot}}}`).join(', ')}</p>{/if}
                                    {#if ['list', 'object'].includes(asset(leaf)?.kind || '')}<p class="text-xs text-muted-foreground">Edit the complete JSON {asset(leaf)?.kind}.</p>{/if}
                                    <div class="flex justify-between items-center gap-3 text-xs"><span class="text-muted-foreground">{stateLabel(field.key, leaf)}</span><button type="button" class="text-primary underline" disabled={!editable && !own(field.key, leaf)} aria-label={`${own(field.key, leaf) ? 'Use inherited value for' : 'Customize'} ${asset(leaf)?.label || leaf}`} onclick={() => own(field.key, leaf) ? inherit(field.key, leaf) : customize(field, leaf)}>{own(field.key, leaf) ? 'Use inherited value' : 'Customize'}</button></div>
                                    <textarea spellcheck="false" autocomplete="off" id={`${uid}-${id}`} class={`${control} font-mono text-sm`} rows="6" readonly={!own(field.key, leaf) || disabled || !editable} value={raw[id] ?? display(current(field.key, leaf))} oninput={e => editObject(field, leaf, e.currentTarget.value)} aria-invalid={!!errors[id]} aria-describedby={errors[id] ? `${uid}-${id}-error` : undefined}></textarea>
                                    {#if field.key === 'ui_assets'}<details class="text-xs"><summary class="cursor-pointer text-primary">Consumer settings · {asset(leaf)?.consumers?.length || 0}</summary><div class="mt-2 flex flex-wrap gap-3">{#each asset(leaf)?.consumers || [] as consumer}<button type="button" class="text-primary underline" disabled={disabled} onclick={() => onChooseScope(consumer.purpose, consumer.variant || '')}>Open consumer: {consumer.purpose}{consumer.variant ? ` · ${consumer.variant}` : ''}</button>{/each}</div></details>{#if !editable}<p class="text-xs text-muted-foreground">Read this entry here; edit it in Shared defaults or its consumer settings.</p>{/if}{/if}
                                    {#if errors[id]}<p id={`${uid}-${id}-error`} role="alert" class="text-sm text-warning">{errors[id]}</p>{/if}
                                    <details class="text-xs text-muted-foreground"><summary class="cursor-pointer">Saved value and shipped default</summary><p class="mt-2">Saved source: {source(field.key, leaf)}</p><pre class="whitespace-pre-wrap break-words mt-2">{display(object(selected.effective_config[field.key])[leaf])}</pre><p class="mt-2">Shipped default</p><pre class="whitespace-pre-wrap break-words mt-2">{display(object(selected.default_config[field.key])[leaf])}</pre></details>
                                </div>
                            {/each}
                        </fieldset>
                    {:else}
                        <div class="space-y-2" data-config-field={field.key}>
                            {#if field.type === 'choices'}<p class="text-sm font-semibold">{field.label}</p>{:else}<label for={`${uid}-${field.key}`} class="block text-sm font-semibold">{field.label}</label>{/if}
                            <div class="flex justify-between items-center gap-3 text-xs"><span class="text-muted-foreground">{stateLabel(field.key)}</span><button type="button" class="text-primary underline" aria-label={`${own(field.key) ? 'Use inherited value for' : 'Customize'} ${field.label}`} disabled={disabled} onclick={() => own(field.key) ? inherit(field.key) : customize(field)}>{own(field.key) ? 'Use inherited value' : 'Customize'}</button></div>
                            {#if field.type === 'text'}
                                <textarea spellcheck="false" autocomplete="off" id={`${uid}-${field.key}`} class={`${control} font-mono text-sm`} rows="8" readonly={!own(field.key) || disabled} value={String(current(field.key) ?? '')} oninput={e => update(field.key, e.currentTarget.value)}></textarea>
                            {:else if field.type === 'boolean'}
                                <input id={`${uid}-${field.key}`} type="checkbox" disabled={!own(field.key) || disabled} checked={current(field.key) === true} onchange={e => update(field.key, e.currentTarget.checked)} />
                            {:else if field.type === 'choices'}
                                <fieldset id={`${uid}-${field.key}`} aria-label={field.label} disabled={!own(field.key) || disabled} class="flex flex-wrap gap-3 rounded-lg border border-border p-3">{#each field.options || [] as option}<label class="flex gap-2 items-center"><input type="checkbox" checked={Array.isArray(current(field.key)) && (current(field.key) as string[]).includes(option)} onchange={e => toggle(field, option, e.currentTarget.checked)} />{option}</label>{/each}</fieldset>
                            {:else}
                                <input id={`${uid}-${field.key}`} class={control} type="number" min={field.min} max={field.max} step={field.type === 'integer' ? 1 : 'any'} disabled={!own(field.key) || disabled} value={raw[field.key] ?? (current(field.key) === null ? '' : Number(current(field.key)))} oninput={e => number(field, e.currentTarget.value)} aria-invalid={!!errors[field.key]} aria-describedby={errors[field.key] ? `${uid}-${field.key}-error` : undefined} />
                                {#if field.min !== undefined || field.max !== undefined}<p class="text-xs text-muted-foreground">Range: {field.min ?? 'Any'} through {field.max ?? 'Any'}.</p>{/if}
                            {#if field.nullable}<p class="text-xs text-muted-foreground">Blank: {field.key === 'max_history_messages' ? 'full conversation history' : 'provider default'}.</p>{/if}
                            {/if}
                            {#if field.max_length !== undefined}<p class="text-xs text-muted-foreground">Maximum text length: {field.max_length.toLocaleString()} characters.</p>{/if}
                            {#if field.slots?.length}<p class="text-xs text-muted-foreground">Template slots: {field.slots.map(slot => `{{${slot}}}`).join(', ')}</p>{/if}
                            {#if errors[field.key]}<p id={`${uid}-${field.key}-error`} role="alert" class="text-sm text-warning">{errors[field.key]}</p>{/if}
                            <details class="text-xs text-muted-foreground"><summary class="cursor-pointer">Saved value and shipped default</summary><p class="mt-2">Saved source: {source(field.key)}</p><pre class="whitespace-pre-wrap break-words mt-2">{display(selected.effective_config[field.key])}</pre><p class="mt-2">Shipped default</p><pre class="whitespace-pre-wrap break-words mt-2">{display(selected.default_config[field.key])}</pre></details>
                        </div>
                    {/if}
                {/each}
            </div>
        </details>
    {/each}
</div>
