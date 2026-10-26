<script lang="ts">
    import { genesisStore } from "$lib/stores/genesisStore";
    import { Layers, Box } from "lucide-svelte";

    // Toggle God Mode
    function toggle() {
        genesisStore.setGodMode(!$genesisStore.isGodMode);
    }
</script>

<button
    class="flex items-center gap-3 bg-slate-800/50 hover:bg-slate-800 backdrop-blur-md border border-white/10 rounded-full pl-1 pr-4 py-1 transition-all group"
    on:click={toggle}
>
    <!-- Switch -->
    <div
        class="w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-lg
        {$genesisStore.isGodMode
            ? 'bg-indigo-500 text-white translate-x-32 rotate-180'
            : 'bg-slate-700 text-slate-400'}"
    >
        {#if $genesisStore.isGodMode}
            <Layers size={14} />
        {:else}
            <Box size={14} />
        {/if}
    </div>

    <!-- Label -->
    <div class="flex flex-col items-start mr-auto ml-3">
        <span
            class="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors"
        >
            {$genesisStore.isGodMode ? "Focus Mode" : "Blueprint View"}
        </span>
    </div>
</button>
