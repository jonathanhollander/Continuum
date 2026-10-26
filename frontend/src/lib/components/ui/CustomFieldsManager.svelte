<script lang="ts">
    import { askConfirm } from "$lib/components/ui/ConfirmModal.svelte";
    import { onMount, untrack } from "svelte";
    import { customFieldStore } from "$lib/stores/customFieldStore.svelte";
    import { Plus, Trash2, Settings, X, Save } from "lucide-svelte";
    import { slide, fade } from "svelte/transition";
    import type { FieldType } from "$lib/types/customFields";

    let {
        entityType,
        data = $bindable({}),
        readOnly = false,
    } = $props<{
        entityType: string;
        data: Record<string, any>;
        readOnly?: boolean;
    }>();

    let isManaging = $state(false);
    let newFieldName = $state("");
    let newFieldType = $state<FieldType>("text");
    let savingField = $state(false);
    let saveError = $state(false);
    let definitions = $derived(customFieldStore.getDefinitions(entityType));
    let loadState = $derived(customFieldStore.getLoadState(entityType));
    const uid = $props.id();
    const drafts = new Map<string, { name: string; type: FieldType; open: boolean; error: boolean }>();
    let draftScope: string | null = null;
    let identity: string | null = null;
    let operation = 0;
    let editor = 0;

    onMount(() => { if (!data) data = {}; });

    // A mounted manager follows identified sessions too; onMount alone misses an account switch.
    $effect(() => {
        const nextIdentity = customFieldStore.ownerKey;
        const account = customFieldStore.accountId;
        const entity = entityType;
        const scope = account == null ? null : JSON.stringify([account, entity]);
        untrack(() => {
            if (identity !== nextIdentity || scope !== draftScope) {
                operation++;
                editor++;
                savingField = false;
                if (scope !== draftScope) {
                    if (draftScope) drafts.set(draftScope, { name: newFieldName, type: newFieldType, open: isManaging, error: saveError });
                    const draft = scope ? drafts.get(scope) : undefined;
                    newFieldName = draft?.name || "";
                    newFieldType = draft?.type || "text";
                    isManaging = draft?.open || false;
                    saveError = draft?.error || false;
                    draftScope = scope;
                }
                identity = nextIdentity;
            }
            if (nextIdentity) void customFieldStore.loadDefinitions(entity);
        });
    });

    function setManaging(open: boolean) {
        editor++;
        isManaging = open;
    }

    async function addField() {
        if (savingField || !newFieldName || !customFieldStore.ownerKey) return;
        const owner = customFieldStore.ownerKey;
        const request = ++operation;
        const opened = editor;
        const name = newFieldName;
        const type = newFieldType;
        savingField = true;
        saveError = false;
        try {
            await customFieldStore.createDefinition({ entity_type: entityType, name, field_type: type, order: definitions.length });
            if (owner !== customFieldStore.ownerKey || request !== operation) return;
            if (opened === editor && name === newFieldName && type === newFieldType) {
                newFieldName = "";
                setManaging(false);
            }
        } catch {
            if (owner === customFieldStore.ownerKey && request === operation) saveError = true;
        } finally {
            if (owner === customFieldStore.ownerKey && request === operation) savingField = false;
        }
    }

    async function removeDefinition(id: number, name: string) {
        if (savingField || !customFieldStore.ownerKey) return;
        const owner = customFieldStore.ownerKey;
        const request = ++operation;
        savingField = true;
        saveError = false;
        try {
            if (await askConfirm(`Remove the field "${name}"? Anything you saved in it stays safe.`)) {
                if (owner !== customFieldStore.ownerKey || request !== operation) return;
                await customFieldStore.deleteDefinition(id);
            }
        } catch {
            if (owner === customFieldStore.ownerKey && request === operation) saveError = true;
        } finally {
            if (owner === customFieldStore.ownerKey && request === operation) savingField = false;
        }
    }

    const fieldTypes: { value: FieldType; label: string }[] = [
        { value: "text", label: "Text" },
        { value: "date", label: "Date" },
        { value: "number", label: "Number" },
        { value: "boolean", label: "Yes/No" },
        { value: "textarea", label: "Long Text" },
    ];
</script>

