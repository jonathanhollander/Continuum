<script lang="ts">
    import {
        propertyStore,
        type PropertyItem,
    } from "$lib/stores/propertyStore";
    import { activityLog } from "$lib/stores/activityLog";
    import { estateProfile } from "$lib/stores/estateStore";
    import { fade, slide, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { qrStore } from "$lib/stores/qrStore";
    import { goto } from "$app/navigation";
    import {
        Home,
        Car,
        Gem,
        Plus,
        Trash2,
        Pencil,
        MapPin,
        Search,
        X,
        DollarSign,
        Calendar,
        ChevronRight,
        ArrowRight,
        Filter,
        Download,
        LayoutGrid,
        Building,
        Key,
        FileText,
        Briefcase,
        Info,
        ShieldCheck,
        QrCode,
    } from "lucide-svelte";
    import EvidenceGalleryUploader from "$lib/components/ui/EvidenceGalleryUploader.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte"; // NEW IMPORT

    // Concierge Imports
    import ConciergeFlow from "$lib/components/concierge/ConciergeFlow.svelte";
    import { t, language } from "$lib/stores/localization";
    import { getSmartSamples } from "$lib/data/smartSamples";
    import { fly } from "svelte/transition"; // Ensure fly is imported

    let showAddModal = false;
    let isEditing = false;
    let searchQuery = "";
    let filterType: string = "All";
    let showWizard = false;

    let newItem: Partial<PropertyItem> = {
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

    let items = $derived($propertyStore);
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
        showAddModal = false;
        isEditing = false;
    }

    function handleAddItem() {
        if (!newItem.name || !newItem.location) return;

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

            propertyStore.updateItem(newItem.id, newItem);

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
                newItem as Omit<PropertyItem, "id">,
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

        resetForm();
    }

    function editItem(item: PropertyItem) {
        newItem = { ...item };
        isEditing = true;
        showAddModal = true;
    }

    function deleteItem(id: string, name: string) {
        if (
            confirm(
                `Are you sure you want to remove "${name}" from your property list?`,
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
        "Real Estate": "text-blue-600 bg-blue-50 border-blue-100",
        Vehicle: "text-indigo-600 bg-indigo-50 border-indigo-100",
        "Personal Property": "text-slate-600 bg-slate-50 border-slate-100",
        Valuable: "text-amber-600 bg-amber-50 border-amber-100",
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

<div
    class="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700"
>
    <!-- Wizard Modal -->
    {#if showWizard}
        <div
            class="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            transition:fade
        >
            <div class="w-full max-w-2xl relative" in:fly={{ y: 20 }}>
                <button
                    class="absolute -top-12 right-0 text-white/50 hover:text-white"
                    onclick={() => (showWizard = false)}>Close</button
                >
                <ConciergeFlow
                    steps={wizardSteps}
                    oncomplete={handleWizardComplete}
                />
            </div>
        </div>
    {/if}

    <!-- Header Section -->
    <header
        class="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-2"
    >
        <div class="space-y-4">
            <nav
                class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400"
            >
                <Home size={14} />
                <span>Concierge v4.0</span>
                <ChevronRight size={12} />
                <span class="text-blue-600">Property & Real Estate</span>
            </nav>
            <div>
                <h1
                    class="text-4xl font-extrabold text-slate-900 tracking-tight mb-2"
                >
                    Property <span class="text-blue-600 font-light italic"
                        >&</span
                    > Assets
                </h1>
                <p class="text-slate-500 max-w-2xl text-lg leading-relaxed">
                    Account for physical holdings, from real estate and vehicles
                    to valuable personal collections.
                </p>
            </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
            <button
                onclick={() => (showWizard = true)}
                class="flex items-center gap-2 px-5 py-3 border border-blue-100 text-blue-700 font-bold rounded-2xl hover:bg-blue-50 transition-colors"
            >
                <Info size={18} />
                {$t("wizard.start")}
            </button>
            <div
                class="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm"
            >
                {#each types as type}
                    <button
                        onclick={() => (filterType = type)}
                        class="px-4 py-2 rounded-xl text-xs font-bold tracking-wider transition-all {filterType ===
                        type
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                            : 'text-slate-500 hover:text-blue-600 hover:bg-slate-50'}"
                    >
                        {type}
                    </button>
                {/each}
            </div>

            <button
                onclick={() => (showAddModal = true)}
                class="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl transition-all shadow-xl shadow-slate-900/10 font-bold"
            >
                <Plus size={20} />
                Add Asset
            </button>
        </div>
    </header>

    <!-- Asset Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
            class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
        >
            <div class="flex items-start justify-between mb-4">
                <div
                    class="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform"
                >
                    <DollarSign size={24} />
                </div>
                <div
                    class="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-bold"
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
            class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
        >
            <div class="flex items-start justify-between mb-4">
                <div
                    class="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform"
                >
                    <Building size={24} />
                </div>
                <div
                    class="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg font-bold"
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
            class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
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
            class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
        >
            <div class="flex items-start justify-between mb-4">
                <div
                    class="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform"
                >
                    <ShieldCheck size={24} />
                </div>
                <div
                    class="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-bold"
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
        class="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/50 backdrop-blur-sm p-4 rounded-3xl border border-slate-200 shadow-sm"
    >
        <div class="relative w-full md:w-96">
            <Search class="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
                type="text"
                bind:value={searchQuery}
                placeholder="Search by asset name or location..."
                class="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
            />
        </div>
        <div class="flex items-center gap-2">
            <span
                class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                >Inventory: {filteredItems.length} Assets</span
            >
            <button
                class="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-blue-600 transition-colors shadow-sm"
            >
                <Download size={18} />
            </button>
        </div>
    </div>

    <!-- Property Cards Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8">
        {#each filteredItems as item (item.id)}
            <div
                class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden group flex flex-col relative"
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
                                    class="text-xl font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors"
                                >
                                    {item.name}
                                </h3>
                                <div
                                    class="flex items-center gap-1.5 text-slate-400 font-bold text-xs uppercase tracking-tighter"
                                >
                                    <MapPin size={12} class="text-blue-500" />
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
                                class="p-3 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all"
                            >
                                <Pencil size={18} />
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
                        class="bg-blue-600 rounded-[2rem] p-6 text-white flex items-center justify-between group/footer hover:bg-slate-900 transition-colors duration-500 cursor-pointer"
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
                            class="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Register First Asset
                        </button>
                    </div>
                </div>
            {/if}
        {/each}
    </div>
</div>

<!-- Add/Edit Asset Modal -->
{#if showAddModal}
    <div
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        transition:fade={{ duration: 300 }}
    >
        <div
            class="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onclick={resetForm}
        ></div>

        <div
            class="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative"
            transition:slide={{ duration: 500, easing: quintOut }}
        >
            <div class="p-10 pb-0 flex items-center justify-between">
                <div>
                    <nav
                        class="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-3"
                    >
                        <Plus size={12} />
                        <span>Asset Inventory</span>
                    </nav>
                    <h2
                        class="text-4xl font-black text-slate-900 tracking-tighter"
                    >
                        {isEditing ? "Modify" : "Add"}
                        <span class="text-blue-600">Asset</span>
                    </h2>
                </div>
                <button
                    onclick={resetForm}
                    class="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:rotate-90 transition-all duration-500"
                >
                    <X size={24} strokeWidth={3} />
                </button>
            </div>

            <div class="flex-1 overflow-y-auto p-10 space-y-12">
                <!-- Group 1: General Info -->
                <section>
                    <h3
                        class="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3"
                    >
                        <span class="w-6 h-[2px] bg-blue-600 rounded-full"
                        ></span>
                        Asset Description
                    </h3>
                    <div
                        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        <div class="space-y-3">
                            <label
                                class="text-[11px] font-black text-slate-800 uppercase tracking-wider pl-1 font-sans"
                                >Asset Name</label
                            >
                            <input
                                type="text"
                                bind:value={newItem.name}
                                placeholder="e.g. Primary Residence"
                                class="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                            />
                        </div>
                        <div class="space-y-3">
                            <label
                                class="text-[11px] font-black text-slate-800 uppercase tracking-wider pl-1 font-sans"
                                >Asset Type</label
                            >
                            <select
                                bind:value={newItem.type}
                                class="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none cursor-pointer"
                            >
                                {#each types.filter((t) => t !== "All") as type}
                                    <option value={type}>{type}</option>
                                {/each}
                            </select>
                        </div>
                        <div class="space-y-3">
                            <label
                                class="text-[11px] font-black text-slate-800 uppercase tracking-wider pl-1 font-sans"
                                >Primary Location</label
                            >
                            <input
                                type="text"
                                bind:value={newItem.location}
                                placeholder="City, State / Full Address"
                                class="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                            />
                        </div>
                    </div>
                </section>

                <!-- Group 2: Financials & Status -->
                <section
                    class="bg-blue-50/50 rounded-[2.5rem] p-8 border border-blue-100/50"
                >
                    <h3
                        class="text-xs font-black text-blue-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-3"
                    >
                        <span class="w-6 h-[2px] bg-blue-600 rounded-full"
                        ></span>
                        Ownership & Value
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div class="space-y-3">
                            <label
                                class="text-[11px] font-black text-slate-800 uppercase tracking-wider pl-1 font-sans"
                                >Current Valuation ($)</label
                            >
                            <div class="relative">
                                <DollarSign
                                    size={16}
                                    class="absolute left-4 top-4.5 text-blue-600"
                                />
                                <input
                                    type="number"
                                    bind:value={newItem.valuation}
                                    class="w-full bg-white border-2 border-transparent focus:border-blue-600 rounded-2xl p-4 pl-10 text-sm font-black outline-none transition-all shadow-sm"
                                />
                            </div>
                        </div>
                        <div class="space-y-3">
                            <label
                                class="text-[11px] font-black text-slate-800 uppercase tracking-wider pl-1 font-sans"
                                >Current Status</label
                            >
                            <div
                                class="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-100"
                            >
                                {#each ["Owned", "Mortgaged", "Leased"] as status}
                                    <button
                                        type="button"
                                        onclick={() =>
                                            (newItem.status = status as any)}
                                        class="flex-1 py-3 text-[10px] font-black uppercase tracking-tighter rounded-xl transition-all {newItem.status ===
                                        status
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : 'text-slate-400 hover:bg-slate-50'}"
                                    >
                                        {status}
                                    </button>
                                {/each}
                            </div>
                        </div>
                        <div class="space-y-3">
                            <label
                                class="text-[11px] font-black text-slate-800 uppercase tracking-wider pl-1 font-sans"
                                >Purchase/Acquisition Date</label
                            >
                            <input
                                type="date"
                                bind:value={newItem.purchaseDate}
                                class="w-full bg-white border-2 border-transparent focus:border-blue-600 rounded-2xl p-4 text-sm font-bold outline-none transition-all shadow-sm cursor-pointer"
                            />
                        </div>
                    </div>
                </section>

                <!-- Group 3: Legacy Details -->
                <section>
                    <h3
                        class="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3"
                    >
                        <span class="w-6 h-[2px] bg-slate-400 rounded-full"
                        ></span>
                        Ownership & Docs
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="space-y-3">
                            <label
                                class="text-[11px] font-black text-slate-800 uppercase tracking-wider pl-1 font-sans"
                                >Title / Ownership Group</label
                            >
                            <input
                                type="text"
                                bind:value={newItem.ownershipDetails}
                                placeholder="e.g. Individual Title, Joint with Spouse"
                                class="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                            />
                        </div>
                        <div class="space-y-3">
                            <label
                                class="text-[11px] font-black text-slate-800 uppercase tracking-wider pl-1 font-sans"
                                >Critical Documents</label
                            >
                            <input
                                type="text"
                                bind:value={newItem.documents}
                                placeholder="Deed, Title, Safety Deposit Box #, etc."
                                class="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                            />
                        </div>
                        <div class="space-y-3 md:col-span-2">
                            <label
                                class="text-[11px] font-black text-slate-800 uppercase tracking-wider pl-1 font-sans"
                                >Inventory Notes</label
                            >
                            <textarea
                                bind:value={newItem.notes}
                                rows="3"
                                placeholder="Additional details, disposal instructions, or historical Significance..."
                                class="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl p-6 text-sm font-bold outline-none transition-all resize-none leading-relaxed"
                            ></textarea>
                        </div>
                    </div>
                </section>

                <!-- Group 4: Visual Evidence -->
                <section>
                    <h3
                        class="text-xs font-black text-blue-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-3"
                    >
                        <span class="w-6 h-[2px] bg-blue-600 rounded-full"
                        ></span>
                        Insurance Evidence
                    </h3>

                    <EvidenceGalleryUploader
                        bind:evidence={newItem.evidence}
                        onsetCover={(e: any) => (newItem.thumbnail = e.detail)}
                    />
                </section>
            </div>

            <!-- Modal Actions -->
            <div
                class="p-10 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-6"
            >
                <button
                    onclick={resetForm}
                    class="text-sm font-black text-slate-400 hover:text-slate-900 uppercase tracking-[0.2em] transition-colors"
                >
                    Discard Changes
                </button>
                <button
                    onclick={handleAddItem}
                    disabled={!newItem.name || !newItem.location}
                    class="bg-blue-600 text-white px-12 py-5 rounded-3xl font-black shadow-2xl shadow-blue-600/30 hover:scale-[1.03] active:scale-[0.98] transition-all disabled:opacity-30"
                >
                    Commit to Inventory
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
