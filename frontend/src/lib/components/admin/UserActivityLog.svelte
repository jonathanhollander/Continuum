<script lang="ts">
    import { engagementLog } from "$lib/stores/concierge";
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

<div class="bg-white rounded-3xl border border-stone-200 shadow-sm p-8">
    <div class="flex items-center gap-3 mb-6">
        <div class="p-2 bg-stone-100 rounded-lg text-stone-600">
            <Activity size={20} />
        </div>
        <div>
            <h3 class="font-bold text-lg text-[#304743]">User Activity Log</h3>
            <p class="text-xs text-gray-500">Real-time session interactions</p>
        </div>
        <div class="ml-auto text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
            {$engagementLog.length} events
        </div>
    </div>

    <div class="h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {#if $engagementLog.length === 0}
            <div class="text-center py-10 text-gray-400 italic text-sm">
                No activity recorded yet for this session.
            </div>
        {:else}
            {#each [...$engagementLog].reverse() as log, i}
                <div
                    in:slide={{ duration: 200 }}
                    class="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-sm"
                >
                    <div class="shrink-0 flex flex-col items-center mt-0.5">
                        <Clock size={12} class="text-gray-400 mb-1" />
                        <span class="text-[10px] font-mono text-gray-500"
                            >{formatTime(log.timestamp)}</span
                        >
                    </div>

                    <div class="flex-1 min-w-0">
                        <div class="font-semibold text-gray-700">
                            {log.action}
                        </div>
                        {#if log.details}
                            <div
                                class="text-gray-500 text-xs mt-0.5 truncate"
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
        background-color: #e5e7eb;
        border-radius: 20px;
    }
</style>
