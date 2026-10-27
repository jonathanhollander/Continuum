<script lang="ts">
    import { get } from "svelte/store";
    import { captureSession, isCurrentSession } from "$lib/services/sessionOwnership";
    import { activeAccountId } from "$lib/stores/keyringStore";
    import { currentProfileId } from "$lib/stores/profileContext";
    import { formSaveAttempt } from "$lib/utils/formSaveAttempt";
    import { focusTrap } from "$lib/actions/focusTrap";
    import {
        advancedAssetStore,
        advancedAssetSync,
        DEFAULT_ADVANCED_STATE,
        type AssetTransaction,
        type MaintenanceLog,
        type InsuranceClaim,
        type AdvancedAssetState,
    } from "$lib/stores/advancedAssetStore.svelte";
    import {
        digitalAssetsStore,
        digitalAssetsSync,
        type DigitalAccount,
        type ClosurePreference,
    } from "$lib/stores/digitalAssetsStore.svelte";
    import { propertySync } from "$lib/stores/propertyStore.svelte";
    import { financialAssetsSync } from "$lib/stores/financialAssetsStore.svelte";
    import { insuranceSync } from "$lib/stores/insuranceStore.svelte";
    import { askConfirm } from "$lib/components/ui/ConfirmModal.svelte";
    import {
        Layers,
        Repeat,
        Wrench,
        FileCheck,
        Flower2,
        Plus,
        Search,
        Filter,
        ArrowUpRight,
        ArrowDownLeft,
        MoreVertical,
        Trash2,
        Pencil,
        X,
        Calendar,
        DollarSign,
        Clock,
        CircleCheck,
        CircleAlert,
        ShieldAlert,
        Monitor,
        Loader2,
        Sparkles,
    } from "lucide-svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import { onMount } from "svelte";
    import { fade, slide, scale } from "svelte/transition";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte";
    import { getSmartSamples } from "$lib/data/smartSamples";
    import { language } from "$lib/stores/localization";

    let isLoading = $state(true);

    onMount(async () => {
        // The registry links to properties, accounts and policies, and lists digital account wishes.
        await Promise.allSettled([
            advancedAssetStore.sync?.(),
            digitalAssetsSync.init(),
            propertySync.init(),
            financialAssetsSync.init(),
            insuranceSync.init(),
        ]);
        isLoading = false;
    });

    // Transactions point at a real record: "property:<id>" or "financial:<id>".
    let assetOptions = $derived([
        ...propertySync.items.map((a) => ({ value: `property:${a.id}`, label: a.name || "Property" })),
        ...financialAssetsSync.items.map((a) => ({ value: `financial:${a.id}`, label: a.name || "Account" })),
    ]);
    // Older rows hold free text; it is shown as it was typed.
    const assetName = (id?: string) => (id ? (assetOptions.find((o) => o.value === id)?.label ?? id) : "");
    const policyName = (id?: string) => {
        if (!id) return "";
        const pol = insuranceSync.items.find((x) => String(x.id) === String(id));
        return pol ? [pol.policyName, pol.insurer].filter(Boolean).join(" · ") || "Policy" : "";
    };

    let activeTab = $state<
        "transactions" | "maintenance" | "claims" | "killswitch"
    >("transactions");
    let searchQuery = $state("");

    // Modals
    let showAddModal = $state(false);
    let addType = $state<"transaction" | "maintenance" | "claim" | "account">(
        "transaction",
    );
    let parsedCustomAttributes = $state<Record<string, any>>({});
    // Set while the form edits an existing row; the same form and save path as Add.
    let editingId = $state<string | null>(null);

    // Temp Form States
    let newTx = $state<Partial<AssetTransaction>>({
        type: "purchase",
        amount: 0,
        description: "",
        date: new Date().toISOString().split("T")[0],
    });
    let newMaint = $state<Partial<MaintenanceLog>>({
        item: "",
        cost: 0,
        date: new Date().toISOString().split("T")[0],
    });
    let newClaim = $state<Partial<InsuranceClaim>>({
        status: "pending",
        amountClaimed: 0,
        dateFiled: new Date().toISOString().split("T")[0],
    });
    let newAccount = $state<Partial<DigitalAccount>>({
        platform: "",
        username: "",
        preference: "memorialize",
        priority: "medium",
    });

    const today = () => new Date().toISOString().split("T")[0];

    let saving = $state(false);
    let registryBusy = $derived(saving || advancedAssetSync.status === "syncing" || digitalAssetsSync.status === "syncing");
    const saveAccountOnce = formSaveAttempt(digitalAssetsSync);
    type RegistryAttempt = { json: string; run: () => Promise<unknown>; release: () => void };
    const registryAttempts = new WeakMap<object, RegistryAttempt>();
    const registryEdits = new Map<string, RegistryAttempt>();
    const draftIds = new WeakMap<object, string>();
    let registryWrite: Promise<unknown> | null = null;
    const draftFor = (kind: typeof addType) => kind === "transaction" ? newTx : kind === "maintenance" ? newMaint : kind === "claim" ? newClaim : newAccount;
    const registryFingerprint = (form: object) => JSON.stringify({ fields: $state.snapshot(form), custom: parsedCustomAttributes });

    async function handleAdd() {
        if (registryBusy) return;
        const kind = addType;
        const form = draftFor(kind);
        const json = registryFingerprint(form);
        if (kind === "account") {
            const original = JSON.stringify($state.snapshot(form));
            saving = true;
            try {
                await saveAccountOnce(form, { ...$state.snapshot(newAccount), isClosed: false }, (saved) => {
                    if (newAccount === form) {
                        if (addType === kind && JSON.stringify($state.snapshot(form)) === original) {
                            resetForm();
                            showAddModal = false;
                        } else form.id = saved.id;
                    }
                }, form.id);
            } catch { /* The manager keeps the draft and its Retry. */ }
            finally { saving = false; }
            return;
        }
        const earlier = registryAttempts.get(form);
        if (earlier?.json === json) { await earlier.run(); return; }
        earlier?.release();
        const id = editingId || form.id || draftIds.get(form) || crypto.randomUUID();
        draftIds.set(form, id);
        const entry = { ...structuredClone($state.snapshot(form)), id, custom_attributes: JSON.stringify(parsedCustomAttributes) };
        const list = kind === "transaction" ? "transactions" : kind === "maintenance" ? "maintenance" : "claims";
        const recordKey = `${kind}:${id}`;
        const owner = captureSession();
        const account = get(activeAccountId);
        const profile = get(currentProfileId);
        const current = () => isCurrentSession(owner) && get(activeAccountId) === account && get(currentProfileId) === profile;
        const recoveryId = crypto.randomUUID();
        let pending: Promise<unknown> | null = null;
        let completed = false;
        let released = false;
        const attempt: RegistryAttempt = {
            json,
            release: () => { released = true; advancedAssetSync.releaseRecovery(recoveryId, owner); },
            run: () => {
                if (pending) return pending;
                if (completed || released || !current()) return Promise.resolve();
                const before = registryWrite;
                const p = (async () => {
                    if (before) await before.catch(() => {});
                    if (completed || released || !current()) return;
                    saving = true;
                    try {
                        // Apply this one immutable row to the latest list; other recorded rows stay intact.
                        const rows = (advancedAssetSync.data || DEFAULT_ADVANCED_STATE)[list];
                        const next = rows.some((row) => row.id === id)
                            ? rows.map((row) => row.id === id ? { ...row, ...entry } : row)
                            : [entry, ...rows];
                        await advancedAssetSync.update({ [list]: next } as Partial<AdvancedAssetState>, false, recoveryId, attempt.run);
                        completed = true;
                        if (registryEdits.get(recordKey) === attempt) registryEdits.delete(recordKey);
                        if (!released && current() && draftFor(kind) === form) {
                            if (addType === kind && registryFingerprint(form) === json) {
                                resetForm();
                                showAddModal = false;
                            } else {
                                form.id = id;
                                if (addType === kind) editingId = id;
                            }
                        }
                    } catch { /* One shared notice; all visible fields remain editable. */ }
                    finally { saving = false; }
                })().finally(() => { pending = null; if (registryWrite === p) registryWrite = null; });
                pending = p;
                registryWrite = p;
                return p;
            },
        };
        registryAttempts.set(form, attempt);
        registryEdits.set(recordKey, attempt);
        await attempt.run();
    }

    function resetForm() {
        if (addType === "transaction") newTx = { type: "purchase", amount: 0, description: "", date: today() };
        if (addType === "maintenance") newMaint = { item: "", cost: 0, date: today() };
        if (addType === "claim") newClaim = { status: "pending", amountClaimed: 0, dateFiled: today() };
        if (addType === "account") newAccount = { platform: "", username: "", preference: "memorialize", priority: "medium" };
        parsedCustomAttributes = {};
        editingId = null;
    }

    // Closing an edit clears its pre-filled values so the next Add starts fresh;
    // an unsaved Add keeps what was typed, as before.
    function closeModal() {
        if (editingId) resetForm();
        showAddModal = false;
    }

    const parseAttrs = (v?: string) => {
        try { const p = JSON.parse(v || "{}"); return p && typeof p === "object" && !Array.isArray(p) ? p : {}; } catch { return {}; }
    };

    function startEdit(kind: "transaction" | "maintenance" | "claim", item: AssetTransaction | MaintenanceLog | InsuranceClaim) {
        const recordKey = `${kind}:${item.id}`;
        registryEdits.get(recordKey)?.release();
        registryEdits.delete(recordKey);
        const copy = { ...$state.snapshot(item) } as any;
        if (kind === "transaction") newTx = copy;
        if (kind === "maintenance") newMaint = copy;
        if (kind === "claim") newClaim = copy;
        parsedCustomAttributes = parseAttrs(item.custom_attributes);
        addType = kind;
        editingId = item.id;
        showAddModal = true;
    }

    // The store has no remove calls: save the record without the item, the same
    // singleton update the adds use. A failed save shows its own message and rolls back.
    async function removeFrom(list: "transactions" | "maintenance" | "claims", id: string) {
        if (!(await askConfirm("Remove this item?"))) return;
        const current = advancedAssetSync.data || DEFAULT_ADVANCED_STATE;
        advancedAssetSync
            .update({ ...current, [list]: (current[list] as { id: string }[]).filter((x) => x.id !== id) })
            .catch(() => {});
    }

    function setClaimStatus(id: string, status: InsuranceClaim["status"]) {
        const current = advancedAssetSync.data || DEFAULT_ADVANCED_STATE;
        advancedAssetSync
            .update({ ...current, claims: current.claims.map((c) => (c.id === id ? { ...c, status } : c)) })
            .catch(() => {});
    }

    const tabs = [
        { id: "transactions", label: "Transactions", icon: Repeat },
        { id: "maintenance", label: "Maintenance", icon: Wrench },
        { id: "claims", label: "Claims", icon: FileCheck },
        { id: "killswitch", label: "Account Wishes", icon: Flower2 },
    ];

    let filteredTransactions = $derived(
        $advancedAssetStore!.transactions.filter((t) =>
            t.description.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );
    let filteredMaintenance = $derived(
        $advancedAssetStore!.maintenance.filter((m) =>
            m.item.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );
    let filteredClaims = $derived(
        $advancedAssetStore!.claims.filter(
            (c) =>
                c.claimNumber
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                (c.note ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );
    const hasWish = (a: DigitalAccount) => !!a.preference && a.preference !== "none";
    let filteredAccounts = $derived(
        $digitalAssetsStore.filter((a) =>
            (a.platform ?? a.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );
</script>

{#if isLoading}
    <div class="flex items-center justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
{:else}
<div
    class="max-w-[1400px] mx-auto p-8 space-y-10 animate-in fade-in duration-500"
>
    <!-- Header -->
    <LivingBlueprintHeader
        title="Your Full Record"
        subtitle="A fuller record of your assets, upkeep, and digital legacy"
        detailedDescription="The Advanced Registry brings together all detailed records about your assets—purchase history, maintenance logs, insurance claims, and digital account management. This comprehensive documentation helps your family understand what you own and its complete history."
        whyMatters="Detailed asset records give your family the history behind each asset. Your family will know when the roof was last inspected, what warranties still apply, and how to care for your digital footprint."
    >
        <div class="flex items-center gap-4">
            <div class="relative w-full md:w-64">
                <Search
                    class="absolute left-3.5 top-2.5 text-muted-foreground"
                    size={18}
                />
                <input
                    bind:value={searchQuery}
                    aria-label="Search registry"
                    placeholder="Search registry..."
                    class="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
            </div>
            <button
                onclick={() => {
                    // Tab ids are plural; the form types are singular.
                    addType =
                        activeTab === "killswitch"
                            ? "account"
                            : activeTab === "transactions"
                              ? "transaction"
                              : activeTab === "claims"
                                ? "claim"
                                : "maintenance";
                    showAddModal = true;
                }}
                class="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold flex items-center gap-2 hover:bg-primary-hover transition-all shadow-lg active:scale-95"
            >
                <Plus size={18} />
                Add Record
            </button>
        </div>
    </LivingBlueprintHeader>


    <!-- AI Concierge Drafting Assistant -->
    <AIPromptBar
        context="advanced-registry"
        promptSource="routes/modules/advanced-registry/+page.svelte:prompts"
    />

    <!-- Tabs -->
    <div
        class="flex items-center gap-1 bg-muted p-1.5 rounded-2xl w-fit border border-border shadow-inner"
    >
        {#each tabs as tab}
            <button
                onclick={() => (activeTab = tab.id as any)}
                class="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all {activeTab ===
                tab.id
                    ? 'bg-card text-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'}"
            >
                <tab.icon size={16} />
                {tab.label}
            </button>
        {/each}
    </div>

    <!-- Content Sections -->
    <div
        class="bg-card rounded-[2.5rem] border border-border shadow-sm overflow-hidden min-h-[600px] flex flex-col"
    >
        {#if activeTab === "transactions"}
            <div class="overflow-x-auto" in:fade>
                <table class="w-full text-left border-collapse">
                    <thead class="bg-background border-b border-border">
                        <tr>
                            <th
                                class="px-8 py-5 text-[10px] font-black uppercase text-muted-foreground tracking-widest"
                                >Date</th
                            >
                            <th
                                class="px-8 py-5 text-[10px] font-black uppercase text-muted-foreground tracking-widest"
                                >Description</th
                            >
                            <th
                                class="px-8 py-5 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center"
                                >Type</th
                            >
                            <th
                                class="px-8 py-5 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-right"
                                >Amount</th
                            >
                            <th
                                class="px-8 py-5 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-right"
                                >Actions</th
                            >
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-border/50">
                        {#each filteredTransactions as tx (tx.id)}
                            <tr
                                class="hover:bg-background/50 transition-colors group"
                            >
                                <td
                                    class="px-8 py-5 text-sm font-bold text-muted-foreground font-mono italic"
                                    >{tx.date}</td
                                >
                                <td class="px-8 py-5">
                                    <p
                                        class="text-sm font-black text-foreground"
                                    >
                                        {tx.description}
                                    </p>
                                    {#if assetName(tx.assetId)}
                                        <p
                                            class="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter"
                                        >
                                            {assetName(tx.assetId)}
                                        </p>
                                    {/if}
                                </td>
                                <td class="px-8 py-5 text-center">
                                    <span
                                        class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border {tx.type ===
                                        'purchase'
                                            ? 'bg-success/10 text-success border-success/20'
                                            : 'bg-warning-soft text-warning border-warning/30'}"
                                    >
                                        {tx.type}
                                    </span>
                                </td>
                                <td
                                    class="px-8 py-5 text-right font-black text-foreground font-mono"
                                >
                                    {tx.type === "sale"
                                        ? "+"
                                        : "-"}${tx.amount.toLocaleString()}
                                </td>
                                <td class="px-8 py-5 text-right">
                                    <button aria-label="Edit these details"
                                        onclick={() => startEdit("transaction", tx)}
                                        class="p-2 text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button aria-label="Remove this item"
                                        onclick={() =>
                                            removeFrom("transactions", tx.id)}
                                        class="p-2 text-muted-foreground hover:text-danger transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
                {#if filteredTransactions.length === 0}
                    <EmptyState
                        title="Your financial story, documented"
                        whyMatters="<strong>Asset transactions tell the story of your financial life—purchases, sales, transfers, and valuations.</strong> This record helps your family understand where each asset came from and who it is meant for."
                        encouragement="Start with your most significant assets. You can add more details as you remember them."
                        icon={Repeat}
                        iconClass="text-primary"
                        ctaLabel="Record first transaction"
                        onAction={() => { addType = 'transaction'; showAddModal = true; }}
                    />
                    <!-- Sample Data GhostRows -->
                    <div class="px-8 pb-8">
                        <p class="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-4 text-center">Example entries to inspire you</p>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <GhostRow
                                name="Home Purchase - 123 Oak Street"
                                subtitle="Real Estate Transaction"
                                type="Purchase"
                                value={450000}
                                onClick={() => {
                                    newTx = { ...newTx, description: 'Home Purchase - 123 Oak Street', type: 'purchase', amount: 450000 };
                                    addType = 'transaction';
                                    showAddModal = true;
                                }}
                            />
                            <GhostRow
                                name="Vehicle Sale - 2019 Honda Accord"
                                subtitle="Auto Transaction"
                                type="Sale"
                                value={18500}
                                onClick={() => {
                                    newTx = { ...newTx, description: 'Vehicle Sale - 2019 Honda Accord', type: 'sale', amount: 18500 };
                                    addType = 'transaction';
                                    showAddModal = true;
                                }}
                            />
                            <GhostRow
                                name="Annual Property Valuation"
                                subtitle="Assessment Update"
                                type="Valuation"
                                value={525000}
                                onClick={() => {
                                    newTx = { ...newTx, description: 'Annual Property Valuation', type: 'valuation_update', amount: 525000 };
                                    addType = 'transaction';
                                    showAddModal = true;
                                }}
                            />
                        </div>
                    </div>
                {/if}
            </div>
        {:else if activeTab === "maintenance"}
            <!-- Similar table for maintenance -->
            <div class="p-10 space-y-6" in:fade>
                <div
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {#each filteredMaintenance as log (log.id)}
                        <div
                            class="bg-background rounded-2xl p-6 border border-border space-y-4 hover:shadow-md transition-all"
                        >
                            <div class="flex items-center justify-between">
                                <div
                                    class="p-3 bg-card rounded-2xl text-primary shadow-sm"
                                >
                                    <Wrench size={20} />
                                </div>
                                <div class="flex items-center gap-1">
                                    <span
                                        class="px-3 py-1 bg-card text-[10px] font-black uppercase text-muted-foreground rounded-full border border-border"
                                        >{log.date}</span
                                    >
                                    <button aria-label="Edit these details"
                                        onclick={() => startEdit("maintenance", log)}
                                        class="p-2 text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button aria-label="Remove this item"
                                        onclick={() => removeFrom("maintenance", log.id)}
                                        class="p-2 text-muted-foreground hover:text-danger transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <h3 class="font-bold text-foreground">{log.item}</h3>
                            <div
                                class="flex items-center justify-between text-xs text-muted-foreground font-medium"
                            >
                                <span>{#if log.provider}Provider: {log.provider}{/if}</span>
                                <span class="text-foreground font-black"
                                    >${log.cost}</span
                                >
                            </div>
                            {#if log.nextDueDate}
                                <div
                                    class="pt-3 border-t border-border flex items-center gap-2 text-[10px] font-black uppercase text-warning"
                                >
                                    <Clock size={12} />
                                    Next Due: {log.nextDueDate}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
                {#if filteredMaintenance.length === 0}
                    <EmptyState
                        title="Keep your property running smoothly"
                        whyMatters="<strong>Maintenance records are invaluable for whoever inherits your property.</strong> Knowing when the roof was last inspected, who services the HVAC, or when the septic was pumped helps them care for what you built and keeps warranties in view."
                        encouragement="Start with your most recent service call or inspection. The history will build over time."
                        icon={Wrench}
                        iconClass="text-primary"
                        ctaLabel="Log first maintenance"
                        onAction={() => { addType = 'maintenance'; showAddModal = true; }}
                    />
                    <!-- Sample Data GhostRows -->
                    <div class="mt-8">
                        <p class="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-4 text-center">Example entries to inspire you</p>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <GhostRow
                                name="HVAC Annual Service"
                                subtitle="Heating & Cooling"
                                type="Maintenance"
                                value={189}
                                onClick={() => {
                                    newMaint = { ...newMaint, item: 'HVAC Annual Service', cost: 189, provider: 'ABC Climate Co.' };
                                    addType = 'maintenance';
                                    showAddModal = true;
                                }}
                            />
                            <GhostRow
                                name="Roof Inspection"
                                subtitle="Annual Check"
                                type="Inspection"
                                value={250}
                                onClick={() => {
                                    newMaint = { ...newMaint, item: 'Roof Inspection', cost: 250, provider: 'Top Roofing Inc.' };
                                    addType = 'maintenance';
                                    showAddModal = true;
                                }}
                            />
                            <GhostRow
                                name="Septic Pumping"
                                subtitle="3-Year Service"
                                type="Maintenance"
                                value={375}
                                onClick={() => {
                                    newMaint = { ...newMaint, item: 'Septic Pumping', cost: 375, provider: 'Clean Septic LLC' };
                                    addType = 'maintenance';
                                    showAddModal = true;
                                }}
                            />
                        </div>
                    </div>
                {/if}
            </div>
        {:else if activeTab === "claims"}
            <!-- Claims view -->
            <div class="p-10" in:fade>
                <div class="space-y-4">
                    {#each filteredClaims as claim (claim.id)}
                        <div
                            class="flex items-center justify-between p-6 bg-card border border-border rounded-2xl hover:border-primary/30 transition-all group"
                        >
                            <div class="flex items-center gap-6">
                                <div
                                    class="w-14 h-14 bg-background text-muted-foreground rounded-2xl flex items-center justify-center group-hover:bg-primary-soft group-hover:text-primary-hover transition-all"
                                >
                                    <FileCheck size={28} />
                                </div>
                                <div>
                                    <h3
                                        class="font-bold text-lg text-foreground uppercase"
                                    >
                                        Claim #{claim.claimNumber}
                                    </h3>
                                    <p
                                        class="text-sm text-muted-foreground font-medium"
                                    >
                                        {claim.note}
                                    </p>
                                    {#if policyName(claim.policyId)}
                                        <p class="text-xs text-muted-foreground font-bold mt-1">
                                            {policyName(claim.policyId)}
                                        </p>
                                    {/if}
                                </div>
                            </div>
                            <div class="flex items-center gap-10">
                                <div class="text-right">
                                    <p
                                        class="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1"
                                    >
                                        Status
                                    </p>
                                    <select
                                        aria-label="Claim status"
                                        value={claim.status}
                                        onchange={(e) => setClaimStatus(claim.id, e.currentTarget.value as InsuranceClaim["status"])}
                                        class="px-3 py-1 rounded-full text-[10px] font-black uppercase cursor-pointer {claim.status ===
                                        'paid'
                                            ? 'bg-success/10 text-success border border-success/20'
                                            : 'bg-warning-soft text-warning border border-warning/30'}"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="paid">Paid</option>
                                        {#if claim.status === "denied"}<option value="denied">Denied</option>{/if}
                                    </select>
                                </div>
                                <div class="text-right">
                                    <p
                                        class="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1"
                                    >
                                        Claimed
                                    </p>
                                    <p
                                        class="font-black text-foreground font-mono"
                                    >
                                        {claim.amountClaimed == null ? "Unknown" : `$${claim.amountClaimed.toLocaleString()}`}
                                    </p>
                                </div>
                                <button aria-label="Edit these details"
                                    onclick={() => startEdit("claim", claim)}
                                    class="p-2 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <Pencil size={20} />
                                </button>
                                <button aria-label="Remove this item"
                                    onclick={() =>
                                        removeFrom("claims", claim.id)}
                                    class="p-2 text-muted-foreground hover:text-danger transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    {/each}
                    {#if filteredClaims.length === 0}
                        <EmptyState
                            title="Track your insurance claims"
                            whyMatters="<strong>Open claims can take a while.</strong> Noting them here gives your family what they need to follow through."
                            encouragement="If you have any pending claims, add them here. Even resolved claims create a helpful history."
                            icon={FileCheck}
                            iconClass="text-primary"
                            ctaLabel="Track first claim"
                            onAction={() => { addType = 'claim'; showAddModal = true; }}
                        />
                        <!-- Sample Data GhostRows -->
                        <div class="mt-8">
                            <p class="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-4 text-center">Example entries to inspire you</p>
                            <div class="space-y-4">
                                <GhostRow
                                    name="Storm Damage - Roof Repair"
                                    subtitle="Home Insurance Claim"
                                    type="Claim"
                                    value={8500}
                                    onClick={() => {
                                        newClaim = { ...newClaim, claimNumber: 'HM-2024-001', note: 'Storm Damage - Roof Repair', amountClaimed: 8500, status: 'pending' };
                                        addType = 'claim';
                                        showAddModal = true;
                                    }}
                                />
                                <GhostRow
                                    name="Fender Bender - Rear Bumper"
                                    subtitle="Auto Insurance Claim"
                                    type="Claim"
                                    value={2200}
                                    onClick={() => {
                                        newClaim = { ...newClaim, claimNumber: 'AU-2024-015', note: 'Fender Bender - Rear Bumper', amountClaimed: 2200, status: 'pending' };
                                        addType = 'claim';
                                        showAddModal = true;
                                    }}
                                />
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        {:else if activeTab === "killswitch"}
            <!-- Digital Kill Switch center view -->
            <div class="p-10 space-y-10" in:fade>
                <div
                    class="bg-background border border-border p-8 rounded-[2rem] flex items-center gap-8 relative overflow-hidden"
                >
                    <div
                        class="absolute -right-10 -bottom-10 opacity-5 rotate-12 pointer-events-none"
                    >
                        <ShieldAlert size={200} />
                    </div>
                    <div
                        class="w-20 h-20 bg-primary-soft text-primary-hover rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
                    >
                        <Flower2 size={40} />
                    </div>
                    <div class="space-y-2 relative z-10">
                        <h2 class="text-2xl font-black text-foreground">
                            How to care for your online presence
                        </h2>
                        <p
                            class="text-muted-foreground max-w-2xl font-medium leading-relaxed"
                        >
                            Define how your online presence should be managed,
                            with clear wishes for your executor about
                            memorializing or removing each account.
                        </p>
                    </div>
                </div>

                {#if filteredAccounts.length === 0}
                    <EmptyState
                        title="Share your account wishes"
                        whyMatters="<strong>Each account can carry its own wish.</strong> Clear wishes for your executor about memorializing or removing each account make the path simple for your family."
                        encouragement="Start with your most important account. You can add more details as you remember them."
                        icon={Monitor}
                        iconClass="text-primary"
                        ctaLabel="Share an account"
                        onAction={() => { addType = 'account'; showAddModal = true; }}
                    />
                {/if}
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {#each filteredAccounts as acc (acc.id)}
                        <div
                            class="bg-card border-2 border-border/50 rounded-[2.5rem] p-8 space-y-6 hover:border-primary/20 transition-all shadow-sm"
                        >
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-4">
                                    <div
                                        class="p-3 bg-primary-deep text-white rounded-2xl"
                                    >
                                        <Monitor size={20} />
                                    </div>
                                    <div>
                                        <h3
                                            class="font-black text-foreground text-xl tracking-tight uppercase"
                                        >
                                            {acc.platform ?? acc.name ?? ""}
                                        </h3>
                                        {#if acc.username}
                                            <p
                                                class="text-[10px] font-black text-muted-foreground tracking-[0.2em]"
                                            >
                                                {acc.username}
                                            </p>
                                        {/if}
                                    </div>
                                </div>
                                <div class="flex flex-col items-end gap-2">
                                    {#if acc.priority}
                                        <span
                                            class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider {acc.priority ===
                                            'high'
                                                ? 'bg-warning-soft text-warning'
                                                : 'bg-muted text-muted-foreground'}"
                                        >
                                            {acc.priority} Priority
                                        </span>
                                    {/if}
                                    <button
                                        onclick={() =>
                                            digitalAssetsStore.toggleClosure(
                                                acc.id,
                                            ).catch(() => {})}
                                        class="flex items-center gap-2 group"
                                    >
                                        <div
                                            class="w-10 h-5 rounded-full relative transition-all {acc.isClosed
                                                ? 'bg-primary'
                                                : 'bg-border'}"
                                        >
                                            <div
                                                class="absolute top-1 w-3 h-3 bg-white rounded-full transition-all {acc.isClosed
                                                    ? 'right-1'
                                                    : 'left-1'}"
                                            ></div>
                                        </div>
                                        <span
                                            class="text-[10px] font-black uppercase text-muted-foreground group-hover:text-foreground transition-colors"
                                            >Closed</span
                                        >
                                    </button>
                                </div>
                            </div>

                            {#if acc.instructions || hasWish(acc) || (acc.isClosed && acc.closureDate)}
                            <div
                                class="p-5 bg-background rounded-2xl border border-border space-y-2"
                            >
                                {#if acc.instructions}
                                    <h4
                                        class="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2"
                                    >
                                        <ArrowUpRight
                                            size={12}
                                            class="text-primary"
                                        />
                                        Final Instruction
                                    </h4>
                                    <p
                                        class="text-sm font-bold text-foreground italic"
                                    >
                                        "{acc.instructions}"
                                    </p>
                                {/if}
                                <div
                                    class="flex items-center justify-between {acc.instructions ? 'pt-3 border-t border-border mt-2' : ''}"
                                >
                                    <div class="flex items-center gap-2">
                                        {#if hasWish(acc)}
                                            <span
                                                class="w-2 h-2 rounded-full {acc.preference ===
                                                'delete'
                                                    ? 'bg-muted-foreground'
                                                    : 'bg-primary'}"
                                            ></span>
                                            <span
                                                class="text-[10px] font-black uppercase text-muted-foreground tracking-wider"
                                                >Protocol: {acc.preference}</span
                                            >
                                        {/if}
                                    </div>
                                    {#if acc.isClosed && acc.closureDate}
                                        <span
                                            class="text-[10px] font-bold text-muted-foreground italic"
                                            >Deactivated on {new Date(
                                                acc.closureDate,
                                            ).toLocaleDateString()}</span
                                        >
                                    {/if}
                                </div>
                            </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
</div>
{/if}

{#if showAddModal}
    <div role="dialog" aria-modal="true" use:focusTrap={{ onEscape: closeModal }}
        class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
        transition:fade
    >
        <div
            class="bg-card w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-white/20"
            transition:scale={{ start: 0.95, duration: 300 }}
        >
            <div
                class="px-10 py-8 border-b border-border flex items-center justify-between bg-background/50"
            >
                <h3
                    class="text-xl font-black text-foreground uppercase tracking-tight"
                >
                    {editingId ? "Edit these details" : `Add ${addType}`}
                </h3>
                <button aria-label="Close"
                    onclick={closeModal}
                    class="text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            <div class="p-10 space-y-6">
                {#if addType === "transaction"}
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label
                                    for="asset-id"
                                    class="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1"
                                    >Asset</label
                                >
                                <select
                                    id="asset-id"
                                    bind:value={newTx.assetId}
                                    class="w-full px-5 py-3 bg-background border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold"
                                >
                                    <option value={undefined}></option>
                                    {#each assetOptions as o (o.value)}
                                        <option value={o.value}>{o.label}</option>
                                    {/each}
                                </select>
                            </div>
                            <div class="space-y-2">
                                <label
                                    for="tx-date"
                                    class="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1"
                                    >Date</label
                                >
                                <input
                                    id="tx-date"
                                    type="date"
                                    bind:value={newTx.date}
                                    class="w-full px-5 py-3 bg-background border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold"
                                />
                            </div>
                        </div>
                        <div class="space-y-2">
                            <label
                                for="tx-description"
                                class="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1"
                                >Description</label
                            >
                            <input
                                id="tx-description"
                                bind:value={newTx.description}
                                class="w-full px-5 py-3 bg-background border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold"
                                placeholder="Quarterly Valuation"
                            />
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label
                                    for="tx-type"
                                    class="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1"
                                    >Type</label
                                >
                                <select
                                    id="tx-type"
                                    bind:value={newTx.type}
                                    class="w-full px-5 py-3 bg-background border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold appearance-none"
                                >
                                    <option value="purchase">Purchase</option>
                                    <option value="sale">Sale</option>
                                    <option value="valuation_update"
                                        >Valuation Update</option
                                    >
                                </select>
                            </div>
                            <div class="space-y-2">
                                <label
                                    for="tx-amount"
                                    class="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1"
                                    >Amount ($)</label
                                >
                                <input
                                    id="tx-amount"
                                    type="number"
                                    bind:value={newTx.amount}
                                    class="w-full px-5 py-3 bg-background border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold font-mono"
                                />
                            </div>
                        </div>
                        <div class="pt-4 mt-4 border-t border-border">
                            <CustomFieldsManager
                                entityType="transaction"
                                bind:data={parsedCustomAttributes}
                            />
                        </div>
                    </div>
                {:else if addType === "maintenance"}
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <label
                                for="maint-item"
                                class="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1"
                                >Item / Task</label
                            >
                            <input
                                id="maint-item"
                                bind:value={newMaint.item}
                                class="w-full px-5 py-3 bg-background border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold"
                                placeholder="Roof Inspection"
                            />
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label
                                    for="maint-cost"
                                    class="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1"
                                    >Cost ($)</label
                                >
                                <input
                                    id="maint-cost"
                                    type="number"
                                    bind:value={newMaint.cost}
                                    class="w-full px-5 py-3 bg-background border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold font-mono"
                                />
                            </div>
                            <div class="space-y-2">
                                <label
                                    for="maint-date"
                                    class="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1"
                                    >Date</label
                                >
                                <input
                                    id="maint-date"
                                    type="date"
                                    bind:value={newMaint.date}
                                    class="w-full px-5 py-3 bg-background border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold"
                                />
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label
                                    for="maint-provider"
                                    class="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1"
                                    >Provider</label
                                >
                                <input
                                    id="maint-provider"
                                    bind:value={newMaint.provider}
                                    class="w-full px-5 py-3 bg-background border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold"
                                />
                            </div>
                            <div class="space-y-2">
                                <label
                                    for="maint-next"
                                    class="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1"
                                    >Next Due</label
                                >
                                <input
                                    id="maint-next"
                                    type="date"
                                    bind:value={newMaint.nextDueDate}
                                    class="w-full px-5 py-3 bg-background border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold"
                                />
                            </div>
                        </div>
                        <div class="pt-4 mt-4 border-t border-border">
                            <CustomFieldsManager
                                entityType="maintenance"
                                bind:data={parsedCustomAttributes}
                            />
                        </div>
                    </div>
                {:else if addType === "claim"}
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <label
                                for="claim-number"
                                class="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1"
                                >Claim Number</label
                            >
                            <input
                                id="claim-number"
                                bind:value={newClaim.claimNumber}
                                class="w-full px-5 py-3 bg-background border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold"
                                placeholder="CL-882299"
                            />
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label
                                    for="claim-amount"
                                    class="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1"
                                    >Amount ($)</label
                                >
                                <input
                                    id="claim-amount"
                                    type="number"
                                    bind:value={newClaim.amountClaimed}
                                    class="w-full px-5 py-3 bg-background border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold font-mono"
                                />
                            </div>
                            <div class="space-y-2">
                                <label
                                    for="claim-policy"
                                    class="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1"
                                    >Policy</label
                                >
                                <select
                                    id="claim-policy"
                                    bind:value={newClaim.policyId}
                                    class="w-full px-5 py-3 bg-background border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold"
                                >
                                    <option value={undefined}></option>
                                    {#each insuranceSync.items as pol (pol.id)}
                                        <option value={String(pol.id)}>{policyName(String(pol.id))}</option>
                                    {/each}
                                </select>
                            </div>
                        </div>
                        <div class="space-y-2">
                            <label
                                for="claim-note"
                                class="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1"
                                >Note / Details</label
                            >
                            <textarea
                                id="claim-note"
                                bind:value={newClaim.note}
                                class="w-full px-5 py-3 bg-background border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold"
                                rows="3"
                            ></textarea>
                        </div>
                        <div class="pt-4 mt-4 border-t border-border">
                            <CustomFieldsManager
                                entityType="claim"
                                bind:data={parsedCustomAttributes}
                            />
                        </div>
                    </div>
                {:else if addType === "account"}
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label
                                    for="platform-input"
                                    class="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1"
                                    >Platform</label
                                >
                                <input
                                    id="platform-input"
                                    bind:value={newAccount.platform}
                                    class="w-full px-5 py-3 bg-background border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold"
                                    placeholder="E.g. Netflix"
                                />
                            </div>
                            <div class="space-y-2">
                                <label
                                    for="username-input"
                                    class="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1"
                                    >Username / ID</label
                                >
                                <input
                                    id="username-input"
                                    bind:value={newAccount.username}
                                    class="w-full px-5 py-3 bg-background border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold"
                                    placeholder="user@gmail.com"
                                />
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label
                                    for="preference-select"
                                    class="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1"
                                    >Preference</label
                                >
                                <select
                                    id="preference-select"
                                    bind:value={newAccount.preference}
                                    class="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                >
                                    <option value="memorialize"
                                        >Memorialize</option
                                    >
                                    <option value="delete"
                                        >Remove / Close the account</option
                                    >
                                    <option value="transfer"
                                        >Transfer Ownership</option
                                    >
                                </select>
                            </div>
                            <div class="space-y-2">
                                <label
                                    for="priority-select"
                                    class="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1"
                                    >Priority</label
                                >
                                <select
                                    id="priority-select"
                                    bind:value={newAccount.priority}
                                    class="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>
                        <div class="space-y-2">
                            <label
                                for="final-instructions"
                                class="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1"
                                >Final Instructions</label
                            >
                            <textarea
                                id="final-instructions"
                                bind:value={newAccount.instructions}
                                placeholder="Any specific details about handling this item..."
                                class="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all h-24 resize-none"
                            ></textarea>
                        </div>
                    </div>
                {/if}

                <div class="pt-6 flex items-center gap-4">
                    <button
                        onclick={handleAdd}
                        disabled={registryBusy}
                        aria-busy={registryBusy}
                        class="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
                    >
                        {registryBusy ? "Saving..." : "Save my thoughts"}
                    </button>
                    <button
                        onclick={closeModal}
                        class="px-8 py-4 bg-muted text-muted-foreground rounded-2xl font-black hover:bg-border transition-all text-sm"
                    >
                        Maybe later
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    :global(.paper-texture) {
        background-color: var(--color-card);
        background-image: linear-gradient(
                90deg,
                transparent 79px,
                color-mix(in srgb, var(--color-info) 35%, transparent) 79px,
                color-mix(in srgb, var(--color-info) 35%, transparent) 81px,
                transparent 81px
            ),
            linear-gradient(var(--color-border) 0.1em, transparent 0.1em);
        background-size: 100% 1.2em;
    }
</style>
