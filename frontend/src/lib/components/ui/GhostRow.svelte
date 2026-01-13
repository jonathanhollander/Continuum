<script lang="ts">
    import { Plus } from "lucide-svelte";
    import { fade } from "svelte/transition";

    export let type: string = "Item"; // e.g. "Family Member", "Asset"
    export let onClick: () => void;
</script>

<!-- 
    GHOST ROW COMPONENT 
    A clickable, empty-state placeholder that mimics a real data row but at lower opacity.
-->
<button
    on:click={onClick}
    class="w-full text-left group relative overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300 transition-all duration-300"
    in:fade
>
    <div
        class="p-4 flex items-center gap-4 opacity-50 group-hover:opacity-80 transition-opacity"
    >
        <!-- Pseudo Icon Placeholder -->
        <div
            class="w-10 h-10 rounded-full bg-slate-200 group-hover:bg-indigo-100 transition-colors flex items-center justify-center"
        >
            <Plus
                size={20}
                class="text-slate-400 group-hover:text-indigo-500"
            />
        </div>

        <div class="flex-1 space-y-2">
            <!-- Pseudo Text Lines -->
            <div class="h-4 w-1/3 bg-slate-200 rounded animate-pulse"></div>
            <div class="h-3 w-1/2 bg-slate-100 rounded"></div>
        </div>

        <!-- Call to Action Badge -->
        <div
            class="px-3 py-1 rounded-full bg-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:bg-indigo-500 group-hover:text-white transition-colors shadow-sm"
        >
            Example {type}
        </div>
    </div>

    <!-- Hover Overlay Text -->
    <div
        class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/60 backdrop-blur-[1px]"
    >
        <span class="font-bold text-indigo-600 text-sm flex items-center gap-2">
            <Plus size={16} /> Click to Add Real {type}
        </span>
    </div>
</button>
