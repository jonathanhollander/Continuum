<script lang="ts">
    import { onMount } from "svelte";
    import { estateAudit } from "$lib/stores/auditStore";
    import { CircleCheck, Circle, ArrowRight } from "lucide-svelte";

    onMount(() => {
        estateAudit.runAudit();
    });

    $: audit = $estateAudit;
    $: completionColor =
        audit.percentage === 100 ? "text-emerald-400" : "text-blue-400";
    $: ringColor =
        audit.percentage === 100 ? "stroke-emerald-500" : "stroke-blue-500";
</script>

<!-- Header Section -->
<div class="flex items-center justify-between mb-12">
    <div>
        <h2 class="text-3xl font-bold text-white mb-2">Estate Readiness Hub</h2>
        <p class="text-slate-400 max-w-2xl">
            Track the completion status of every critical module in the estate.
            This replaces the traditional "rollout" view with a live data
            readiness check.
        </p>
    </div>

    <!-- Big Score Ring -->
    <div class="relative flex items-center justify-center">
        <svg class="transform -rotate-90 w-32 h-32">
            <circle
                cx="64"
                cy="64"
                r="60"
                stroke="currentColor"
                stroke-width="8"
                fill="transparent"
                class="text-slate-800"
            />
            <circle
                cx="64"
                cy="64"
                r="60"
                stroke="currentColor"
                stroke-width="8"
                fill="transparent"
                class="{ringColor} transition-all duration-1000 ease-out"
                stroke-dasharray={2 * Math.PI * 60}
                stroke-dashoffset={2 *
                    Math.PI *
                    60 *
                    (1 - audit.percentage / 100)}
            />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-3xl font-bold text-white"
                >{audit.percentage}%</span
            >
            <span class="text-[10px] uppercase tracking-widest text-slate-500"
                >Ready</span
            >
        </div>
    </div>
</div>

<!-- Module Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each Object.entries(audit.moduleScores) as [id, score], i}
        <div
            class="bg-slate-900 border border-slate-800 rounded-xl p-6 relative group hover:border-slate-700 transition-all"
        >
            <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold text-white capitalize">{id} Data</h3>
                <span
                    class="text-xs font-mono px-2 py-1 rounded bg-slate-800 text-slate-300"
                >
                    {score} pts
                </span>
            </div>

            <!-- Mini Progress Bar -->
            <div class="h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
                <div
                    class="h-full bg-blue-500 transition-all duration-500"
                    style="width: {(score / 50) * 100}%"
                ></div>
                <!-- Note: simplified max score visualization, assume roughly 50-ish per mod for visual -->
            </div>

            <p class="text-sm text-slate-400 mb-4">
                {#if score === 0}
                    Critical data missing.
                {:else if score < 30}
                    Partially complete.
                {:else}
                    Excellent coverage.
                {/if}
            </p>

            <div class="flex justify-end">
                <a
                    href="/modules/{id === 'financial'
                        ? 'financial-accounts'
                        : id === 'legal'
                          ? 'legal-documents'
                          : id}"
                    class="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                >
                    Go to Module <ArrowRight size={12} />
                </a>
            </div>
        </div>
    {/each}
</div>

<!-- Action Cards -->
{#if audit.issues.length > 0}
    <div class="mt-12">
        <h3 class="text-xl font-bold text-white mb-6">Priority Actions</h3>
        <div class="space-y-3">
            {#each audit.issues.slice(0, 5) as issue}
                <div
                    class="flex items-center gap-4 p-4 bg-slate-900/50 border-l-4 border-amber-500 rounded-r-lg"
                >
                    <CircleCheck class="text-amber-500 shrink-0" size={20} />
                    <span class="text-slate-300 text-sm font-medium"
                        >{issue}</span
                    >
                </div>
            {/each}
        </div>
    </div>
{/if}
