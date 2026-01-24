<script lang="ts">
    import { onMount } from "svelte";
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
    let definitions = $derived(customFieldStore.getDefinitions(entityType));

    onMount(() => {
        customFieldStore.loadDefinitions(entityType);
        // Ensure data is initialized
        if (!data) data = {};
    });

    async function addField() {
        if (!newFieldName) return;
        await customFieldStore.createDefinition({
            entity_type: entityType,
            name: newFieldName,
            field_type: newFieldType,
            order: definitions.length,
        });
        newFieldName = "";
        isManaging = false;
    }

    async function removeDefinition(id: number, name: string) {
        if (
            confirm(
                `Delete field "${name}"? Data in this field will remain but be hidden.`,
            )
        ) {
            await customFieldStore.deleteDefinition(id);
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
    <!-- Custom Field Inputs (appear first, integrated into form) -->
    <div class="grid grid-cols-1 gap-4">
        {#each definitions as def (def.id)}
            <div class="space-y-1">
                <label
                    class="text-[11px] font-bold text-slate-600 uppercase tracking-wider pl-1"
                >
                    {def.name}
                </label>

                {#if def.field_type === "date"}
                    <input
                        type="date"
                        bind:value={data[def.name]}
                        class="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl p-2.5 text-sm font-medium outline-none transition-all"
                    />
                {:else if def.field_type === "boolean"}
                    <div class="flex items-center gap-2 mt-1">
                        <button
                            class="px-4 py-2 rounded-lg text-xs font-bold border transition-all {data[
                                def.name
                            ] === true
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}"
                            onclick={() => (data[def.name] = true)}>Yes</button
                        >
                        <button
                            class="px-4 py-2 rounded-lg text-xs font-bold border transition-all {data[
                                def.name
                            ] === false
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}"
                            onclick={() => (data[def.name] = false)}>No</button
                        >
                    </div>
                {:else if def.field_type === "textarea"}
                    <textarea
                        bind:value={data[def.name]}
                        placeholder={`Enter ${def.name}...`}
                        class="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl p-3 text-sm font-medium outline-none transition-all min-h-[80px] resize-none"
                    ></textarea>
                {:else if def.field_type === "number"}
                    <input
                        type="number"
                        bind:value={data[def.name]}
                        placeholder="0.00"
                        class="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl p-2.5 text-sm font-medium outline-none transition-all"
                    />
                {:else}
                    <input
                        type="text"
                        bind:value={data[def.name]}
                        placeholder={`Enter ${def.name}...`}
                        class="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl p-2.5 text-sm font-medium outline-none transition-all"
                    />
                {/if}
            </div>
        {/each}
    </div>

    <!-- Add Field Section (appears after custom field inputs) -->
    {#if !readOnly}
        <div class="pt-2">
            {#if definitions.length === 0 && !isManaging}
                <p class="text-xs text-slate-400 italic mb-3">Add custom fields to track additional information.</p>
            {/if}

            <button
                onclick={() => (isManaging = !isManaging)}
                class="text-xs text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
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
            class="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-3"
        >
            <h5 class="text-xs font-bold text-indigo-800">Create New Field</h5>
            <div class="flex flex-col gap-3">
                <input
                    type="text"
                    bind:value={newFieldName}
                    placeholder="Field Name (e.g. Warranty Date)"
                    class="w-full px-3 py-2 rounded-lg border border-indigo-200 text-sm focus:border-indigo-500 outline-none"
                    autofocus
                />
                <select
                    bind:value={newFieldType}
                    class="w-full px-3 py-2 rounded-lg border border-indigo-200 text-sm focus:border-indigo-500 outline-none bg-white"
                >
                    {#each fieldTypes as type}
                        <option value={type.value}>{type.label}</option>
                    {/each}
                </select>
                <div class="flex justify-end gap-2">
                    <button
                        onclick={() => (isManaging = false)}
                        class="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700"
                    >
                        Cancel
                    </button>
                    <button
                        onclick={addField}
                        disabled={!newFieldName}
                        class="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-500 disabled:opacity-50 shadow-sm"
                    >
                        Create Field
                    </button>
                </div>
            </div>

            <!-- List of existing definitions to allow deletion -->
            {#if definitions.length > 0}
                <div class="border-t border-indigo-200/50 pt-3 mt-2">
                    <label
                        class="text-[10px] uppercase font-bold text-indigo-400 mb-2 block"
                        >Existing Fields</label
                    >
                    <div class="space-y-1">
                        {#each definitions as def}
                            <div
                                class="flex items-center justify-between text-xs bg-white/50 p-2 rounded-lg"
                            >
                                <span class="font-medium text-slate-700"
                                    >{def.name}
                                    <span class="text-slate-400 font-normal"
                                        >({def.field_type})</span
                                    ></span
                                >
                                <button
                                    onclick={() =>
                                        removeDefinition(def.id!, def.name)}
                                    class="text-red-400 hover:text-red-600"
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
