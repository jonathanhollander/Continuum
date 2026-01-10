<script lang="ts">
    import { X, Trash2, Tag, SquareCheck } from "lucide-svelte";
    import { createEventDispatcher } from "svelte";
    import { fly } from "svelte/transition";

    export let selectedCount: number = 0;

    const dispatch = createEventDispatcher();

    let showTagInput = false;
    let newTag = "";

    function handleAddTag() {
        if (!newTag) return;
        dispatch("tag", newTag);
        newTag = "";
        showTagInput = false;
    }
</script>

{#if selectedCount > 0}
    <div
        class="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 z-50 backdrop-blur-md bg-opacity-90 border border-slate-700/50"
        transition:fly={{ y: 50, duration: 300 }}
    >
        <div class="flex items-center gap-3 border-r border-slate-700 pr-6">
            <span
                class="bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[24px] text-center"
            >
                {selectedCount}
            </span>
            <span class="font-medium text-sm">Selected</span>
        </div>

        <div class="flex items-center gap-2">
            {#if showTagInput}
                <div
                    class="flex items-center gap-2 animate-in slide-in-from-right-4 fade-in"
                >
                    <input
                        type="text"
                        bind:value={newTag}
                        placeholder="Enter tag..."
                        class="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500 w-32 placeholder:text-slate-500"
                        on:keydown={(e) => e.key === "Enter" && handleAddTag()}
                        autoFocus
                    />
                    <button
                        class="p-1.5 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white transition-colors"
                        on:click={handleAddTag}
                    >
                        <SquareCheck size={16} />
                    </button>
                    <button
                        class="p-1.5 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white transition-colors"
                        on:click={() => (showTagInput = false)}
                    >
                        <X size={16} />
                    </button>
                </div>
            {:else}
                <button
                    class="flex items-center gap-2 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
                    on:click={() => (showTagInput = true)}
                >
                    <Tag size={16} />
                    <span>Tag</span>
                </button>
            {/if}

            <button
                class="flex items-center gap-2 px-3 py-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors text-sm font-medium"
                on:click={() => dispatch("delete")}
            >
                <Trash2 size={16} />
                <span>Delete</span>
            </button>
        </div>

        <button
            class="ml-2 hover:bg-slate-800 p-2 rounded-full transition-colors"
            on:click={() => dispatch("clear")}
            title="Clear Selection"
        >
            <X size={16} />
        </button>
    </div>
{/if}
