<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import { Trophy, Plus, Search, X, Pencil } from "lucide-svelte";
    import { timelineStore, type LifeEvent } from "$lib/stores/timelineStore";
    import { onMount } from "svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte"; // NEW IMPORT
    import { goto } from "$app/navigation";

    let searchTerm = "";
    let activeCategory = "All";
    const categories = [
        "All",
        "Career",
        "Personal",
        "Education",
        "Relationships",
        "Travel",
        "Other",
    ];

    $: accomplishments = $timelineStore.filter(
        (e) => e.type === "accomplishment",
    );

    $: filteredAccomplishments = accomplishments.filter((acc) => {
        const matchesSearch =
            acc.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            acc.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory =
            activeCategory === "All" || acc.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

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
                    on:click={() => (activeCategory = cat)}
                    class="px-4 py-1.5 rounded-full text-sm font-bold transition-all border
                    {activeCategory === cat
                        ? 'bg-amber-600 border-amber-600 text-white shadow-sm'
                        : 'bg-white border-stone-200 text-stone-500 hover:border-amber-200'}"
                >
                    {cat}
                </button>
            {/each}
        </div>

        <!-- Search -->
        <div class="relative w-full md:w-64">
            <Search
                size={16}
                class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
                type="text"
                bind:value={searchTerm}
                placeholder="Search accomplishments..."
                class="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 focus:border-amber-500 focus:ring-0 text-sm bg-white"
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
                        class="inline-block px-6 py-2 bg-amber-600 text-white font-bold rounded-full hover:bg-amber-700 transition-colors shadow-lg"
                    >
                        Go to Timeline to Add
                    </a>
                {:else}
                    <p class="text-stone-400 text-sm">
                        No matches found. Try clearing filters.
                    </p>
                {/if}
            </div>
        </div>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each filteredAccomplishments as acc (acc.id)}
                <div
                    in:scale={{ duration: 300, start: 0.95 }}
                    class="group bg-white rounded-2xl p-6 border border-stone-200 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all flex flex-col h-full overflow-hidden relative"
                >
                    <!-- Golden accent top -->
                    <div
                        class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 opacity-0 group-hover:opacity-100 transition-opacity"
                    ></div>

                    <div class="flex justify-between items-start mb-4">
                        <div
                            class="px-2.5 py-1 rounded-md bg-amber-50 text-[10px] font-black text-amber-600 tracking-wider uppercase border border-amber-100"
                        >
                            {acc.category || "Personal"}
                        </div>
                        <span class="text-xs font-bold text-stone-300">
                            {acc.year}
                        </span>
                    </div>

                    <h3
                        class="text-xl font-serif font-bold text-[#304743] mb-3 leading-tight group-hover:text-amber-700 transition-colors"
                    >
                        {acc.label}
                    </h3>

                    <p
                        class="text-stone-500 text-sm leading-relaxed mb-6 flex-grow line-clamp-3"
                    >
                        {acc.description || "No description provided."}
                    </p>

                    {#if acc.reflection}
                        <div class="mt-auto pt-4 border-t border-stone-50">
                            <div class="flex items-center gap-2 mb-2">
                                <span
                                    class="text-[10px] font-black text-stone-300 uppercase tracking-widest"
                                    >The Story</span
                                >
                            </div>
                            <p
                                class="text-xs text-stone-400 italic line-clamp-4 leading-relaxed"
                            >
                                "{acc.reflection}"
                            </p>
                        </div>
                    {/if}

                    <div class="mt-6 flex justify-end">
                        <a
                            href="/modules/timeline"
                            class="text-[10px] font-black text-amber-600 uppercase tracking-widest hover:underline"
                            >Edit in Timeline →</a
                        >
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>
