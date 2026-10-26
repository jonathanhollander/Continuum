<script lang="ts">
    import { Plus } from "lucide-svelte";
    import { fade } from "svelte/transition";

    let {
        type = "Item",
        name = "",
        subtitle = "",
        value = null,
        onclick,
        onClick,
        icon,
    } = $props<{
        type?: string;
        name?: string;
        subtitle?: string;
        value?: number | null;
        onclick?: () => void;
        onClick?: () => void;
        icon?: import("svelte").Snippet;
    }>();

    // Support both onclick and onClick prop naming conventions
    const handleClick = onclick || onClick;
</script>

<!-- 
    GHOST ROW COMPONENT 
    A clickable, empty-state placeholder that mimics a real data row but at lower opacity.
-->
<button
    onclick={handleClick}
    class="@container w-full text-left group relative overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300 transition-all duration-300"
    in:fade
>
    <div
        class="p-4 grid grid-cols-[2.5rem_minmax(0,1fr)] @md:grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 opacity-50 group-hover:opacity-80 transition-opacity"
    >
        <!-- Pseudo Icon Placeholder -->
        <div
            class="w-10 h-10 rounded-full bg-slate-200 group-hover:bg-indigo-100 transition-colors flex items-center justify-center shrink-0"
        >
            {#if icon}
                {@render icon()}
            {:else}
                <Plus
                    size={20}
                    class="text-slate-400 group-hover:text-indigo-500"
                />
            {/if}
        </div>

        <div class="min-w-0 space-y-1">
            {#if name}
                <!-- Smart Sample Data -->
                <div class="font-bold text-slate-700 break-words">{name}</div>
                {#if subtitle}
                    <div class="text-xs text-slate-500 break-words">{subtitle}</div>
                {/if}
            {:else}
                <!-- Unnamed example: the example label itself is the title -->
                <div class="font-bold text-slate-700">Example {type}</div>
            {/if}
        </div>

        {#if value !== null}
            <div
                class="col-start-2 @md:col-start-auto justify-self-start @md:justify-self-end whitespace-nowrap font-serif font-bold text-slate-400 group-hover:text-indigo-600 transition-colors"
            >
                ${value.toLocaleString()}
            </div>
        {:else if name}
            <!-- Call to Action Badge -->
            <div
                class="col-start-2 @md:col-start-auto justify-self-start @md:justify-self-end shrink-0 whitespace-nowrap px-3 py-1 rounded-full bg-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:bg-indigo-500 group-hover:text-white transition-colors shadow-sm"
            >
                Example {type}
            </div>
        {/if}
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
