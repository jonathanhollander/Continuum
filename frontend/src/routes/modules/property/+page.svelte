<script lang="ts">
    import {
        propertyStore,
        type PropertyItem,
    } from "$lib/stores/propertyStore.svelte";
    import { activityLog } from "$lib/stores/activityLog.svelte";
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
        ShieldCheck,
        QrCode,
        Loader2,
    } from "lucide-svelte";
    import EvidenceGalleryUploader from "$lib/components/ui/EvidenceGalleryUploader.svelte";
    import UniversalUploader from "$lib/components/ui/UniversalUploader.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte"; // NEW IMPORT
    import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte";
    import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";
    import { userPreferencesStore, type ViewMode } from "$lib/stores/userPreferencesStore.svelte";
    import Affirmation from "$lib/components/Affirmation.svelte";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";

    // Concierge Imports
    import ConciergeFlow from "$lib/components/concierge/ConciergeFlow.svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import { t, language } from "$lib/stores/localization";
    import { getSmartSamples } from "$lib/data/smartSamples";
    import { fly } from "svelte/transition"; // Ensure fly is imported
    import { onMount } from "svelte";

    let showAddModal = $state(false);
    let isLoading = $state(true);
    let viewMode = $state<ViewMode>('card');
    let showAffirmation = $state(false);

    onMount(async () => {
        await propertyStore.sync?.();
        isLoading = false;
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
            question: "wizard.start",
            type: "boolean" as const,
            logic: { yes: "real", no: "cancel", next: "real" },
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

    function handleWizardComplete(event: CustomEvent) {
        const answers = event.detail;
        if (answers.intro === false) {
            showWizard = false;
            return;
        }

        if (answers.real) addWizardItem("Primary Residence", "Real Estate");
        if (answers.vehicle) addWizardItem("Daily Driver", "Vehicle");
        if (answers.personal)
            addWizardItem("Jewelry / Watch Collection", "Valuable");

        showWizard = false;
    }

    function addWizardItem(name: string, type: any) {
        const created = propertyStore.addItem({
            name: name,
            type: type,
            location: "TBD",
            valuation: 0,
            status: "Owned",
            ownershipDetails: "",
            documents: "",
            notes: "Added via Concierge Wizard",
            evidence: [],
            thumbnail: "",
        });

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
            const matchesSearch =
                i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                i.location.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterType === "All" || i.type === filterType;
            return matchesSearch && matchesFilter;
        }),
    );

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

    function handleAddItem() {
        if (!newItem.name || !newItem.location) return;

        const itemData = {
            ...newItem,
            custom_attributes: JSON.stringify(parsedCustomAttributes),
        };

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

            propertyStore.updateItem(newItem.id, itemData);

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
            const created = propertyStore.addItem(
                itemData as Omit<PropertyItem, "id">,
            );

            activityLog.logEvent({
                module: "Property",
                action: "CREATE",
                entityType: "Asset",
                entityId: created.id,
                entityName: created.name,
                userContext: $estateProfile.ownerName || "User",
            });
        }

        showAffirmation = true;
        resetForm();
    }

    function editItem(item: PropertyItem) {
        newItem = { ...item };
        try {
            parsedCustomAttributes = JSON.parse(item.custom_attributes || "{}");
        } catch {
            parsedCustomAttributes = {};
        }
        isEditing = true;
        showAddModal = true;
    }

    function deleteItem(id: string, name: string) {
        if (
            confirm(
                `Remove "${name}" from your property list? You can add it back anytime.`,
            )
        ) {
            propertyStore.deleteItem(id);

            activityLog.logEvent({
                module: "Property",
                action: "DELETE",
                entityType: "Asset",
                entityId: id,
                entityName: name,
                userContext: $estateProfile.ownerName || "User",
            });
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
            assetId: item.id,
            assetName: item.name,
            assetType: "Property",
            location: item.location,
        });

        activityLog.logEvent({
            module: "Property",
            action: "CREATE",
            entityType: "QR Label",
            entityId: item.id,
            entityName: item.name,
            userContext: $estateProfile.ownerName || "User",
        });

        alert("QR Label generated! Redirecting to QR Access Center...");
        goto("/modules/qr-codes");
    }
</script>

