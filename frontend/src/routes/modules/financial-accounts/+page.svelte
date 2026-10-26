<script lang="ts">
    import AssetManager from "$lib/components/archetypes/AssetManager.svelte";
    import { Sparkles, Plus, Loader2 } from "lucide-svelte";
    import { onMount } from "svelte";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";
    import LegalDisclaimer from "$lib/components/common/LegalDisclaimer.svelte";
    import ConciergeFlow from "$lib/components/concierge/ConciergeFlow.svelte";
    import Modal from "$lib/components/ui/Modal.svelte";
    import { financialAssetsSync } from "$lib/stores/financialAssetsStore.svelte";
    import { t } from "$lib/stores/localization";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import { notifications } from "$lib/stores/notificationStore";
    import { userRole } from "$lib/stores/conciergeStore.svelte";

    let showWizard = $state(false);
    // Add Asset lives beside Guided Setup; the manager below opens its form from this.
    let showAddForm = $state(false);
    let reloadKey = $state(0);

    // The financial_assets store owns this registry key (and its mapper).
    const assetSync: any = financialAssetsSync;

    // A gentle cue until the first server answer, unless this device already holds accounts:
    // no $0.00 total and no example cards meanwhile.
    let isLoading = $derived(
        financialAssetsSync.lastSync === null &&
            financialAssetsSync.status !== "error" &&
            financialAssetsSync.items.length === 0,
    );
    onMount(() => {
        financialAssetsSync.init().catch(() => {});
    });

    const wizardSteps = [
        {
            id: "intro",
            question: "wizard.financial_intro",
            type: "boolean" as const,
            logic: { yes: "check", no: "EXIT" },
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

    async function handleWizardComplete(answers: Record<string, any>) {
        if (answers.intro === false) {
            showWizard = false;
            return;
        }

        const accounts = [];

        // Logic Mapping - now using SyncManager
        if (answers.check)
            accounts.push(createAsset("Checking Account", "Financial"));
        if (answers.savings)
            accounts.push(createAsset("High Yield Savings", "Financial"));
        if (answers.retirement)
            accounts.push(createAsset("401(k) / IRA", "Financial"));
        if (answers.crypto)
            accounts.push(
                createAsset("Hardware Wallet", "Financial", "Crypto"),
            );

        if (accounts.length > 0) {
            await saveAccounts(accounts);
            reloadKey++; // Force refresh
        }

        showWizard = false;
    }

    // One wizard answer set is one save: the creates run quietly (no per-account affirmation),
    // then one affirmation if all landed, or the manager's one gentle message whose Try Again
    // re-sends only the accounts that did not land.
    async function saveAccounts(accounts: ReturnType<typeof createAsset>[]) {
        const results = await Promise.allSettled(
            accounts.map((a) => assetSync.create(a, false, true)),
        );
        const failed = accounts.filter((_, i) => results[i].status === "rejected");
        if (failed.length === 0) {
            notifications.showAffirmation("general", "create");
            return;
        }
        const reason = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
        notifications.showError(
            {
                message:
                    "Your words are safe here. We can save them again whenever you're ready.",
                code: "DATABASE_ERROR",
                technicalDetails: reason.reason?.technicalDetails || reason.reason?.message || String(reason.reason),
            },
            () => {
                saveAccounts(failed).then(() => reloadKey++);
            },
        );
    }

    function createAsset(name: string, type: string, note = "") {
        return {
            name,
            type,
            value: null, // blank until the person adds one, so the audit asks for it
            location: "", // blank until the person adds the institution
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

<LivingBlueprintHeader
        title={$t("assets")}
        subtitle="Bank accounts, investments and debts, gathered in one place."
        detailedDescription="Gathering your financial accounts in one place gives your family a clear path to the resources meant for them, and a steady footing during a time of uncertainty."
        whyMatters="Documenting your accounts now helps your resources reach the people you love, with ease."
    >
        <div class="flex items-center gap-3">
            {#if $userRole !== "Family"}
                <!-- Guided Setup creates accounts, so it follows the same rule as adding one. -->
                <button
                    onclick={() => (showWizard = true)}
                    class="flex items-center gap-2 px-5 py-3 border border-primary/10 text-primary font-bold rounded-2xl hover:bg-primary/5 transition-colors"
                >
                    <Sparkles size={18} />
                    {$t("wizard.start")}
                </button>
                <button
                    onclick={() => (showAddForm = true)}
                    class="flex items-center gap-2 px-5 py-3 border border-primary bg-primary text-primary-foreground font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                    <Plus size={18} /> Share an asset
                </button>
            {/if}
        </div>
    </LivingBlueprintHeader>

<div class="max-w-6xl mx-auto p-8">


    <!-- AI Prompt Bar -->
    <div class="max-w-3xl mx-auto mb-8">
        <AIPromptBar context="financial" />
    </div>

    <!-- Core Manager -->
    {#if isLoading}
        <div class="flex flex-col items-center justify-center gap-3 py-16" role="status" data-testid="accounts-loading">
            <Loader2 class="w-8 h-8 animate-spin text-primary" />
            <p class="text-sm text-muted-foreground">Gathering your records...</p>
        </div>
    {:else}
        {#key reloadKey}
            <AssetManager module={{ id: "assets-main" }} bind:showAddForm headerAdd={false} />
        {/key}
    {/if}
</div>
