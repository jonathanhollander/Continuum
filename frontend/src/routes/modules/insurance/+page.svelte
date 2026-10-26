<script lang="ts">
    import { focusTrap } from "$lib/actions/focusTrap";
    import { readCustom } from "$lib/utils/customFields";
    import {
        insuranceStore,
        insuranceSync,
        type InsurancePolicy,
    } from "$lib/stores/insuranceStore.svelte";
    import { activityLog } from "$lib/stores/activityLog.svelte";
    import { notifications } from "$lib/stores/notificationStore";
    import { estateProfile } from "$lib/stores/estateStore.svelte";
    import { fade, slide, scale, fly } from "svelte/transition";
    import { quintOut, cubicOut } from "svelte/easing";
    import {
        Shield,
        Plus,
        Trash2,
        Pencil,
        ExternalLink,
        FileText,
        User,
        Activity,
        CircleAlert,
        CircleCheck,
        Clock,
        DollarSign,
        Calendar,
        ChevronRight,
        X,
        Search,
        Heart,
        Car,
        Home,
        Info,
        ArrowRight,
        Filter,
        Download,
        Sparkles,
        Loader2,
    } from "lucide-svelte";
    import { onMount } from "svelte";
    import Modal from "$lib/components/ui/Modal.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import UniversalUploader from "$lib/components/ui/UniversalUploader.svelte";
    import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte";
    import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";
    import { userPreferencesStore, type ViewMode } from "$lib/stores/userPreferencesStore.svelte";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";

    // Concierge Imports
    import ConciergeFlow from "$lib/components/concierge/ConciergeFlow.svelte";
    import { portal } from "$lib/actions/portal";
    import { t, language } from "$lib/stores/localization";
    import { getSmartSamples } from "$lib/data/smartSamples";
    import { plural } from "$lib/utils/plural";
    import { formatMoney } from "$lib/utils/money";
    import { downloadMedia, mediaIdFromRef } from "$lib/services/mediaService";

    let showAddModal = $state(false);
    let viewMode = $state<ViewMode>('card');
    let isEditing = $state(false);
    let searchQuery = $state("");
    let filterType = $state("All");
    let openClaims = $state<Record<string, boolean>>({});
    const cap = (v: unknown) => {
        const t = String(v ?? "").trim();
        return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
    };
    let showWizard = $state(false);
    let parsedCustomAttributes = $state<Record<string, any>>({});
    let isLoading = $state(true);

    onMount(async () => {
        await insuranceStore.sync?.();
        isLoading = false;
    });

    let newPolicy = $state<Partial<InsurancePolicy>>({
        policyName: "",
        insuranceType: "Life",
        insurer: "",
        policyNumber: "",
        premiumAmount: 0,
        premiumFrequency: "Monthly",
        beneficiaries: "",
        agentName: "",
        agentContact: "",
        claimsProcedure: "",
        status: "Active",
        policyDocuments: "",
        expirationDate: "",
        notes: "",
    });

    const wizardSteps = [
        {
            id: "intro",
            question: "wizard.insurance_intro",
            type: "boolean" as const,
            logic: { yes: "life", no: "EXIT" },
        },
        {
            id: "life",
            question: "wizard.insurance_life",
            type: "boolean" as const,
            logic: { next: "auto" },
        },
        {
            id: "auto",
            question: "wizard.insurance_auto",
            type: "boolean" as const,
            logic: { next: "home" },
        },
        {
            id: "home",
            question: "wizard.insurance_home",
            type: "boolean" as const,
        },
    ];

    function handleWizardComplete(answers: Record<string, any>) {
        if (answers.intro === false) {
            showWizard = false;
            return;
        }

        const wanted: [string, any, string][] = [];
        if (answers.life) wanted.push(["Life Insurance", "Life", "Term Life"]);
        if (answers.auto) wanted.push(["Auto Insurance", "Auto", "Comprehensive"]);
        if (answers.home)
            wanted.push(["Home/Renters Insurance", "Home", "Standard Fire & Theft"]);

        showWizard = false;
        if (wanted.length > 0) saveWizardPolicies(wanted);
    }

    // One wizard run is one save: the creates run quietly, then one affirmation when all land,
    // or one gentle message whose Try Again re-sends only the policies still waiting.
    async function saveWizardPolicies(wanted: [string, any, string][]) {
        const results = await Promise.allSettled(
            wanted.map(([name, type, insurer]) => addWizardPolicy(name, type, insurer)),
        );
        const waiting = wanted.filter((_, i) => results[i].status === "rejected");
        if (waiting.length === 0) {
            notifications.showAffirmation("general");
            return;
        }
        const reason = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
        notifications.showError(
            {
                message:
                    "Your answers are safe here. We can save them again whenever you're ready.",
                code: "DATABASE_ERROR",
                technicalDetails: reason.reason?.technicalDetails || reason.reason?.message || String(reason.reason),
            } as any,
            () => saveWizardPolicies(waiting),
        );
    }

    async function addWizardPolicy(name: string, type: any, insurer = "TBD") {
        const created = await insuranceSync.create({
            id: crypto.randomUUID(),
            policyName: name,
            insuranceType: type,
            insurer: insurer,
            policyNumber: "",
            premiumAmount: 0,
            premiumFrequency: "Monthly",
            beneficiaries: estateProfile.current.primaryBeneficiary || "",
            agentName: "",
            agentContact: "",
            claimsProcedure: "",
            status: "Pending",
            policyDocuments: "",
            notes: "Added via Concierge Wizard",
        }, false, true);

        activityLog.logEvent({
            module: "Insurance",
            action: "CREATE",
            entityType: "Policy",
            entityId: String(created.id),
            entityName: created.policyName,
            userContext: "Concierge",
        });
    }

    const policies = $derived(insuranceStore.policies);
    const filteredPolicies = $derived(
        policies.filter((p) => {
            const matchesSearch =
                p.policyName
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                p.insurer.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter =
                filterType === "All" || p.insuranceType === filterType;
            return matchesSearch && matchesFilter;
        }),
    );

    // Download: save the stored policy document of each policy shown.
    let shownDocumentIds = $derived(
        filteredPolicies
            .map((p) => mediaIdFromRef(p.policyDocuments))
            .filter((id): id is number => id !== null),
    );
    let downloadingDocuments = $state(false);
    async function downloadShownDocuments() {
        if (downloadingDocuments) return;
        downloadingDocuments = true;
        try {
            for (const id of shownDocumentIds) {
                await downloadMedia(id).catch((e) => console.warn("[insurance] policy document download paused", id, e));
            }
        } finally {
            downloadingDocuments = false;
        }
    }

    const stats = $derived(insuranceStore.getTotalPremiums());
    // Share of the key details recorded across every policy (0 with none)
    const completionRate = $derived.by(() => {
        if (policies.length === 0) return 0;
        const filled = (v: unknown) => String(v ?? "").trim() !== "" && String(v).trim() !== "TBD";
        let done = 0;
        for (const p of policies) {
            if (filled(p.insurer)) done++;
            if (filled(p.policyNumber)) done++;
            if (filled(p.beneficiaries)) done++;
            if (Number(p.premiumAmount) > 0) done++;
            if (filled(p.agentName) || filled(p.agentContact)) done++;
        }
        return Math.round((done / (policies.length * 5)) * 100);
    });
    const types = [
        "All",
        "Life",
        "Health",
        "Auto",
        "Home",
        "Disability",
        "Other",
    ];

    function resetForm() {
        newPolicy = {
            policyName: "",
            insuranceType: "Life",
            insurer: "",
            policyNumber: "",
            premiumAmount: 0,
            premiumFrequency: "Monthly",
            beneficiaries: "",
            agentName: "",
            agentContact: "",
            claimsProcedure: "",
            status: "Active",
            policyDocuments: "",
            expirationDate: "",
            notes: "",
        };
        showAddModal = false;
        isEditing = false;
        parsedCustomAttributes = {};
    }

    // One save at a time: while it is open the button waits, so a second click sends nothing.
    let saving = $state(false);
    async function handleAddPolicy() {
        if (saving) return;
        saving = true;
        try {
            await handleAddPolicyOnce();
        } finally {
            saving = false;
        }
    }

    async function handleAddPolicyOnce() {
        if (!newPolicy.policyName || !newPolicy.insurer) return;

        // Serialize custom attributes
        const policyData = {
            ...newPolicy,
            custom_attributes: JSON.stringify(parsedCustomAttributes)
        };

        try {
        if (isEditing && newPolicy.id) {
            const oldPolicy = insuranceStore.getPolicy(newPolicy.id);
            const changes = [];

            if (oldPolicy) {
                if (oldPolicy.policyName !== newPolicy.policyName)
                    changes.push({
                        field: "policyName",
                        oldValue: oldPolicy.policyName,
                        newValue: newPolicy.policyName,
                    });
                if (oldPolicy.premiumAmount !== newPolicy.premiumAmount)
                    changes.push({
                        field: "premiumAmount",
                        oldValue: oldPolicy.premiumAmount,
                        newValue: newPolicy.premiumAmount,
                    });
                if (oldPolicy.status !== newPolicy.status)
                    changes.push({
                        field: "status",
                        oldValue: oldPolicy.status,
                        newValue: newPolicy.status,
                    });
            }

            await insuranceStore.updatePolicy(newPolicy.id, policyData);

            activityLog.logEvent({
                module: "Insurance",
                action: "UPDATE",
                entityType: "Policy",
                entityId: String(newPolicy.id),
                entityName: newPolicy.policyName!,
                changes,
                userContext: estateProfile.current.ownerName || "User",
            });
        } else {
            const created = await insuranceStore.addPolicy(
                policyData as Omit<InsurancePolicy, "id">,
                handleAddPolicy,
            );

            activityLog.logEvent({
                module: "Insurance",
                action: "CREATE",
                entityType: "Policy",
                entityId: String(created!.id!),
                entityName: created!.policyName,
                userContext: estateProfile.current.ownerName || "User",
            });
        }

        resetForm();
        } catch {
            // The manager already showed the one gentle message; the form stays open with the draft.
        }
    }

    function editPolicy(policy: InsurancePolicy) {
        newPolicy = { ...policy };
        // Parse custom attributes for editing
        parsedCustomAttributes = readCustom(policy);
        isEditing = true;
        showAddModal = true;
    }

    async function deletePolicy(id: string | number, name: string) {
        if (
            confirm(
                `Remove the policy "${name}"? You can add it back later if needed.`,
            )
        ) {
            try {
                await insuranceStore.deletePolicy(id);
            } catch {
                return;
            }
            if (insuranceStore.policies.some((p) => String(p.id) === String(id))) return;

            activityLog.logEvent({
                module: "Insurance",
                action: "DELETE",
                entityType: "Policy",
                entityId: String(id),
                entityName: name,
                userContext: estateProfile.current.ownerName || "User",
            });
        }
    }

    const typeIcons = {
        Life: Heart,
        Health: Activity,
        Auto: Car,
        Home: Home,
        Disability: CircleAlert,
        Other: FileText,
    };

    const statusColors = {
        Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
        Inactive: "bg-slate-100 text-slate-600 border-slate-200",
        Pending: "bg-amber-100 text-amber-700 border-amber-200",
    };

    const typeColors = {
        Life: "text-rose-600 bg-rose-50 border-rose-100",
        Health: "text-blue-600 bg-blue-50 border-blue-100",
        Auto: "text-indigo-600 bg-indigo-50 border-indigo-100",
        Home: "text-emerald-600 bg-emerald-50 border-emerald-100",
        Disability: "text-amber-600 bg-amber-50 border-amber-100",
        Other: "text-slate-600 bg-slate-50 border-slate-100",
    };
