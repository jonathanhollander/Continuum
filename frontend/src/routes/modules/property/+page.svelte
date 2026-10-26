<script lang="ts">
    import { focusTrap } from "$lib/actions/focusTrap";
    import { readCustom } from "$lib/utils/customFields";
    import {
        propertyStore,
        propertySync,
        type PropertyItem,
    } from "$lib/stores/propertyStore.svelte";
    import { activityLog } from "$lib/stores/activityLog.svelte";
    import { notifications } from "$lib/stores/notificationStore";
    import { estateProfile } from "$lib/stores/estateStore.svelte";
    import { fade, slide, scale } from "svelte/transition";
    import { quintOut, cubicOut } from "svelte/easing";
    import { qrStore } from "$lib/stores/qrStore";
    import { goto } from "$app/navigation";
    import {
        Home,
        Car,
        Gem,
        Plus,
        Trash2,
        Edit2,
        MapPin,
        Search,
        X,
        DollarSign,
        ChevronRight,
        ArrowRight,
        Download,
        LayoutGrid,
        Building,
        FileText,
        Briefcase,
        Info,
        QrCode,
        Loader2,
    } from "lucide-svelte";
    import EvidenceGalleryUploader from "$lib/components/ui/EvidenceGalleryUploader.svelte";
    import { blobUrlFor, cachedBlobUrl } from "$lib/components/ui/MediaView.svelte";
    import { deleteMedia, downloadMedia, mediaIdFromRef, updateMediaMetadata } from "$lib/services/mediaService";
    import UniversalUploader from "$lib/components/ui/UniversalUploader.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte"; // NEW IMPORT
    import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte";
    import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";
    import { userPreferencesStore, type ViewMode } from "$lib/stores/userPreferencesStore.svelte";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";

    // Concierge Imports
    import ConciergeFlow from "$lib/components/concierge/ConciergeFlow.svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import { t, language } from "$lib/stores/localization";
    import { getSmartSamples } from "$lib/data/smartSamples";
    import { fly } from "svelte/transition"; // Ensure fly is imported
    import { onMount, tick } from "svelte";
    import { portal } from "$lib/actions/portal";
    import { plural } from "$lib/utils/plural";

    let showAddModal = $state(false);
    let isLoading = $state(true);
    let viewMode = $derived<ViewMode>(userPreferencesStore.getViewMode('property'));

    // A scanned QR label opens /modules/property?id=N: that asset's card is brought into view and marked.
    let focusId = $state<string | null>(null);

    onMount(async () => {
        await propertyStore.sync?.();
        isLoading = false;

        const id = new URLSearchParams(window.location.search).get("id");
        if (id && propertyStore.items.some((p) => String(p.id) === id)) {
            focusId = id;
            await tick();
            document.getElementById(`property-item-${id}`)?.scrollIntoView({ block: "center" });
        }
    });
    let isEditing = $state(false);
    let searchQuery = $state("");
    let filterType = $state<string>("All");
    let showWizard = $state(false);
    let parsedCustomAttributes = $state<Record<string, any>>({});

    let newItem = $state<Partial<PropertyItem>>({
        name: "",
        type: "Real Estate",
        location: "",
        valuation: 0,
        status: "Owned",
        ownershipDetails: "",
        documents: "",
        notes: "",
        evidence: [],
        thumbnail: "",
    });

    const wizardSteps = [
        {
            id: "intro",
            question: "wizard.property_intro",
            type: "boolean" as const,
            logic: { yes: "real", no: "EXIT" },
        },
        {
            id: "real",
            question: "wizard.property_real",
            type: "boolean" as const,
            logic: { next: "vehicle" },
        },
        {
            id: "vehicle",
            question: "wizard.property_vehicle",
            type: "boolean" as const,
            logic: { next: "personal" },
        },
        {
            id: "personal",
            question: "wizard.property_personal",
            type: "boolean" as const,
        },
    ];

    function handleWizardComplete(answers: Record<string, any>) {
        if (answers.intro === false) {
            showWizard = false;
            return;
        }

        const wanted: [string, any][] = [];
        if (answers.real) wanted.push(["Primary Residence", "Real Estate"]);
        if (answers.vehicle) wanted.push(["Daily Driver", "Vehicle"]);
        if (answers.personal) wanted.push(["Jewelry / Watch Collection", "Valuable"]);

        showWizard = false;
        if (wanted.length > 0) saveWizardItems(wanted);
    }

    // One wizard run is one save: the creates run quietly, then one affirmation when all land,
    // or one gentle message whose Try Again re-sends only the items still waiting.
    async function saveWizardItems(wanted: [string, any][]) {
        const results = await Promise.allSettled(
            wanted.map(([name, type]) => addWizardItem(name, type)),
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
            },
            () => saveWizardItems(waiting),
        );
    }

    async function addWizardItem(name: string, type: any) {
        const created = await propertySync.create({
            id: crypto.randomUUID(),
            name: name,
            type: type,
            location: "",
            valuation: 0,
            status: "Owned",
            ownershipDetails: "",
            documents: "",
            notes: "",
            evidence: [],
            thumbnail: "",
        }, false, true);

        activityLog.logEvent({
            module: "Property",
            action: "CREATE",
            entityType: "Asset",
            entityId: created.id,
            entityName: created.name,
            userContext: "Concierge",
        });
    }

    let items = $derived(propertyStore.items); // Updated to access property directly
    let filteredItems = $derived(
        items.filter((i) => {
            const q = searchQuery.toLowerCase();
            const matchesSearch =
                String(i.name ?? "").toLowerCase().includes(q) ||
                String(i.location ?? "").toLowerCase().includes(q);
            const matchesFilter = filterType === "All" || i.type === filterType;
            return matchesSearch && matchesFilter;
        }),
    );

    // Download: save every evidence file of each asset shown (cached copies are reused).
    let shownEvidence = $derived(filteredItems.flatMap((i) => i.evidence ?? []));
    let downloadingEvidence = $state(false);
    async function downloadShownEvidence() {
        if (downloadingEvidence) return;
        downloadingEvidence = true;
        try {
            for (const e of shownEvidence) {
                await downloadMedia(e.id, e.filename, cachedBlobUrl(e.id)).catch((err) =>
                    console.warn("[property] evidence download paused", e.id, err),
                );
            }
        } finally {
            downloadingEvidence = false;
        }
    }

    function showAllAssets() {
        filterType = "All";
        searchQuery = "";
    }

    // A value is shown once one is recorded; a blank or zero valuation is left out.
    function hasValue(v: unknown): boolean {
        return Number(v) > 0;
    }

    let totalValuation = $derived(propertyStore.getTotalValuation());
    let typeCounts = $derived(
        items.reduce(
            (acc: Record<string, number>, item: PropertyItem) => {
                acc[item.type] = (acc[item.type] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>,
        ),
    );

    const types = [
        "All",
        "Real Estate",
        "Vehicle",
        "Personal Property",
        "Valuable",
        "Other",
    ];

    function resetForm() {
        // Files added in this form but never saved on the record, except those a Try Again still holds.
        removeMediaQuietly(
            formMediaIds().filter((id) => !savedMediaIds.includes(id) && !retryMediaIds.has(id)),
        );
        savedMediaIds = [];
        draftSeq += 1;
        newItem = {
            name: "",
            type: "Real Estate",
            location: "",
            valuation: 0,
            status: "Owned",
            ownershipDetails: "",
            documents: "",
            notes: "",
            evidence: [],
            thumbnail: "",
        };
        parsedCustomAttributes = {};
        showAddModal = false;
        isEditing = false;
    }

    // Media ids the record being edited already holds; anything else in the form is new this time.
    let savedMediaIds: number[] = [];

    // Each fresh form is a new draft. A failed new save keeps its own copy of the draft for
    // Try Again, and its uploads stay until that copy is saved.
    let draftSeq = 0;
    const savedDrafts = new Set<number>();
    const retryMediaIds = new Set<number>();

    function formMediaIds(): number[] {
        return (newItem.evidence ?? []).map((e) => e.id);
    }

    function removeMediaQuietly(ids: number[]) {
        for (const id of ids) {
            deleteMedia(id).catch((e) => console.warn("[property] evidence removal paused", id, e));
        }
    }

    // Card covers, as object URLs from the shared authorised cache.
    // Each cover is asked for once its card is within 200 px of the screen.
    let coverUrls = $state<Record<string, string>>({});
    function loadCover(ref: string | undefined) {
        const id = mediaIdFromRef(ref);
        if (id === null || coverUrls[id] !== undefined) return;
        coverUrls[id] = "";
        blobUrlFor(id).then(
            (u) => (coverUrls[id] = u),
            (e) => console.warn("[property] cover open paused", id, e),
        );
    }
    function coverInView(node: HTMLElement, ref: string | undefined) {
        let current = ref;
        let near = false;
        const io = new IntersectionObserver(
            (entries) => {
                near = entries.some((e) => e.isIntersecting);
                if (near) loadCover(current);
            },
            { rootMargin: "200px 0px" },
        );
        io.observe(node);
        return {
            update(next: string | undefined) {
                current = next;
                if (near) loadCover(current);
            },
            destroy: () => io.disconnect(),
        };
    }

    // One save at a time: while it is open the button waits, so a second click sends nothing.
    let saving = $state(false);
    async function handleAddItem() {
        if (saving) return;
        saving = true;
        try {
            await handleAddItemOnce();
        } finally {
            saving = false;
        }
    }

    // With no cover chosen, the first photo among the evidence is the cover.
    function firstImageId(): number | null {
        const img = (newItem.evidence ?? []).find((e) => e.mime?.startsWith("image/"));
        return img ? img.id : null;
    }

    async function handleAddItemOnce() {
        if (!newItem.name || !newItem.location) return;

        const keptIds = formMediaIds();
        const cover = mediaIdFromRef(newItem.thumbnail);
        const itemData = {
            ...newItem,
            // The cover is one of this record's evidence images, or none.
            thumbnail:
                cover !== null && keptIds.includes(cover)
                    ? String(cover)
                    : firstImageId() !== null
                      ? String(firstImageId())
                      : "",
            custom_attributes: JSON.stringify(parsedCustomAttributes),
        };

        try {
        if (isEditing && newItem.id) {
            const oldItem = propertyStore.getItem(newItem.id);
            const changes = [];

            if (oldItem) {
                if (oldItem.name !== newItem.name)
                    changes.push({
                        field: "name",
                        oldValue: oldItem.name,
                        newValue: newItem.name,
                    });
                if (oldItem.valuation !== newItem.valuation)
                    changes.push({
                        field: "valuation",
                        oldValue: oldItem.valuation,
                        newValue: newItem.valuation,
                    });
                if (oldItem.status !== newItem.status)
                    changes.push({
                        field: "status",
                        oldValue: oldItem.status,
                        newValue: newItem.status,
                    });
            }

            await propertyStore.updateItem(newItem.id, itemData);

            activityLog.logEvent({
                module: "Property",
                action: "UPDATE",
                entityType: "Asset",
                entityId: newItem.id,
                entityName: newItem.name,
                changes,
                userContext: $estateProfile.ownerName || "User",
            });
        } else {
            await saveNewItem($state.snapshot(itemData) as Omit<PropertyItem, "id">, keptIds, draftSeq);
            return;
        }

        // The record now holds this list; files taken out of it go.
        removeMediaQuietly(savedMediaIds.filter((id) => !keptIds.includes(id)));
        savedMediaIds = keptIds;
        resetForm();
        } catch {
            // The manager already showed the one gentle message; the form stays open with the draft.
        }
    }

    // Saves one new-property draft as captured at save time; Try Again re-sends the same copy.
    async function saveNewItem(itemData: Omit<PropertyItem, "id">, keptIds: number[], seq: number) {
        if (savedDrafts.has(seq)) return;
        for (const id of keptIds) retryMediaIds.add(id);
        const created = await propertyStore.addItem(itemData, () => saveNewItem(itemData, keptIds, seq));
        savedDrafts.add(seq);
        for (const id of keptIds) retryMediaIds.delete(id);
        for (const id of keptIds) {
            updateMediaMetadata(id, undefined, String(created.id)).catch(() => undefined);
        }

        activityLog.logEvent({
            module: "Property",
            action: "CREATE",
            entityType: "Asset",
            entityId: created.id,
            entityName: created.name,
            userContext: $estateProfile.ownerName || "User",
        });

        // The form still holds this draft: it is saved now, so the form closes.
        if (draftSeq === seq) {
            savedMediaIds = keptIds;
            resetForm();
        }
    }

    function editItem(item: PropertyItem) {
        newItem = { ...item, evidence: [...(item.evidence ?? [])] };
        savedMediaIds = (item.evidence ?? []).map((e) => e.id);
        parsedCustomAttributes = readCustom(item);
        isEditing = true;
        draftSeq += 1;
        showAddModal = true;
    }

    // Remove asks in the page first: the card (or table row) shows the question and two answers.
    let removingId = $state<string | null>(null);

    async function deleteItem(id: string, name: string) {
        removingId = null;
        try {
            await propertyStore.deleteItem(id);
        } catch {
            return;
        }
        if (propertyStore.items.some((i) => String(i.id) === String(id))) return;

        activityLog.logEvent({
            module: "Property",
            action: "DELETE",
            entityType: "Asset",
            entityId: id,
            entityName: name,
            userContext: $estateProfile.ownerName || "User",
        });
    }

    // Status as a label: first letter capitalised; nothing shown when empty.
    function statusLabel(status: string | undefined): string {
        const s = (status ?? "").trim();
        return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
    }

    // The modal's "Ownership Document" field, opened from the card.
    let openingDocument = $state<string | null>(null);
    async function openOwnershipDocument(item: PropertyItem) {
        const ref = mediaIdFromRef(item.documents);
        if (ref === null || openingDocument) return;
        openingDocument = String(item.id);
        try {
            await downloadMedia(ref, undefined, cachedBlobUrl(ref));
        } catch (e) {
            console.warn("[property] ownership document open paused", ref, e);
        } finally {
            openingDocument = null;
        }
    }

    const typeIcons = {
        "Real Estate": Building,
        Vehicle: Car,
        "Personal Property": Briefcase,
        Valuable: Gem,
        Other: LayoutGrid,
    };

    const typeColors = {
        "Real Estate": "text-primary bg-primary/10 border-primary/20",
        Vehicle: "text-primary bg-primary/10 border-primary/20",
        "Personal Property": "text-slate-600 bg-slate-50 border-slate-100",
        Valuable: "text-primary bg-primary/10 border-primary/20",
        Other: "text-purple-600 bg-purple-50 border-purple-100",
    };

    function generateQR(item: PropertyItem) {
        qrStore.generateAssetQR({
            id: crypto.randomUUID(),
            // A string, as the heirloom labels are, so one asset never gets two labels.
            assetId: String(item.id),
            assetName: item.name,
            assetType: "Property",
            location: item.location,
        });

        activityLog.logEvent({
            module: "Property",
            action: "CREATE",
            entityType: "QR Label",
            entityId: String(item.id),
            entityName: item.name,
            userContext: $estateProfile.ownerName || "User",
        });

        notifications.showSuccess("Your label is ready in the QR Access Center.", "QR Label generated");
        goto("/modules/qr-codes");
    }
</script>

<LivingBlueprintHeader
    title="Property & Real Estate"
    subtitle="Your home, your vehicles, the possessions that matter"
    detailedDescription="These are the physical things you've built, bought, and cared for. Documenting them now means your family can find deeds, titles, and proof of ownership with ease."
    whyMatters="Clear records of what you own, and where the documents are, give your family a steady path to ownership and access."
>
    <div class="flex flex-wrap items-center gap-3">
        <DataViewToggle module="property" />
        <button
            onclick={() => (showWizard = true)}
            class="flex items-center gap-2 px-5 py-3 border border-primary/20 text-primary font-bold rounded-2xl hover:bg-primary/5 transition-colors"
        >
            <Info size={18} />
            {$t("wizard.start")}
        </button>
        <button
            onclick={() => (showAddModal = true)}
            class="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-2xl transition-all shadow-xl shadow-primary/10 font-bold"
        >
            <Plus size={20} />
            Share a property detail
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


    <!-- Filter Controls -->
    <div class="flex flex-wrap items-center gap-3">
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
    </div>

    <!-- Search & Filters -->
    <div
        class="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm"
    >
        <div class="relative w-full md:w-96">
            <Search class="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
                type="text"
                bind:value={searchQuery}
                aria-label="Search by asset name or location"
                placeholder="Search by asset name or location..."
                class="w-full px-4 py-3 pl-12 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
            />
        </div>
        <div class="flex items-center gap-2">
            <span
                class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                >Inventory: {plural(filteredItems.length, "Asset")}</span
            >
            <button
                class="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-primary transition-colors shadow-sm disabled:opacity-40 disabled:hover:text-slate-500"
                aria-label="Download"
                disabled={shownEvidence.length === 0 || downloadingEvidence}
                onclick={downloadShownEvidence}
            >
                <Download size={18} />
            </button>
        </div>
    </div>

    <!-- Property Views -->
    {#if viewMode === 'card'}
    <!-- Property Cards Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8">
        {#each filteredItems as item (item.id)}
            {@const Icon = typeIcons[item.type] || LayoutGrid}
            <div
                id="property-item-{item.id}"
                data-focused={focusId === String(item.id)}
                class="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden group flex flex-col relative {focusId === String(item.id) ? 'ring-2 ring-primary' : ''}"
                use:coverInView={item.thumbnail}
                transition:scale={{
                    duration: 400,
                    delay: 0,
                    opacity: 0,
                    start: 0.95,
                    easing: quintOut,
                }}
            >
                {#if item.thumbnail && coverUrls[item.thumbnail]}
                    <div class="absolute inset-0 h-48 z-0">
                        <div
                            class="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent z-10"
                        ></div>
                        <img
                            src={coverUrls[item.thumbnail]}
                            alt={item.name}
                            class="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity"
                        />
                    </div>
                {/if}

                <div class="p-8 pb-0 relative z-10">
                    <div class="flex items-start justify-between mb-8">
                        <div class="flex items-center gap-4">
                            <div
                                class="w-14 h-14 rounded-2xl shadow-inner flex items-center justify-center transition-all duration-500 {item.thumbnail
                                    ? 'bg-white/80 backdrop-blur'
                                    : typeColors[item.type]}"
                            >
                                <Icon
                                    size={28}
                                    strokeWidth={2.5}
                                    class={item.thumbnail
                                        ? "text-slate-900"
                                        : ""}
                                />
                            </div>
                            <div>
                                <h3
                                    class="text-xl font-black text-slate-900 leading-tight group-hover:text-primary transition-colors"
                                >
                                    {item.name}
                                </h3>
                                {#if item.location}
                                <div
                                    class="flex items-center gap-1.5 text-slate-400 font-bold text-xs uppercase tracking-tighter"
                                >
                                    <MapPin size={12} class="text-primary/60" />
                                    {item.location}
                                </div>
                                {/if}
                            </div>
                        </div>
                        <div
                            class="flex items-center gap-1 bg-white/50 backdrop-blur rounded-2xl p-1"
                        >
                            <button
                                onclick={() => generateQR(item)}
                                class="p-3 bg-slate-50 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-2xl transition-all"
                                title="Generate QR Label"
                            >
                                <QrCode size={18} />
                            </button>
                            <button
                                onclick={() => editItem(item)}
                                aria-label="Edit these details"
                                class="p-3 bg-slate-50 hover:bg-primary/10 text-slate-400 hover:text-primary rounded-2xl transition-all"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                onclick={() => (removingId = String(item.id))}
                                aria-label="Remove this item"
                                class="p-3 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    {#if removingId === String(item.id)}
                        <div class="p-4 mb-8 bg-rose-50 rounded-2xl border border-rose-100 space-y-3" role="group" aria-label="Remove {item.name}" transition:slide>
                            <p class="text-sm text-rose-800">Remove "{item.name}" from your property list? You can add it back anytime.</p>
                            <div class="flex gap-2">
                                <button
                                    type="button"
                                    onclick={() => (removingId = null)}
                                    class="flex-1 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                                >
                                    Maybe later
                                </button>
                                <button
                                    type="button"
                                    onclick={() => deleteItem(item.id, item.name)}
                                    class="flex-1 py-2 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-all"
                                >
                                    Remove this item
                                </button>
                            </div>
                        </div>
                    {/if}

                    {#if hasValue(item.valuation) || statusLabel(item.status)}
                    <div class="grid grid-cols-2 gap-4 mb-8">
                        {#if hasValue(item.valuation)}
                        <div
                            class="bg-slate-50 rounded-2xl p-4 border border-slate-100/50"
                        >
                            <p
                                class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1"
                            >
                                Est. Value
                            </p>
                            <p
                                class="text-lg font-black text-slate-900 tracking-tight"
                            >
                                ${Number(item.valuation).toLocaleString()}
                            </p>
                        </div>
                        {/if}
                        {#if statusLabel(item.status)}
                        <div
                            class="bg-slate-50 rounded-2xl p-4 border border-slate-100/50"
                        >
                            <p
                                class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1"
                            >
                                Current Status
                            </p>
                            <p
                                class="text-sm font-black text-slate-700 tracking-tight"
                            >
                                {statusLabel(item.status)}
                            </p>
                        </div>
                        {/if}
                    </div>
                    {/if}

                    <div class="space-y-4 mb-8">
                        {#if item.ownershipDetails}
                        <div class="flex items-start gap-4">
                            <div
                                class="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0"
                            >
                                <FileText size={14} />
                            </div>
                            <div>
                                <p
                                    class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                                >
                                    Ownership Details
                                </p>
                                <p
                                    class="text-sm font-bold text-slate-700 leading-snug"
                                >
                                    {item.ownershipDetails}
                                </p>
                            </div>
                        </div>
                        {/if}
                        {#if item.notes}
                            <div class="flex items-start gap-4">
                                <div
                                    class="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0"
                                >
                                    <Info size={14} />
                                </div>
                                <div>
                                    <p
                                        class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                                    >
                                        Key Notes
                                    </p>
                                    <p
                                        class="text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed"
                                    >
                                        {item.notes}
                                    </p>
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>

                <div class="mt-auto p-2 space-y-2">
                    {#if mediaIdFromRef(item.documents) !== null}
                        <button
                            type="button"
                            onclick={() => openOwnershipDocument(item)}
                            aria-busy={openingDocument === String(item.id)}
                            class="w-full text-left bg-slate-100 rounded-2xl p-6 text-slate-900 flex items-center justify-between group/doc hover:bg-slate-200 transition-colors duration-300"
                        >
                            <span>
                                <span
                                    class="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1"
                                >
                                    Important Documents
                                </span>
                                <span class="block font-bold text-sm tracking-tight">
                                    Ownership Document
                                </span>
                            </span>
                            <span
                                class="w-10 h-10 rounded-full bg-slate-900/10 flex items-center justify-center group-hover/doc:translate-x-1 transition-transform"
                            >
                                <Download size={20} />
                            </span>
                        </button>
                    {/if}
                    {#if (item.evidence ?? []).length > 0}
                        <button
                            type="button"
                            onclick={() => editItem(item)}
                            class="w-full text-left bg-slate-100 rounded-2xl p-6 text-slate-900 flex items-center justify-between group/footer hover:bg-slate-200 transition-colors duration-300"
                        >
                            <span>
                                <span
                                    class="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1"
                                >
                                    Asset Verification
                                </span>
                                <span class="block font-bold text-sm tracking-tight">
                                    View Ownership Documents
                                </span>
                            </span>
                            <span
                                class="w-10 h-10 rounded-full bg-slate-900/10 flex items-center justify-center group-hover/footer:translate-x-1 transition-transform"
                            >
                                <ArrowRight size={20} />
                            </span>
                        </button>
                    {/if}
                </div>
            </div>
        {:else}
            <!-- First run: the examples. With assets saved, a search or filter that shows none
                 offers the way back to all of them. -->
            {#if items.length > 0}
                <div class="col-span-full flex justify-center py-12">
                    <button
                        type="button"
                        onclick={showAllAssets}
                        class="px-6 py-3 rounded-2xl font-bold border border-primary/20 text-primary hover:bg-primary/5 transition-colors"
                    >
                        Show all assets
                    </button>
                </div>
            {:else}
                <div class="col-span-full space-y-4">
                    {#each getSmartSamples($language).property || [] as sample}
                        <GhostRow
                            name={sample.name}
                            subtitle={sample.type}
                            value={sample.valuation}
                            type="Property"
                            onClick={() => {
                                newItem = {
                                    ...newItem,
                                    name: sample.name,
                                    type: sample.type as any,
                                    valuation: sample.valuation || 0,
                                };
                                showAddModal = true;
                            }}
                        >
                            {#snippet icon()}
                                <Building size={20} class="text-slate-400" />
                            {/snippet}
                        </GhostRow>
                    {/each}

                    <div class="flex justify-center mt-6">
                        <button
                            onclick={() => (showAddModal = true)}
                            class="bg-primary text-primary-foreground px-8 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Share your first asset
                        </button>
                    </div>
                </div>
            {/if}
        {/each}
    </div>
    {:else}
        <!-- Table View -->
        {#if items.length > 0 && filteredItems.length === 0}
            <div class="flex justify-center py-12">
                <button
                    type="button"
                    onclick={showAllAssets}
                    class="px-6 py-3 rounded-2xl font-bold border border-primary/20 text-primary hover:bg-primary/5 transition-colors"
                >
                    Show all assets
                </button>
            </div>
        {:else if items.length === 0}
            {#each getSmartSamples($language).property || [] as sample}
                <GhostRow
                    name={sample.name}
                    subtitle={sample.type}
                    value={sample.valuation}
                    type="Property"
                    onClick={() => {
                        newItem = {
                            ...newItem,
                            name: sample.name,
                            type: sample.type as any,
                            valuation: sample.valuation || 0,
                        };
                        showAddModal = true;
                    }}
                >
                    {#snippet icon()}
                        <Building size={20} class="text-slate-400" />
                    {/snippet}
                </GhostRow>
            {/each}
        {:else}
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table class="w-full">
                    <thead class="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Asset</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Type</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Location</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Value</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Status</th>
                            <th class="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        {#each filteredItems as item (item.id)}
                            {@const Icon = typeIcons[item.type] || LayoutGrid}
                            <tr
                                id="property-item-{item.id}"
                                data-focused={focusId === String(item.id)}
                                class="hover:bg-slate-50 transition-colors group {focusId === String(item.id) ? 'ring-2 ring-primary ring-inset' : ''}"
                            >
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-lg flex items-center justify-center {typeColors[item.type]}">
                                            <Icon size={16} />
                                        </div>
                                        <span class="font-medium text-slate-800">{item.name}</span>
                                    </div>
                                </td>
                                <td class="px-4 py-3 text-sm text-slate-600">{item.type}</td>
                                <td class="px-4 py-3 text-sm text-slate-600">{item.location || ''}</td>
                                <td class="px-4 py-3 text-sm text-slate-600 font-medium">{hasValue(item.valuation) ? `$${Number(item.valuation).toLocaleString()}` : ""}</td>
                                <td class="px-4 py-3">
                                    <span class="text-xs font-medium text-slate-600">{statusLabel(item.status)}</span>
                                </td>
                                <td class="px-4 py-3 text-right">
                                    <div class="flex items-center justify-end gap-2">
                                        <button
                                            onclick={() => generateQR(item)}
                                            class="p-1.5 text-slate-400 hover:text-amber-600 transition-colors"
                                            title="Generate QR Label"
                                        >
                                            <QrCode size={14} />
                                        </button>
                                        <button
                                            onclick={() => editItem(item)}
                                            aria-label="Edit these details"
                                            class="p-1.5 text-slate-400 hover:text-primary transition-colors"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button aria-label="Remove this item"
                                            onclick={() => (removingId = String(item.id))}
                                            class="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            {#if removingId === String(item.id)}
                                <tr class="bg-rose-50">
                                    <td colspan="6" class="px-4 py-3">
                                        <div class="flex items-center justify-between gap-4" role="group" aria-label="Remove {item.name}">
                                            <p class="text-sm text-rose-800">Remove "{item.name}" from your property list? You can add it back anytime.</p>
                                            <div class="flex gap-2 shrink-0">
                                                <button
                                                    type="button"
                                                    onclick={() => (removingId = null)}
                                                    class="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                                                >
                                                    Maybe later
                                                </button>
                                                <button
                                                    type="button"
                                                    onclick={() => deleteItem(item.id, item.name)}
                                                    class="px-4 py-2 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-all"
                                                >
                                                    Remove this item
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            {/if}
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    {/if}

    <!-- Asset Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
            class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
        >
            <div class="flex items-start justify-between mb-4">
                <div
                    class="p-3 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform"
                >
                    <DollarSign size={24} />
                </div>
                <div
                    class="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded-lg font-bold"
                >
                    TOTAL
                </div>
            </div>
            <p
                class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1"
            >
                Total Asset Value
            </p>
            <p class="text-3xl font-black text-slate-900 tracking-tight">
                ${totalValuation.toLocaleString()}
            </p>
        </div>

        <div
            class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
        >
            <div class="flex items-start justify-between mb-4">
                <div
                    class="p-3 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform"
                >
                    <Building size={24} />
                </div>
                <div
                    class="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded-lg font-bold"
                >
                    COUNT
                </div>
            </div>
            <p
                class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1"
            >
                Real Estate Items
            </p>
            <p class="text-3xl font-black text-slate-900 tracking-tight">
                {typeCounts["Real Estate"] || 0}
            </p>
        </div>

        <div
            class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
        >
            <div class="flex items-start justify-between mb-4">
                <div
                    class="p-3 bg-amber-50 rounded-2xl text-amber-600 group-hover:scale-110 transition-transform"
                >
                    <Gem size={24} />
                </div>
                <div
                    class="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-bold"
                >
                    HIGH-VALUE
                </div>
            </div>
            <p
                class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1"
            >
                Valuables Recorded
            </p>
            <p class="text-3xl font-black text-slate-900 tracking-tight">
                {typeCounts["Valuable"] || 0}
            </p>
        </div>
    </div>

    <!-- AI Prompt Bar -->
    <div class="max-w-3xl mx-auto mt-8">
        <AIPromptBar context="property" />
    </div>
</div>
{/if}

<!-- Add/Edit Asset Modal -->
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
            <!-- Header -->
            <div class="flex items-start justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
                <div class="flex-1 pr-4">
                    <h2 class="font-serif font-bold text-xl text-slate-800">
                        {isEditing ? "Update" : "Record"} Asset Detail
                    </h2>
                    <p class="text-slate-500 text-sm mt-2 leading-relaxed">
                        Document your property details to help your family understand what you own and where to find important documents.
                    </p>
                </div>
                <button
                    onclick={resetForm}
                    class="p-2 -mr-2 -mt-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
                    aria-label="Close"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-6 space-y-6">
                <!-- Group 1: General Info -->
                <section class="space-y-4">
                    <h3
                        class="text-xs font-bold uppercase text-slate-500 tracking-wide"
                    >
                        Asset Description
                    </h3>
                    <div
                        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        <div class="space-y-1.5">
                            <label for="property-name"
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Asset Name</label
                            >
                            <input id="property-name"
                                type="text"
                                bind:value={newItem.name}
                                placeholder="e.g. Primary Residence"
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <label for="property-type"
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Asset Type</label
                            >
                            <select id="property-type"
                                bind:value={newItem.type}
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800 appearance-none cursor-pointer"
                            >
                                {#each types.filter((t) => t !== "All") as type}
                                    <option value={type}>{type}</option>
                                {/each}
                            </select>
                        </div>
                        <div class="space-y-1.5">
                            <label for="property-location"
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Primary Location</label
                            >
                            <input id="property-location"
                                type="text"
                                bind:value={newItem.location}
                                placeholder="City, State / Full Address"
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
                            />
                        </div>
                    </div>
                </section>

                <!-- Group 2: Financials & Status -->
                <section
                    class="bg-primary/5 rounded-2xl p-6 border border-primary/10 space-y-4"
                >
                    <h3
                        class="text-xs font-bold uppercase text-primary tracking-wide"
                    >
                        Ownership & Value
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="space-y-1.5">
                            <label for="property-valuation"
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Current Valuation ($)</label
                            >
                            <div class="relative">
                                <DollarSign
                                    size={16}
                                    class="absolute left-4 top-3.5 text-primary"
                                />
                                <input id="property-valuation"
                                    type="number"
                                    bind:value={newItem.valuation}
                                    class="w-full px-4 py-3 pl-10 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
                                />
                            </div>
                        </div>
                        <div class="space-y-1.5">
                            <span id="property-status-label"
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Current Status</span
                            >
                            <div
                                role="group"
                                aria-labelledby="property-status-label"
                                class="flex bg-white rounded-xl p-1 border border-slate-200"
                            >
                                {#each ["Owned", "Mortgaged", "Leased"] as status}
                                    <button
                                        type="button"
                                        aria-pressed={newItem.status === status}
                                        onclick={() =>
                                            (newItem.status = status as any)}
                                        class="flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all {newItem.status ===
                                        status
                                            ? 'bg-primary text-white shadow-lg'
                                            : 'text-slate-500 hover:bg-slate-50'}"
                                    >
                                        {status}
                                    </button>
                                {/each}
                            </div>
                        </div>
                        <div class="space-y-1.5">
                            <label for="property-purchase-date"
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Purchase/Acquisition Date</label
                            >
                            <input id="property-purchase-date"
                                type="date"
                                bind:value={newItem.purchaseDate}
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800 cursor-pointer"
                            />
                        </div>
                    </div>
                </section>

                <!-- Group 3: Legacy Details -->
                <section class="space-y-4">
                    <h3
                        class="text-xs font-bold uppercase text-slate-500 tracking-wide"
                    >
                        Ownership & Documents
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-1.5">
                            <label for="property-ownership-details"
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Title / Ownership Group</label
                            >
                            <input id="property-ownership-details"
                                type="text"
                                bind:value={newItem.ownershipDetails}
                                placeholder="e.g. Individual Title, Joint with Spouse"
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <p
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Important Documents</p
                            >
                            <UniversalUploader
                                bind:value={newItem.documents}
                                label="Ownership Document"
                                mode="any"
                                module="properties"
                            />
                        </div>
                        <div class="space-y-1.5 md:col-span-2">
                            <label for="property-notes"
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Inventory Notes</label
                            >
                            <textarea id="property-notes"
                                bind:value={newItem.notes}
                                rows="4"
                                placeholder="Additional details, disposal instructions, or historical significance..."
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800 resize-none"
                            ></textarea>
                        </div>
                    </div>
                </section>

                <!-- Group 4: Visual Evidence -->
                <section class="space-y-4">
                    <h3
                        class="text-xs font-bold uppercase text-slate-500 tracking-wide"
                    >
                        Insurance Evidence
                    </h3>

                    <EvidenceGalleryUploader
                        bind:evidence={newItem.evidence}
                        referenceId={newItem.id ? String(newItem.id) : undefined}
                        onsetCover={(id: number) => (newItem.thumbnail = String(id))}
                    />
                </section>

                <!-- Custom Fields -->
                <section class="pt-4 mt-4 border-t border-slate-100">
                    <CustomFieldsManager
                        entityType="property"
                        bind:data={parsedCustomAttributes}
                    />
                </section>
            </div>

            <!-- Footer -->
            <div
                class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3"
            >
                <button
                    onclick={resetForm}
                    class="px-6 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                    Maybe later
                </button>
                <button
                    onclick={handleAddItem}
                    disabled={!newItem.name || !newItem.location || saving}
                    aria-busy={saving}
                    class="px-6 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? "Saving..." : "Save my thoughts"}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    select {
        -webkit-appearance: none;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 1.25rem center;
        padding-right: 3rem;
    }

    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
</style>
