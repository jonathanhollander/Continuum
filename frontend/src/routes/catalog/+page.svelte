<script lang="ts">
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";
    import { Search, Grid, List as ListIcon } from "lucide-svelte";
    import { navGroups, catalogCategories, type NavItem } from "$lib/config/navigation";
    import { dict, userRole, language } from "$lib/stores/conciergeStore.svelte";

    // Card X127: every module from the sidebar (navGroups) and the catalog categories,
    // each once (by href), grouped like the sidebar. Catalog-only items join the group
    // the data settings page gives them (legacy -> My Legacy, tools -> Extras).
    const SELF = "/catalog";
    const catalogGroup: Record<string, string> = { legacy: "groupMyLegacy", tools: "groupExtras" };
    const selfItem = navGroups.flatMap((g) => g.items).find((i) => i.href === SELF);

    // Same rule as the sidebar: English shows the label, other languages read the dictionary.
    const text = (key: string, fallback: string) =>
        $language === "en" ? fallback : ($dict as Record<string, string>)[key] || fallback;

    let groups = $derived.by(() => {
        const role = $userRole;
        const seen = new Set<string>([SELF]);
        const out = navGroups.map((g) => ({ group: g, items: [] as NavItem[] }));
        const add = (groupKey: string, item: NavItem) => {
            if (seen.has(item.href) || !item.allowedRoles.includes(role)) return;
            const target = out.find((x) => x.group.groupKey === groupKey);
            if (!target) return;
            seen.add(item.href);
            target.items.push(item);
        };
        for (const g of navGroups) for (const item of g.items) add(g.groupKey, item);
        for (const c of catalogCategories) for (const item of c.items) add(catalogGroup[c.id], item);
        return out.filter((x) => x.items.length > 0);
    });

    let searchQuery = $state("");
    let viewMode = $state<"grid" | "list">("grid");

    let shownGroups = $derived.by(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return groups;
        return groups
            .map((x) => ({
                ...x,
                items: x.items.filter(
                    (i) =>
                        text(i.key, i.label).toLowerCase().includes(q) ||
                        (i.tooltip ?? "").toLowerCase().includes(q),
                ),
            }))
            .filter((x) => x.items.length > 0);
    });
</script>

<div class="min-h-screen bg-background pb-20">
    <LivingBlueprintHeader
        title={text("catalog", selfItem?.label ?? "")}
        subtitle={selfItem?.tooltip}
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
                    placeholder="Find what you need..."
                    class="w-full bg-card border border-border rounded pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                />
            </div>

            <div
                class="flex items-center gap-2 border border-border rounded p-1 bg-card"
            >
                <button
                    onclick={() => (viewMode = "grid")}
                    aria-label="Grid"
                    class={`p-2 rounded ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
                >
                    <Grid size={16} />
                </button>
                <button
                    onclick={() => (viewMode = "list")}
                    aria-label="List"
                    class={`p-2 rounded ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
                >
                    <ListIcon size={16} />
                </button>
            </div>
        </div>

        <div class="space-y-12">
            {#each shownGroups as { group, items } (group.groupKey)}
                <section data-testid="catalog-group">
                    <div class="mb-5 border-b border-border/50 pb-3">
                        <h2 class="text-xl font-serif">
                            {text(group.groupKey, group.groupLabel)}
                        </h2>
                        {#if group.groupDescription}
                            <p class="text-sm text-muted-foreground mt-1">
                                {group.groupDescription}
                            </p>
                        {/if}
                    </div>

                    {#if viewMode === "grid"}
                        <div
                            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {#each items as item (item.href)}
                                <a href={item.href} class="block group h-full">
                                    <div
                                        class="bg-card border border-border p-6 rounded-lg h-full hover:border-primary/50 transition-all hover:shadow-lg relative overflow-hidden group-hover:-translate-y-1"
                                    >
                                        <div
                                            class="size-10 mb-4 rounded bg-primary/5 flex items-center justify-center text-primary"
                                        >
                                            <svelte:component this={item.icon} size={20} />
                                        </div>
                                        <h3
                                            class="text-lg font-serif mb-2 group-hover:text-primary transition-colors"
                                        >
                                            {text(item.key, item.label)}
                                        </h3>
                                        {#if item.isPreview}
                                            <span
                                                class="inline-block mb-2 text-xs font-medium px-2 py-0.5 rounded-md bg-secondary/10 text-muted-foreground"
                                                data-testid="preview-tag">Early preview</span
                                            >
                                        {/if}
                                        {#if item.tooltip}
                                            <p
                                                class="text-sm text-muted-foreground line-clamp-2"
                                            >
                                                {item.tooltip}
                                            </p>
                                        {/if}
                                    </div>
                                </a>
                            {/each}
                        </div>
                    {:else}
                        <div class="space-y-2">
                            {#each items as item (item.href)}
                                <a
                                    href={item.href}
                                    class="flex items-center gap-4 p-4 bg-card border border-border rounded hover:border-primary/50 transition-colors group"
                                >
                                    <div
                                        class="size-8 rounded bg-primary/5 flex items-center justify-center text-primary"
                                    >
                                        <svelte:component this={item.icon} size={16} />
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <h3
                                            class="font-medium truncate group-hover:text-primary transition-colors"
                                        >
                                            {text(item.key, item.label)}
                                        </h3>
                                        {#if item.isPreview}
                                            <span
                                                class="inline-block mt-0.5 text-xs font-medium px-2 py-0.5 rounded-md bg-secondary/10 text-muted-foreground"
                                                data-testid="preview-tag">Early preview</span
                                            >
                                        {/if}
                                        {#if item.tooltip}
                                            <p class="text-xs text-muted-foreground truncate">
                                                {item.tooltip}
                                            </p>
                                        {/if}
                                    </div>
                                </a>
                            {/each}
                        </div>
                    {/if}
                </section>
            {/each}
        </div>
    </div>
</div>
