<script lang="ts">
    import { onMount } from "svelte";
    import { estateAudit } from "$lib/stores/auditStore.svelte";
    import { TriangleAlert, Activity, ShieldAlert } from "lucide-svelte";

    onMount(() => {
        estateAudit.runAudit();
    });

    let audit = $derived($estateAudit);
    // The level box takes the level's colour (it was red even at Low)
    const tones = {
        High: { box: "bg-red-500/10 border-red-500/20", icon: "text-red-500", label: "text-red-400" },
        Moderate: { box: "bg-amber-500/10 border-amber-500/20", icon: "text-amber-500", label: "text-amber-400" },
        Low: { box: "bg-emerald-500/10 border-emerald-500/20", icon: "text-emerald-500", label: "text-emerald-400" },
    };
    let level = $derived(
        audit.issues.length > 5 ? "High" : audit.issues.length > 0 ? "Moderate" : "Low",
    );
    let levelTone = $derived(tones[level as keyof typeof tones]);
</script>

<div class="space-y-8">
    <div
        class="flex items-center justify-between border-b border-slate-800 pb-8"
    >
        <div>
            <h1 class="text-3xl font-bold text-white mb-2">
                Data Health Center
            </h1>
            <p class="text-slate-400">
                A look at how current each record is.
            </p>
        </div>
        <div
            class="flex items-center gap-3 px-4 py-2 rounded-lg border {levelTone.box}"
        >
            <ShieldAlert class={levelTone.icon} size={24} />
            <div>
                <div class="text-xs uppercase font-bold {levelTone.label}">
                    Care Level
                </div>
                <div class="text-lg font-bold text-white">
                    {level}
                </div>
            </div>
        </div>
    </div>

    <!-- Red Flags Grid -->
    <div class="grid grid-cols-1 gap-6">
        <section class="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3
                class="flex items-center gap-2 text-lg font-bold text-white mb-6"
            >
                <TriangleAlert class="text-amber-500" size={20} />
                Records worth a closer look
            </h3>

            {#if audit.issues.length === 0}
                <div
                    class="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm flex items-center gap-2"
                >
                    <Activity size={16} /> Everything is current.
                </div>
            {:else}
                <ul class="space-y-2">
                    {#each audit.issues as issue}
                        <li
                            class="flex items-start gap-3 p-3 bg-slate-950 rounded border border-slate-800"
                        >
                            <span
                                class="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0"
                            ></span>
                            <span class="text-sm text-slate-300">{issue}</span>
                        </li>
                    {/each}
                </ul>
            {/if}
        </section>

    </div>

    <!-- JSON Inspector (Developer Tool) -->
    <section
        class="bg-slate-950 border border-slate-800 rounded-xl p-6 overflow-hidden"
    >
        <h3
            class="text-sm font-mono text-slate-500 mb-4 uppercase tracking-wider"
        >
            Raw Audit Telemetry
        </h3>
        <pre
            class="text-xs text-emerald-500 font-mono overflow-x-auto p-4 bg-slate-900 rounded-lg border border-slate-800 max-h-64">
{JSON.stringify(audit, null, 2)}
        </pre>
    </section>
</div>
