<script lang="ts">
    import { onMount } from "svelte";
    import { estateAudit } from "$lib/stores/auditStore";
    import { TriangleAlert, Clock, Activity, ShieldAlert } from "lucide-svelte";

    onMount(() => {
        estateAudit.runAudit();
    });

    let audit = $derived($estateAudit);
</script>

<div class="space-y-8">
    <div
        class="flex items-center justify-between border-b border-slate-800 pb-8"
    >
        <div>
            <h2 class="text-3xl font-bold text-white mb-2">
                Data Health Center
            </h2>
            <p class="text-slate-400">
                Deep diagnostics to detect data rot, missing metadata, and
                security risks.
            </p>
        </div>
        <div
            class="flex items-center gap-3 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20"
        >
            <ShieldAlert class="text-red-500" size={24} />
            <div>
                <div class="text-xs text-red-400 uppercase font-bold">
                    Risk Level
                </div>
                <div class="text-lg font-bold text-white">
                    {audit.issues.length > 5
                        ? "High"
                        : audit.issues.length > 0
                          ? "Moderate"
                          : "Low"}
                </div>
            </div>
        </div>
    </div>

    <!-- Red Flags Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section class="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3
                class="flex items-center gap-2 text-lg font-bold text-white mb-6"
            >
                <TriangleAlert class="text-amber-500" size={20} />
                Critical Metadata Gaps
            </h3>

            {#if audit.issues.length === 0}
                <div
                    class="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm flex items-center gap-2"
                >
                    <Activity size={16} /> All systems nominal. No gaps detected.
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

        <!-- Zombie Data (Staleness) -->
        <section class="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3
                class="flex items-center gap-2 text-lg font-bold text-white mb-6"
            >
                <Clock class="text-blue-500" size={20} />
                Stale Data ("Zombie" Records)
            </h3>

            <p class="text-sm text-slate-500 mb-4">
                Records that haven't been updated in over 180 days risk becoming
                obsolete.
            </p>

            {#if audit.zombieData.length === 0}
                <div
                    class="p-8 text-center border-2 border-dashed border-slate-800 rounded-lg"
                >
                    <div class="text-lg font-bold text-slate-700">
                        No Zombie Data Detected
                    </div>
                    <div class="text-xs text-slate-600">
                        Timestamp data mock not yet active
                    </div>
                </div>
            {:else}
                <!-- Future implementation for version 4.1 -->
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
