<script lang="ts">
    import { onMount } from "svelte";
    import { Clock, Smartphone, Globe, Mail } from "lucide-svelte";
    import { fade } from "svelte/transition";

    const USER_ID = 1;

    let history = $state<any[]>([]);
    let loading = $state(true);

    onMount(async () => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE || "http://localhost:8000"}/api/pulse/history?user_id=${USER_ID}&limit=20`,
            );
            if (res.ok) {
                history = await res.json();
            }
        } finally {
            loading = false;
        }
    });

    function getMethodIcon(method: string) {
        switch (method) {
            case "manual":
                return Smartphone;
            case "web":
                return Globe;
            case "email":
                return Mail;
            default:
                return Clock;
        }
    }
</script>

<div class="max-w-4xl mx-auto p-4 md:p-8">
    <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-serif text-slate-100 flex items-center gap-2">
            <Clock class="text-teal-400" />
            Check-in History
        </h1>
        <a
            href="/modules/pulse"
            class="text-sm text-teal-400 hover:text-teal-300 transition-colors"
            >Back to Dashboard</a
        >
    </div>

    {#if loading}
        <div class="space-y-4">
            {#each Array(3) as _}
                <div
                    class="h-16 bg-slate-900/50 rounded-xl animate-pulse"
                ></div>
            {/each}
        </div>
    {:else if history.length > 0}
        <div class="space-y-4">
            {#each history as checkin (checkin.id)}
                <div
                    class="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:bg-slate-800/80 transition-colors"
                    in:fade
                >
                    <div class="flex items-center gap-4">
                        <div
                            class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400"
                        >
                            <svelte:component
                                this={getMethodIcon(checkin.method)}
                                class="w-5 h-5"
                            />
                        </div>
                        <div>
                            <div class="text-slate-200 font-medium">
                                {checkin.note
                                    ? `Note: ${checkin.note}`
                                    : "Routine Check-in"}
                            </div>
                            <div class="text-xs text-slate-500 font-mono">
                                {new Date(checkin.timestamp).toLocaleString(
                                    undefined,
                                    { dateStyle: "full", timeStyle: "short" },
                                )}
                            </div>
                        </div>
                    </div>
                    <div
                        class="text-xs font-bold text-teal-500 uppercase tracking-wider bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20"
                    >
                        Verified
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <div
            class="text-center py-12 text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800/50 dashed"
        >
            <Clock class="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No check-in history found.</p>
        </div>
    {/if}
</div>