</script>

<LivingBlueprintHeader
    title="Insurance Portfolio"
    subtitle="Protecting your loved ones with financial security"
    tier="protection"
    detailedDescription="Life insurance and protection policies are acts of love. They ensure your family has financial security when you're no longer here to provide it, bridging the gap when they need it most."
    whyMatters="Billions in insurance benefits go unclaimed every year simply because beneficiaries didn't know policies existed. Cataloging them here guarantees your foresight protects those you love."
>
    <div class="flex flex-wrap items-center gap-3">
        <DataViewToggle module="insurance" onchange={(mode) => viewMode = mode} />
        <button
            onclick={() => (showWizard = true)}
            class="flex items-center gap-2 px-5 py-3 border border-primary/10 text-primary font-bold rounded-2xl hover:bg-primary/5 transition-colors"
        >
            <Sparkles size={18} />
            {$t("wizard.start")}
        </button>
        <button
            onclick={() => (showAddModal = true)}
            class="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl transition-all shadow-xl shadow-slate-900/10 font-bold"
        >
            <Plus size={20} />
            Share Protection
        </button>
    </div>
</LivingBlueprintHeader>

{#if isLoading}
    <div class="flex items-center justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
{:else}
<div
    class="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700"
>
    <!-- Wizard Modal -->
    {#if showWizard}
        <!-- Moved to <body>: the animated page wrapper would otherwise hold this "fixed" overlay below the fold. -->
        <div role="dialog" aria-modal="true" use:focusTrap={{ onEscape: () => (showWizard = false) }}
            use:portal
            class="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            transition:fade
        >
            <div class="w-full max-w-2xl relative" in:fly={{ y: 20 }}>
                <button
                    class="absolute -top-12 right-0 text-white/50 hover:text-white"
                    onclick={() => (showWizard = false)}>Go back</button
                >
                <ConciergeFlow
                    steps={wizardSteps}
                    oncomplete={handleWizardComplete}
                />
            </div>
        </div>
    {/if}

    <!-- AI Prompt Bar -->
    <div class="max-w-3xl mx-auto mb-8">
        <AIPromptBar context="insurance" />
    </div>

    <!-- Stats Dashboard -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
            class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
        >
            <div class="flex items-start justify-between mb-4">
                <div
                    class="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform"
                >
                    <DollarSign size={24} />
                </div>
                <div
                    class="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-bold"
                >
                    ANNUAL
                </div>
            </div>
            <p
                class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1"
            >
                Total Premiums
            </p>
            <p class="text-3xl font-black text-slate-900 tracking-tight">
                {formatMoney(stats.annual)}
            </p>
        </div>

        <div
            class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
        >
            <div class="flex items-start justify-between mb-4">
                <div
                    class="p-3 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform"
                >
                    <Activity size={24} />
                </div>
                <div
                    class="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded-lg font-bold"
                >
                    MONTHLY
                </div>
            </div>
            <p
                class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1"
            >
                Monthly Average
            </p>
            <p class="text-3xl font-black text-slate-900 tracking-tight">
                {formatMoney(stats.monthly)}
            </p>
        </div>

        <div
            class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
        >
            <div class="flex items-start justify-between mb-4">
                <div
                    class="p-3 bg-rose-50 rounded-2xl text-rose-600 group-hover:scale-110 transition-transform"
                >
                    <Heart size={24} />
                </div>
                <div
                    class="text-[10px] bg-rose-100 text-rose-700 px-2 py-1 rounded-lg font-bold"
                >
                    STATUS
                </div>
            </div>
            <p
                class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1"
            >
                Active Policies
            </p>
            <p class="text-3xl font-black text-slate-900 tracking-tight">
                {policies.filter((p) => p.status === "Active").length}
            </p>
        </div>

        <div
            class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
        >
            <div class="flex items-start justify-between mb-4">
                <div
                    class="p-3 bg-slate-50 rounded-2xl text-slate-600 group-hover:scale-110 transition-transform"
                >
                    <CircleCheck size={24} />
                </div>
                <div
                    class="text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded-lg font-bold"
                >
                    AUDIT
                </div>
            </div>
            <p
                class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1"
            >
                Completion Rate
            </p>
            <p class="text-3xl font-black text-slate-900 tracking-tight">
                {completionRate}%
            </p>
        </div>
    </div>

    <!-- Search & Filters -->
    <div
        class="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 p-4 rounded-2xl border border-slate-100"
    >
        <div class="relative w-full md:w-96">
            <Search class="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
                type="text"
                bind:value={searchQuery}
                placeholder="Search by policy, carrier, or type"
                class="w-full px-4 py-3 pl-12 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
            />
        </div>
        <div
            class="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm"
        >
            {#each types as type}
                <button
                    onclick={() => (filterType = type)}
                    class="px-4 py-2 rounded-xl text-xs font-bold tracking-wider transition-all {filterType ===
                    type
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'text-slate-500 hover:text-primary hover:bg-slate-50'}"
                >
                    {type}
                </button>
            {/each}
        </div>
        <div class="flex items-center gap-2">
            <span
                class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                >Showing {plural(filteredPolicies.length, "Policy", "Policies")}</span
            >
            <button
                class="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-primary transition-colors shadow-sm disabled:opacity-40 disabled:hover:text-slate-500"
                aria-label="Download"
                disabled={shownDocumentIds.length === 0 || downloadingDocuments}
                onclick={downloadShownDocuments}
            >
                <Download size={18} />
            </button>
        </div>
    </div>

    <!-- Policy Views -->
    {#if viewMode === 'card'}
    <!-- Policy Cards Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
        {#each filteredPolicies as policy (policy.id)}
            {@const Icon = typeIcons[policy.insuranceType] || Shield}
            <div
                class="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden group flex flex-col ring-1 ring-slate-900/5"
                transition:scale={{
                    duration: 400,
                    delay: 0,
                    opacity: 0,
                    start: 0.95,
                    easing: quintOut,
                }}
            >
                <div class="p-6 pb-0">
                    <!-- Card Top -->
                    <div class="flex items-start justify-between mb-6">
                        <div class="flex items-center gap-4">
                            <div
                                class="w-12 h-12 rounded-xl shadow-inner flex items-center justify-center transition-all duration-500 {typeColors[
                                    policy.insuranceType
                                ]}"
                            >
                                <Icon size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3
                                    class="text-lg font-semibold text-slate-900 leading-tight group-hover:text-primary transition-colors"
                                >
                                    {policy.policyName}
                                </h3>
                                <p
                                    class="text-slate-500 text-sm"
                                >
                                    {policy.insurer}
                                </p>
                            </div>
                        </div>
                        <div
                            class="flex items-center gap-1"
                        >
                            <button
                                onclick={() => editPolicy(policy)}
                                aria-label="Edit these details"
                                class="p-2 bg-slate-50 hover:bg-primary/5 text-slate-400 hover:text-primary rounded-xl transition-all"
                            >
                                <Pencil size={16} />
                            </button>
                            <button
                                onclick={() =>
                                    deletePolicy(
                                        String(policy.id),
                                        policy.policyName,
                                    )}
                                aria-label="Remove this item"
                                class="p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    <!-- Mini Stats Grid -->
                    <div class="grid grid-cols-3 gap-3 mb-6">
                        <div
                            class="bg-slate-50 rounded-xl p-3 border border-slate-100/50"
                        >
                            <p
                                class="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1"
                            >
                                Premium
                            </p>
                            <p
                                class="text-sm font-semibold text-slate-700"
                            >
                                {formatMoney(policy.premiumAmount)}
                            </p>
                        </div>
                        <div
                            class="bg-slate-50 rounded-xl p-3 border border-slate-100/50"
                        >
                            <p
                                class="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1"
                            >
                                Interval
                            </p>
                            <p
                                class="text-sm font-semibold text-slate-700"
                            >
                                {cap(policy.premiumFrequency)}
                            </p>
                        </div>
                        <div
                            class="bg-slate-50 rounded-xl p-3 border border-slate-100/50"
                        >
                            <p
                                class="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1"
                            >
                                Status
                            </p>
                            <div class="flex items-center gap-1.5 mt-0.5">
                                <div
                                    class="w-2 h-2 rounded-full {policy.status ===
                                    'Active'
                                        ? 'bg-emerald-500 animate-pulse'
                                        : 'bg-slate-300'}"
                                ></div>
                                <span
                                    class="text-xs font-semibold text-slate-800"
                                    >{policy.status}</span
                                >
                            </div>
                        </div>
                    </div>

                    <!-- Details Section -->
                    <div class="space-y-4 mb-6">
                        {#if policy.beneficiaries}
                        <div class="flex items-center gap-4 text-slate-600">
                            <div
                                class="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"
                            >
                                <User size={14} />
                            </div>
                            <div>
                                <p
                                    class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                                >
                                    Key Beneficiary
                                </p>
                                <p
                                    class="text-sm font-bold text-slate-700 truncate max-w-[180px]"
                                >
                                    {policy.beneficiaries}
                                </p>
                            </div>
                        </div>
                        {/if}
                        {#if policy.policyNumber}
                        <div class="flex items-center gap-4 text-slate-600">
                            <div
                                class="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"
                            >
                                <FileText size={14} />
                            </div>
                            <div>
                                <p
                                    class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                                >
                                    Policy Number
                                </p>
                                <p
                                    class="text-sm font-bold text-slate-700 tracking-wider font-mono uppercase"
                                >
                                    {policy.policyNumber}
                                </p>
                            </div>
                        </div>
                        {/if}
                    </div>
                </div>

                <!-- Card Footer / Claims Procedure -->
                {#if policy.claimsProcedure}
                <div class="mt-auto p-3">
                    <button
                        type="button"
                        onclick={() => (openClaims[String(policy.id)] = !openClaims[String(policy.id)])}
                        aria-expanded={!!openClaims[String(policy.id)]}
                        class="w-full text-left bg-primary rounded-xl p-4 text-primary-foreground flex items-center justify-between group/footer hover:bg-slate-900 hover:text-white transition-colors duration-300"
                    >
                        <span class="font-semibold text-sm">Claims Procedure</span>
                        <span class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover/footer:translate-x-1 transition-transform">
                            <ArrowRight size={18} />
                        </span>
                    </button>
                    {#if openClaims[String(policy.id)]}
                        <p class="mt-3 px-2 text-sm text-slate-700 whitespace-pre-line">{policy.claimsProcedure}</p>
                    {/if}
                </div>
                {/if}
            </div>
        {:else}
            <!-- Empty State for Insurance -->
            {#if filteredPolicies.length === 0 && searchQuery === ""}
                <div class="col-span-full">
                    <EmptyState
                        title="Protect your family's financial future"
                        whyMatters="<strong>Life insurance ensures your family has financial security when you're no longer here to provide it.</strong> Without documentation, they may never find these benefits—policies sit unclaimed, beneficiaries go unpaid, and the protection you worked for goes to waste.<br/><br/>Cataloging your policies here means your family will know exactly what coverage exists, who to contact, and how to file claims. It turns a confusing maze of paperwork into a clear roadmap during their darkest time."
                        encouragement="Start with just your life insurance. Add health, auto, and home policies as you have time."
                        icon={Shield}
                        iconClass="text-indigo-500"
                        ctaLabel="Share my first policy"
                        onAction={() => (showAddModal = true)}
                    />
                </div>

                <!-- Sample Data GhostRows -->
                <div class="col-span-full mt-8">
                    <p class="text-xs font-bold uppercase text-slate-400 tracking-widest mb-4 text-center">Example entries to inspire you</p>
                    <div class="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 opacity-60">
                        {#each getSmartSamples($language).insurance || [] as sample}
                            <GhostRow
                                name={sample.policyName}
                                subtitle={`${sample.insurer} - ${sample.insuranceType}`}
                                type="Policy"
                                value={sample.premiumAmount}
                                onClick={() => {
                                    newPolicy = {
                                        ...newPolicy,
                                        policyName: sample.policyName,
                                        insuranceType: sample.insuranceType,
                                        insurer: sample.insurer,
                                        policyNumber: sample.policyNumber,
                                        premiumAmount: sample.premiumAmount,
                                        premiumFrequency: sample.premiumFrequency,
                                        beneficiaries: sample.beneficiaries,
                                        status: sample.status,
                                        notes: sample.notes
                                    };
                                    showAddModal = true;
                                }}
                            >
                                {#snippet icon()}
                                    {@const Icon = typeIcons[sample.insuranceType] || Shield}
                                    <Icon size={20} class="text-slate-400" />
                                {/snippet}
                            </GhostRow>
                        {/each}
                    </div>
                </div>
            {/if}
        {/each}
    </div>
    {:else}
        <!-- Table View -->
        {#if filteredPolicies.length === 0 && searchQuery === ""}
            <EmptyState
                title="Protect your family's financial future"
                whyMatters="<strong>Life insurance ensures your family has financial security when you're no longer here to provide it.</strong> Without documentation, they may never find these benefits—policies sit unclaimed, beneficiaries go unpaid, and the protection you worked for goes to waste.<br/><br/>Cataloging your policies here means your family will know exactly what coverage exists, who to contact, and how to file claims. It turns a confusing maze of paperwork into a clear roadmap during their darkest time."
                encouragement="Start with just your life insurance. Add health, auto, and home policies as you have time."
                icon={Shield}
                iconClass="text-indigo-500"
                ctaLabel="Share my first policy"
                onAction={() => (showAddModal = true)}
            />
        {:else}
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table class="w-full">
                    <thead class="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Policy</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Type</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Carrier</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Premium</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Beneficiary</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Status</th>
                            <th class="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        {#each filteredPolicies as policy (policy.id)}
                            {@const Icon = typeIcons[policy.insuranceType] || Shield}
                            <tr class="hover:bg-slate-50 transition-colors group">
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-lg flex items-center justify-center {typeColors[policy.insuranceType]}">
                                            <Icon size={16} />
                                        </div>
                                        <div>
                                            <span class="font-medium text-slate-800">{policy.policyName}</span>
                                            <div class="text-xs text-slate-400">{policy.policyNumber || '-'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-4 py-3 text-sm text-slate-600">{cap(policy.insuranceType)}</td>
                                <td class="px-4 py-3 text-sm text-slate-600">{policy.insurer}</td>
                                <td class="px-4 py-3 text-sm text-slate-600">
                                    {formatMoney(policy.premiumAmount)} {cap(policy.premiumFrequency || "Monthly")}
                                </td>
                                <td class="px-4 py-3 text-sm text-slate-600 max-w-[150px] truncate">
                                    {policy.beneficiaries || '-'}
                                </td>
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-1.5">
                                        <div class="w-2 h-2 rounded-full {policy.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'}"></div>
                                        <span class="text-xs font-medium text-slate-600">{policy.status}</span>
                                    </div>
                                </td>
                                <td class="px-4 py-3 text-right">
                                    <div class="flex items-center justify-end gap-2 transition-opacity">
                                        <button aria-label="Edit these details"
                                            onclick={() => editPolicy(policy)}
                                            class="p-1.5 text-slate-400 hover:text-primary transition-colors"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button aria-label="Remove this item"
                                            onclick={() => deletePolicy(String(policy.id), policy.policyName)}
                                            class="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    {/if}
</div>
{/if}

<!-- Premium Add/Edit Modal -->
{#if showAddModal}
    <div use:focusTrap={{ onEscape: resetForm }}
        class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
    >
        <!-- Backdrop -->
        <div
            class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            transition:fade={{ duration: 200 }}
            onclick={resetForm}
            onkeydown={(e) => e.key === "Enter" && resetForm()}
            role="button"
            tabindex="0"
            aria-label="Close modal"
        ></div>

        <!-- Panel -->
        <div
            class="relative bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/5 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            transition:scale={{ duration: 250, start: 0.95, easing: cubicOut }}
        >
            <!-- Modal Header -->
            <div class="flex items-start justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
                <div class="flex-1 pr-4">
                    <nav
                        class="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2"
                    >
                        <Heart size={12} />
                        <span>Acts of Love</span>
                    </nav>
                    <h2 class="font-serif font-bold text-xl text-slate-800">
                        {isEditing ? "Update" : "Share"} Protection Details
                    </h2>
                    <p class="text-slate-500 text-sm mt-2 leading-relaxed">
                        Document your insurance coverage so your family knows what protection exists when they need it most.
                    </p>
                </div>
                <button
                    onclick={resetForm}
                    class="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
                    aria-label="Close"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>

            <div class="flex-1 overflow-y-auto p-6 space-y-8">
                <!-- Group 1: Identity -->
                <section>
                    <h3
                        class="text-xs font-bold uppercase text-slate-500 tracking-wide mb-4 flex items-center gap-3"
                    >
                        <span class="w-6 h-[2px] bg-primary rounded-full"
                        ></span>
                        Policy Identity
                    </h3>
                    <div
                        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        <div class="space-y-1.5">
                            <label
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Policy Title</label
                            >
                            <input
                                type="text"
                                bind:value={newPolicy.policyName}
                                placeholder="e.g. Master Life Policy"
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <label
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Insurance Classification</label
                            >
                            <select
                                bind:value={newPolicy.insuranceType}
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800 appearance-none cursor-pointer"
                            >
                                {#each types.filter((t) => t !== "All") as type}
                                    <option value={type}>{type}</option>
                                {/each}
                            </select>
                        </div>
                        <div class="space-y-1.5">
                            <label
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Insurance Carrier</label
                            >
                            <input
                                type="text"
                                bind:value={newPolicy.insurer}
                                placeholder="e.g. Prudential Financial"
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <label
                                for="insurance-policy-number"
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Policy Number</label
                            >
                            <input
                                id="insurance-policy-number"
                                type="text"
                                bind:value={newPolicy.policyNumber}
                                placeholder="As printed on the policy"
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <label
                                for="insurance-expiration-date"
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Expiration Date</label
                            >
                            <input
                                id="insurance-expiration-date"
                                type="date"
                                bind:value={newPolicy.expirationDate}
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
                            />
                        </div>
                    </div>

                    <!-- Policy Document Upload -->
                    <div class="mt-6">
                        <h3
                            class="text-xs font-bold uppercase text-slate-500 tracking-wide mb-4 flex items-center gap-3"
                        >
                            <span class="w-6 h-[2px] bg-primary rounded-full"
                            ></span>
                            Policy Documentation
                        </h3>
                        <div
                            class="bg-slate-50 rounded-xl p-4 border border-slate-200"
                        >
                            <UniversalUploader
                                label="Upload Policy Document (PDF/Text/Image)"
                                mode="any"
                                module="insurance"
                                category="financial"
                                bind:value={newPolicy.policyDocuments}
                            />
                            {#if newPolicy.policyDocuments}
                                <div
                                    class="mt-2 text-xs text-slate-500 font-medium flex items-center gap-1"
                                >
                                    <CircleCheck
                                        size={12}
                                        class="text-green-500"
                                    />
                                    Document secured in vault
                                </div>
                            {/if}
                        </div>
                    </div>
                </section>

                <!-- Group 2: Financial -->
                <section
                    class="bg-slate-50 rounded-2xl p-6 border border-slate-200"
                >
                    <h3
                        class="text-xs font-bold uppercase text-primary tracking-wide mb-4 flex items-center gap-3"
                    >
                        <span class="w-6 h-[2px] bg-primary rounded-full"
                        ></span>
                        Premium Structure
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="space-y-1.5">
                            <label
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Premium Amount ($)</label
                            >
                            <div class="relative">
                                <DollarSign
                                    size={16}
                                    class="absolute left-4 top-3.5 text-primary"
                                />
                                <input
                                    type="number"
                                    bind:value={newPolicy.premiumAmount}
                                    class="w-full px-4 py-3 pl-10 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
                                />
                            </div>
                        </div>
                        <div class="space-y-1.5">
                            <label
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Billing Interval</label
                            >
                            <select
                                bind:value={newPolicy.premiumFrequency}
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800 appearance-none cursor-pointer"
                            >
                                <option>Monthly</option>
                                <option>Quarterly</option>
                                <option>Annually</option>
                            </select>
                        </div>
                        <div class="space-y-1.5">
                            <label
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Status Tracking</label
                            >
                            <div
                                class="flex bg-white rounded-xl p-1 border border-slate-200"
                            >
                                {#each ["Active", "Pending", "Inactive"] as status}
                                    <button
                                        type="button"
                                        onclick={() =>
                                            (newPolicy.status = status as any)}
                                        class="flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all {newPolicy.status ===
                                        status
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-slate-400 hover:bg-slate-50'}"
                                    >
                                        {status}
                                    </button>
                                {/each}
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Group 3: Legacy Details -->
                <section>
                    <h3
                        class="text-xs font-bold uppercase text-slate-500 tracking-wide mb-4 flex items-center gap-3"
                    >
                        <span class="w-6 h-[2px] bg-rose-500 rounded-full"
                        ></span>
                        Legacy Information
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-1.5">
                            <label
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Designated Beneficiaries</label
                            >
                            <input
                                type="text"
                                bind:value={newPolicy.beneficiaries}
                                placeholder="Split 50/50 between children..."
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <label
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Agent / Point of Contact</label
                            >
                            <input
                                type="text"
                                bind:value={newPolicy.agentName}
                                placeholder="Full name and company name"
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <label
                                for="insurance-agent-contact"
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Agent Phone or Email</label
                            >
                            <input
                                id="insurance-agent-contact"
                                type="text"
                                bind:value={newPolicy.agentContact}
                                placeholder="How to reach them"
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
                            />
                        </div>
                        <div class="space-y-1.5 md:col-span-2">
                            <label
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1 flex items-center gap-2"
                            >
                                Claims Filing Instructions
                                <span
                                    class="bg-rose-100 text-rose-600 px-2 py-0.5 rounded-lg text-[8px] font-bold tracking-wide"
                                    >CRITICAL</span
                                >
                            </label>
                            <textarea
                                bind:value={newPolicy.claimsProcedure}
                                rows="4"
                                placeholder="Detailed step-by-step for the family..."
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800 resize-none"
                            ></textarea>
                        </div>
                        <div class="space-y-1.5 md:col-span-2">
                            <label
                                for="insurance-notes"
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Notes</label
                            >
                            <textarea
                                id="insurance-notes"
                                bind:value={newPolicy.notes}
                                rows="3"
                                placeholder="Anything else your family may find helpful"
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800 resize-none"
                            ></textarea>
                        </div>
                    </div>
                </section>

                <!-- Custom Fields Section -->
                <section>
                    <h3
                        class="text-xs font-bold uppercase text-slate-500 tracking-wide mb-4 flex items-center gap-3"
                    >
                        <span class="w-6 h-[2px] bg-primary rounded-full"></span>
                        Additional Details
                    </h3>
                    <CustomFieldsManager
                        entityType="insurance"
                        bind:data={parsedCustomAttributes}
                    />
                </section>
            </div>

            <!-- Modal Footer -->
            <div
                class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3"
            >
                <button
                    onclick={resetForm}
                    class="px-6 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                    Not right now
                </button>
                <button
                    onclick={handleAddPolicy}
                    disabled={!newPolicy.policyName || !newPolicy.insurer || saving}
                    aria-busy={saving}
                    class="px-6 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? "Saving..." : isEditing ? "Save my updates" : "Save my thoughts"}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    select {
        -webkit-appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 1.25rem center;
        padding-right: 3rem;
    }

    /* Range and Number overrides */
    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
</style>
