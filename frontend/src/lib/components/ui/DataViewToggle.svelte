<script lang="ts">
    /**
     * DataViewToggle Component
     *
     * Toggle button for switching between Card and Table views.
     * Persists user preference to the backend via userPreferencesStore.
     *
     * Usage:
     * <DataViewToggle module="contacts" />
     */
    import { LayoutGrid, Table } from "lucide-svelte";
    import { userPreferencesStore, type ViewMode } from "$lib/stores/userPreferencesStore.svelte";
    import { onMount } from "svelte";

    interface Props {
        /** Module identifier for preference storage (e.g., "contacts", "medical") */
        module: string;
        /** Optional callback when view mode changes */
        onchange?: (mode: ViewMode) => void;
    }

    let { module, onchange }: Props = $props();

    // Local state that syncs with store
    let viewMode = $state<ViewMode>('card');

    // Initialize store and sync local state
    onMount(async () => {
        await userPreferencesStore.init();
        viewMode = userPreferencesStore.getViewMode(module);
    });

    // Keep local state in sync with store
    $effect(() => {
        if (userPreferencesStore.isInitialized) {
            viewMode = userPreferencesStore.getViewMode(module);
        }
    });

    async function setViewMode(mode: ViewMode) {
        viewMode = mode; // Optimistic update
        await userPreferencesStore.setViewMode(module, mode);
        onchange?.(mode);
    }
</script>

<div class="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
    <button
        onclick={() => setViewMode('card')}
        class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
               {viewMode === 'card' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}"
        title="Card view"
        aria-pressed={viewMode === 'card'}
    >
        <LayoutGrid size={16} />
        <span class="hidden sm:inline">Cards</span>
    </button>
    <button
        onclick={() => setViewMode('table')}
        class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
               {viewMode === 'table' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}"
        title="Table view"
        aria-pressed={viewMode === 'table'}
    >
        <Table size={16} />
        <span class="hidden sm:inline">Table</span>
    </button>
</div>
