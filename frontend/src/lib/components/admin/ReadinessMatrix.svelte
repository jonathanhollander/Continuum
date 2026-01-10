<script lang="ts">
    import { onMount } from "svelte";
    import {
        analyzeEstateHealth,
        type ModuleStatus,
    } from "$lib/utils/readiness";
    import { CircleCheck, CircleAlert, TriangleAlert } from "lucide-svelte";

    let modules: ModuleStatus[] = [];
    let overallHealth = 0;

    onMount(() => {
        modules = analyzeEstateHealth();
        const healthyCount = modules.filter(
            (m) => m.health === "healthy",
        ).length;
        overallHealth = Math.round((healthyCount / modules.length) * 100);
    });
</script>

<div class="bg-white rounded-3xl border border-stone-200 shadow-sm p-8">
    <div class="flex items-center justify-between mb-8">
        <div>
            <h2 class="text-2xl font-bold text-[#304743]">
                Estate Readiness Matrix
            </h2>
            <p class="text-stone-500">
                System functionality and data population status.
            </p>
        </div>
        <div class="text-right">
            <div class="text-xs uppercase font-bold text-stone-400">
                Total Completion
            </div>
            <div class="text-3xl font-mono font-bold text-[#4A7C74]">
                {overallHealth}%
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each modules as mod}
            <div
                class="p-4 rounded-xl border flex items-center justify-between transition-all hover:shadow-md
                {mod.health === 'healthy'
                    ? 'bg-emerald-50 border-emerald-100'
                    : mod.health === 'partial'
                      ? 'bg-amber-50 border-amber-100'
                      : 'bg-rose-50 border-rose-100'}"
            >
                <div class="flex items-center gap-3">
                    {#if mod.health === "healthy"}
                        <div
                            class="p-2 bg-emerald-100 text-emerald-700 rounded-lg"
                        >
                            <CircleCheck size={20} />
                        </div>
                    {:else if mod.health === "partial"}
                        <div class="p-2 bg-amber-100 text-amber-700 rounded-lg">
                            <TriangleAlert size={20} />
                        </div>
                    {:else}
                        <div class="p-2 bg-rose-100 text-rose-700 rounded-lg">
                            <CircleAlert size={20} />
                        </div>
                    {/if}

                    <div>
                        <div class="font-bold text-sm text-[#304743]">
                            {mod.name}
                        </div>
                        <div class="text-xs text-stone-500">
                            {#if mod.hasData}
                                {mod.itemCount} items found
                            {:else}
                                No data detected
                            {/if}
                        </div>
                    </div>
                </div>

                <a
                    href={mod.path}
                    class="text-xs font-bold underline opacity-50 hover:opacity-100"
                >
                    Visit
                </a>
            </div>
        {/each}
    </div>
</div>
