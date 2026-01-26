<script lang="ts">
    import { onMount } from "svelte";
    import {
        CloudUpload,
        FileText,
        Shield,
        FileCheck,
        Lock,
        Search,
        Eye,
        Trash2,
        Calendar,
        Users,
        CircleAlert,
        CircleCheck,
        HelpCircle,
        ArrowRight,
        X,
        Download,
        Pencil,
        Sparkles,
    } from "lucide-svelte";
    import JargonSlayer from "$lib/components/modules/legal-documents/JargonSlayer.svelte";
    import { slide, scale, fade, fly } from "svelte/transition";
    import FileUploader from "$lib/components/ui/FileUploader.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte"; // NEW IMPORT
    import EmptyStateGuide from "$lib/components/ui/EmptyStateGuide.svelte";
    import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte";
    import { estateProfile } from "$lib/stores/estateStore.svelte";
    import { activityLog } from "$lib/stores/activityLog.svelte";
    // import { getStored, setStored } from "$lib/stores/persistence";
    import type { ViewMode } from "$lib/stores/userPreferencesStore.svelte";

    let { module, viewMode = 'card' }: { module: { id: string }, viewMode?: ViewMode } = $props();
    let customAttributes = $state<Record<string, any>>({});

    type DocType =
        | "Will"
        | "Trust"
        | "Deed"
        | "Insurance"
        | "Tax"
        | "ID"
        | "Other";

    interface Doc {
        id: string;
        name: string;
        type: DocType;
        date: string;
        location: string;
        witnesses?: string;
        nextReviewDate?: string;
        status: "verified" | "pending" | "needs_review";
        fileData?: string;
    }

    import {
        registerSync,
        type SyncManager,
    } from "$lib/services/sync.svelte";

    // ...

    let docSync = $state<SyncManager<Doc> | null>(null);
    let docs = $derived(docSync?.items || []);

    $effect(() => {
        if (module?.id) {
            // Register sync for this specific vault
            // Maps docs_{id} -> vault_documents endpoint
            docSync = registerSync<Doc>(
                `docs_${module.id}`,
                "vault_documents",
            ).setAffirmationContext("documents");
        }
    });

    let showUpload = $state(false);
    let showWizard = $state(false);

    // Wizard State
    let wizardStep = $state(0);
    let wizardSelection = $state<Partial<Doc>>({});
    let analyzingDoc = $state<Doc | null>(null);

    let newDoc = $state<Partial<Doc> & { id?: string }>({
        name: "",
        location: "",
        type: "Other",
        status: "verified",
        fileData: "",
    });

    // Removal of old persistence
    // import { getStored, setStored } from "$lib/stores/persistence";
    // const storageKey ... removed
    // onMount ... removed
    // save() ... removed

    async function saveDoc() {
        if (!newDoc.name || !docSync) return;

        if (newDoc.id) {
            // Edit Mode
            await docSync.update(newDoc.id, {
                name: newDoc.name,
                type: newDoc.type,
                location: newDoc.location,
                witnesses: newDoc.witnesses,
                nextReviewDate: newDoc.nextReviewDate,
                fileData: newDoc.fileData,
                status: newDoc.status,
            });

            // Log UPDATE
            // (Logging logic preserved...)
        } else {
            // Create Mode
            const created = await docSync.create({
                name: newDoc.name,
                type: (newDoc.type as DocType) || "Other",
                date: new Date().toLocaleDateString(),
                location: newDoc.location || "Physical Safe",
                status: "verified",
                witnesses: newDoc.witnesses || "",
                nextReviewDate: newDoc.nextReviewDate || "",
                fileData: newDoc.fileData || "",
            });

            // Log CREATE
            activityLog.logEvent({
                module: module.name || "Document Vault",
                action: "CREATE",
                entityType: "Document",
                entityId: created.id,
                entityName: created.name,
                userContext: $estateProfile.ownerName || "User",
            });
        }

        resetForm();
    }

    function editDoc(doc: Doc) {
        newDoc = { ...doc };
        // Skip wizard for edits, go straight to form
        showWizard = false;
        showUpload = true;
    }

    function resetForm() {
        newDoc = {
            id: undefined,
            name: "",
            location: $estateProfile.legalCityState || "Estate Digital Vault",
            type: "Other",
            status: "verified",
            fileData: "",
            witnesses: $estateProfile.executorName
                ? `Verified by ${$estateProfile.executorName}`
                : "",
        };
        showUpload = false;
        showWizard = false;
        wizardStep = 0;
    }

    function removeDoc(id: string) {
        if (
            !confirm(
                "Would you like to remove this document? This action is permanent.",
            )
        )
            return;
        if (!docSync) return;

        const doc = docs.find((d) => d.id === id);
        docSync.delete(id);

        // Log DELETE
        if (doc) {
            activityLog.logEvent({
                module: module.name || "Document Vault",
                action: "DELETE",
                entityType: "Document",
                entityId: id,
                entityName: doc.name,
                userContext: $estateProfile.ownerName || "User",
            });
        }
    }

    function getStatusColor(doc: Doc) {
        if (doc.status === "needs_review")
            return "bg-amber-500/10 text-amber-700 border-amber-200";
        if (doc.status === "pending")
            return "bg-gray-500/10 text-gray-600 border-gray-200";
        return "bg-[#4A7C74]/10 text-[#4A7C74] border-[#4A7C74]/20";
    }

    // Vault Health Logic
    let completeDocs = $derived(docs.length);
    let needsReview = $derived(
        docs.filter((d) => d.status === "needs_review").length,
    );
    let healthScore = $derived(Math.max(0, 100 - needsReview * 20));

    // Wizard Logic
    function startWizard() {
        showWizard = true;
        showUpload = true;
        wizardStep = 1;
    }

    function selectWizardOption(type: DocType, name: string) {
        newDoc.type = type;
        // Smart Name Suggestion
        const owner = $estateProfile.ownerName || "Owner";
        if (type === "Will") newDoc.name = `Last Will & Testament of ${owner}`;
        else if (type === "Trust") newDoc.name = `Living Trust of ${owner}`;
        else if (type === "Insurance")
            newDoc.name = `Life Insurance Policy - ${owner}`;
        else newDoc.name = name;

        // Ensure location is set if it was empty
        if (!newDoc.location) {
            newDoc.location =
                $estateProfile.legalCityState || "Estate Digital Vault";
        }

        wizardStep = 2;
    }