<LivingBlueprintHeader
    title="Property & Real Estate"
    subtitle="Your home, your vehicles, the possessions that matter"
    tier="preparation"
    detailedDescription="These are the physical things you've built, bought, and cared for. Documenting them now means your family won't have to search for deeds, titles, or proof of ownership during an already difficult time."
    whyMatters="Without clear records of what you own and where the documents are, your family could face legal complications, miss valuable assets, or struggle to prove ownership when they need access most."
>
    <div class="flex flex-wrap items-center gap-3">
        <DataViewToggle module="property" onchange={(mode) => viewMode = mode} />
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
        <div
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

    <!-- Affirmation Message -->
    <Affirmation module="property" bind:show={showAffirmation} />

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

    <!-- AI Prompt Bar -->
    <div class="max-w-3xl mx-auto mb-8">
        <AIPromptBar context="property" />
    </div>

    <!-- Asset Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        <div
            class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
        >
            <div class="flex items-start justify-between mb-4">
                <div
                    class="p-3 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform"
                >
                    <ShieldCheck size={24} />
                </div>
                <div
                    class="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded-lg font-bold"
                >
                    SECURE
                </div>
            </div>
            <p
                class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1"
            >
                Document Match
            </p>
            <p class="text-3xl font-black text-slate-900 tracking-tight">85%</p>
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
                placeholder="Search by asset name or location..."
                class="w-full px-4 py-3 pl-12 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
            />
        </div>
        <div class="flex items-center gap-2">
            <span
                class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                >Inventory: {filteredItems.length} Assets</span
            >
            <button
                class="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-primary transition-colors shadow-sm"
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
            <div
                class="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden group flex flex-col relative"
                transition:scale={{
                    duration: 400,
                    delay: 0,
                    opacity: 0,
                    start: 0.95,
                    easing: quintOut,
                }}
            >
                {#if item.thumbnail}
                    <div class="absolute inset-0 h-48 z-0">
                        <div
                            class="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent z-10"
                        ></div>
                        <img
                            src={item.thumbnail}
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
                                <svelte:component
                                    this={typeIcons[item.type] || LayoutGrid}
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
                                <div
                                    class="flex items-center gap-1.5 text-slate-400 font-bold text-xs uppercase tracking-tighter"
                                >
                                    <MapPin size={12} class="text-primary/60" />
                                    {item.location}
                                </div>
                            </div>
                        </div>
                        <div
                            class="flex items-center gap-1 opacity-10 md:opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 bg-white/50 backdrop-blur rounded-2xl p-1"
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
                                class="p-3 bg-slate-50 hover:bg-primary/10 text-slate-400 hover:text-primary rounded-2xl transition-all"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                onclick={() => deleteItem(item.id, item.name)}
                                class="p-3 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-8">
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
                                ${item.valuation.toLocaleString()}
                            </p>
                        </div>
                        <div
                            class="bg-slate-50 rounded-2xl p-4 border border-slate-100/50"
                        >
                            <p
                                class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1"
                            >
                                Ownership
                            </p>
                            <p
                                class="text-sm font-black text-slate-700 tracking-tight capitalize"
                            >
                                {item.status}
                            </p>
                        </div>
                    </div>

                    <div class="space-y-4 mb-8">
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
                                    {item.ownershipDetails || "Sole Ownership"}
                                </p>
                            </div>
                        </div>
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

                <div class="mt-auto p-2">
                    <div
                        class="bg-primary rounded-2xl p-6 text-primary-foreground flex items-center justify-between group/footer hover:bg-slate-900 transition-colors duration-500 cursor-pointer"
                    >
                        <div>
                            <p
                                class="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1"
                            >
                                Asset Verification
                            </p>
                            <h4 class="font-bold text-sm tracking-tight">
                                View Ownership Documents
                            </h4>
                        </div>
                        <div
                            class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover/footer:translate-x-1 transition-transform"
                        >
                            <ArrowRight size={20} />
                        </div>
                    </div>
                </div>
            </div>
        {:else}
            <!-- GHOST ROW IMPLEMENTATION -->
            {#if filteredItems.length === 0 && searchQuery === ""}
                <div class="col-span-full space-y-4">
                    <div
                        class="border border-blue-200 bg-blue-50/50 rounded-xl p-4 mb-4 flex items-center gap-3 text-blue-800"
                    >
                        <Info size={20} />
                        <p class="text-sm font-medium">
                            Concierge Mode: Showing examples based on your
                            region.
                        </p>
                    </div>

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
                            <svelte:fragment slot="icon">
                                <Building size={20} class="text-slate-400" />
                            </svelte:fragment>
                        </GhostRow>
                    {/each}

                    <div class="flex justify-center mt-6">
                        <button
                            onclick={() => (showAddModal = true)}
                            class="bg-primary text-primary-foreground px-8 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Register First Asset
                        </button>
                    </div>
                </div>
            {/if}
        {/each}
    </div>
    {:else}
        <!-- Table View -->
        {#if filteredItems.length === 0 && searchQuery === ""}
            <div class="border border-blue-200 bg-blue-50/50 rounded-xl p-4 mb-4 flex items-center gap-3 text-blue-800">
                <Info size={20} />
                <p class="text-sm font-medium">Concierge Mode: Showing examples based on your region.</p>
            </div>
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
                    <svelte:fragment slot="icon">
                        <Building size={20} class="text-slate-400" />
                    </svelte:fragment>
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
                            <tr class="hover:bg-slate-50 transition-colors group">
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-lg flex items-center justify-center {typeColors[item.type]}">
                                            <Icon size={16} />
                                        </div>
                                        <span class="font-medium text-slate-800">{item.name}</span>
                                    </div>
                                </td>
                                <td class="px-4 py-3 text-sm text-slate-600">{item.type}</td>
                                <td class="px-4 py-3 text-sm text-slate-600">{item.location || '-'}</td>
                                <td class="px-4 py-3 text-sm text-slate-600 font-medium">${item.valuation?.toLocaleString() || '0'}</td>
                                <td class="px-4 py-3">
                                    <span class="text-xs font-medium text-slate-600 capitalize">{item.status || 'owned'}</span>
                                </td>
                                <td class="px-4 py-3 text-right">
                                    <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onclick={() => generateQR(item)}
                                            class="p-1.5 text-slate-400 hover:text-amber-600 transition-colors"
                                            title="Generate QR Label"
                                        >
                                            <QrCode size={14} />
                                        </button>
                                        <button
                                            onclick={() => editItem(item)}
                                            class="p-1.5 text-slate-400 hover:text-primary transition-colors"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onclick={() => deleteItem(item.id, item.name)}
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

<!-- Add/Edit Asset Modal -->
{#if showAddModal}
    <div
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
                            <label
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Asset Name</label
                            >
                            <input
                                type="text"
                                bind:value={newItem.name}
                                placeholder="e.g. Primary Residence"
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <label
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Asset Type</label
                            >
                            <select
                                bind:value={newItem.type}
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
                                >Primary Location</label
                            >
                            <input
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
                            <label
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Current Valuation ($)</label
                            >
                            <div class="relative">
                                <DollarSign
                                    size={16}
                                    class="absolute left-4 top-3.5 text-primary"
                                />
                                <input
                                    type="number"
                                    bind:value={newItem.valuation}
                                    class="w-full px-4 py-3 pl-10 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
                                />
                            </div>
                        </div>
                        <div class="space-y-1.5">
                            <label
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Current Status</label
                            >
                            <div
                                class="flex bg-white rounded-xl p-1 border border-slate-200"
                            >
                                {#each ["Owned", "Mortgaged", "Leased"] as status}
                                    <button
                                        type="button"
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
                            <label
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Purchase/Acquisition Date</label
                            >
                            <input
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
                            <label
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Title / Ownership Group</label
                            >
                            <input
                                type="text"
                                bind:value={newItem.ownershipDetails}
                                placeholder="e.g. Individual Title, Joint with Spouse"
                                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800"
                            />
                        </div>
                        <div class="space-y-1.5">
                            <label
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Critical Documents</label
                            >
                            <UniversalUploader
                                bind:value={newItem.documents}
                                label="Ownership Document"
                                mode="any"
                                module="properties"
                            />
                        </div>
                        <div class="space-y-1.5 md:col-span-2">
                            <label
                                class="block text-xs font-bold uppercase text-slate-500 tracking-wide px-1"
                                >Inventory Notes</label
                            >
                            <textarea
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
                        onsetCover={(e: any) => (newItem.thumbnail = e.detail)}
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
                    Not right now
                </button>
                <button
                    onclick={handleAddItem}
                    disabled={!newItem.name || !newItem.location}
                    class="px-6 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Save my thoughts
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    :global(.animate-in) {
        animation: fadeIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    select {
        -webkit-appearance: none;
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
