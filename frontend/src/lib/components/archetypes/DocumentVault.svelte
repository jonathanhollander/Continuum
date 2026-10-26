<script lang="ts">
    import { onMount, tick } from "svelte";
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
    import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte";
    import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";
    import Modal from "$lib/components/ui/Modal.svelte";
    import { estateProfile } from "$lib/stores/estateStore.svelte";
    import { activityLog } from "$lib/stores/activityLog.svelte";
    import { userPreferencesStore } from "$lib/stores/userPreferencesStore.svelte";
    import { downloadMedia, mediaIdFromRef } from "$lib/services/mediaService";
    import { documentSync, type Document, type DocType } from "$lib/stores/documentStore.svelte";
    import { notifications } from "$lib/stores/notificationStore";
    import { pluralWord } from "$lib/utils/plural";
    import { dateWords } from "$lib/utils/dateWords";

    let { module }: { module: { id: string; name?: string } } = $props();
    // The one Cards/Table toggle below remembers its choice in userPreferencesStore; read it from there.
    let viewMode = $derived(userPreferencesStore.getViewMode("legal-documents"));

    // The one /api/data/documents manager (documentStore); the dashboard and Settings › Data read it too.
    type Doc = Document;
    const docSync = documentSync;
    let docs = $derived(docSync.items);
    // A gentle cue until the first server answer, unless this device already holds documents.
    let isLoading = $derived(
        docSync.lastSync === null && docSync.status !== "error" && docs.length === 0,
    );

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
    let titleMissing = $state(false);

    // When the form opens (or the assistant step hands over to it), the cursor waits in the title field.
    $effect(() => {
        if (showUpload && !(showWizard && wizardStep === 1)) {
            tick().then(() => document.getElementById("doc-title")?.focus());
        }
    });

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
        if (!(newDoc.name ?? "").trim()) {
            titleMissing = true;
            await tick();
            document.getElementById("doc-title")?.focus();
            return;
        }

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
                entityName: newDoc.name ?? "",
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
        titleMissing = false;
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

    // Remove asks in the page (shared Modal) before anything is sent.
    let removing = $state<Doc | null>(null);

    async function confirmRemove() {
        const doc = removing;
        removing = null;
        if (!doc) return;
        const id = doc.id;
        await docSync.delete(id);

        // Log DELETE only if the item is really gone (the manager rolls back and shows its message on failure)
        if (!docSync.items.some((d) => d.id === id)) {
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
            return "bg-warning-soft text-warning border-warning/30";
        if (state === "locate")
            return "bg-slate-500/10 text-muted-foreground border-border";
        return "bg-primary/10 text-primary-hover border-primary/20";
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
            class="bg-card/70 backdrop-blur-md border border-border shadow-sm p-6 rounded-2xl relative overflow-hidden group border-primary/20"
        >
            <div
                class="absolute -right-4 -top-4 opacity-10 rotate-12 transition-transform group-hover:scale-110 text-primary"
                aria-hidden="true"
            >
                <Shield size={120} />
            </div>
            <p
                class="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2"
            >
                <CircleCheck size={14} /> Peace of Mind Score
            </p>
            {#if healthScore === null}
                <div class="mt-2" data-testid="vault-score">
                    <span class="text-2xl font-serif font-bold text-foreground"
                        >Ready when you are</span
                    >
                </div>
                <p class="mt-4 text-xs text-muted-foreground">
                    Your first document starts your score.
                </p>
            {:else}
                <div class="mt-2 flex items-baseline gap-2" data-testid="vault-score">
                    <span class="text-4xl font-serif font-bold text-foreground"
                        >{healthScore}%</span
                    >
                    <span class="text-sm font-medium text-muted-foreground"
                        >ready for your family</span
                    >
                </div>

                <div class="mt-4 flex gap-1">
                    {#if readyDocs === docs.length}
                        <div
                            class="text-xs bg-primary/10 text-primary-hover px-2 py-1 rounded-full flex items-center gap-1 font-bold"
                        >
                            <CircleCheck size={10} /> Every document ready
                        </div>
                    {:else}
                        <div
                            class="text-xs bg-warning-soft text-warning px-2 py-1 rounded-full flex items-center gap-1 font-bold"
                        >
                            <CircleAlert size={10} /> {readyDocs} of {docs.length} ready
                        </div>
                    {/if}
                </div>
            {/if}
        </div>

        <!-- Assistant Banner -->
        <div
            class="md:col-span-2 bg-card/70 backdrop-blur-md border border-border shadow-sm p-6 rounded-2xl flex flex-col justify-center bg-gradient-to-r from-background to-primary/5"
        >
            <div class="flex items-center gap-6 h-full">
                <div
                    class="hidden md:flex bg-card p-4 rounded-full shadow-md text-primary"
                >
                    {#if !isLoading && docs.length > 0 && needsReview === 0}
                        <CircleCheck size={32} />
                    {:else}
                        <HelpCircle size={32} />
                    {/if}
                </div>
                <div>
                    <h4 class="font-serif font-bold text-xl text-foreground">
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
                            class="mt-4 text-sm font-bold text-primary hover:underline flex items-center gap-1"
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
        class="flex justify-between items-center bg-secondary/5 p-3 rounded-2xl border border-border"
    >
        <div class="relative flex-1 max-w-sm ml-2">
            <Search
                size={16}
                class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
                bind:value={searchQuery}
                aria-label="Search your documents"
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
                class="px-4 py-2.5 bg-card border border-border text-muted-foreground font-bold rounded-xl hover:bg-background transition-all flex items-center gap-2"
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
            class="bg-card/70 backdrop-blur-md border border-border shadow-sm p-0 rounded-2xl border-l-4 border-l-primary overflow-hidden"
        >
            <!-- Wizard Mode -->
            {#if showWizard && wizardStep === 1}
                <div class="p-8 bg-muted/50">
                    <div class="flex justify-between items-start mb-6">
                        <div>
                            <h4
                                class="font-serif font-bold text-xl text-foreground"
                            >
                                Vault Assistant
                            </h4>
                            <p class="text-muted-foreground text-sm mt-1">
                                I'll help you categorize this correctly.
                            </p>
                        </div>
                        <button
                            onclick={() => (showUpload = false)}
                            class="p-2 -mr-2 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-full transition-colors"
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
                            class="p-4 bg-card border border-border hover:border-primary rounded-2xl text-left transition-all hover:shadow-md group"
                        >
                            <span
                                class="block font-bold text-primary mb-1 group-hover:underline"
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
                            class="p-4 bg-card border border-border hover:border-primary rounded-2xl text-left transition-all hover:shadow-md group"
                        >
                            <span
                                class="block font-bold text-primary mb-1 group-hover:underline"
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
                            class="p-4 bg-card border border-border hover:border-primary rounded-2xl text-left transition-all hover:shadow-md group"
                        >
                            <span
                                class="block font-bold text-primary mb-1 group-hover:underline"
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
                        <h4 class="font-serif font-bold text-lg text-foreground">
                            Document Details
                        </h4>
                        {#if wizardStep === 2}
                            <span
                                class="text-xs bg-primary/10 text-primary-hover px-2 py-1 rounded-full font-bold flex items-center gap-1"
                            >
                                <CircleCheck size={10} /> Assistant Auto-Filled
                            </span>
                        {/if}
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div class="space-y-1.5">
                            <label
                                for="doc-title"
                                class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1"
                                >Document Title</label
                            >
                            <input
                                id="doc-title"
                                bind:value={newDoc.name}
                                oninput={() => (titleMissing = false)}
                                aria-invalid={titleMissing}
                                aria-describedby={titleMissing ? "doc-title-hint" : undefined}
                                class="w-full px-4 py-3 rounded-xl border {titleMissing ? 'border-warning ring-2 ring-warning-soft' : 'border-border'} bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                                placeholder="e.g. Last Will"
                            />
                            {#if titleMissing}
                                <p id="doc-title-hint" class="text-xs text-warning px-1">
                                    Give this document a title and it is ready to save.
                                </p>
                            {/if}
                        </div>
                        <div class="space-y-1.5">
                            <label
                                for="doc-category"
                                class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1"
                                >Category</label
                            >
                            <select
                                id="doc-category"
                                bind:value={newDoc.type}
                                class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
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
                                class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1"
                                >Where the Original Is Kept</label
                            >
                            <input
                                id="doc-location"
                                bind:value={newDoc.location}
                                class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                                placeholder="e.g. Blue fire safe in the study"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <label
                                for="doc-witnesses"
                                class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1"
                                >Witnesses</label
                            >
                            <input
                                id="doc-witnesses"
                                bind:value={newDoc.witnesses}
                                class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                                placeholder="Optional"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <label
                                for="doc-signed"
                                class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1"
                                >Date Signed</label
                            >
                            <input
                                id="doc-signed"
                                type="date"
                                bind:value={newDoc.signedDate}
                                class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <div class="flex justify-between">
                                <label
                                    for="doc-review"
                                    class="block text-xs font-bold uppercase text-muted-foreground tracking-wide px-1"
                                    >Next Review</label
                                >
                                <span
                                    class="text-[10px] text-primary font-medium cursor-help"
                                    title="A gentle date to look this over again, so it keeps reflecting your current wishes."
                                    >Why?</span
                                >
                            </div>
                            <input
                                id="doc-review"
                                type="date"
                                bind:value={newDoc.nextReviewDate}
                                class="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                            />
                        </div>
                    </div>

                    <!-- Custom Fields -->
                    <div class="mb-4 pt-4 border-t border-border">
                        <CustomFieldsManager
                            entityType="legal_document"
                            bind:data={newDoc.customAttributes}
                        />
                    </div>

                    <div class="flex justify-end gap-3 pt-4">
                        <button
                            onclick={resetForm}
                            class="px-6 py-2.5 rounded-xl font-semibold text-muted-foreground hover:bg-muted transition-colors"
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
                    class="group bg-card/60 backdrop-blur-sm border border-border shadow-sm hover:shadow-md transition-all duration-300 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between hover:bg-card/80 transition-all border border-transparent hover:border-primary/20 gap-4"
                >
                    <div class="flex items-start gap-5">
                        <div
                            class="w-12 h-12 shrink-0 rounded-2xl bg-muted border border-primary/10 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform text-primary"
                        >
                            <FileText size={22} />
                        </div>
                        <div>
                            <div class="flex items-center gap-3 mb-1">
                                <h4
                                    class="font-serif font-bold text-lg leading-tight text-foreground"
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
                                    class="font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1"
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
                                            ? 'text-warning font-bold'
                                            : ''}"
                                    >
                                        <Calendar size={10} /> Review: {dateWords(doc.nextReviewDate)}
                                    </span>
                                {/if}
                                {#if doc.filePath}
                                    <span
                                        class="flex items-center gap-1 text-success font-bold"
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
                                <div class="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                                    {#each Object.entries(doc.customAttributes) as [k, v] (k)}
                                        {#if v !== "" && v != null}
                                            <span class="bg-muted px-2 py-0.5 rounded"><span class="font-semibold">{k}:</span> {v === true ? "Yes" : v === false ? "No" : v}</span>
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
                                class="p-2 hover:bg-secondary/10 text-muted-foreground hover:text-primary rounded-full transition-colors"
                                title="Save a copy of the digital file"
                                aria-label="Save a copy of the digital file"
                            >
                                <Download size={18} />
                            </button>
                        {/if}
                        <button
                            onclick={() => editDoc(doc)}
                            class="p-2 hover:bg-secondary/10 text-muted-foreground hover:text-primary rounded-full transition-colors"
                            title="Edit Details"
                            aria-label="Edit Details"
                        >
                            <Pencil size={18} />
                        </button>
                        <button
                            onclick={() => (removing = doc)}
                            class="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-full transition-colors"
                            title="Remove this item"
                            aria-label="Remove this item"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            {/each}
            {#if isLoading}
                <div class="flex flex-col items-center justify-center gap-3 py-12" role="status" data-testid="documents-loading">
                    <Loader2 size={28} class="animate-spin text-primary" />
                    <span class="sr-only">Gathering your documents…</span>
                </div>
            {:else if docs.length === 0}
                <GhostRow type="Document" onclick={startWizard} />
                <GhostRow type="Document" onclick={startWizard} />
                <GhostRow type="Document" onclick={startWizard} />
                <div class="flex justify-center mt-4">
                    <button
                        onclick={startWizard}
                        class="text-sm font-bold text-primary hover:bg-primary/5 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Sparkles size={14} /> Start Vault Assistant
                    </button>
                </div>
            {/if}
        </div>
    {:else}
        <!-- Table View -->
        <div class="bg-card rounded-xl border border-border overflow-hidden">
            <table class="w-full">
                <thead class="bg-background border-b border-border">
                    <tr>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Document</th>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Type</th>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Status</th>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Date Signed</th>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Location</th>
                        <th class="text-left px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Next Review</th>
                        <th class="text-right px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-border">
                    {#each visibleDocs as doc (doc.id)}
                        <tr class="hover:bg-background transition-colors group">
                            <td class="px-4 py-3">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 shrink-0 rounded-lg bg-muted border border-primary/10 flex items-center justify-center text-primary">
                                        <FileText size={16} />
                                    </div>
                                    <span class="font-medium text-foreground">{doc.name}</span>
                                </div>
                            </td>
                            <td class="px-4 py-3">
                                <span class="px-2 py-1 bg-muted text-muted-foreground rounded text-xs font-medium">
                                    {doc.type}
                                </span>
                            </td>
                            <td class="px-4 py-3">
                                <span class="text-xs font-bold px-2 py-1 rounded border {getStatusColor(doc)} uppercase">
                                    {stateLabel[docState(doc)]}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-muted-foreground text-sm">{dateWords(doc.signedDate) || '-'}</td>
                            <td class="px-4 py-3 text-muted-foreground text-sm">{doc.location}</td>
                            <td class="px-4 py-3 text-muted-foreground text-sm">{dateWords(doc.nextReviewDate) || '-'}</td>
                            <td class="px-4 py-3 text-right">
                                <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {#if doc.filePath}
                                        <button
                                            type="button"
                                            onclick={() => saveCopy(doc)}
                                            class="p-1 hover:bg-muted text-muted-foreground hover:text-primary rounded transition-colors"
                                            title="Save a copy"
                                            aria-label="Save a copy"
                                        >
                                            <Download size={14} />
                                        </button>
                                    {/if}
                                    <button
                                        onclick={() => editDoc(doc)}
                                        class="p-1 hover:bg-muted text-muted-foreground hover:text-primary rounded transition-colors"
                                        title="Edit"
                                        aria-label="Edit"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onclick={() => (removing = doc)}
                                        class="p-1 hover:bg-danger-soft text-muted-foreground hover:text-danger rounded transition-colors"
                                        title="Remove this item"
                                        aria-label="Remove this item"
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
                    <Loader2 size={28} class="animate-spin text-primary" />
                    <span class="sr-only">Gathering your documents…</span>
                </div>
            {:else if docs.length === 0}
                <div class="p-8 text-center text-muted-foreground">
                    <GhostRow type="Document" onclick={startWizard} />
                    <GhostRow type="Document" onclick={startWizard} />
                    <GhostRow type="Document" onclick={startWizard} />
                    <div class="flex justify-center mt-4">
                        <button
                            onclick={startWizard}
                            class="text-sm font-bold text-primary hover:bg-primary/5 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Sparkles size={14} /> Start Vault Assistant
                        </button>
                    </div>
                </div>
            {/if}
        </div>
    {/if}

    <!-- An example will with legal terms explained -->
    <Modal
        bind:open={() => removing !== null, (v) => { if (!v) removing = null; }}
        title="Would you like to remove this document?"
        description="This action is permanent."
    >
        <p class="font-serif font-bold text-foreground">{removing?.name}</p>
        <div class="flex justify-end gap-3 pt-6">
            <button
                type="button"
                onclick={() => (removing = null)}
                class="px-6 py-2.5 rounded-xl font-semibold text-muted-foreground hover:bg-muted transition-colors"
                >Not right now</button
            >
            <button
                type="button"
                onclick={confirmRemove}
                class="px-6 py-2.5 rounded-xl font-semibold bg-danger text-card hover:opacity-90 transition-colors"
                >Remove this item</button
            >
        </div>
    </Modal>

    {#if showExampleWill}
        <JargonSlayer onclose={() => (showExampleWill = false)} />
    {/if}
</div>
