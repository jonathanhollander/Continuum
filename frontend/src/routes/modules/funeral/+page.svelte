<script lang="ts">
    import { askConfirm } from "$lib/components/ui/ConfirmModal.svelte";
    import { focusTrap } from "$lib/actions/focusTrap";
    import { get } from "svelte/store";
    import { captureSession, isCurrentSession } from "$lib/services/sessionOwnership";
    import { activeAccountId } from "$lib/stores/keyringStore";
    import { currentProfileId } from "$lib/stores/profileContext";
    import { readCustom } from "$lib/utils/customFields";
    import { fade, scale } from "svelte/transition";
    import {
        MapPin,
        Users,
        DollarSign,
        Scroll,
        CircleCheck,
        Palette,
        Trash2,
        Pencil,
        Plus,
        X,
        Sparkles,
        Loader2,
    } from "lucide-svelte";
    import SmartTextarea from "$lib/components/ui/SmartTextarea.svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import { aiJobChanges, currentAIJob, type AIWritingJob } from "$lib/services/aiCapabilities";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte"; // NEW IMPORT
    import GriefSupportBanner from "$lib/components/GriefSupportBanner.svelte";
    import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte";
    import { onMount } from "svelte";
    import { estateProfile } from "$lib/stores/estateStore.svelte";
    import { estateExecutorName } from "$lib/stores/analyticsStore";
    import { activityLog } from "$lib/stores/activityLog.svelte";
    import { UserCircle, MapPin as MapPinIcon, Cross } from "lucide-svelte";
    import { funeralStore, funeralSync, type FuneralWishes, type FuneralBudgetItem } from "$lib/stores/funeralStore.svelte";
    import FuneralWizard, { type FuneralShownContext } from "$lib/components/modules/funeral/FuneralWizard.svelte";
    import LegalDisclaimer from "$lib/components/common/LegalDisclaimer.svelte";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";
    import * as registryRaw from "$lib/data/registry.json";
    import { t, language } from "$lib/stores/localization";

    // Registry Data Handling
    const registryData = (registryRaw as any).default || registryRaw;
    const registry = Array.isArray(registryData) ? registryData : [];
    const module = registry.find((m) => m.id === "funeral");

    const funeralIntro = "Record the funeral or memorial arrangements you want your family to follow. Start with what matters most; leave details open and return when you're ready.";
    let activeTab = $state("wishes"); // 'wishes' | 'budget'
    const funeralTabLabel = $derived(activeTab === "wishes" ? "Funeral & memorial wishes" : "Costs & arrangements");
    const pageOwner = captureSession();
    let shownContext = $state<FuneralShownContext | null>(null);
    function acceptShownContext(context: FuneralShownContext | null) {
        shownContext = context && isCurrentSession(pageOwner) ? context : null;
    }
    const funeralJob = $derived.by((): AIWritingJob => {
        $aiJobChanges;
        const engaged = currentAIJob();
        const shown = activeTab === "wishes" ? shownContext : null;
        const category = shown?.step === 1 ? "foundation" : shown?.step === 4 ? "atmosphere" : shown?.step === 5 ? "legacy" : null;
        const field = category && engaged?.document_type === "funeral"
            && engaged.job_id === `funeral:wishes:${category}` ? engaged : undefined;
        const recorded = funeralSync.data;
        const displayed = shown ? JSON.stringify({ current_stage: shown.stage, displayed_wishes: shown.wishes, save_pending: shown.pending }) : "";
        return {
            ...field, job_id: `funeral:${activeTab}`,
            job_brief: funeralTabLabel, document_title: "Final Wishes", document_type: "funeral",
            field_label: field?.field_label || shown?.stage || funeralTabLabel,
            field_question: field?.field_question || shown?.question || "",
            question_answers: [...(field?.question_answers || []), ...(field && displayed ? [displayed] : [])],
            current_draft: field?.current_draft ?? (shown ? displayed : recorded ? JSON.stringify(activeTab === "wishes" ? recorded.wishes || {} : recorded.budget || [], null, 2) : ""),
            current_draft_source: field?.current_draft_source ?? "edited",
            source_facts: recorded ? [JSON.stringify({ wishes: recorded.wishes || {}, budget: recorded.budget || [], sync_status: funeralSync.status })] : [],
        };
    });
    let showAddExpense = $state(false);
    let newExpense = $state<Partial<FuneralBudgetItem>>({
        name: "",
        cost: 0,
    });
    let parsedCustomAttributes = $state<Record<string, any>>({});
    let isLoading = $state(true);

    onMount(async () => {
        await funeralStore.sync?.();
        isLoading = false;
    });

    let wishes = $derived($funeralStore!.wishes);
    let budgetItems = $derived($funeralStore!.budget);

    let savingExpense = $state(false);
    let costNote = $state<string | null>(null);
    const recordedCost = (value: unknown): number | undefined => {
        if ((typeof value !== "number" && typeof value !== "string") || (typeof value === "string" && !value.trim())) return undefined;
        const amount = Number(value);
        return Number.isFinite(amount) ? amount : undefined;
    };
    const shownCost = (value: unknown) => {
        const amount = recordedCost(value);
        return amount === undefined ? "Unknown" : `$${amount.toLocaleString()}`;
    };
    let expenseBusy = $derived(savingExpense || funeralSync.status === "syncing");
    type ExpenseAttempt = { json: string; run: () => Promise<unknown>; release: () => void };
    const expenseAttempts = new WeakMap<object, ExpenseAttempt>();
    const expenseEdits = new Map<string, ExpenseAttempt>();
    const expenseIds = new WeakMap<object, string>();
    let expenseWrite: Promise<unknown> | null = null;
    const expenseFingerprint = (form: object) => JSON.stringify({ fields: $state.snapshot(form), custom: parsedCustomAttributes });

    async function saveExpense() {
        if (expenseBusy || !newExpense.name) return;
        const cost = recordedCost(newExpense.cost);
        if (cost === undefined) {
            costNote = "A cost, including 0, completes this detail.";
            return;
        }
        costNote = null;
        const form = newExpense;
        const json = expenseFingerprint(form);
        const earlier = expenseAttempts.get(form);
        if (earlier?.json === json) { await earlier.run(); return; }
        earlier?.release();
        const isEdit = !!form.id;
        const id = form.id || expenseIds.get(form) || crypto.randomUUID();
        expenseIds.set(form, id);
        const entry: FuneralBudgetItem = {
            ...JSON.parse(json).fields, id, name: form.name, cost,
            ...(!isEdit ? { estimated: industryAverage(form.name) } : {}),
            custom_attributes: JSON.stringify(parsedCustomAttributes),
        };
        const owner = captureSession();
        const account = get(activeAccountId);
        const profile = get(currentProfileId);
        const current = () => isCurrentSession(owner) && get(activeAccountId) === account && get(currentProfileId) === profile;
        const userContext = $estateProfile.ownerName || "User";
        const recoveryId = crypto.randomUUID();
        let pending: Promise<unknown> | null = null;
        let completed = false;
        let released = false;
        const attempt: ExpenseAttempt = {
            json,
            release: () => { released = true; funeralSync.releaseRecovery(recoveryId, owner); },
            run: () => {
                if (pending) return pending;
                if (completed || released || !current()) return Promise.resolve();
                const before = expenseWrite;
                const p = (async () => {
                    if (before) await before.catch(() => {});
                    if (completed || released || !current()) return;
                    savingExpense = true;
                    try {
                        const rows = funeralSync.data?.budget || [];
                        const budget = rows.some((row) => row.id === id)
                            ? rows.map((row) => row.id === id ? { ...row, ...entry } : row)
                            : [...rows, entry];
                        await funeralSync.update({ budget }, false, recoveryId, attempt.run);
                        completed = true;
                        if (expenseEdits.get(id) === attempt) expenseEdits.delete(id);
                        try {
                            activityLog.logEvent({
                                module: "Funeral Planning", action: isEdit ? "UPDATE" : "CREATE", entityType: "Budget Item",
                                entityId: id, entityName: entry.name, changes: [], userContext,
                            });
                        } catch { /* The record is already saved. */ }
                        if (!released && current() && newExpense === form) {
                            if (expenseFingerprint(form) === json) resetExpenseForm();
                            else form.id = id;
                        }
                    } catch { /* The shared notice keeps this attempt; the form keeps its fields. */ }
                    finally { savingExpense = false; }
                })().finally(() => { pending = null; if (expenseWrite === p) expenseWrite = null; });
                pending = p;
                expenseWrite = p;
                return p;
            },
        };
        expenseAttempts.set(form, attempt);
        expenseEdits.set(id, attempt);
        await attempt.run();
    }

    function editExpense(item: FuneralBudgetItem) {
        costNote = null;
        expenseEdits.get(item.id)?.release();
        expenseEdits.delete(item.id);
        newExpense = { ...item };
        parsedCustomAttributes = readCustom(item);
        showAddExpense = true;
    }

    function resetExpenseForm() {
        costNote = null;
        newExpense = { id: undefined, name: "", cost: 0 };
        parsedCustomAttributes = {};
        showAddExpense = false;
    }

    async function removeExpense(id: string) {
        if (!(await askConfirm("Remove this expense? You can add it back later."))) return;
        await funeralStore
            .update((data) => ({
                ...data,
                budget: data.budget.filter((i) => i.id !== id),
            }))
            .catch(() => {}); // the manager already showed the one gentle message
    }

    // 2021 NFDA national averages. `aliases` are names these items were saved under before.
    const standardItems = [
            { name: "Basic Services Fees", cost: 2300, estimated: 2300 },
            { name: "Embalming and preparation", cost: 775, estimated: 775, aliases: ["Embalming & Prep"] },
            { name: "Viewing / Visitation", cost: 450, estimated: 450 },
            { name: "Funeral Ceremony", cost: 515, estimated: 515 },
            { name: "Hearse", cost: 350, estimated: 350 },
            { name: "Transport of your loved one", cost: 350, estimated: 350, aliases: ["Transfer of Remains"] },
            { name: "Casket (Metal)", cost: 2500, estimated: 2500 },
            { name: "Vault", cost: 1572, estimated: 1572 },
            { name: "Memorial Printed Package", cost: 183, estimated: 183 },
    ];

    const findStandard = (name?: string) => {
        const n = (name || "").trim().toLowerCase();
        return standardItems.find(
            (s) => s.name.toLowerCase() === n || s.aliases?.some((a) => a.toLowerCase() === n),
        );
    };
    // The national average comes from this table, never from the person's own cost
    // (rows saved earlier carry estimated = cost, so the stored value can't be trusted).
    const industryAverage = (name?: string) => findStandard(name)?.estimated;

    // Reactive Updates
    let totalBudget = $derived(
        $funeralStore!.budget.reduce((acc, item) => acc + (recordedCost(item.cost) ?? 0), 0),
    );
    let unknownBudgetCost = $derived(budgetItems.some((item) => recordedCost(item.cost) === undefined));
    // Compare only the items that have a national average, against their own costs.
    let comparedItems = $derived(budgetItems.filter((i) => industryAverage(i.name) !== undefined));
    let totalEstimated = $derived(
        comparedItems.reduce((acc, item) => acc + (industryAverage(item.name) ?? 0), 0),
    );
    let comparedCost = $derived(comparedItems.reduce((acc, item) => acc + (recordedCost(item.cost) ?? 0), 0));
    let unknownComparedCost = $derived(comparedItems.some((item) => recordedCost(item.cost) === undefined));
    let variance = $derived(totalEstimated - comparedCost);
    // Auto-Fill adds only the common costs the budget doesn't hold yet.
    let missingStandard = $derived(standardItems.filter((s) => !budgetItems.some((i) => findStandard(i.name) === s)));

    async function prefillEstimates() {
        if (
            !(await askConfirm(
                "This will add standard industry average costs (2021 NFDA) to your budget. Continue?",
                "Add these costs",
            ))
        )
            return;

        const toAdd = missingStandard;
        if (toAdd.length === 0) return;
        // One save for the whole set: one POST, one affirmation (was one per item).
        funeralStore
            .update((data) => ({
                ...data,
                budget: [
                    ...data.budget,
                    ...toAdd.map((std) => ({
                        id: crypto.randomUUID(),
                        name: std.name,
                        cost: std.cost,
                        estimated: std.estimated,
                    })),
                ],
            }))
            .catch(() => {}); // the manager already showed the one gentle message
    }
