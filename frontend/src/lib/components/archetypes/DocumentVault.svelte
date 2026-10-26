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
        BookOpenText,
        Loader2,
    } from "lucide-svelte";
    import JargonSlayer from "$lib/components/modules/legal-documents/JargonSlayer.svelte";
    import { slide, scale, fade, fly } from "svelte/transition";
    import FileUploader from "$lib/components/ui/FileUploader.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte"; // NEW IMPORT
    import EmptyStateGuide from "$lib/components/ui/EmptyStateGuide.svelte";
    import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte";
    import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";
    import { estateProfile } from "$lib/stores/estateStore.svelte";
    import { activityLog } from "$lib/stores/activityLog.svelte";
    import { userPreferencesStore } from "$lib/stores/userPreferencesStore.svelte";
    import { downloadMedia, mediaIdFromRef } from "$lib/services/mediaService";
    import { notifications } from "$lib/stores/notificationStore";
    import { pluralWord } from "$lib/utils/plural";
    import { dateWords } from "$lib/utils/dateWords";

    let { module }: { module: { id: string; name?: string } } = $props();
    // The one Cards/Table toggle below remembers its choice in userPreferencesStore; read it from there.
    let viewMode = $derived(userPreferencesStore.getViewMode("legal-documents"));

    type DocType =
        | "Will"
        | "Trust"
        | "Deed"
        | "Insurance"
        | "Tax"
        | "ID"
        | "Other";

    // UI shape. Other pages read name/type/location from the "docs_<id>" store, so those stay.
    interface Doc {
        id: string;
        name: string;
        type: DocType;
        location: string; // where the original is kept
        witnesses?: string;
        signedDate?: string;
        nextReviewDate?: string;
        status: "verified" | "pending" | "needs_review";
        notes?: string;
        filePath?: string; // stored copy: "/api/media/12/download" (or an older data URL)
        mediaId?: number | null;
        customAttributes?: Record<string, any>;
    }

    /**
     * Doc <-> Document row (backend/estate_models.py), used both ways by SyncManager.
     * UI fields win over their column twins, so an edit to `name` beats a stale `title`.
     */
    function docMapper(d: any): any {
        const name = d.name || d.title || "";
        const type = d.type || d.category || "Other";
        const location = d.location ?? d.locationPhysical ?? "";
        const filePath = d.filePath || d.fileData || ""; // fileData: older device-only copies
        let custom = d.customAttributes;
        if (typeof custom === "string") {
            try { custom = JSON.parse(custom); } catch { custom = {}; }
        }
        return {
            id: d.id,
            name,
            title: name,
            type,
            category: type,
            location,
            locationPhysical: location,
            witnesses: d.witnesses ?? "",
            signedDate: d.signedDate ?? "",
            nextReviewDate: d.nextReviewDate ?? "",
            status: d.status || "verified",
            notes: d.notes ?? "",
            filePath,
            mediaId: d.mediaId ?? mediaIdFromRef(filePath),
            isDigitized: !!filePath,
            customAttributes: custom && typeof custom === "object" ? custom : {},
        };
    }

    import {
        registerSync,
        type SyncManager,
    } from "$lib/services/sync.svelte";

    let docSync = $state<SyncManager<Doc> | null>(null);
    let docs = $derived(docSync?.items || []);
    // A gentle cue until the first server answer, unless this device already holds documents.
    let isLoading = $derived(
        !docSync || (docSync.lastSync === null && docSync.status !== "error" && docs.length === 0),
    );

    $effect(() => {
        if (module?.id) {
            // docs_{id} -> /api/data/documents (all verbs go through routers/estate_data.py)
            docSync = registerSync<Doc>(
                `docs_${module.id}`,
                "documents",
                docMapper,
            ).setAffirmationContext("documents");
        }
    });

    let showUpload = $state(false);
    let showWizard = $state(false);

    // Wizard State
    let wizardStep = $state(0);
    let showExampleWill = $state(false);

    type DocDraft = Partial<Doc> & { id?: string; customAttributes: Record<string, any> };

    const emptyDoc = (): DocDraft => ({
        id: undefined,
        name: "",
        location: "",
        type: "Other",
        status: "verified",
        witnesses: "",
        signedDate: "",
        nextReviewDate: "",
        filePath: "",
        mediaId: null,
        customAttributes: {},
    });

    let newDoc = $state<DocDraft>(emptyDoc());

    // One save at a time: while it is open the button waits, so a second click sends nothing.
    let saving = $state(false);
    async function saveDoc() {
        if (saving) return;
        saving = true;
        try {
            await saveDocOnce();
        } finally {
            saving = false;
        }
    }

    async function saveDocOnce() {
        if (!newDoc.name || !docSync) return;

        const fields = {
            name: newDoc.name,
            type: (newDoc.type as DocType) || "Other",
            location: newDoc.location || "",
            witnesses: newDoc.witnesses || "",
            signedDate: newDoc.signedDate || "",
            nextReviewDate: newDoc.nextReviewDate || "",
            filePath: newDoc.filePath || "",
            mediaId: newDoc.filePath ? (newDoc.mediaId ?? null) : null,
            customAttributes: { ...(newDoc.customAttributes || {}) },
            status: newDoc.status || "verified",
        };

        try {
        if (newDoc.id) {
            // Edit Mode
            await docSync.update(newDoc.id, fields);

            // Log UPDATE
            activityLog.logEvent({
                module: module.name || "Document Vault",
                action: "UPDATE",
                entityType: "Document",
                entityId: String(newDoc.id),
                entityName: newDoc.name,
                userContext: $estateProfile.ownerName || "User",
            });
        } else {
            // Create Mode
            const created = await docSync.create(fields, false, false, saveDoc);

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
        } catch {
            // The manager already showed the one gentle message; the form stays open with the draft.
        }
    }

    function editDoc(doc: Doc) {
        newDoc = { ...doc, customAttributes: { ...(doc.customAttributes || {}) } };
        // Skip wizard for edits, go straight to form
        showWizard = false;
        showUpload = true;
    }

    function resetForm() {
        newDoc = emptyDoc();
        showUpload = false;
        showWizard = false;
        wizardStep = 0;
    }

    async function saveCopy(doc: Doc) {
        const id = doc.mediaId ?? mediaIdFromRef(doc.filePath);
        try {
            if (id !== null) {
                await downloadMedia(id);
            } else if (doc.filePath) {
                const a = document.createElement("a");
                a.href = doc.filePath;
                a.download = `${doc.name}-DigitalCopy`;
                a.click();
            }
        } catch (e: any) {
            notifications.showError({
                message: "Your copy is taking a moment to open. Try again when you're ready.",
                code: "NETWORK_ERROR",
                technicalDetails: e?.message || String(e),
            } as any);
        }
    }

    async function removeDoc(id: string) {
        if (
            !confirm(
                "Would you like to remove this document? This action is permanent.",
            )
        )
            return;
        if (!docSync) return;

        const doc = docs.find((d) => d.id === id);
        await docSync.delete(id);

        // Log DELETE only if the item is really gone (the manager rolls back and shows its message on failure)
        if (doc && !docSync.items.some((d) => d.id === id)) {
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

    // Nothing in the app sets a document's saved status, so readiness comes from its real fields:
    // the family can find it (a stored copy, or where the original is kept) and any review date is still ahead.
    function localToday(): string {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
    const today = localToday();
    function reviewDue(doc: Doc): boolean {
        return !!doc.nextReviewDate && doc.nextReviewDate <= today;
    }
    function docState(doc: Doc): "ready" | "review" | "locate" {
        if (reviewDue(doc)) return "review";
        return doc.filePath || String(doc.location || "").trim() ? "ready" : "locate";
    }
    const stateLabel = { ready: "Ready", review: "Review due", locate: "Add where it's kept" };

    function getStatusColor(doc: Doc) {
        const state = docState(doc);
        if (state === "review")
            return "bg-amber-500/10 text-amber-700 border-amber-200";
        if (state === "locate")
            return "bg-gray-500/10 text-gray-600 border-gray-200";
        return "bg-[#4A7C74]/10 text-[#4A7C74] border-[#4A7C74]/20";
    }

    // Vault Health Logic
    let readyDocs = $derived(docs.filter((d) => docState(d) === "ready").length);
    let needsReview = $derived(docs.length - readyDocs);

    // Search box: matches name, type and notes as you type; empty shows every document.
    let searchQuery = $state("");
    let visibleDocs = $derived.by(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return docs;
        return docs.filter((d) =>
            [d.name, d.type, d.notes].some((f) => (f || "").toLowerCase().includes(q)),
        );
    });
    // Share of documents ready for the family; no score until there is a document
    let healthScore = $derived(
        docs.length ? Math.round((readyDocs / docs.length) * 100) : null,
    );

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
            {#if healthScore === null}
                <div class="mt-2" data-testid="vault-score">
                    <span class="text-2xl font-serif font-bold text-[#304743]"
                        >Ready when you are</span
                    >
                </div>
                <p class="mt-4 text-xs text-muted-foreground">
                    Your first document starts your score.
                </p>
            {:else}
                <div class="mt-2 flex items-baseline gap-2" data-testid="vault-score">
                    <span class="text-4xl font-serif font-bold text-[#304743]"
                        >{healthScore}%</span
                    >
                    <span class="text-sm font-medium text-muted-foreground"
                        >ready for your family</span
                    >
                </div>

                <div class="mt-4 flex gap-1">
                    {#if readyDocs === docs.length}
                        <div
                            class="text-xs bg-[#4A7C74]/10 text-[#4A7C74] px-2 py-1 rounded-full flex items-center gap-1 font-bold"
                        >
                            <CircleCheck size={10} /> Every document ready
                        </div>
                    {:else}
                        <div
                            class="text-xs bg-amber-500/10 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1 font-bold"
                        >
                            <CircleAlert size={10} /> {readyDocs} of {docs.length} ready
                        </div>
                    {/if}
                </div>
            {/if}
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
                        {#if isLoading}
                            Gathering your documents…
                        {:else if docs.length === 0}
                            Let's secure your first document.
                        {:else if needsReview > 0}
                            {needsReview} {pluralWord(needsReview, "item")} could use your attention.
                        {:else}
                            Your vault is secure.
                        {/if}
                    </h4>
                    <p
                        class="text-sm text-muted-foreground mt-1 max-w-lg leading-relaxed"
                    >
                        {#if isLoading}
                            One moment while everything you have saved comes into view.
                        {:else if docs.length === 0}
                            Uploading your Will or Trust is one of the most
                            meaningful steps you can take today. I can help you
                            file it correctly.
                        {:else if needsReview > 0}
                            A quick look keeps each one current and easy for
                            your family to find.
                        {:else}
                            Rest easy knowing your critical information is
                            organized and accessible to those you trust.
                        {/if}
                    </p>

                    {#if !isLoading && docs.length === 0}
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
                bind:value={searchQuery}
                placeholder="Search your peace of mind..."
                class="w-full bg-transparent border-none outline-none pl-9 text-sm h-10 placeholder:text-muted-foreground/50"
            />
        </div>
        <div class="flex items-center gap-3">
            <DataViewToggle module="legal-documents" />
            <button
                type="button"
                onclick={() => (showExampleWill = true)}
                data-testid="example-will"
                class="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2"
            >
                <BookOpenText size={16} /> Example will, explained
            </button>
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
                            module="documents"
                            mode="any"
                            bind:imageUrl={newDoc.filePath}
                            bind:mediaId={newDoc.mediaId}
                        />
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div class="space-y-1.5">
                            <label
                                for="doc-location"
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Where the Original Is Kept</label
                            >
                            <input
                                id="doc-location"
                                bind:value={newDoc.location}
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
                                placeholder="e.g. Blue fire safe in the study"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <label
                                for="doc-witnesses"
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Witnesses</label
                            >
                            <input
                                id="doc-witnesses"
                                bind:value={newDoc.witnesses}
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
                                placeholder="Optional"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <label
                                for="doc-signed"
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Date Signed</label
                            >
                            <input
                                id="doc-signed"
                                type="date"
                                bind:value={newDoc.signedDate}
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <div class="flex justify-between">
                                <label
                                    for="doc-review"
                                    class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                    >Next Review</label
                                >
                                <span
                                    class="text-[10px] text-[#4A7C74] font-medium cursor-help"
                                    title="A gentle date to look this over again, so it keeps reflecting your current wishes."
                                    >Why?</span
                                >
                            </div>
                            <input
                                id="doc-review"
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
                            bind:data={newDoc.customAttributes}
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
                            disabled={saving}
                            aria-busy={saving}
                            class="px-6 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
                        >
                            {saving ? "Saving..." : newDoc.id ? "Save my updates" : "Save my document"}
                        </button>
                    </div>
                </div>
            {/if}
        </div>
    {/if}

    <!-- Doc Grid -->
    {#if viewMode === 'card'}
        <div class="grid grid-cols-1 gap-4">
            {#each visibleDocs as doc (doc.id)}
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
                                    {stateLabel[docState(doc)]}
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
                                {#if doc.signedDate}
                                    <span>Signed: {dateWords(doc.signedDate)}</span>
                                {/if}
                                {#if doc.location}
                                    <span class="flex items-center gap-1"
                                        ><Lock size={10} /> {doc.location}</span
                                    >
                                {/if}
                                {#if doc.nextReviewDate}
                                    <span
                                        class="flex items-center gap-1 {reviewDue(doc)
                                            ? 'text-amber-700 font-bold'
                                            : ''}"
                                    >
                                        <Calendar size={10} /> Review: {dateWords(doc.nextReviewDate)}
                                    </span>
                                {/if}
                                {#if doc.filePath}
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
                            {#if doc.customAttributes && Object.keys(doc.customAttributes).some((k) => doc.customAttributes?.[k] !== "" && doc.customAttributes?.[k] != null)}
                                <div class="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
                                    {#each Object.entries(doc.customAttributes) as [k, v] (k)}
                                        {#if v !== "" && v != null}
                                            <span class="bg-slate-100 px-2 py-0.5 rounded"><span class="font-semibold">{k}:</span> {v === true ? "Yes" : v === false ? "No" : v}</span>
                                        {/if}
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    </div>

                    <div
                        class="flex items-center gap-2 justify-end"
                    >
                        {#if doc.filePath}
                            <button
                                type="button"
                                onclick={() => saveCopy(doc)}
                                class="p-2 hover:bg-secondary/10 text-muted-foreground hover:text-[#4A7C74] rounded-full transition-colors"
                                title="Save a copy of the digital file"
                                aria-label="Save a copy of the digital file"
                            >
                                <Download size={18} />
                            </button>
                        {/if}
                        <button
                            onclick={() => editDoc(doc)}
                            class="p-2 hover:bg-secondary/10 text-muted-foreground hover:text-[#4A7C74] rounded-full transition-colors"
                            title="Edit Details"
                            aria-label="Edit Details"
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
            {#if isLoading}
                <div class="flex flex-col items-center justify-center gap-3 py-12" role="status" data-testid="documents-loading">
                    <Loader2 size={28} class="animate-spin text-[#4A7C74]" />
                    <span class="sr-only">Gathering your documents…</span>
                </div>
            {:else if docs.length === 0}
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
                    {#each visibleDocs as doc (doc.id)}
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
                                    {stateLabel[docState(doc)]}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-slate-600 text-sm">{dateWords(doc.signedDate) || '-'}</td>
                            <td class="px-4 py-3 text-slate-600 text-sm">{doc.location}</td>
                            <td class="px-4 py-3 text-slate-500 text-sm">{dateWords(doc.nextReviewDate) || '-'}</td>
                            <td class="px-4 py-3 text-right">
                                <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {#if doc.filePath}
                                        <button
                                            type="button"
                                            onclick={() => saveCopy(doc)}
                                            class="p-1 hover:bg-slate-100 text-slate-400 hover:text-[#4A7C74] rounded transition-colors"
                                            title="Save a copy"
                                            aria-label="Save a copy"
                                        >
                                            <Download size={14} />
                                        </button>
                                    {/if}
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
            {#if isLoading}
                <div class="flex flex-col items-center justify-center gap-3 py-12" role="status" data-testid="documents-loading">
                    <Loader2 size={28} class="animate-spin text-[#4A7C74]" />
                    <span class="sr-only">Gathering your documents…</span>
                </div>
            {:else if docs.length === 0}
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

    <!-- An example will with legal terms explained -->
    {#if showExampleWill}
        <JargonSlayer onclose={() => (showExampleWill = false)} />
    {/if}
</div>
