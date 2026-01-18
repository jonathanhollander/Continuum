<script lang="ts">
    import AssetManager from "$lib/components/archetypes/AssetManager.svelte";
    import { Wallet, Search, ExternalLink, Sparkles } from "lucide-svelte";
    import LegalDisclaimer from "$lib/components/common/LegalDisclaimer.svelte";
    import ConciergeFlow from "$lib/components/concierge/ConciergeFlow.svelte"; // Moved inside
    import { registerSync } from "$lib/services/sync.svelte";
    import { t } from "$lib/stores/localization";
    import { fade, fly } from "svelte/transition";

    let showWizard = $state(false);
    let reloadKey = $state(0);

    // Initialize Sync Service for Financial Assets
    const assetSync = registerSync("financial_assets", "financial_assets");

    const wizardSteps = [
        {
            id: "intro",
            question: "wizard.start",
            type: "boolean" as const,
            logic: { yes: "check", no: "EXIT", next: "check" },
        },
        {
            id: "check",
            question: "wizard.financial_check",
            type: "boolean" as const,
            logic: { next: "savings" },
        },
        {
            id: "savings",
            question: "wizard.financial_savings",
            type: "boolean" as const,
            logic: { next: "retirement" },
        },
        {
            id: "retirement",
            question: "wizard.financial_401k",
            type: "boolean" as const,
            logic: { next: "crypto" },
        },
        {
            id: "crypto",
            question: "wizard.financial_crypto",
            type: "boolean" as const,
            logic: { next: "crypto" },
        },
    ];

    async function handleWizardComplete(event: CustomEvent) {
        const answers = event.detail;

        if (answers.intro === false) {
            showWizard = false;
            return;
        }

        const promises = [];

        // Logic Mapping - now using SyncManager
        if (answers.check)
            promises.push(
                assetSync.create(createAsset("Checking Account", "Financial")),
            );
        if (answers.savings)
            promises.push(
                assetSync.create(
                    createAsset("High Yield Savings", "Financial"),
                ),
            );
        if (answers.retirement)
            promises.push(
                assetSync.create(createAsset("401(k) / IRA", "Financial")),
            );
        if (answers.crypto)
            promises.push(
                assetSync.create(
                    createAsset("Hardware Wallet", "Financial", "Crypto"),
                ),
            );

        if (promises.length > 0) {
            await Promise.all(promises);
            reloadKey++; // Force refresh
        }

        showWizard = false;
    }

    function createAsset(name: string, type: string, note = "") {
        return {
            name,
            type,
            value: 0,
            location: "TBD",
            notes: note,
            valueHistory: [],
            beneficiaries: "",
        };
    }
</script>

{#if showWizard}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        transition:fade
    >
        <div class="w-full max-w-2xl relative" in:fly={{ y: 20 }}>
            <button
                class="absolute -top-12 right-0 text-white/50 hover:text-white"
                onclick={() => (showWizard = false)}>Close</button
            >
            <ConciergeFlow
                steps={wizardSteps}
                on:complete={handleWizardComplete}
            />
        </div>
    </div>
{/if}

<div class="max-w-6xl mx-auto p-8">
    <div class="mb-8 flex justify-between items-end">
        <div>
            <h1
                class="font-serif font-bold text-4xl text-[#304743] flex items-center gap-3"
            >
                <div class="p-3 bg-[#4A7C74]/10 rounded-xl text-[#4A7C74]">
                    <Wallet size={32} />
                </div>
                Assets & Wealth
            </h1>
            <p class="text-muted-foreground mt-2 ml-16 max-w-xl">
                The ledger of your life's work. Track checking accounts,
                retirement funds, and real estate so nothing gets lost.
            </p>
        </div>
        <button
            onclick={() => (showWizard = true)}
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-lg hover:bg-indigo-500 transition-all flex items-center gap-2"
        >
            <Sparkles size={16} />
            {$t("wizard.start")}
        </button>
    </div>

    <!-- Core Manager -->
    {#key reloadKey}
        <AssetManager module={{ id: "assets-main" }} />
    {/key}
</div>