</script>

{#if isLoading}
    <div class="flex items-center justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
{:else}
{#if module}
    <LivingBlueprintHeader
        title="Final Wishes"
        subtitle="Funeral and memorial preferences"
        detailedDescription={funeralIntro}
    />
{/if}

<div class="max-w-6xl mx-auto p-8 animate-in fade-in duration-500">
    <div class="mb-12 text-center">
        <div class="max-w-xl mx-auto mb-8">
            <p class="text-left text-muted-foreground mb-4">{funeralIntro}</p>
            <p class="text-left text-sm text-muted-foreground mb-4">This notebook holds your wishes. The helper uses the current field and wishes shown here to draft text for you to review and copy.</p>
            <AIPromptBar context="funeral" job={funeralJob} />
        </div>

        <div class="max-w-3xl mx-auto text-left">
            <LegalDisclaimer
                variant="banner"
                title="Important Note"
                message="Funeral laws and requirements vary significantly by state and country. While these wishes guide your family, some jurisdictions require specific legal forms for binding disposition instructions."
            />
        </div>

        <div class="max-w-3xl mx-auto mt-8 text-left">
            <GriefSupportBanner compact={true} />
        </div>

    </div>

    <!-- Tabs -->
    <div class="flex justify-center items-center gap-4 mb-8">
        <div class="bg-muted p-1.5 rounded-xl inline-flex max-w-full flex-wrap justify-center gap-2">
            <button
                class="px-6 py-2.5 rounded-lg font-bold text-sm transition-all {activeTab ===
                'wishes'
                    ? 'bg-card shadow-sm text-primary-deep dark:text-primary-hover'
                    : 'text-muted-foreground hover:text-foreground'}"
                onclick={() => (activeTab = "wishes")}
            >
                Funeral &amp; memorial wishes
            </button>
            <button
                class="px-6 py-2.5 rounded-lg font-bold text-sm transition-all {activeTab ===
                'budget'
                    ? 'bg-card shadow-sm text-primary-deep dark:text-primary-hover'
                    : 'text-muted-foreground hover:text-foreground'}"
                onclick={() => (activeTab = "budget")}
            >
                Costs &amp; arrangements
            </button>
        </div>
    </div>

    <div
        class="bg-card rounded-2xl border border-border shadow-sm min-h-[500px] p-8"
    >
        <!-- Memorial Subject Header (Synced): only the values that are filled in -->
        {#if $estateProfile.ownerName || $estateExecutorName || $estateProfile.legalCityState}
        <div
            class="mb-10 p-6 bg-muted border border-border rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6"
        >
            {#if $estateProfile.ownerName}
            <div class="flex items-center gap-4">
                <div class="p-3 bg-card rounded-xl shadow-sm text-muted-foreground">
                    <UserCircle size={32} />
                </div>
                <div>
                    <h2 class="text-xl font-bold text-foreground">
                        Celebrating the Life of {$estateProfile.ownerName}
                    </h2>
                    <p class="text-sm text-muted-foreground italic">
                        Pre-filled from Estate Profile
                    </p>
                </div>
            </div>
            {/if}

            {#if $estateExecutorName}
            {#if $estateProfile.ownerName}
            <div class="h-10 w-px bg-border hidden md:block"></div>
            {/if}

            <div class="flex items-center gap-4">
                <div class="text-right">
                    <p
                        class="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                    >
                        Chief Coordinator
                    </p>
                    <p class="font-bold text-foreground">
                        {$estateExecutorName}
                    </p>
                </div>
                <div class="p-3 bg-card rounded-xl shadow-sm text-primary">
                    <Users size={24} />
                </div>
            </div>
            {/if}

            {#if $estateProfile.legalCityState}
            {#if $estateProfile.ownerName || $estateExecutorName}
            <div class="h-10 w-px bg-border hidden md:block"></div>
            {/if}

            <div class="flex items-center gap-4">
                <div class="text-right">
                    <p
                        class="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                    >
                        Local Area
                    </p>
                    <p class="font-bold text-foreground">
                        {$estateProfile.legalCityState}
                    </p>
                </div>
                <div class="p-3 bg-card rounded-xl shadow-sm text-primary">
                    <MapPinIcon size={24} />
                </div>
            </div>
            {/if}
        </div>
        {/if}

        {#if activeTab === "wishes"}
            <FuneralWizard onOpenBudget={() => (activeTab = "budget")} onContextChange={acceptShownContext} />
        {/if}
        {#if activeTab === "budget"}
            <!-- BUDGET TAB -->
            <div in:fade={{ duration: 300 }}>
                {#if budgetItems.length === 0}
                    <EmptyState
                        title="Financial Stewardship"
                        whyMatters="By thinking through these costs now, you're protecting your family from difficult financial decisions during an already hard time."
                        icon={DollarSign}
                        ctaLabel="Auto-Fill Common Costs"
                        onAction={prefillEstimates}
                        skipMessage="Come back to this whenever you're ready."
                    />

                    <!-- Example costs (the same standard estimates Auto-Fill adds) -->
                    <div class="mt-8">
                        <p class="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-4 text-center">Example entries to inspire you</p>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-60">
                            {#each standardItems.slice(0, 3) as sample}
                                <GhostRow
                                    name={sample.name}
                                    value={sample.cost}
                                    onClick={() => {
                                        newExpense = {
                                            name: sample.name,
                                            cost: sample.cost
                                        };
                                        showAddExpense = true;
                                    }}
                                >
                                    {#snippet icon()}
                                        <DollarSign size={20} class="text-muted-foreground" />
                                    {/snippet}
                                </GhostRow>
                            {/each}
                        </div>
                    </div>
                {:else}
                    <!-- Total Cost / Comparison -->
                    <div
                        class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-end"
                    >
                        <div
                            class="p-6 rounded-2xl bg-primary-deep text-white shadow-lg"
                        >
                            <div
                                class="text-xs font-bold uppercase tracking-wider opacity-70 mb-1"
                            >
                                Total Estimated Cost
                            </div>
                            <div class="text-4xl font-serif font-bold">
                                {unknownBudgetCost ? "Unknown" : `$${totalBudget.toLocaleString()}`}
                            </div>
                        </div>

                        {#if comparedItems.length > 0}
                        <div
                            class="p-6 rounded-2xl bg-card border border-border shadow-sm"
                        >
                            <div
                                class="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1"
                            >
                                Industry Avg. (Projected)
                            </div>
                            <div class="text-2xl font-bold text-foreground">
                                ${totalEstimated.toLocaleString()}
                            </div>
                            {#if comparedItems.length < budgetItems.length}
                                <div class="text-xs text-muted-foreground mt-1">
                                    Across the {comparedItems.length} common costs
                                </div>
                            {/if}
                        </div>

                        <div
                            class="p-6 rounded-2xl h-fit {variance >= 0
                                ? 'bg-success/10 text-success'
                                : 'bg-muted text-foreground'}"
                        >
                            <div class="flex items-center gap-2 font-bold mb-1">
                                Saving vs. Avg
                            </div>
                            <p class="text-sm opacity-90 leading-relaxed">
                                {#if unknownComparedCost}
                                    Unknown
                                {:else if variance === 0}
                                    Your plan matches the national average.
                                {:else if variance > 0}
                                    You are projected to save <span
                                        class="font-bold underline"
                                        >${variance.toLocaleString()}</span
                                    > compared to the national average.
                                {:else}
                                    Your plan is currently <span
                                        class="font-bold underline"
                                        >${Math.abs(
                                            variance,
                                        ).toLocaleString()}</span
                                    > above the national average.
                                {/if}
                            </p>
                        </div>
                        {/if}
                    </div>

                    <!-- Budget Table -->
                    <div
                        class="bg-card rounded-xl shadow-sm border border-border overflow-hidden"
                    >
                        <div
                            class="px-6 py-4 border-b border-border flex justify-between items-center"
                        >
                            <h3
                                class="font-bold text-foreground flex items-center gap-2"
                            >
                                <DollarSign size={18} /> Financial Stewardship
                            </h3>
                            <div class="flex gap-2">
                                {#if missingStandard.length > 0}
                                <button
                                    onclick={prefillEstimates}
                                    class="text-xs font-bold text-muted-foreground hover:text-primary px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
                                >
                                    Auto-Fill Common Costs
                                </button>
                                {/if}
                                <button
                                    onclick={() => {
                                        newExpense = { name: "", cost: 0 };
                                        showAddExpense = true;
                                    }}
                                    class="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-1"
                                >
                                    <Plus size={14} /> Add Item
                                </button>
                            </div>
                        </div>

                        <div class="divide-y divide-border">
                            {#each budgetItems as item (item.id)}
                                <div
                                    class="px-6 py-4 flex items-center justify-between group hover:bg-muted transition-colors"
                                >
                                    <div>
                                        <div class="font-bold text-foreground">
                                            {item.name}
                                        </div>
                                        {#if industryAverage(item.name) !== undefined}
                                            <div class="text-xs text-muted-foreground">
                                                Industry avg.: ${industryAverage(item.name)?.toLocaleString()}
                                            </div>
                                        {/if}
                                    </div>
                                    <div class="flex items-center gap-6">
                                        <div class="font-bold text-foreground">
                                            {shownCost(item.cost)}
                                        </div>
                                        <div class="flex gap-2">
                                            <button
                                                onclick={() =>
                                                    editExpense(item)}
                                                aria-label="Edit these details"
                                                class="p-2 text-muted-foreground hover:text-primary bg-card border border-border rounded-full shadow-sm"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onclick={() =>
                                                    removeExpense(item.id)}
                                                aria-label="Remove this item"
                                                class="p-2 text-muted-foreground hover:text-foreground bg-card border border-border rounded-full shadow-sm"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        {/if}

        <!-- Expense Modal -->
        {#if showAddExpense}
            <div role="dialog" aria-modal="true" use:focusTrap={{ onEscape: resetExpenseForm }}
                class="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                transition:fade
            >
                <div
                    class="bg-card rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
                    transition:scale={{ start: 0.95 }}
                >
                    <div
                        class="bg-primary-deep p-6 flex justify-between items-start text-white"
                    >
                        <div class="flex-1 pr-4">
                            <h3 class="font-serif font-bold text-xl text-white">
                                {newExpense.id
                                    ? "Refine this detail"
                                    : "Plan Ahead"}
                            </h3>
                            <p
                                class="text-white/80 text-sm mt-1 leading-relaxed"
                            >
                                {newExpense.id
                                    ? "Keep your estimates current—it helps your family plan with clarity."
                                    : "By thinking through these costs now, you're protecting your family from difficult financial decisions during an already hard time."}
                            </p>
                        </div>
                        <button aria-label="Close"
                            onclick={resetExpenseForm}
                            class="text-white/70 hover:text-white transition-colors mt-1"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <div class="p-6 space-y-4">
                        <div class="space-y-2">
                            <label for="funeral-name"
                                class="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                                >Item Name</label
                            >
                            <input id="funeral-name"
                                bind:value={newExpense.name}
                                class="w-full p-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium"
                                placeholder="e.g. Venue Rental"
                            />
                        </div>
                        <div class="space-y-2">
                            <label for="funeral-cost"
                                class="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                                >Cost ($)</label
                            >
                            <input id="funeral-cost"
                                type="number"
                                bind:value={newExpense.cost}
                                aria-invalid={costNote ? true : undefined}
                                aria-describedby={costNote ? "funeral-cost-note" : undefined}
                                oninput={() => (costNote = null)}
                                class="w-full p-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium"
                                placeholder="0.00"
                            />
                            {#if costNote}<p id="funeral-cost-note" role="status" class="text-sm text-muted-foreground">{costNote}</p>{/if}
                        </div>
                        <div class="pt-4 mt-4 border-t border-border">
                            <CustomFieldsManager
                                entityType="funeral"
                                bind:data={parsedCustomAttributes}
                            />
                        </div>
                        <button
                            onclick={saveExpense}
                            disabled={expenseBusy || !newExpense.name}
                            aria-busy={expenseBusy}
                            class="w-full py-4 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {expenseBusy ? "Saving..." : "Save this detail"}
                        </button>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>
{/if}
