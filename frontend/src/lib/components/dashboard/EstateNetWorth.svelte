<script lang="ts">
    import { onMount } from "svelte";
    import { TrendingUp, TriangleAlert, DollarSign } from "lucide-svelte";
    import { fade } from "svelte/transition";

    import { getStored } from "$lib/stores/persistence";

    // ... imports

    let totalValue = 0;
    let hasAssets = false;
    let loading = true;

    onMount(() => {
        // Read from the same key used in Financial Accounts -> AssetManager
        // Using getStored ensures we read from the current account/profile context
        const assets = getStored<any[]>("assets_assets-main", []);

        if (assets && assets.length > 0) {
            try {
                totalValue = assets.reduce(
                    (sum: number, asset: any) =>
                        sum +
                        (Number(asset.value) || 0) *
                            ((asset.ownershipPercentage || 100) / 100),
                    0,
                );
                hasAssets = true;
            } catch (e) {
                console.error("Failed to parse asset data", e);
            }
        }
        loading = false;
    });
</script>

<div
    class="p-6 rounded-xl bg-gray-50 border border-gray-100 h-full flex flex-col justify-between group hover:border-primary/20 transition-colors cursor-pointer"
    on:click={() => (window.location.href = "/modules/financial-accounts")}
>
    <div>
        <div
            class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"
        >
            Estate Net Worth
            {#if !loading && hasAssets}
                <span class="w-2 h-2 rounded-full bg-primary animate-pulse"
                ></span>
            {/if}
        </div>

        {#if loading}
            <div class="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
        {:else}
            <div
                class="text-3xl font-serif font-bold text-primary tracking-tight"
                in:fade
            >
                {#if totalValue > 0}
                    {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                    }).format(totalValue)}
                {:else}
                    $0.00
                {/if}
            </div>
        {/if}
    </div>

    <div class="mt-4 pt-4 border-t border-gray-100">
        {#if !hasAssets}
            <div
                class="text-xs text-orange-500 font-medium flex items-center gap-1.5 bg-orange-50 px-2 py-1.5 rounded-md w-fit"
            >
                <TriangleAlert size={12} /> Needs Valuation
            </div>
        {:else}
            <div
                class="text-xs text-primary font-medium flex items-center gap-1.5 bg-primary/10 px-2 py-1.5 rounded-md w-fit"
            >
                <TrendingUp size={12} />
                <span class="font-bold">Tracking Active</span>
            </div>
        {/if}
    </div>
</div>
