<script lang="ts">
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";

    import MechanicalIcon from "$lib/components/MechanicalIcon.svelte";
    import * as registryRaw from "$lib/data/registry.json";
    import { Search, Grid, List as ListIcon } from "lucide-svelte";

    // Robustly extract the array from the import, handling potential default export wrappers
    const registryData = (registryRaw as any).default || registryRaw;

    // Ensure registry is an array
    const registry = Array.isArray(registryData)
        ? registryData
        : Object.values(registryData).filter((x) => typeof x === "object");

    let searchQuery = "";
    let viewMode: "grid" | "list" = "grid";
    // FIX: Initialize with data, not empty array
    let filteredModules = registry;

    $: {
        if (searchQuery.trim() === "") {
            filteredModules = registry;
        } else {
            filteredModules = registry.filter(
                (m) =>
                    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (m.description &&
                        m.description
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())),
            );
        }
    }
</script>

<div class="min-h-screen bg-background pb-20">
    <LivingBlueprintHeader
        title="Module Registry"
        subtitle={`${registry.length} System Components Loaded`}
        tier="preparation"
    />

    <div class="container mx-auto px-6 py-12">
        <!-- Controls -->
        <div
            class="flex flex-col md:flex-row gap-4 justify-between items-center mb-10"
        >
            <div class="relative w-full md:w-96">
                <Search
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4"
                />
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Search components..."
                    class="w-full bg-card border border-border rounded pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                />
            </div>

            <div
                class="flex items-center gap-2 border border-border rounded p-1 bg-card"
            >
                <button
                    on:click={() => (viewMode = "grid")}
                    class={`p-2 rounded ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
                >
                    <Grid size={16} />
                </button>
                <button
                    on:click={() => (viewMode = "list")}
                    class={`p-2 rounded ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
                >
                    <ListIcon size={16} />
                </button>
            </div>
        </div>

        <!-- Grid View -->
        {#if viewMode === "grid"}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each filteredModules as module (module.id)}
                    <a
                        href={`/modules/${module.id}`}
                        class="block group h-full"
                    >
                        <div
                            class="bg-card border border-border p-6 rounded-lg h-full hover:border-primary/50 transition-all hover:shadow-lg relative overflow-hidden group-hover:-translate-y-1"
                        >
                            <div class="flex items-start justify-between mb-4">
                                <div
                                    class="size-10 rounded bg-primary/5 flex items-center justify-center text-xl"
                                >
                                    {module.icon}
                                </div>
                                <span
                                    class="text-xs font-blueprint uppercase text-muted-foreground px-2 py-1 bg-secondary/10 rounded"
                                >
                                    {module.role}
                                </span>
                            </div>
                            <h3
                                class="text-lg font-serif mb-2 group-hover:text-primary transition-colors"
                            >
                                {module.title}
                            </h3>
                            <p
                                class="text-sm text-muted-foreground line-clamp-2"
                            >
                                {module.description}
                            </p>
                            <div
                                class="mt-4 pt-4 border-t border-border/50 flex justify-between items-center text-xs text-muted-foreground font-blueprint opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <span class="uppercase tracking-wider"
                                    >Access Module</span
                                >
                                <span>→</span>
                            </div>
                        </div>
                    </a>
                {/each}
            </div>
        {/if}

        <!-- List View -->
        {#if viewMode === "list"}
            <div class="space-y-2">
                {#each filteredModules as module (module.id)}
                    <a
                        href={`/modules/${module.id}`}
                        class="flex items-center gap-4 p-4 bg-card border border-border rounded hover:border-primary/50 transition-colors group"
                    >
                        <div
                            class="size-8 rounded bg-primary/5 flex items-center justify-center text-lg"
                        >
                            {module.icon}
                        </div>
                        <div class="flex-1 min-w-0">
                            <h3
                                class="font-medium truncate group-hover:text-primary transition-colors"
                            >
                                {module.title}
                            </h3>
                            <p class="text-xs text-muted-foreground truncate">
                                {module.description}
                            </p>
                        </div>
                        <div
                            class="text-xs font-blueprint text-muted-foreground uppercase px-2"
                        >
                            {module.role}
                        </div>
                    </a>
                {/each}
            </div>
        {/if}

        {#if filteredModules.length === 0}
            <div class="text-center py-20 text-muted-foreground">
                <p>No modules found matching "{searchQuery}"</p>
            </div>
        {/if}
    </div>
</div>