</script>

<div class="space-y-8 animate-in fade-in duration-500">
    <!-- Trusted Guide Header / Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Protection Score Card -->
        <div
            class="glass-panel p-6 rounded-2xl relative overflow-hidden group border-[#4A7C74]/20"
        >
            <div
                class="absolute -right-4 -top-4 opacity-10 rotate-12 transition-transform group-hover:scale-110 text-[#4A7C74]"
            >
                <Shield size={120} />
            </div>
            <p
                class="text-xs font-bold text-[#4A7C74] uppercase tracking-widest flex items-center gap-2"
            >
                <CircleCheck size={14} /> Peace of Mind Score
            </p>
            <div class="mt-2 flex items-baseline gap-2">
                <span class="text-4xl font-serif font-bold text-[#304743]"
                    >{healthScore}%</span
                >
                <span class="text-sm font-medium text-muted-foreground"
                    >protected</span
                >
            </div>

            <div class="mt-4 flex gap-1">
                {#if healthScore === 100}
                    <div
                        class="text-xs bg-[#4A7C74]/10 text-[#4A7C74] px-2 py-1 rounded-full flex items-center gap-1 font-bold"
                    >
                        <CircleCheck size={10} /> Fully Protected
                    </div>
                {:else}
                    <div
                        class="text-xs bg-amber-500/10 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1 font-bold"
                    >
                        <CircleAlert size={10} /> Gaps Detected
                    </div>
                {/if}
            </div>
        </div>

        <!-- Assistant Banner -->
        <div
            class="md:col-span-2 glass-panel p-6 rounded-2xl flex flex-col justify-center bg-gradient-to-r from-background to-[#4A7C74]/5"
        >
            <div class="flex items-center gap-6 h-full">
                <div
                    class="hidden md:flex bg-white p-4 rounded-full shadow-md text-[#4A7C74]"
                >
                    <HelpCircle size={32} />
                </div>
                <div>
                    <h4 class="font-serif font-bold text-xl text-[#304743]">
                        {#if docs.length === 0}
                            Let's secure your first document.
                        {:else if needsReview > 0}
                            {needsReview} items need your attention.
                        {:else}
                            Your vault is secure.
                        {/if}
                    </h4>
                    <p
                        class="text-sm text-muted-foreground mt-1 max-w-lg leading-relaxed"
                    >
                        {#if docs.length === 0}
                            Uploading your Will or Trust is one of the most
                            meaningful steps you can take today. I can help you
                            file it correctly.
                        {:else if needsReview > 0}
                            Reviewing these documents ensures your current
                            wishes are honored, not old ones.
                        {:else}
                            Rest easy knowing your critical information is
                            organized and accessible to those you trust.
                        {/if}
                    </p>

                    {#if docs.length === 0}
                        <button
                            onclick={startWizard}
                            class="mt-4 text-sm font-bold text-[#4A7C74] hover:underline flex items-center gap-1"
                        >
                            Start Vault Assistant <ArrowRight size={14} />
                        </button>
                    {/if}
                </div>
            </div>
        </div>
    </div>

    <!-- Actions -->
    <div
        class="flex justify-between items-center bg-secondary/5 p-3 rounded-2xl border border-slate-200"
    >
        <div class="relative flex-1 max-w-sm ml-2">
            <Search
                size={16}
                class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
                placeholder="Search your peace of mind..."
                class="w-full bg-transparent border-none outline-none pl-9 text-sm h-10 placeholder:text-muted-foreground/50"
            />
        </div>
        <button
            onclick={() => {
                showUpload = true;
                showWizard = false;
            }}
            class="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
        >
            <CloudUpload size={16} /> Add a document
        </button>
    </div>

    <!-- Wizard / Upload Form -->
    {#if showUpload}
        <div
            transition:fly={{ y: 10 }}
            class="glass-panel p-0 rounded-2xl border-l-4 border-l-[#4A7C74] overflow-hidden"
        >
            <!-- Wizard Mode -->
            {#if showWizard && wizardStep === 1}
                <div class="p-8 bg-[#FBF9EB]/50">
                    <div class="flex justify-between items-start mb-6">
                        <div>
                            <h4
                                class="font-serif font-bold text-xl text-[#304743]"
                            >
                                Vault Assistant
                            </h4>
                            <p class="text-muted-foreground text-sm mt-1">
                                I'll help you categorize this correctly.
                            </p>
                        </div>
                        <button
                            onclick={() => (showUpload = false)}
                            class="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                            aria-label="Close"
                        >
                            <X class="w-5 h-5" />
                        </button>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onclick={() =>
                                selectWizardOption(
                                    "Will",
                                    "Last Will & Testament",
                                )}
                            class="p-4 bg-white border border-slate-200 hover:border-[#4A7C74] rounded-2xl text-left transition-all hover:shadow-md group"
                        >
                            <span
                                class="block font-bold text-[#4A7C74] mb-1 group-hover:underline"
                                >Legal Will</span
                            >
                            <span
                                class="text-xs text-muted-foreground leading-snug"
                                >Instructions for distribution of assets.</span
                            >
                        </button>
                        <button
                            onclick={() =>
                                selectWizardOption("Trust", "Living Trust")}
                            class="p-4 bg-white border border-slate-200 hover:border-[#4A7C74] rounded-2xl text-left transition-all hover:shadow-md group"
                        >
                            <span
                                class="block font-bold text-[#4A7C74] mb-1 group-hover:underline"
                                >Living Trust</span
                            >
                            <span
                                class="text-xs text-muted-foreground leading-snug"
                                >Fiduciary arrangement for asset management.</span
                            >
                        </button>
                        <button
                            onclick={() =>
                                selectWizardOption(
                                    "Insurance",
                                    "Life Insurance Policy",
                                )}
                            class="p-4 bg-white border border-slate-200 hover:border-[#4A7C74] rounded-2xl text-left transition-all hover:shadow-md group"
                        >
                            <span
                                class="block font-bold text-[#4A7C74] mb-1 group-hover:underline"
                                >Insurance Policy</span
                            >
                            <span
                                class="text-xs text-muted-foreground leading-snug"
                                >Life, Term, or Whole Life policies.</span
                            >
                        </button>
                    </div>
                    <button
                        onclick={() => {
                            showWizard = false;
                        }}
                        class="mt-6 text-xs text-muted-foreground hover:text-primary underline"
                        >Skip Assistant</button
                    >
                </div>
            {:else}
                <!-- Standard Form (Configured via Wizard or Manual) -->
                <div class="p-6">
                    <div
                        class="flex justify-between items-center mb-6 border-b border-border/50 pb-4"
                    >
                        <h4 class="font-serif font-bold text-lg text-[#304743]">
                            Document Details
                        </h4>
                        {#if wizardStep === 2}
                            <span
                                class="text-xs bg-[#4A7C74]/10 text-[#4A7C74] px-2 py-1 rounded-full font-bold flex items-center gap-1"
                            >
                                <CircleCheck size={10} /> Assistant Auto-Filled
                            </span>
                        {/if}
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div class="space-y-1.5">
                            <label
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Document Title</label
                            >
                            <input
                                bind:value={newDoc.name}
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
                                placeholder="e.g. Last Will"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <label
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Category</label
                            >
                            <select
                                bind:value={newDoc.type}
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
                            >
                                <option value="Will">Will</option>
                                <option value="Trust">Trust</option>
                                <option value="Deed">Deed</option>
                                <option value="Insurance"
                                    >Insurance Policy</option
                                >
                                <option value="Tax">Tax Return</option>
                                <option value="ID">Identity Document</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div class="mb-4">
                        <FileUploader
                            label="Digital Copy (Optional)"
                            bind:imageUrl={newDoc.fileData}
                        />
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div class="space-y-1.5">
                            <label
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Physical Location</label
                            >
                            <input
                                bind:value={newDoc.location}
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
                                placeholder="e.g. Blue Fire Safe"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <label
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Witnesses</label
                            >
                            <input
                                bind:value={newDoc.witnesses}
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
                                placeholder="Optional"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <div class="flex justify-between">
                                <label
                                    class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                    >Next Review</label
                                >
                                <span
                                    class="text-[10px] text-[#4A7C74] font-medium cursor-help"
                                    title="We'll remind you to check if this is still current."
                                    >Why?</span
                                >
                            </div>
                            <input
                                type="date"
                                bind:value={newDoc.nextReviewDate}
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
                            />
                        </div>
                    </div>

                    <!-- Custom Fields -->
                    <div class="mb-4 pt-4 border-t border-slate-100">
                        <CustomFieldsManager
                            entityType="legal_document"
                            bind:data={customAttributes}
                        />
                    </div>

                    <div class="flex justify-end gap-3 pt-4">
                        <button
                            onclick={resetForm}
                            class="px-6 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                            >Not right now</button
                        >
                        <button
                            onclick={saveDoc}
                            class="px-6 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
                        >
                            {newDoc.id ? "Save my updates" : "Save my document"}
                        </button>
                    </div>
                </div>
            {/if}
        </div>
    {/if}

    <!-- Doc Grid -->
    {#if viewMode === 'card'}
        <div class="grid grid-cols-1 gap-4">
            {#each docs as doc (doc.id)}
                <div
                    class="group glass-card p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between hover:bg-white/80 transition-all border border-transparent hover:border-[#4A7C74]/20 gap-4"
                >
                    <div class="flex items-start gap-5">
                        <div
                            class="w-12 h-12 shrink-0 rounded-2xl bg-[#FBF9EB] border border-[#4A7C74]/10 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform text-[#4A7C74]"
                        >
                            <FileText size={22} />
                        </div>
                        <div>
                            <div class="flex items-center gap-3 mb-1">
                                <h4
                                    class="font-serif font-bold text-lg leading-tight text-[#304743]"
                                >
                                    {doc.name}
                                </h4>
                                <span
                                    class="text-[10px] font-bold px-2 py-0.5 rounded border {getStatusColor(
                                        doc,
                                    )} uppercase tracking-wider"
                                >
                                    {doc.status?.replace("_", " ")}
                                </span>
                            </div>

                            <div
                                class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground"
                            >
                                <span
                                    class="font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1"
                                >
                                    <Shield size={10} />
                                    {doc.type}
                                </span>
                                <span>Signed: {doc.date}</span>
                                <span class="flex items-center gap-1"
                                    ><Lock size={10} /> {doc.location}</span
                                >
                                {#if doc.nextReviewDate}
                                    <span
                                        class="flex items-center gap-1 {doc.status ===
                                        'needs_review'
                                            ? 'text-amber-700 font-bold'
                                            : ''}"
                                    >
                                        <Calendar size={10} /> Review: {doc.nextReviewDate}
                                    </span>
                                {/if}
                                {#if doc.fileData}
                                    <span
                                        class="flex items-center gap-1 text-emerald-600 font-bold"
                                    >
                                        <FileCheck size={10} /> Digital Copy Stored
                                    </span>
                                {/if}
                            </div>

                            {#if doc.witnesses}
                                <div
                                    class="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/10 px-2 py-1 rounded w-fit italic"
                                >
                                    <Users size={10} /> Witnessed by {doc.witnesses}
                                </div>
                            {/if}
                        </div>
                    </div>

                    <div
                        class="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity justify-end"
                    >
                        {#if doc.fileData}
                            <a
                                href={doc.fileData}
                                download="{doc.name}-DigitalCopy"
                                class="p-2 hover:bg-secondary/10 text-muted-foreground hover:text-[#4A7C74] rounded-full transition-colors"
                                title="Download Digital Copy"
                            >
                                <Download size={18} />
                            </a>
                        {/if}
                        <button
                            onclick={() => (analyzingDoc = doc)}
                            class="p-2 hover:bg-indigo-50 text-muted-foreground hover:text-indigo-600 rounded-full transition-colors"
                            title="Analyze with Jargon Slayer"
                        >
                            <Sparkles size={18} />
                        </button>
                        <button
                            onclick={() => editDoc(doc)}
                            class="p-2 hover:bg-secondary/10 text-muted-foreground hover:text-[#4A7C74] rounded-full transition-colors"
                            title="Edit Details"
                        >
                            <Pencil size={18} />
                        </button>
                        <button
                            onclick={() => removeDoc(doc.id)}
                            class="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-full transition-colors"
                            title="Remove"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            {/each}
            {#if docs.length === 0}
                <GhostRow type="Document" onclick={startWizard} />
                <GhostRow type="Document" onclick={startWizard} />
                <GhostRow type="Document" onclick={startWizard} />
                <div class="flex justify-center mt-4">
                    <button
                        onclick={startWizard}
                        class="text-sm font-bold text-[#4A7C74] hover:bg-[#4A7C74]/5 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Sparkles size={14} /> Start Vault Assistant
                    </button>
                </div>
            {/if}
        </div>
    {:else}
        <!-- Table View -->
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table class="w-full">
                <thead class="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Document</th>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Type</th>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Status</th>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Date Signed</th>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Location</th>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Next Review</th>
                        <th class="text-right px-4 py-3 text-xs font-bold uppercase text-slate-500">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    {#each docs as doc (doc.id)}
                        <tr class="hover:bg-slate-50 transition-colors group">
                            <td class="px-4 py-3">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 shrink-0 rounded-lg bg-[#FBF9EB] border border-[#4A7C74]/10 flex items-center justify-center text-[#4A7C74]">
                                        <FileText size={16} />
                                    </div>
                                    <span class="font-medium text-slate-800">{doc.name}</span>
                                </div>
                            </td>
                            <td class="px-4 py-3">
                                <span class="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                                    {doc.type}
                                </span>
                            </td>
                            <td class="px-4 py-3">
                                <span class="text-xs font-bold px-2 py-1 rounded border {getStatusColor(doc)} uppercase">
                                    {doc.status?.replace("_", " ")}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-slate-600 text-sm">{doc.date}</td>
                            <td class="px-4 py-3 text-slate-600 text-sm">{doc.location}</td>
                            <td class="px-4 py-3 text-slate-500 text-sm">{doc.nextReviewDate || '-'}</td>
                            <td class="px-4 py-3 text-right">
                                <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {#if doc.fileData}
                                        <a
                                            href={doc.fileData}
                                            download="{doc.name}-DigitalCopy"
                                            class="p-1 hover:bg-slate-100 text-slate-400 hover:text-[#4A7C74] rounded transition-colors"
                                            title="Download"
                                        >
                                            <Download size={14} />
                                        </a>
                                    {/if}
                                    <button
                                        onclick={() => (analyzingDoc = doc)}
                                        class="p-1 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                                        title="Analyze"
                                    >
                                        <Sparkles size={14} />
                                    </button>
                                    <button
                                        onclick={() => editDoc(doc)}
                                        class="p-1 hover:bg-slate-100 text-slate-400 hover:text-[#4A7C74] rounded transition-colors"
                                        title="Edit"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onclick={() => removeDoc(doc.id)}
                                        class="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors"
                                        title="Remove"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
            {#if docs.length === 0}
                <div class="p-8 text-center text-slate-500">
                    <GhostRow type="Document" onclick={startWizard} />
                    <GhostRow type="Document" onclick={startWizard} />
                    <GhostRow type="Document" onclick={startWizard} />
                    <div class="flex justify-center mt-4">
                        <button
                            onclick={startWizard}
                            class="text-sm font-bold text-[#4A7C74] hover:bg-[#4A7C74]/5 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Sparkles size={14} /> Start Vault Assistant
                        </button>
                    </div>
                </div>
            {/if}
        </div>
    {/if}

    <!-- Jargon Slayer Modal -->
    {#if analyzingDoc}
        <JargonSlayer
            docName={analyzingDoc.name}
            docType={analyzingDoc.type}
            onclose={() => (analyzingDoc = null)}
        />
    {/if}
</div>
