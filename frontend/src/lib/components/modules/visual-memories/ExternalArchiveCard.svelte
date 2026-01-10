<script lang="ts">
    import type { ExternalArchive } from "$lib/stores/visualMemoryStore";
    import {
        ExternalLink,
        HardDrive,
        Cloud,
        Key,
        Edit2,
        Trash2,
    } from "lucide-svelte";
    import { createEventDispatcher } from "svelte";

    export let archive: ExternalArchive;

    const dispatch = createEventDispatcher();

    // Helper to pick an icon based on platform name
    function getIcon(platform: string) {
        const p = platform.toLowerCase();
        if (p.includes("drive") || p.includes("usb") || p.includes("disk"))
            return HardDrive;
        if (p.includes("cloud") || p.includes("drive") || p.includes("photos"))
            return Cloud;
        return ExternalLink;
    }
</script>

<div
    class="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-all group relative"
>
    <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-3">
            <div
                class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
            >
                <svelte:component this={getIcon(archive.platform)} size={20} />
            </div>
            <div>
                <h3 class="font-bold text-slate-800">{archive.platform}</h3>
                <div
                    class="text-xs font-medium text-slate-400 uppercase tracking-wider"
                >
                    External Archive
                </div>
            </div>
        </div>

        <!-- Actions -->
        <div
            class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
            <button
                class="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#4A7C74] transition-colors"
                title="Edit"
                on:click={() => dispatch("edit", archive)}
            >
                <Edit2 size={16} />
            </button>
            <button
                class="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                title="Remove"
                on:click={() => dispatch("delete", archive.id)}
            >
                <Trash2 size={16} />
            </button>
        </div>
    </div>

    <div class="space-y-3">
        {#if archive.accessUrl}
            <a
                href={archive.accessUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 text-sm text-[#4A7C74] font-medium hover:underline"
            >
                <ExternalLink size={14} /> Open Location
            </a>
        {/if}

        <div class="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
            <div
                class="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1"
            >
                <Key size={12} /> Access Instructions
            </div>
            {archive.locationDetails}
        </div>
    </div>
</div>
