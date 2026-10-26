<script lang="ts">
    import AssetManager from "$lib/components/archetypes/AssetManager.svelte";
    import { Sparkles, Plus } from "lucide-svelte";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";
    import LegalDisclaimer from "$lib/components/common/LegalDisclaimer.svelte";
    import ConciergeFlow from "$lib/components/concierge/ConciergeFlow.svelte";
    import Modal from "$lib/components/ui/Modal.svelte";
    import { financialAssetsSync } from "$lib/stores/financialAssetsStore.svelte";
    import { t } from "$lib/stores/localization";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";

    let showWizard = $state(false);
    let reloadKey = $state(0);

    // The financial_assets store owns this registry key (and its mapper).
    const assetSync: any = financialAssetsSync;

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
            // Last step: no logic, so the flow completes (next: "crypto" looped on itself).
        },
    ];

    // ConciergeFlow calls oncomplete with the answers (it dispatches no "complete" event).
    async function handleWizardComplete(answers: Record<string, any>) {
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

<Modal bind:open={showWizard} title={$t("wizard.start")} maxWidth="max-w-2xl">
    <ConciergeFlow
        steps={wizardSteps}
        oncomplete={handleWizardComplete}
    />
</Modal>

<div class="max-w-6xl mx-auto p-8">
    <LivingBlueprintHeader
        title={$t("assets")}
        subtitle="Manage bank accounts, investments, and liabilities"
        tier="financial"
        detailedDescription="Gathering your financial accounts in one place isn't just about numbers—it's about ensuring your family isn't left searching for resources they might desperately need. This clarity provides immediate stability during a time of uncertainty."
        whyMatters="Unclaimed assets and lost accounts are a common burden for grieving families. By documenting these now, you ensure resources go to supporting your loved ones rather than being lost to bureaucracy."
    >
        <button
            onclick={() => (showWizard = true)}
            class="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
        >
            <Sparkles size={16} />
            {$t("wizard.start")}
        </button>
    </LivingBlueprintHeader>


    <!-- AI Prompt Bar -->
    <div class="max-w-3xl mx-auto mb-8">
        <AIPromptBar context="financial" />
    </div>

    <!-- Core Manager -->
    {#key reloadKey}
        <AssetManager module={{ id: "assets-main" }} />
    {/key}
</div>
