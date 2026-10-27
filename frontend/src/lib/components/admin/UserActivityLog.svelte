<script lang="ts">
    import { engagementLog } from "$lib/stores/conciergeStore.svelte";
    import { Clock, Activity } from "lucide-svelte";
    import { slide } from "svelte/transition";

    // Format timestamp to readable time
    function formatTime(ts: number) {
        return new Date(ts).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    }
</script>

<div class="bg-card rounded-2xl border border-border shadow-sm p-8">
    <div class="flex items-center gap-3 mb-6">
        <div class="p-2 bg-primary-soft rounded-lg text-primary">
            <Activity size={20} />
        </div>
        <div>
            <h3 class="font-bold text-lg text-foreground">This Session's Activity</h3>
            <p class="text-xs text-muted-foreground">Actions in this browser session</p>
        </div>
        <div class="ml-auto text-xs text-muted-foreground bg-background px-2 py-1 rounded">
            {$engagementLog.length} events
        </div>
    </div>

    <div class="h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {#if $engagementLog.length === 0}
            <div class="text-center py-10 text-muted-foreground italic text-sm">
                Activity from this session will appear here.
            </div>
        {:else}
            {#each [...$engagementLog].reverse() as log, i}
                <div
                    in:slide={{ duration: 200 }}
                    class="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-background transition-colors text-sm"
                >
                    <div class="shrink-0 flex flex-col items-center mt-0.5">
                        <Clock size={12} class="text-muted-foreground mb-1" />
                        <span class="text-[10px] font-mono text-muted-foreground"
                            >{formatTime(log.timestamp)}</span
                        >
                    </div>

                    <div class="flex-1 min-w-0">
                        <div class="font-semibold text-foreground">
                            {log.action}
                        </div>
                        {#if log.details}
                            <div
                                class="text-muted-foreground text-xs mt-0.5 truncate"
                                title={log.details}
                            >
                                {log.details}
                            </div>
                        {/if}
                    </div>
                </div>
            {/each}
        {/if}
    </div>
</div>

<style>
    /* Custom Scrollbar for cleaner look */
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: var(--color-border);
        border-radius: 20px;
    }
</style>
