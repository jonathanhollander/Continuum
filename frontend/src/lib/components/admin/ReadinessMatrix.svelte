<script lang="ts">
    import { analyzeEstateHealth } from "$lib/utils/readiness";
    import { plural } from "$lib/utils/plural";
    import { CircleCheck, CircleDashed } from "lucide-svelte";

    // Follows each module's store as it syncs, so records saved from another browser show here too
    let modules = $derived(analyzeEstateHealth());
    let overallHealth = $derived(
        modules.length
            ? Math.round((modules.filter((m) => m.health === "healthy").length / modules.length) * 100)
            : 0,
    );
</script>

<div class="bg-card rounded-2xl border border-border shadow-sm p-8">
    <div class="flex items-center justify-between mb-8">
        <div>
            <h2 class="text-2xl font-bold text-foreground">
                Estate Readiness Matrix
            </h2>
            <p class="text-muted-foreground">
                System functionality and data population status.
            </p>
        </div>
        <div class="text-right">
            <div class="text-xs uppercase font-bold text-muted-foreground">
                Total Completion
            </div>
            <div class="text-3xl font-mono font-bold text-primary">
                {overallHealth}%
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each modules as mod}
            <div
                class="p-4 rounded-xl border flex items-center justify-between transition-all hover:shadow-md
                {mod.health === 'healthy'
                    ? 'bg-primary-soft border-primary/20'
                    : 'bg-muted border-border'}"
            >
                <div class="flex items-center gap-3">
                    {#if mod.health === "healthy"}
                        <div class="p-2 bg-card text-success rounded-lg">
                            <CircleCheck size={20} />
                        </div>
                    {:else}
                        <div class="p-2 bg-card text-muted-foreground rounded-lg">
                            <CircleDashed size={20} />
                        </div>
                    {/if}

                    <div>
                        <div class="font-bold text-sm text-foreground">
                            {mod.name}
                        </div>
                        <div class="text-xs text-muted-foreground">
                            {#if mod.hasData}
                                {plural(mod.itemCount, "item")} saved
                            {:else}
                                Ready when you are
                            {/if}
                        </div>
                    </div>
                </div>

                <a
                    href={mod.path}
                    class="text-xs font-bold underline text-primary-hover hover:text-foreground"
                >
                    Visit
                </a>
            </div>
        {/each}
    </div>
</div>