<div class="space-y-4">
    {#if loadState.loading}
        <p role="status" class="text-xs text-muted-foreground">Loading...</p>
    {:else if loadState.error}
        <div role="status" class="space-y-2 text-xs text-muted-foreground">
            <p>Your saved records are still on your account. Let's try loading them again.</p>
            <button type="button" onclick={() => customFieldStore.loadDefinitions(entityType)} class="font-bold text-primary-hover">Try Again</button>
        </div>
    {/if}
    {#if saveError}
        <p role="status" class="text-xs text-muted-foreground">Your draft is kept. We can save it again whenever you're ready.</p>
    {/if}
    <!-- Custom Field Inputs (appear first, integrated into form) -->
    <div class="grid grid-cols-1 gap-4">
        {#each definitions as def (def.id)}
            <div class="space-y-1">
                <label
                    id={`${uid}-label-${def.id}`}
                    for={def.field_type === "boolean" ? undefined : `${uid}-field-${def.id}`}
                    class="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-1"
                >
                    {def.name}
                </label>

                {#if def.field_type === "date"}
                    <input
                        id={`${uid}-field-${def.id}`}
                        type="date"
                        bind:value={data[def.name]}
                        class="w-full bg-muted text-foreground border border-border focus:border-primary focus:bg-card rounded-xl p-2.5 text-sm font-medium outline-none transition-all"
                    />
                {:else if def.field_type === "boolean"}
                    <div class="flex items-center gap-2 mt-1" role="group" aria-labelledby={`${uid}-label-${def.id}`}>
                        <button
                            class="px-4 py-2 rounded-lg text-xs font-bold border transition-all {data[
                                def.name
                            ] === true
                                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                                : 'bg-card border-border text-muted-foreground hover:bg-muted'}"
                            onclick={() => (data[def.name] = true)}>Yes</button
                        >
                        <button
                            class="px-4 py-2 rounded-lg text-xs font-bold border transition-all {data[
                                def.name
                            ] === false
                                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                                : 'bg-card border-border text-muted-foreground hover:bg-muted'}"
                            onclick={() => (data[def.name] = false)}>No</button
                        >
                    </div>
                {:else if def.field_type === "textarea"}
                    <textarea
                        id={`${uid}-field-${def.id}`}
                        bind:value={data[def.name]}
                        placeholder={`Enter ${def.name}...`}
                        class="w-full bg-muted text-foreground border border-border focus:border-primary focus:bg-card rounded-xl p-3 text-sm font-medium outline-none transition-all min-h-[80px] resize-none"
                    ></textarea>
                {:else if def.field_type === "number"}
                    <input
                        id={`${uid}-field-${def.id}`}
                        type="number"
                        bind:value={data[def.name]}
                        placeholder="0.00"
                        class="w-full bg-muted text-foreground border border-border focus:border-primary focus:bg-card rounded-xl p-2.5 text-sm font-medium outline-none transition-all"
                    />
                {:else}
                    <input
                        id={`${uid}-field-${def.id}`}
                        type="text"
                        bind:value={data[def.name]}
                        placeholder={`Enter ${def.name}...`}
                        class="w-full bg-muted text-foreground border border-border focus:border-primary focus:bg-card rounded-xl p-2.5 text-sm font-medium outline-none transition-all"
                    />
                {/if}
            </div>
        {/each}
    </div>

    <!-- Add Field Section (appears after custom field inputs) -->
    {#if !readOnly}
        <div class="pt-2">
            {#if definitions.length === 0 && !isManaging && loadState.loaded}
                <p class="text-xs text-muted-foreground italic mb-3">Add custom fields to track additional information.</p>
            {/if}

            <button
                onclick={() => setManaging(!isManaging)}
                disabled={!customFieldStore.ownerKey}
                class="text-xs text-primary-hover font-bold hover:text-foreground flex items-center gap-1 bg-primary-soft px-3 py-1.5 rounded-lg transition-colors"
            >
                {#if isManaging}
                    Done
                {:else}
                    <Plus size={12} /> Add Field
                {/if}
            </button>
        </div>
    {/if}

    <!-- Manager UI (Create New Field) -->
    {#if isManaging}
        <div
            transition:slide
            class="bg-primary-soft p-4 rounded-xl border border-primary/20 space-y-3"
        >
            <h5 class="text-xs font-bold text-primary-hover">Create New Field</h5>
            <div class="flex flex-col gap-3">
                <!-- Focus moves to this field because the person just chose to add something here. -->
                <!-- svelte-ignore a11y_autofocus -->
                <input
                    type="text"
                    bind:value={newFieldName}
                    aria-label="Field Name"
                    placeholder="Field Name (e.g. Warranty Date)"
                    class="w-full px-3 py-2 rounded-lg border border-primary/30 bg-card text-foreground text-sm focus:border-primary outline-none"
                    autofocus
                />
                <select
                    aria-label="Field Type"
                    bind:value={newFieldType}
                    class="w-full px-3 py-2 rounded-lg border border-primary/30 text-foreground text-sm focus:border-primary outline-none bg-card"
                >
                    {#each fieldTypes as type}
                        <option value={type.value}>{type.label}</option>
                    {/each}
                </select>
                <div class="flex justify-end gap-2">
                    <button
                        onclick={() => setManaging(false)}
                        class="px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
                    >
                        Maybe later
                    </button>
                    <button
                        onclick={addField}
                        disabled={!newFieldName || savingField || !customFieldStore.ownerKey}
                        aria-busy={savingField}
                        class="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary-hover disabled:opacity-50 shadow-sm"
                    >
                        Create Field
                    </button>
                </div>
            </div>

            <!-- List of existing definitions to allow deletion -->
            {#if definitions.length > 0}
                <div class="border-t border-primary/20 pt-3 mt-2">
                    <p
                        class="text-[10px] uppercase font-bold text-primary-hover mb-2 block"
                    >
                        Existing Fields
                    </p>
                    <div class="space-y-1">
                        {#each definitions as def}
                            <div
                                class="flex items-center justify-between text-xs bg-card p-2 rounded-lg"
                            >
                                <span class="font-medium text-foreground"
                                    >{def.name}
                                    <span class="text-muted-foreground font-normal"
                                        >({def.field_type})</span
                                    ></span
                                >
                                <button aria-label={`Remove ${def.name}`}
                                    disabled={savingField}
                                    onclick={() =>
                                        removeDefinition(def.id!, def.name)}
                                    class="text-muted-foreground hover:text-foreground"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
    {/if}
</div>
