<script lang="ts">
    import { formSaveAttempt } from "$lib/utils/formSaveAttempt";
    import { askConfirm } from "$lib/components/ui/ConfirmModal.svelte";
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
    let viewMode = $derived<ViewMode>(userPreferencesStore.getViewMode('insurance'));
    let isEditing = $state(false);
    let exampleDraft = $state(false);
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
        premiumAmount: undefined,
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

        const wanted: [string, any][] = [];
        if (answers.life) wanted.push(["Life Insurance", "Life"]);
        if (answers.auto) wanted.push(["Auto Insurance", "Auto"]);
        if (answers.home) wanted.push(["Home/Renters Insurance", "Home"]);

        showWizard = false;
        if (wanted.length > 0) saveWizardPolicies(wanted);
    }

    // One wizard run is one save: the creates run quietly, then one affirmation when all land,
    // or one gentle message whose Try Again re-sends only the policies still waiting.
    async function saveWizardPolicies(wanted: [string, any][]) {
        const results = await Promise.allSettled(
            wanted.map(([name, type]) => addWizardPolicy(name, type)),
        );
        const waiting = wanted.filter((_, i) => results[i].status === "rejected");
        if (waiting.length === 0) {
            notifications.showAffirmation("general", "create");
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

    // The wizard knows only the kind of cover; the carrier, beneficiaries and notes stay blank for the person to fill in.
    async function addWizardPolicy(name: string, type: any) {
        const created = await insuranceSync.create({
            id: crypto.randomUUID(),
            policyName: name,
            insuranceType: type,
            insurer: "",
            policyNumber: "",
            premiumAmount: undefined,
            premiumFrequency: "Monthly",
            beneficiaries: "",
            agentName: "",
            agentContact: "",
            claimsProcedure: "",
            status: "Pending",
            policyDocuments: "",
            notes: "",
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
            const q = searchQuery.toLowerCase();
            const matchesSearch =
                String(p.policyName ?? "").toLowerCase().includes(q) ||
                String(p.insurer ?? "").toLowerCase().includes(q);
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

    // One policy's stored document, opened from its card or row.
    let openingDocument = $state<string | null>(null);
    async function openPolicyDocument(policy: InsurancePolicy) {
        const id = mediaIdFromRef(policy.policyDocuments);
        if (id === null || openingDocument) return;
        openingDocument = String(policy.id);
        try {
            await downloadMedia(id);
        } catch (e) {
            console.warn("[insurance] policy document open paused", id, e);
        } finally {
            openingDocument = null;
        }
    }

    // "2031-05-01" reads as a local calendar date.
    function dateLabel(v: string | null | undefined): string {
        const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v ?? ""));
        if (!m) return "";
        return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    function showAllPolicies() {
        filterType = "All";
        searchQuery = "";
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
        exampleDraft = false;
        newPolicy = {
            policyName: "",
            insuranceType: "Life",
            insurer: "",
            policyNumber: "",
            premiumAmount: undefined,
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

    const saveAttempt = formSaveAttempt(insuranceSync);

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
        const form = newPolicy;
        const fields = JSON.stringify([form, parsedCustomAttributes]);
        const id = isEditing ? form.id : undefined;
        const ownerName = estateProfile.current.ownerName || "User";
        const policyData = { ...form, custom_attributes: JSON.stringify(parsedCustomAttributes) };
        const oldPolicy = id ? insuranceStore.getPolicy(id) : undefined;
        const changes = oldPolicy ? (["policyName", "premiumAmount", "status"] as const)
            .filter((field) => oldPolicy[field] !== form[field])
            .map((field) => ({ field, oldValue: oldPolicy[field], newValue: form[field] })) : [];
        try {
            await saveAttempt(form, policyData, (saved) => {
                activityLog.logEvent({
                    module: "Insurance", action: id ? "UPDATE" : "CREATE", entityType: "Policy",
                    entityId: String(saved.id), entityName: saved.policyName, changes, userContext: ownerName,
                });
                if (newPolicy !== form) return;
                if (JSON.stringify([form, parsedCustomAttributes]) === fields) resetForm();
                else { newPolicy.id = saved.id; isEditing = true; }
            }, id);
        } catch {
            // The captured attempt stays available through Try Again.
        }
    }

    function editPolicy(policy: InsurancePolicy) {
        exampleDraft = false;
        newPolicy = { ...policy };
        // Parse custom attributes for editing
        parsedCustomAttributes = readCustom(policy);
        isEditing = true;
        showAddModal = true;
    }

    async function deletePolicy(id: string | number, name: string) {
        if (
            await askConfirm(
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
        Active: "bg-success/10 text-success border-success/20",
        Inactive: "bg-muted text-muted-foreground border-border",
        Pending: "bg-warning-soft text-warning border-warning/30",
    };

    const typeColors = {
        Life: "text-primary-hover bg-primary-soft border-primary/20",
        Health: "text-success bg-success/10 border-success/20",
        Auto: "text-info bg-info/10 border-info/20",
        Home: "text-primary-hover bg-primary/10 border-primary/20",
        Disability: "text-foreground bg-muted border-border",
        Other: "text-muted-foreground bg-background border-border",
    };
</script>

<LivingBlueprintHeader
    title="Insurance Portfolio"
    subtitle="Policy details, insurer contacts and claims information"
    detailedDescription="Keep each policy's identifiers, insurer contacts, renewal information and claims instructions together so your family knows where to start. Use the current policy and any insurer confirmation as your sources."
    whyMatters="A clear record helps your family find the policy and ask the insurer about current cover, beneficiaries and any next steps."
>
    <div class="flex flex-wrap items-center gap-3">
        <DataViewToggle module="insurance" />
        <button
            onclick={() => (showWizard = true)}
            class="flex items-center gap-2 px-5 py-3 border border-primary/10 text-primary font-bold rounded-2xl hover:bg-primary/5 transition-colors"
        >
            <Sparkles size={18} />
            {$t("wizard.start")}
        </button>
        <button
            onclick={() => (showAddModal = true)}
            class="flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-3 rounded-2xl transition-all shadow-xl shadow-primary/20 font-bold"
        >
            <Plus size={20} />
            Record a policy
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
                    class="absolute -top-12 right-0 text-white hover:text-white/80"
                    onclick={() => (showWizard = false)}>Go back</button
                >
                <p class="mb-3 rounded-xl bg-card p-4 text-sm text-muted-foreground">Guided Setup starts a list of common policy types. Open each new record to add the insurer, policy number and details from your own documents.</p>
                <ConciergeFlow
                    steps={wizardSteps}
                    oncomplete={handleWizardComplete}
                />
            </div>
        </div>
    {/if}

    <!-- AI Prompt Bar -->
    <div class="max-w-3xl mx-auto mb-8">
        <p class="text-sm text-muted-foreground">Describe one policy for help organizing a contact note or questions for the insurer. Review the wording, then add it to the policy record you save.</p>
        <AIPromptBar context="insurance" />
    </div>

    <!-- Stats Dashboard -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
            class="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow group"
        >
            <div class="flex items-start justify-between mb-4">
                <div
                    class="p-3 bg-success/10 rounded-2xl text-success group-hover:scale-110 transition-transform"
                >
                    <DollarSign size={24} />
                </div>
                <div
                    class="text-[10px] bg-success/10 text-success px-2 py-1 rounded-lg font-bold"
                >
                    ANNUAL
                </div>
            </div>
            <p
                class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1"
            >
                Total Premiums
            </p>
            <p class="text-3xl font-black text-foreground tracking-tight">
                {formatMoney(stats.annual)}
            </p>
        </div>

        <div
            class="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow group"
        >
            <div class="flex items-start justify-between mb-4">
                <div
                    class="p-3 bg-primary/10 rounded-2xl text-primary-hover group-hover:scale-110 transition-transform"
                >
                    <Activity size={24} />
                </div>
                <div
                    class="text-[10px] bg-primary/20 text-primary-hover px-2 py-1 rounded-lg font-bold"
                >
                    MONTHLY
                </div>
            </div>
            <p
                class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1"
            >
                Monthly Average
            </p>
            <p class="text-3xl font-black text-foreground tracking-tight">
                {formatMoney(stats.monthly)}
            </p>
        </div>

        <div
            class="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow group"
        >
            <div class="flex items-start justify-between mb-4">
                <div
                    class="p-3 bg-primary-soft rounded-2xl text-primary-hover group-hover:scale-110 transition-transform"
                >
                    <Heart size={24} />
                </div>
                <div
                    class="text-[10px] bg-primary-soft text-primary-hover px-2 py-1 rounded-lg font-bold"
                >
                    STATUS
                </div>
            </div>
            <p
                class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1"
            >
                Active Policies
            </p>
            <p class="text-3xl font-black text-foreground tracking-tight">
                {policies.filter((p) => p.status === "Active").length}
            </p>
        </div>

        <div
            class="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow group"
        >
            <div class="flex items-start justify-between mb-4">
                <div
                    class="p-3 bg-background rounded-2xl text-muted-foreground group-hover:scale-110 transition-transform"
                >
                    <CircleCheck size={24} />
                </div>
                <div
                    class="text-[10px] bg-muted text-foreground px-2 py-1 rounded-lg font-bold"
                >
                    DETAILS
                </div>
            </div>
            <p
                class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1"
            >
                Key details recorded
            </p>
            <p class="text-3xl font-black text-foreground tracking-tight">
                {completionRate}%
            </p>
            <p class="mt-2 text-xs text-muted-foreground" data-testid="insurance-detail-rule">Five checks per policy: insurer, policy number, recorded beneficiary, a premium above zero, and an agent name or contact. This measures details recorded.</p>
        </div>
    </div>

    <!-- Search & Filters -->
    <div
        class="flex flex-col md:flex-row gap-4 items-center justify-between bg-background/50 p-4 rounded-2xl border border-border"
    >
        <div class="relative w-full md:w-96">
            <Search class="absolute left-4 top-3.5 text-muted-foreground" size={18} />
            <input
                type="text"
                bind:value={searchQuery}
                aria-label="Search by policy, carrier, or type"
                placeholder="Search by policy, carrier, or type"
                class="w-full px-4 py-3 pl-12 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
            />
        </div>
        <div
            class="flex bg-card p-1 rounded-2xl border border-border shadow-sm"
        >
            {#each types as type}
                <button
                    onclick={() => (filterType = type)}
                    class="px-4 py-2 rounded-xl text-xs font-bold tracking-wider transition-all {filterType ===
                    type
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:text-primary hover:bg-background'}"
                >
                    {type}
                </button>
            {/each}
        </div>
        <div class="flex items-center gap-2">
            <span
                class="text-xs font-bold text-muted-foreground uppercase tracking-widest"
                >Showing {plural(filteredPolicies.length, "Policy", "Policies")}</span
            >
            <button
                class="p-3 bg-card border border-border rounded-xl text-muted-foreground hover:text-primary transition-colors shadow-sm disabled:opacity-40 disabled:hover:text-muted-foreground"
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
                class="bg-card rounded-2xl border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden group flex flex-col ring-1 ring-slate-900/5"
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
                                    class="text-lg font-semibold text-foreground leading-tight group-hover:text-primary transition-colors"
                                >
                                    {policy.policyName}
                                </h3>
                                {#if policy.insurer}
                                    <p class="text-muted-foreground text-sm">
                                        {policy.insurer}
                                    </p>
                                {/if}
                            </div>
                        </div>
                        <div
                            class="flex items-center gap-1"
                        >
                            <button
                                onclick={() => editPolicy(policy)}
                                aria-label="Edit these details"
                                class="p-2 bg-background hover:bg-primary/5 text-muted-foreground hover:text-primary rounded-xl transition-all"
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
                                class="p-2 bg-background hover:bg-danger-soft text-muted-foreground hover:text-danger rounded-xl transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    <!-- Mini Stats Grid -->
                    <div class="grid grid-cols-3 gap-3 mb-6">
                        <div
                            class="bg-background rounded-xl p-3 border border-border/50"
                        >
                            <p
                                class="text-[9px] font-bold text-muted-foreground uppercase tracking-wide mb-1"
                            >
                                Premium
                            </p>
                            <p
                                class="text-sm font-semibold text-foreground"
                            >
                                {policy.premiumAmount == null ? "Not recorded" : formatMoney(policy.premiumAmount)}
                            </p>
                        </div>
                        <div
                            class="bg-background rounded-xl p-3 border border-border/50"
                        >
                            <p
                                class="text-[9px] font-bold text-muted-foreground uppercase tracking-wide mb-1"
                            >
                                Interval
                            </p>
                            <p
                                class="text-sm font-semibold text-foreground"
                            >
                                {cap(policy.premiumFrequency)}
                            </p>
                        </div>
                        <div
                            class="bg-background rounded-xl p-3 border border-border/50"
                        >
                            <p
                                class="text-[9px] font-bold text-muted-foreground uppercase tracking-wide mb-1"
                            >
                                Status
                            </p>
                            <div class="flex items-center gap-1.5 mt-0.5">
                                <div
                                    class="w-2 h-2 rounded-full {policy.status ===
                                    'Active'
                                        ? 'bg-success'
                                        : 'bg-muted-foreground/40'}"
                                ></div>
                                <span
                                    class="text-xs font-semibold text-foreground"
                                    >{policy.status}</span
                                >
                            </div>
                        </div>
                    </div>

                    <!-- Details Section -->
                    <div class="space-y-4 mb-6">
                        {#if policy.beneficiaries}
                        <div class="flex items-center gap-4 text-muted-foreground">
                            <div
                                class="w-8 h-8 rounded-xl bg-background flex items-center justify-center text-muted-foreground"
                            >
                                <User size={14} />
                            </div>
                            <div>
                                <p
                                    class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest"
                                >
                                    Key Beneficiary
                                </p>
                                <p
                                    class="text-sm font-bold text-foreground truncate max-w-[180px]"
                                >
                                    {policy.beneficiaries}
                                </p>
                            </div>
                        </div>
                        {/if}
                        {#if policy.policyNumber}
                        <div class="flex items-center gap-4 text-muted-foreground">
                            <div
                                class="w-8 h-8 rounded-xl bg-background flex items-center justify-center text-muted-foreground"
                            >
                                <FileText size={14} />
                            </div>
                            <div>
                                <p
                                    class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest"
                                >
                                    Policy Number
                                </p>
                                <p
                                    class="text-sm font-bold text-foreground tracking-wider font-mono uppercase"
                                >
                                    {policy.policyNumber}
                                </p>
                            </div>
                        </div>
                        {/if}
                        {#if policy.agentName || policy.agentContact}
                        <div class="flex items-center gap-4 text-muted-foreground">
                            <div
                                class="w-8 h-8 rounded-xl bg-background flex items-center justify-center text-muted-foreground"
                            >
                                <User size={14} />
                            </div>
                            <div class="min-w-0">
                                <p
                                    class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest"
                                >
                                    Agent / Point of Contact
                                </p>
                                {#if policy.agentName}
                                    <p class="text-sm font-bold text-foreground truncate">{policy.agentName}</p>
                                {/if}
                                {#if policy.agentContact}
                                    <p class="text-sm text-muted-foreground truncate">{policy.agentContact}</p>
                                {/if}
                            </div>
                        </div>
                        {/if}
                        {#if dateLabel(policy.expirationDate)}
                        <div class="flex items-center gap-4 text-muted-foreground">
                            <div
                                class="w-8 h-8 rounded-xl bg-background flex items-center justify-center text-muted-foreground"
                            >
                                <Calendar size={14} />
                            </div>
                            <div>
                                <p
                                    class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest"
                                >
                                    Expiration Date
                                </p>
                                <p class="text-sm font-bold text-foreground">
                                    {dateLabel(policy.expirationDate)}
                                </p>
                            </div>
                        </div>
                        {/if}
                        {#if policy.notes}
                        <div class="flex items-start gap-4 text-muted-foreground">
                            <div
                                class="w-8 h-8 rounded-xl bg-background flex items-center justify-center text-muted-foreground shrink-0"
                            >
                                <Info size={14} />
                            </div>
                            <div class="min-w-0">
                                <p
                                    class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest"
                                >
                                    Notes
                                </p>
                                <p class="text-sm text-muted-foreground whitespace-pre-line line-clamp-3">
                                    {policy.notes}
                                </p>
                            </div>
                        </div>
                        {/if}
                        {#if mediaIdFromRef(policy.policyDocuments) !== null}
                        <button
                            type="button"
                            onclick={() => openPolicyDocument(policy)}
                            aria-busy={openingDocument === String(policy.id)}
                            class="flex items-center gap-4 text-muted-foreground hover:text-primary transition-colors text-left"
                        >
                            <span
                                class="w-8 h-8 rounded-xl bg-background flex items-center justify-center text-muted-foreground"
                            >
                                <Download size={14} />
                            </span>
                            <span>
                                <span
                                    class="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest"
                                >
                                    Policy Documentation
                                </span>
                                <span class="block text-sm font-bold">Policy Document</span>
                            </span>
                        </button>
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
                        class="w-full text-left bg-muted rounded-xl p-4 text-foreground flex items-center justify-between group/footer hover:bg-border transition-colors duration-300"
                    >
                        <span class="font-semibold text-sm">Claims Procedure</span>
                        <span class="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center group-hover/footer:translate-x-1 transition-transform">
                            <ArrowRight size={18} />
                        </span>
                    </button>
                    {#if openClaims[String(policy.id)]}
                        <p class="mt-3 px-2 text-sm text-foreground whitespace-pre-line">{policy.claimsProcedure}</p>
                    {/if}
                </div>
                {/if}
            </div>
        {:else}
            <!-- First run: the welcome and examples. With policies saved, a search or filter
                 that shows none offers the way back to all of them. -->
            {#if policies.length > 0}
                <div class="col-span-full flex justify-center py-12">
                    <button
                        type="button"
                        onclick={showAllPolicies}
                        class="px-6 py-3 rounded-2xl font-bold border border-primary/20 text-primary hover:bg-primary/5 transition-colors"
                    >
                        Show all policies
                    </button>
                </div>
            {:else}
                <div class="col-span-full">
                    <EmptyState
                        title="Start with one policy"
                        whyMatters="Record the policy name, insurer and identifying number from your documents. Add who to contact, where the policy is kept, and any claims instructions the insurer has provided."
                        encouragement="Choose a policy you can find today. Add other policies as you gather their documents."
                        icon={Shield}
                        iconClass="text-primary"
                        ctaLabel="Share my first policy"
                        onAction={() => (showAddModal = true)}
                    />
                </div>

                <!-- Sample Data GhostRows -->
                <div class="col-span-full mt-8">
                    <p class="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-4 text-center">Examples open a blank policy for your own details</p>
                    <div class="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
                        {#each getSmartSamples($language).insurance || [] as sample}
                            <GhostRow
                                name={sample.policyName}
                                subtitle={`${sample.insurer} - ${sample.insuranceType}`}
                                type="Policy"
                                value={sample.premiumAmount}
                                onClick={() => {
                                    exampleDraft = true;
                                    newPolicy = { ...newPolicy, insuranceType: newPolicy.policyName ? newPolicy.insuranceType : sample.insuranceType };
                                    showAddModal = true;
                                }}
                            >
                                {#snippet icon()}
                                    {@const Icon = typeIcons[sample.insuranceType] || Shield}
                                    <Icon size={20} class="text-muted-foreground" />
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
        {#if policies.length > 0 && filteredPolicies.length === 0}
            <div class="flex justify-center py-12">
                <button
                    type="button"
                    onclick={showAllPolicies}
                    class="px-6 py-3 rounded-2xl font-bold border border-primary/20 text-primary hover:bg-primary/5 transition-colors"
                >
                    Show all policies
                </button>
            </div>
        {:else if policies.length === 0}
            <EmptyState
                title="Start with one policy"
                whyMatters="Record the policy name, insurer and identifying number from your documents. Add who to contact, where the policy is kept, and any claims instructions the insurer has provided."
                encouragement="Choose a policy you can find today. Add other policies as you gather their documents."
                icon={Shield}
                iconClass="text-primary"
                ctaLabel="Share my first policy"
                onAction={() => (showAddModal = true)}
            />
        {:else}
            <div class="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <table class="w-full">
                    <thead class="bg-background border-b border-border">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-muted-foreground">Policy</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-muted-foreground">Type</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-muted-foreground">Carrier</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-muted-foreground">Premium</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-muted-foreground">Beneficiary</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-muted-foreground">Agent</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-muted-foreground">Expiration</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-muted-foreground">Status</th>
                            <th class="px-4 py-3 text-right text-xs font-bold uppercase text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-border">
                        {#each filteredPolicies as policy (policy.id)}
                            {@const Icon = typeIcons[policy.insuranceType] || Shield}
                            <tr class="hover:bg-background transition-colors group">
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-lg flex items-center justify-center {typeColors[policy.insuranceType]}">
                                            <Icon size={16} />
                                        </div>
                                        <div>
                                            <span class="font-medium text-foreground">{policy.policyName}</span>
                                            <div class="text-xs text-muted-foreground">{policy.policyNumber || '-'}</div>
                                            {#if policy.notes}
                                                <div class="text-xs text-muted-foreground truncate max-w-[220px]" title={policy.notes}>{policy.notes}</div>
                                            {/if}
                                        </div>
                                    </div>
                                </td>
                                <td class="px-4 py-3 text-sm text-muted-foreground">{cap(policy.insuranceType)}</td>
                                <td class="px-4 py-3 text-sm text-muted-foreground">{policy.insurer}</td>
                                <td class="px-4 py-3 text-sm text-muted-foreground">
                                    {policy.premiumAmount == null ? "Not recorded" : formatMoney(policy.premiumAmount)} {cap(policy.premiumFrequency || "Monthly")}
                                </td>
                                <td class="px-4 py-3 text-sm text-muted-foreground max-w-[150px] truncate">
                                    {policy.beneficiaries || '-'}
                                </td>
                                <td class="px-4 py-3 text-sm text-muted-foreground max-w-[180px]">
                                    <div class="truncate">{policy.agentName}</div>
                                    {#if policy.agentContact}
                                        <div class="text-xs text-muted-foreground truncate">{policy.agentContact}</div>
                                    {/if}
                                </td>
                                <td class="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{dateLabel(policy.expirationDate)}</td>
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-1.5">
                                        <div class="w-2 h-2 rounded-full {policy.status === 'Active' ? 'bg-success' : 'bg-muted-foreground/40'}"></div>
                                        <span class="text-xs font-medium text-muted-foreground">{policy.status}</span>
                                    </div>
                                </td>
                                <td class="px-4 py-3 text-right">
                                    <div class="flex items-center justify-end gap-2 transition-opacity">
                                        {#if mediaIdFromRef(policy.policyDocuments) !== null}
                                            <button aria-label="Policy Document"
                                                onclick={() => openPolicyDocument(policy)}
                                                aria-busy={openingDocument === String(policy.id)}
                                                class="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                <Download size={14} />
                                            </button>
                                        {/if}
                                        <button aria-label="Edit these details"
                                            onclick={() => editPolicy(policy)}
                                            class="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button aria-label="Remove this item"
                                            onclick={() => deletePolicy(String(policy.id), policy.policyName)}
                                            class="p-1.5 text-muted-foreground hover:text-danger transition-colors"
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
            class="relative bg-card rounded-2xl shadow-2xl ring-1 ring-slate-900/5 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            transition:scale={{ duration: 250, start: 0.95, easing: cubicOut }}
        >
            <!-- Modal Header -->
            <div class="flex items-start justify-between px-6 py-4 border-b border-border bg-card sticky top-0 z-10">
                <div class="flex-1 pr-4">
                    <nav
                        class="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2"
                    >
                        <Heart size={12} />
                        <span>POLICY RECORD</span>
                    </nav>
                    <h2 class="font-serif font-bold text-xl text-foreground">
                        {isEditing ? "Update" : "Record"} policy details
                    </h2>
                    <p class="text-muted-foreground text-sm mt-2 leading-relaxed">
                        Identify the policy, the source documents and the insurer contact your family should use.
                            {#if exampleDraft}<span class="block mt-2 text-primary-hover" role="status">Example starting point: enter your own policy name, insurer and details. Your entered words stay in the form.</span>{/if}
                    </p>
                </div>
                <button
                    onclick={resetForm}
                    class="p-2 -mr-2 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-full transition-colors flex-shrink-0"
                    aria-label="Close"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>

            <div class="flex-1 overflow-y-auto p-6 space-y-8">
                <!-- Group 1: Identity -->
                <section>
                    <h3
                        class="text-xs font-bold uppercase text-muted-foreground tracking-wide mb-4 flex items-center gap-3"
                    >
                        <span class="w-6 h-[2px] bg-primary rounded-full"
                        ></span>
                        Policy Identity
                    </h3>
                    <div
                        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        <div class="space-y-1.5">
                            <label for="insurance-policy-name"
                                class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1"
                                >Policy Title</label
                            >
                            <input id="insurance-policy-name"
                                type="text"
                                bind:value={newPolicy.policyName}
                                placeholder="Your own policy name or short description"
                                class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <label for="insurance-insurance-type"
                                class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1"
                                >Insurance Classification</label
                            >
                            <select id="insurance-insurance-type"
                                bind:value={newPolicy.insuranceType}
                                class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground appearance-none cursor-pointer"
                            >
                                {#each types.filter((t) => t !== "All") as type}
                                    <option value={type}>{type}</option>
                                {/each}
                            </select>
                        </div>
                        <div class="space-y-1.5">
                            <label for="insurance-insurer"
                                class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1"
                                >Insurance Carrier</label
                            >
                            <input id="insurance-insurer"
                                type="text"
                                bind:value={newPolicy.insurer}
                                placeholder="e.g. Prudential Financial"
                                class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <label
                                for="insurance-policy-number"
                                class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1"
                                >Policy Number</label
                            >
                            <input
                                id="insurance-policy-number"
                                type="text"
                                bind:value={newPolicy.policyNumber}
                                placeholder="As printed on the policy"
                                class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <label
                                for="insurance-expiration-date"
                                class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1"
                                >Expiration Date</label
                            >
                            <input
                                id="insurance-expiration-date"
                                type="date"
                                bind:value={newPolicy.expirationDate}
                                class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                            />
                        </div>
                    </div>

                    <!-- Policy Document Upload -->
                    <div class="mt-6">
                        <h3
                            class="text-xs font-bold uppercase text-muted-foreground tracking-wide mb-4 flex items-center gap-3"
                        >
                            <span class="w-6 h-[2px] bg-primary rounded-full"
                            ></span>
                            Policy Documentation
                        </h3>
                        <div
                            class="bg-background rounded-xl p-4 border border-border"
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
                                    class="mt-2 text-xs text-muted-foreground font-medium flex items-center gap-1"
                                >
                                    <CircleCheck
                                        size={12}
                                        class="text-success"
                                    />
                                    Document attached to this record
                                </div>
                            {/if}
                        </div>
                    </div>
                </section>

                <!-- Group 2: Financial -->
                <section
                    class="bg-background rounded-2xl p-6 border border-border"
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
                            <label for="insurance-premium-amount"
                                class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1"
                                >Premium Amount ($)</label
                            >
                            <div class="relative">
                                <DollarSign
                                    size={16}
                                    class="absolute left-4 top-3.5 text-primary"
                                />
                                <input id="insurance-premium-amount"
                                    type="number"
                                    bind:value={newPolicy.premiumAmount}
                                    class="w-full px-4 py-3 pl-10 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                                />
                            </div>
                        </div>
                        <div class="space-y-1.5">
                            <label for="insurance-premium-frequency"
                                class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1"
                                >Billing Interval</label
                            >
                            <select id="insurance-premium-frequency"
                                bind:value={newPolicy.premiumFrequency}
                                class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground appearance-none cursor-pointer"
                            >
                                <option>Monthly</option>
                                <option>Quarterly</option>
                                <option>Annually</option>
                            </select>
                        </div>
                        <div class="space-y-1.5">
                            <span id="insurance-status-label"
                                class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1"
                                >Status Tracking</span
                            >
                            <div
                                role="group"
                                aria-labelledby="insurance-status-label"
                                class="flex bg-card rounded-xl p-1 border border-border"
                            >
                                {#each ["Active", "Pending", "Inactive"] as status}
                                    <button
                                        type="button"
                                        aria-pressed={newPolicy.status === status}
                                        onclick={() =>
                                            (newPolicy.status = status as any)}
                                        class="flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all {newPolicy.status ===
                                        status
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-background'}"
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
                        class="text-xs font-bold uppercase text-muted-foreground tracking-wide mb-4 flex items-center gap-3"
                    >
                        <span class="w-6 h-[2px] bg-primary rounded-full"
                        ></span>
                        Legacy Information
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-1.5">
                            <label for="insurance-beneficiaries"
                                class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1"
                                >Designated Beneficiaries</label
                            >
                            <input id="insurance-beneficiaries"
                                type="text"
                                bind:value={newPolicy.beneficiaries}
                                placeholder="As shown on the policy or latest beneficiary confirmation"
                                class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <label for="insurance-agent-name"
                                class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1"
                                >Agent / Point of Contact</label
                            >
                            <input id="insurance-agent-name"
                                type="text"
                                bind:value={newPolicy.agentName}
                                placeholder="Full name and company name"
                                class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <label
                                for="insurance-agent-contact"
                                class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1"
                                >Agent Phone or Email</label
                            >
                            <input
                                id="insurance-agent-contact"
                                type="text"
                                bind:value={newPolicy.agentContact}
                                placeholder="How to reach them"
                                class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                            />
                        </div>
                        <div class="space-y-1.5 md:col-span-2">
                            <label for="insurance-claims-procedure"
                                class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1 flex items-center gap-2"
                            >
                                Claims Filing Instructions
                                <span
                                    class="bg-primary-soft text-primary-hover px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wide"
                                    >IMPORTANT</span
                                >
                            </label>
                            <textarea id="insurance-claims-procedure"
                                bind:value={newPolicy.claimsProcedure}
                                rows="4"
                                placeholder="Who should your family contact first? What instructions has the insurer provided, and where are the current documents?"
                                class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground resize-none"
                            ></textarea>
                        </div>
                        <div class="space-y-1.5 md:col-span-2">
                            <label
                                for="insurance-notes"
                                class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1"
                                >Notes</label
                            >
                            <textarea
                                id="insurance-notes"
                                bind:value={newPolicy.notes}
                                rows="3"
                                placeholder="Anything else your family may find helpful"
                                class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground resize-none"
                            ></textarea>
                        </div>
                    </div>
                </section>

                <!-- Custom Fields Section -->
                <section>
                    <h3
                        class="text-xs font-bold uppercase text-muted-foreground tracking-wide mb-4 flex items-center gap-3"
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
                class="px-6 py-4 bg-background border-t border-border flex justify-end gap-3"
            >
                <button
                    onclick={resetForm}
                    class="px-6 py-2.5 rounded-xl font-semibold text-muted-foreground hover:bg-border transition-colors"
                >
                    Maybe later
                </button>
                <button
                    onclick={handleAddPolicy}
                    disabled={!newPolicy.policyName || !newPolicy.insurer || saving}
                    aria-busy={saving}
                    class="px-6 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? "Saving..." : isEditing ? "Save my updates" : "Save policy details"}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    select {
        -webkit-appearance: none;
        appearance: none;
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
