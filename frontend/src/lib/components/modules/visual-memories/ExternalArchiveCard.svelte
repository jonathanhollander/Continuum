<script lang="ts">
    import type { ExternalArchive } from "$lib/stores/visualMemoryStore.svelte";
    import {
        ExternalLink,
        HardDrive,
        Cloud,
        Key,
        Edit2,
        Trash2,
    } from "lucide-svelte";

    let {
        archive,
        onedit,
        ondelete
    } = $props<{
        archive: ExternalArchive;
        onedit?: (archive: ExternalArchive) => void;
        ondelete?: (id: number) => void;
    }>();

    // Helper to pick an icon based on platform name
    function getIcon(platform: string) {
        const p = platform.toLowerCase();
        if (p.includes("drive") || p.includes("usb") || p.includes("disk"))
            return HardDrive;
        if (p.includes("cloud") || p.includes("drive") || p.includes("photos"))
            return Cloud;
        return ExternalLink;
    }
    const Icon = $derived(getIcon(archive.platform));
</script>

<div
    class="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-all group relative"
>
    <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-3">
            <div
                class="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
            >
                <Icon size={20} />
            </div>
            <div>
                <h3 class="font-bold text-foreground">{archive.platform}</h3>
                <div
                    class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                    External Archive
                </div>
            </div>
        </div>

        <!-- Actions -->
        <div
            class="flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
        >
            <button
                class="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                title="Edit"
                aria-label="Edit {archive.platform}"
                onclick={() => onedit?.(archive)}
            >
                <Edit2 size={16} />
            </button>
            <button
                class="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                title="Remove"
                aria-label="Remove {archive.platform}"
                onclick={() => ondelete?.(archive.id)}
            >
                <Trash2 size={16} />
            </button>
        </div>
    </div>

    <div class="space-y-3">
        {#if archive.access_url || archive.accessUrl}
            <a
                href={archive.access_url || archive.accessUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 text-sm text-primary font-medium hover:underline"
            >
                <ExternalLink size={14} /> Open Location
            </a>
        {/if}

        <div class="bg-muted rounded-lg p-3 text-sm text-muted-foreground">
            <div
                class="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase mb-1"
            >
                <Key size={12} /> Access Instructions
            </div>
            {archive.location_details || archive.locationDetails}
        </div>
    </div>
</div>
