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
    import { estateProfile } from "$lib/stores/estateStore";
    import { activityLog } from "$lib/stores/activityLog";
    import { getStored, setStored } from "$lib/stores/persistence";

    export let module: any;

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

    let docs: Doc[] = [];
    let showUpload = false;
    let showWizard = false;

    // Wizard State
    let wizardStep = 0;
    let wizardSelection: Partial<Doc> = {};
    let analyzingDoc: Doc | null = null;

    let newDoc: Partial<Doc> & { id?: string } = {
        name: "",
        location: "",
        type: "Other",
        status: "verified",
        fileData: "",
    };

    const storageKey = `docs_${module.id}`;

    onMount(() => {
        docs = getStored(storageKey, []);
    });

    function save() {
        setStored(storageKey, docs);
    }

    function saveDoc() {
        if (!newDoc.name) return;

        if (newDoc.id) {
            // Edit Mode
            const oldDoc = docs.find((d) => d.id === newDoc.id);
            const changes = [];

            if (oldDoc) {
                if (oldDoc.name !== newDoc.name)
                    changes.push({
                        field: "name",
                        oldValue: oldDoc.name,
                        newValue: newDoc.name,
                    });
                if (oldDoc.type !== newDoc.type)
                    changes.push({
                        field: "type",
                        oldValue: oldDoc.type,
                        newValue: newDoc.type,
                    });
                if (oldDoc.location !== newDoc.location)
                    changes.push({
                        field: "location",
                        oldValue: oldDoc.location,
                        newValue: newDoc.location,
                    });
                if (oldDoc.witnesses !== newDoc.witnesses)
                    changes.push({
                        field: "witnesses",
                        oldValue: oldDoc.witnesses,
                        newValue: newDoc.witnesses,
                    });
            }

            docs = docs.map((d) =>
                d.id === newDoc.id
                    ? ({
                          ...newDoc,
                      } as Doc)
                    : d,
            );

            // Log UPDATE
            activityLog.logEvent({
                module: module.name || "Document Vault",
                action: "UPDATE",
                entityType: "Document",
                entityId: newDoc.id,
                entityName: newDoc.name || "Unnamed Document",
                changes,
                userContext: $estateProfile.ownerName || "User",
            });
        } else {
            // Create Mode
            const newId = crypto.randomUUID();
            docs = [
                ...docs,
                {
                    id: newId,
                    name: newDoc.name,
                    type: (newDoc.type as DocType) || "Other",
                    date: new Date().toLocaleDateString(),
                    location: newDoc.location || "Physical Safe",
                    status: "verified",
                    witnesses: newDoc.witnesses || "",
                    nextReviewDate: newDoc.nextReviewDate || "",
                    fileData: newDoc.fileData || "",
                },
            ];

            // Log CREATE
            activityLog.logEvent({
                module: module.name || "Document Vault",
                action: "CREATE",
                entityType: "Document",
                entityId: newId,
                entityName: newDoc.name,
                userContext: $estateProfile.ownerName || "User",
            });
        }

        save();
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
        const doc = docs.find((d) => d.id === id);

        docs = docs.filter((d) => d.id !== id);
        save();

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
    $: completeDocs = docs.length;
    $: needsReview = docs.filter((d) => d.status === "needs_review").length;
    $: healthScore = Math.max(0, 100 - needsReview * 20);

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
            class="glass-panel p-6 rounded-xl relative overflow-hidden group border-[#4A7C74]/20"
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
            class="md:col-span-2 glass-panel p-6 rounded-xl flex flex-col justify-center bg-gradient-to-r from-background to-[#4A7C74]/5"
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
                            Uploading your Will or Trust is the single most
                            important step you can take today. I can help you
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
                            on:click={startWizard}
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
        class="flex justify-between items-center bg-secondary/5 p-2 rounded-lg border border-border"
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
            on:click={() => {
                showUpload = true;
                showWizard = false;
            }}
            class="bg-[#4A7C74] hover:bg-[#3b635d] text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 shadow-sm transition-all shadow-[#4A7C74]/20"
        >
            <CloudUpload size={16} /> Secure a Document
        </button>
    </div>

    <!-- Wizard / Upload Form -->
    {#if showUpload}
        <div
            transition:fly={{ y: 10 }}
            class="glass-panel p-0 rounded-xl border-l-4 border-l-[#4A7C74] overflow-hidden"
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
                        <button on:click={() => (showUpload = false)}
                            ><X
                                size={20}
                                class="text-muted-foreground"
                            /></button
                        >
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            on:click={() =>
                                selectWizardOption(
                                    "Will",
                                    "Last Will & Testament",
                                )}
                            class="p-4 bg-white border border-border hover:border-[#4A7C74] rounded-xl text-left transition-all hover:shadow-md group"
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
                            on:click={() =>
                                selectWizardOption("Trust", "Living Trust")}
                            class="p-4 bg-white border border-border hover:border-[#4A7C74] rounded-xl text-left transition-all hover:shadow-md group"
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
                            on:click={() =>
                                selectWizardOption(
                                    "Insurance",
                                    "Life Insurance Policy",
                                )}
                            class="p-4 bg-white border border-border hover:border-[#4A7C74] rounded-xl text-left transition-all hover:shadow-md group"
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
                        on:click={() => {
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
                                class="text-xs font-bold uppercase text-muted-foreground"
                                >Document Title</label
                            >
                            <input
                                bind:value={newDoc.name}
                                class="w-full p-2.5 rounded border border-border bg-white/50 focus:bg-white focus:ring-2 focus:ring-[#4A7C74]/20 outline-none"
                                placeholder="e.g. Last Will"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <label
                                class="text-xs font-bold uppercase text-muted-foreground"
                                >Category</label
                            >
                            <select
                                bind:value={newDoc.type}
                                class="w-full p-2.5 rounded border border-border bg-white/50 focus:bg-white focus:ring-2 focus:ring-[#4A7C74]/20 outline-none"
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
                                class="text-xs font-bold uppercase text-muted-foreground"
                                >Physical Location</label
                            >
                            <input
                                bind:value={newDoc.location}
                                class="w-full p-2.5 rounded border border-border bg-white/50 focus:bg-white focus:ring-2 focus:ring-[#4A7C74]/20 outline-none"
                                placeholder="e.g. Blue Fire Safe"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <label
                                class="text-xs font-bold uppercase text-muted-foreground"
                                >Witnesses</label
                            >
                            <input
                                bind:value={newDoc.witnesses}
                                class="w-full p-2.5 rounded border border-border bg-white/50 focus:bg-white focus:ring-2 focus:ring-[#4A7C74]/20 outline-none"
                                placeholder="Optional"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <div class="flex justify-between">
                                <label
                                    class="text-xs font-bold uppercase text-muted-foreground"
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
                                class="w-full p-2.5 rounded border border-border bg-white/50 focus:bg-white focus:ring-2 focus:ring-[#4A7C74]/20 outline-none"
                            />
                        </div>
                    </div>

                    <div class="flex justify-end gap-3 pt-2">
                        <button
                            on:click={resetForm}
                            class="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                            >Cancel</button
                        >
                        <button
                            on:click={saveDoc}
                            class="px-5 py-2 bg-[#4A7C74] text-white text-sm font-bold rounded shadow hover:shadow-lg hover:-translate-y-0.5 transition-all"
                        >
                            {newDoc.id ? "Update Record" : "Secure this Record"}
                        </button>
                    </div>
                </div>
            {/if}
        </div>
    {/if}

    <!-- Doc Grid -->
    <div class="grid grid-cols-1 gap-4">
        {#each docs as doc (doc.id)}
            <div
                class="group glass-card p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between hover:bg-white/80 transition-all border border-transparent hover:border-[#4A7C74]/20 gap-4"
            >
                <div class="flex items-start gap-5">
                    <div
                        class="w-12 h-12 shrink-0 rounded-xl bg-[#FBF9EB] border border-[#4A7C74]/10 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform text-[#4A7C74]"
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
                        on:click={() => (analyzingDoc = doc)}
                        class="p-2 hover:bg-indigo-50 text-muted-foreground hover:text-indigo-600 rounded-full transition-colors"
                        title="Analyze with Jargon Slayer"
                    >
                        <Sparkles size={18} />
                    </button>
                    <button
                        on:click={() => editDoc(doc)}
                        class="p-2 hover:bg-secondary/10 text-muted-foreground hover:text-[#4A7C74] rounded-full transition-colors"
                        title="Edit Details"
                    >
                        <Pencil size={18} />
                    </button>
                    <button
                        on:click={() => removeDoc(doc.id)}
                        class="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-full transition-colors"
                        title="Remove"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        {/each}
        {#if docs.length === 0}
            <GhostRow type="Document" onClick={startWizard} />
            <GhostRow type="Document" onClick={startWizard} />
            <GhostRow type="Document" onClick={startWizard} />
            <div class="flex justify-center mt-4">
                <button
                    on:click={startWizard}
                    class="text-sm font-bold text-[#4A7C74] hover:bg-[#4A7C74]/5 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                    <Sparkles size={14} /> Start Vault Assistant
                </button>
            </div>
        {/if}
    </div>

    <!-- Jargon Slayer Modal -->
    {#if analyzingDoc}
        <JargonSlayer
            docName={analyzingDoc.name}
            docType={analyzingDoc.type}
            on:close={() => (analyzingDoc = null)}
        />
    {/if}
</div>
