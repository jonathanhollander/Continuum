<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import { Trophy, Plus, Search, X, Pencil } from "lucide-svelte";
    import {
        timelineStore,
        type LifeEvent,
    } from "$lib/stores/timelineStore.svelte";
    import { onMount } from "svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte";
    import { goto } from "$app/navigation";

    let searchTerm = $state("");
    let activeCategory = $state("All");
    const categories = [
        "All",
        "Career",
        "Personal",
        "Education",
        "Relationships",
        "Travel",
        "Other",
    ];

    let accomplishments = $derived(
        timelineStore.items.filter((e) => e.type === "accomplishment"),
    );

    let filteredAccomplishments = $derived(
        accomplishments.filter((acc) => {
            const matchesSearch =
                acc.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                acc.description
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase());
            const matchesCategory =
                activeCategory === "All" || acc.category === activeCategory;
            return matchesSearch && matchesCategory;
        }),
    );

    // We don't implement the Add/Edit form here to keep it simple and centralized in Timeline for now,
    // but we can provide a link to the Timeline module or implement a simplified version later if needed.
    // For now, let's keep it as a viewing gallery.
</script>

<div class="space-y-8">
    <!-- Header/Controls -->
    <div class="flex flex-col md:flex-row gap-4 justify-between items-center">
        <!-- Categories -->
        <div class="flex flex-wrap gap-2">
            {#each categories as cat}
                <button
                    onclick={() => (activeCategory = cat)}
                    class="px-4 py-1.5 rounded-full text-sm font-bold transition-all border
                    {activeCategory === cat
                        ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                        : 'bg-card border-border text-muted-foreground hover:border-primary/40'}"
                >
                    {cat}
                </button>
            {/each}
        </div>

        <!-- Search -->
        <div class="relative w-full md:w-64">
            <Search
                size={16}
                class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
                type="text"
                bind:value={searchTerm}
                aria-label="Search accomplishments"
                placeholder="Search accomplishments..."
                class="w-full pl-10 pr-4 py-2 rounded-xl border border-border focus:border-primary focus:ring-0 text-sm bg-card"
            />
        </div>
    </div>

    {#if filteredAccomplishments.length === 0}
        <div class="space-y-4">
            <GhostRow
                type="Accomplishment"
                onClick={() => goto("/modules/timeline")}
            />
            <GhostRow
                type="Accomplishment"
                onClick={() => goto("/modules/timeline")}
            />
            <GhostRow
                type="Accomplishment"
                onClick={() => goto("/modules/timeline")}
            />

            <div class="flex justify-center mt-6">
                {#if !searchTerm && activeCategory === "All"}
                    <a
                        href="/modules/timeline"
                        class="inline-block px-6 py-2 bg-primary text-primary-foreground font-bold rounded-full hover:bg-primary-hover transition-colors shadow-lg"
                    >
                        Add on your Timeline
                    </a>
                {:else}
                    <p class="text-muted-foreground text-sm">
                        Clear the filters to see everything you've gathered.
                    </p>
                {/if}
            </div>
        </div>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each filteredAccomplishments as acc (acc.id)}
                <div
                    in:scale={{ duration: 300, start: 0.95 }}
                    class="group bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-xl hover:border-primary/40 transition-all flex flex-col h-full overflow-hidden relative"
                >
                    <!-- Golden accent top -->
                    <div
                        class="absolute top-0 left-0 w-full h-1 bg-gold opacity-0 group-hover:opacity-100 transition-opacity"
                    ></div>

                    <div class="flex justify-between items-start mb-4">
                        <div
                            class="px-2.5 py-1 rounded-md bg-primary-soft text-[10px] font-black text-primary-hover tracking-wider uppercase border border-primary/20"
                        >
                            {acc.category || "Personal"}
                        </div>
                        <span class="text-xs font-bold text-muted-foreground">
                            {acc.year}
                        </span>
                    </div>

                    <h3
                        class="text-xl font-serif font-bold text-primary-deep dark:text-primary-hover mb-3 leading-tight group-hover:text-primary-hover transition-colors"
                    >
                        {acc.label}
                    </h3>

                    <p
                        class="text-muted-foreground text-sm leading-relaxed mb-6 flex-grow line-clamp-3"
                    >
                        {acc.description || ""}
                    </p>

                    {#if acc.reflection}
                        <div class="mt-auto pt-4 border-t border-border">
                            <div class="flex items-center gap-2 mb-2">
                                <span
                                    class="text-[10px] font-black text-muted-foreground uppercase tracking-widest"
                                    >The Story</span
                                >
                            </div>
                            <p
                                class="text-xs text-muted-foreground italic line-clamp-4 leading-relaxed"
                            >
                                "{acc.reflection}"
                            </p>
                        </div>
                    {/if}

                    <div class="mt-6 flex justify-end">
                        <a
                            href="/modules/timeline"
                            class="text-[10px] font-black text-primary-hover uppercase tracking-widest hover:underline"
                            >Edit in Timeline →</a
                        >
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>
