<script lang="ts">
    import { onMount } from "svelte";
    import {
        Plus,
        DollarSign,
        MapPin,
        Trash2,
        Building2,
        CreditCard,
        TrendingUp,
        Users,
        Landmark,
        MoreHorizontal,
        Home,
        Briefcase,
        Car,
        Laptop,
        Wallet,
        Info,
        HeartHandshake,
        Sparkles,
        Pencil,
    } from "lucide-svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte"; // NEW IMPORT
    import UniversalUploader from "$lib/components/ui/UniversalUploader.svelte";
    import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte"; // NEW IMPORT
    import EmptyStateGuide from "$lib/components/ui/EmptyStateGuide.svelte";
    import { language } from "$lib/stores/localization";
    import {
        encouragementMode,
        userRole,
    } from "$lib/stores/conciergeStore.svelte";
    import { estateProfile } from "$lib/stores/estateStore.svelte";
    import { activityLog } from "$lib/stores/activityLog.svelte";
    import { fly, scale, slide, fade } from "svelte/transition";
    // import { getStored, setStored } from "$lib/stores/persistence"; // REMOVED
    import { registerSync } from "$lib/services/sync.svelte"; // ADDDED
    import { getSmartSamples } from "$lib/data/smartSamples";
    import { conciergeEngine } from "$lib/stores/conciergeEngine";

    let { module } = $props<{ module: any }>();

    // Determine sync key based on module ID
    // Financial Accounts passes 'assets-main', so we map it to 'financial_assets'
    const syncKey =
        module.id === "assets-main"
            ? "financial_assets"
            : `assets_${module.id}`;
    const assetSync = registerSync<Asset>(
        syncKey,
        syncKey,
    ).setAffirmationContext("general");

    type AssetType =
        | "Property"
        | "Financial"
        | "Business"
        | "Vehicle"
        | "Digital"
        | "Other";

    interface Asset {
        id: string;
        name: string;
        type: AssetType;
        value: number;
        location: string;
        accountNumber?: string;
        ownershipPercentage?: number;
        beneficiaries: string;
        notes: string;
        valueHistory: number[];
        // Phase 28 Upgrade
        loginUrl?: string;
        beneficiaryEmail?: string;
        closureNotes?: string;
        image?: string;
        is_closed: boolean;
        closure_date?: string;
        customAttributes?: string; // Correct casing for SyncManager
    }

    let assets = $derived(assetSync.items);
    let showAddForm = $state(false);

    let newAsset = $state<Partial<Asset> & { id?: string; documents?: string }>({
        name: "",
        type: "Financial",
        value: 0,
        location: "",
        accountNumber: "",
        ownershipPercentage: 100,
        beneficiaries: "",
        notes: "",
        valueHistory: [],
        loginUrl: "",
        beneficiaryEmail: "",
        image: "",
        is_closed: false,
        closure_date: "",
        customAttributes: "{}",
        documents: "",
    });

    // Reactive object for the custom field manager (binds to this object)
    let parsedCustomAttributes = $state<Record<string, any>>({});

    // AI Intake Mirroring (True Simulation)
    $effect(() => {
        const data =
            $conciergeEngine.lastExtractedData?.asset ||
            $conciergeEngine.lastExtractedData?.financial_account ||
            $conciergeEngine.lastExtractedData;

        if (data && (data.name || data.value || data.location)) {
            // Open form if not already open
            if (!showAddForm) showAddForm = true;

            // Sync form state
            newAsset = {
                ...newAsset,
                name: data.name || newAsset.name,
                type: (data.type || newAsset.type) as AssetType,
                value: data.value || newAsset.value,
                location: data.location || newAsset.location,
                accountNumber: data.accountNumber || newAsset.accountNumber,
                beneficiaries: data.beneficiaries || newAsset.beneficiaries,
                notes: data.notes || newAsset.notes,
            };
        }
    });

    // Detect when AI commits data
    let previousDataWasPresent = false;
    $effect(() => {
        const hasData = !!$conciergeEngine.lastExtractedData;
        if (previousDataWasPresent && !hasData && showAddForm) {
            console.log("[AI Mirror] Commit detected, saving asset...");
            saveAsset();
        }
        previousDataWasPresent = hasData;
    });

    // Trigger sync on mount to fetch from API (registerSync only loads from localStorage)
    onMount(() => {
        assetSync.sync();
    });

    function generateMockHistory(currentValue: number): number[] {
        const history = [];
        let val = currentValue * 0.8;
        for (let i = 0; i < 5; i++) {
            history.push(val);
            val += (currentValue - val) * Math.random();
        }
        history.push(currentValue);
        return history;
    }

    async function saveAsset() {
        if (!newAsset.name) return;

        // Serialize Custom Attributes
        const customAttributesStr = JSON.stringify(parsedCustomAttributes);

        if (newAsset.id) {
            // Edit Mode - update via SyncManager
            const updates = {
                ...newAsset,
                value: Number(newAsset.value) || 0,
                ownershipPercentage: Number(newAsset.ownershipPercentage),
                customAttributes: customAttributesStr,
                valueHistory: Array.isArray(newAsset.valueHistory)
                    ? JSON.stringify(newAsset.valueHistory)
                    : newAsset.valueHistory || "[]",
            };

            await assetSync.update(newAsset.id, updates);

            // Log UPDATE
            activityLog.logEvent({
                module: module.name || "Asset Manager",
                action: "UPDATE",
                entityType: "Asset",
                entityId: newAsset.id,
                entityName: newAsset.name || "Unnamed Asset",
                changes: [], // Simplified for now
                userContext: $estateProfile.ownerName || "User",
            });
        } else {
            // Create Mode - create via SyncManager
            const created = await assetSync.create({
                name: newAsset.name!,
                type: (newAsset.type as AssetType) || "Other",
                value: Number(newAsset.value) || 0,
                location: newAsset.location || "",
                accountNumber: newAsset.accountNumber,
                ownershipPercentage: Number(newAsset.ownershipPercentage),
                beneficiaries: newAsset.beneficiaries || "",
                notes: newAsset.notes || "",
                loginUrl: newAsset.loginUrl || "",
                beneficiaryEmail: newAsset.beneficiaryEmail || "",
                image: newAsset.image || "",
                is_closed: newAsset.is_closed || false,
                closure_date: newAsset.closure_date || "",
                valueHistory: JSON.stringify(generateMockHistory(Number(newAsset.value) || 0)),
                customAttributes: customAttributesStr,
            });

            // Log CREATE
            activityLog.logEvent({
                module: module.name || "Asset Manager",
                action: "CREATE",
                entityType: "Asset",
                entityId: created.id,
                entityName: created.name,
                userContext: $estateProfile.ownerName || "User",
            });
        }

        // save(); // SyncManager handles persistence
        resetForm();
    }

    function editAsset(asset: Asset) {
        // Ensure all form fields have defaults to prevent bind:value={undefined} errors
        newAsset = {
            id: asset.id,
            name: asset.name || "",
            type: asset.type || "Financial",
            value: asset.value || 0,
            location: asset.location || "",
            accountNumber: asset.accountNumber || "",
            ownershipPercentage: asset.ownershipPercentage ?? 100,
            beneficiaries: asset.beneficiaries || "",
            notes: asset.notes || "",
            valueHistory: asset.valueHistory || [],
            loginUrl: asset.loginUrl || "",
            beneficiaryEmail: asset.beneficiaryEmail || "",
            image: asset.image || "",
            is_closed: asset.is_closed || false,
            closure_date: asset.closure_date || "",
            closureNotes: asset.closureNotes || "",
            customAttributes: asset.customAttributes || "{}",
            documents: "",
        };
        try {
            parsedCustomAttributes = JSON.parse(asset.customAttributes || "{}");
        } catch (e) {
            parsedCustomAttributes = {};
        }
        showAddForm = true;
    }

    function resetForm() {
        newAsset = {
            id: undefined, // Clear ID to switch back to create mode
            name: "",
            type: "Financial",
            value: 0,
            location: "",
            accountNumber: "",
            ownershipPercentage: 100,
            beneficiaries: $estateProfile.primaryBeneficiary || "",
            notes: "",
            valueHistory: [],
            loginUrl: "",
            beneficiaryEmail: "",
            image: "",
            is_closed: false,
            closure_date: "",
            customAttributes: "{}",
            documents: "",
        };
        parsedCustomAttributes = {};
        showAddForm = false;
    }

    function removeAsset(id: string) {
        if (!confirm("Remove this asset? You can add it back later if needed."))
            return;
        const asset = assets.find((a) => a.id === id);

        // SyncManager delete
        assetSync.delete(id);

        // Log DELETE
        if (asset) {
            activityLog.logEvent({
                module: module.name || "Asset Manager",
                action: "DELETE",
                entityType: "Asset",
                entityId: id,
                entityName: asset.name,
                userContext: $estateProfile.ownerName || "User",
            });
        }
    }

    function getSparklinePoints(history: number[]): string {
        if (!history || history.length < 2) return "";
        const min = Math.min(...history);
        const max = Math.max(...history);
        const range = max - min || 1;
        const width = 100;
        const height = 30;

        return history
            .map((val, i) => {
                const x = (i / (history.length - 1)) * width;
                const y = height - ((val - min) / range) * height;
                return `${x},${y}`;
            })
            .join(" ");
    }

    function getIcon(type: AssetType) {
        switch (type) {
            case "Property":
                return Home;
            case "Business":
                return Briefcase;
            case "Vehicle":
                return Car;
            case "Digital":
                return Laptop;
            case "Financial":
                return Wallet;
            default:
                return DollarSign;
        }
    }

    function getGradient(type: AssetType) {
        switch (type) {
            // Warmer, more comforting gradients for "Legacy" feel
            case "Property":
                return "from-amber-600/10 to-stone-200/20";
            case "Business":
                return "from-slate-600/10 to-gray-200/20";
            case "Financial":
                return "from-emerald-600/10 to-teal-200/20";
            default:
                return "from-gray-500/10 to-slate-200/20";
        }
    }

    async function addStarterPack() {
        const address =
            $estateProfile.legalAddress ||
            $estateProfile.legalCityState ||
            "Home Address";
        const starterItems = [
            {
                name: "Primary Residence",
                type: "Property",
                value: 0,
                location: address,
                notes: "Deed location pending",
            },
            {
                name: "Main Checking Account",
                type: "Financial",
                value: 0,
                location: "Bank Name",
                accountNumber: "Last 4",
            },
            {
                name: "Life Insurance Policy",
                type: "Financial",
                value: 0,
                location: "Provider Name",
                notes: "Policy # needed",
            },
            {
                name: "Primary Vehicle",
                type: "Vehicle",
                value: 0,
                location: "Garage",
                notes: "Title location pending",
            },
        ];

        // Create all in parallel
        await Promise.all(
            starterItems.map((item) =>
                assetSync.create({
                    name: item.name,
                    type: item.type as AssetType,
                    value: 0,
                    location: item.location,
                    accountNumber: item.accountNumber || "",
                    ownershipPercentage: 100,
                    beneficiaries: $estateProfile.primaryBeneficiary || "",
                    notes: item.notes || "",
                    valueHistory: [],
                    loginUrl: "",
                    beneficiaryEmail: "",
                    closureNotes: "",
                }),
            ),
        );
    }

    const totalValue = $derived(
        assets.reduce(
            (sum, asset) =>
                sum + (asset.value || 0) * ((asset.ownershipPercentage || 100) / 100),
            0,
        ),
    );

    function exportToCSV() {
        const headers = [
            "Name",
            "Type",
            "Value",
            "Location",
            "Account Number",
            "Beneficiaries",
            "Notes",
        ];
        const rows = assets.map((a) => [
            `"${a.name}"`,
            a.type,
            a.value,
            `"${a.location}"`,
            `"${a.accountNumber || ""}"`,
            `"${a.beneficiaries}"`,
            `"${(a.notes || "").replace(/"/g, '""')}"`,
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "estate_assets.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
</script>

<div class="space-y-8 animate-in fade-in duration-500">
    <!-- Total Wealth Header -->
    <div
        class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6"
    >
        <div>
            <h2
                class="text-sm font-bold uppercase tracking-wider text-gray-500 mb-1"
            >
                Total Estate Value
            </h2>
            <div class="text-4xl font-serif font-bold text-[#304743]">
                {#if $userRole !== "Family"}
                    ${totalValue.toLocaleString()}
                {:else}
                    $•••,•••,•••
                {/if}
            </div>
        </div>
        <div class="flex gap-3">
            <button
                onclick={exportToCSV}
                class="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
                <TrendingUp size={16} /> Export CSV
            </button>
        </div>
    </div>
    <!-- Role-Based Context Banner -->
    {#if $userRole === "Executor"}
        <div
            in:slide
            class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r shadow-sm flex items-start gap-3"
        >
            <Info class="text-blue-600 shrink-0 mt-0.5" size={20} />
            <div>
                <h4 class="font-bold text-blue-900 text-sm">
                    Executor View Active
                </h4>
                <p class="text-blue-700 text-xs mt-1">
                    You have full access to view and manage assets. Ensure all
                    valuations are up to date for probate filing.
                </p>
            </div>
        </div>
    {/if}

    <!-- Header Stats (With Role Hiding) -->
    <!-- (Add Asset Form) -->
    {#if $userRole !== "Family"}
        <!-- Only Owner and Executor can add assets -->
        <!-- Only Owner and Executor can add assets -->
        {#if showAddForm}
            <div
                class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
                transition:slide
            >
                <div
                    class="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                    onclick={resetForm}
                ></div>

                <div
                    class="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative"
                    in:scale={{ start: 0.95, duration: 300 }}
                >
                    <!-- Modal Header -->
                    <div class="p-10 pb-0 flex items-center justify-between">
                        <div>
                            <nav
                                class="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#4A7C74] mb-3"
                            >
                                <Wallet size={12} />
                                <span>Asset Inventory</span>
                            </nav>
                            <h2
                                class="text-4xl font-black text-slate-900 tracking-tighter"
                            >
                                {newAsset.id ? "Update" : "Add"}
                                <span class="text-[#4A7C74]">Asset</span>
                            </h2>
                        </div>
                        <button
                            onclick={resetForm}
                            class="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:rotate-90 transition-all duration-500"
                        >
                            <Trash2
                                size={24}
                                strokeWidth={3}
                                class="rotate-45"
                            />
                        </button>
                    </div>

                    <div class="flex-1 overflow-y-auto p-10 space-y-12">
                        <!-- Group 1: Identity -->
                        <section>
                            <h3
                                class="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3"
                            >
                                <span
                                    class="w-6 h-[2px] bg-[#4A7C74] rounded-full"
                                ></span>
                                Asset Details
                            </h3>
                            <div
                                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                            >
                                <div class="space-y-3">
                                    <label
                                        class="text-[11px] font-black text-slate-800 uppercase tracking-wider pl-1"
                                        >Asset Name</label
                                    >
                                    <input
                                        type="text"
                                        bind:value={newAsset.name}
                                        placeholder="e.g. Chase Checking, Tesla Model Y"
                                        class="w-full bg-slate-50 border-2 border-transparent focus:border-[#4A7C74] focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all {$conciergeEngine
                                            .lastExtractedData?.name
                                            ? 'amber-glow border-amber-500/50'
                                            : ''}"
                                    />
                                </div>
                                <div class="space-y-3">
                                    <label
                                        class="text-[11px] font-black text-slate-800 uppercase tracking-wider pl-1"
                                        >Asset Type</label
                                    >
                                    <select
                                        bind:value={newAsset.type}
                                        class="w-full bg-slate-50 border-2 border-transparent focus:border-[#4A7C74] focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="Financial"
                                            >Financial</option
                                        >
                                        <option value="Property"
                                            >Property</option
                                        >
                                        <option value="Vehicle">Vehicle</option>
                                        <option value="Business"
                                            >Business</option
                                        >
                                        <option value="Digital">Digital</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div class="space-y-3">
                                    <label
                                        class="text-[11px] font-black text-slate-800 uppercase tracking-wider pl-1 font-mono"
                                        >Est. Value ($)</label
                                    >
                                    <div class="relative">
                                        <DollarSign
                                            size={16}
                                            class="absolute left-4 top-4.5 text-[#4A7C74]"
                                        />
                                        <input
                                            type="number"
                                            bind:value={newAsset.value}
                                            class="w-full bg-white border-2 border-transparent focus:border-[#4A7C74] rounded-2xl p-4 pl-10 text-sm font-black outline-none transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div
                                class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8"
                            >
                                <div class="space-y-3">
                                    <label
                                        class="text-[11px] font-black text-slate-800 uppercase tracking-wider pl-1"
                                        >Location / Institution</label
                                    >
                                    <input
                                        bind:value={newAsset.location}
                                        placeholder="e.g. 123 Main St, Wallet"
                                        class="w-full bg-slate-50 border-2 border-transparent focus:border-[#4A7C74] focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                                    />
                                </div>
                                {#if newAsset.type === "Financial" || newAsset.type === "Digital"}
                                    <div class="space-y-3">
                                        <label
                                            class="text-[11px] font-black text-slate-800 uppercase tracking-wider pl-1"
                                            >Login URL</label
                                        >
                                        <input
                                            type="text"
                                            bind:value={newAsset.loginUrl}
                                            placeholder="https://..."
                                            class="w-full bg-slate-50 border-2 border-transparent focus:border-[#4A7C74] focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                                        />
                                    </div>
                                {/if}
                            </div>

                            <div class="mt-8 pt-8 border-t border-slate-100">
                                <CustomFieldsManager
                                    entityType="asset"
                                    bind:data={parsedCustomAttributes}
                                />
                            </div>
                        </section>

                        <!-- Group 2: Documentation -->
                        <section
                            class="bg-[#4A7C74]/5 rounded-[2.5rem] p-8 border border-[#4A7C74]/10"
                        >
                            <h3
                                class="text-xs font-black text-[#4A7C74] uppercase tracking-[0.2em] mb-6 flex items-center gap-3"
                            >
                                <span
                                    class="w-6 h-[2px] bg-[#4A7C74] rounded-full"
                                ></span>
                                Verification
                            </h3>

                            <div class="space-y-6">
                                <div
                                    class="bg-white/50 rounded-2xl p-6 border border-[#4A7C74]/10"
                                >
                                    <UniversalUploader
                                        label="Upload Statement or Document"
                                        mode="any"
                                        module="financial"
                                        category="financial"
                                        bind:value={newAsset.documents}
                                    />
                                </div>

                                <div
                                    class="grid grid-cols-1 md:grid-cols-2 gap-8"
                                >
                                    <div class="space-y-3">
                                        <label
                                            class="text-[11px] font-black text-slate-800 uppercase tracking-wider pl-1"
                                            >Beneficiary Name</label
                                        >
                                        <input
                                            type="text"
                                            bind:value={newAsset.beneficiaries}
                                            placeholder="Who inherits this?"
                                            class="w-full bg-white border-2 border-transparent focus:border-[#4A7C74] rounded-2xl p-4 text-sm font-bold outline-none transition-all shadow-sm"
                                        />
                                    </div>
                                    <div class="space-y-3">
                                        <label
                                            class="text-[11px] font-black text-slate-800 uppercase tracking-wider pl-1"
                                            >Beneficiary Email</label
                                        >
                                        <input
                                            type="text"
                                            bind:value={
                                                newAsset.beneficiaryEmail
                                            }
                                            placeholder="Contact for beneficiary..."
                                            class="w-full bg-white border-2 border-transparent focus:border-[#4A7C74] rounded-2xl p-4 text-sm font-bold outline-none transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <!-- Group 3: Notes -->
                        <section>
                            <h3
                                class="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3"
                            >
                                <span
                                    class="w-6 h-[2px] bg-slate-300 rounded-full"
                                ></span>
                                Transfer Instructions
                            </h3>
                            <textarea
                                bind:value={newAsset.closureNotes}
                                placeholder="Instructions for the Executor on how to find/close/transfer this..."
                                class="w-full bg-slate-50 border-2 border-transparent focus:border-[#4A7C74] focus:bg-white rounded-2xl p-6 text-sm font-medium outline-none transition-all min-h-[120px] resize-none leading-relaxed"
                            ></textarea>
                        </section>
                    </div>

                    <!-- Footer Actions -->
                    <div
                        class="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4"
                    >
                        <button
                            onclick={resetForm}
                            class="px-8 py-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onclick={saveAsset}
                            class="px-10 py-4 rounded-2xl bg-[#4A7C74] hover:bg-[#3b635d] text-white font-black shadow-xl shadow-[#4A7C74]/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                        >
                            <Sparkles size={18} />
                            {newAsset.id ? "Update Asset" : "Add to Inventory"}
                        </button>
                    </div>
                </div>
            </div>
        {/if}
    {/if}

    <!-- Asset Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <!-- ... (Each asset block remains same) ... -->
        {#each assets as asset (asset.id)}
            {@const Icon = getIcon(asset.type)}
            <div
                transition:scale={{ duration: 300 }}
                class="group bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-transparent hover:border-[#4A7C74]/20 relative overflow-hidden"
            >
                <div
                    class="absolute top-2 right-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <button
                        onclick={() => editAsset(asset)}
                        class="p-2 bg-white/80 rounded-full text-blue-400 hover:text-blue-600 hover:bg-blue-50"
                        title="Edit Asset"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        onclick={() => removeAsset(asset.id)}
                        class="p-2 bg-white/80 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete Asset"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>

                <!-- Background Gradient Decoration -->
                <div
                    class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br {getGradient(
                        asset.type,
                    )} opacity-50 blur-2xl rounded-bl-full pointer-events-none group-hover:opacity-100 transition-opacity"
                ></div>

                <div class="flex justify-between items-start relative z-10">
                    <div
                        class="p-3 rounded-xl bg-secondary/30 text-[#4A7C74] group-hover:scale-110 transition-transform duration-300"
                    >
                        <Icon size={24} />
                    </div>
                    <div class="text-right">
                        {#if $userRole !== "Family"}
                            <div class="font-bold text-lg text-foreground">
                                ${(asset.value || 0).toLocaleString()}
                            </div>
                        {:else}
                            <div
                                class="font-bold text-lg text-muted-foreground blur-sm select-none"
                                title="Visible only to Owner type"
                            >
                                $•••,•••
                            </div>
                        {/if}

                        <!-- Trend indicator (mock) -->
                        <div
                            class="flex items-center justify-end gap-1 text-xs text-emerald-600 font-medium"
                        >
                            <TrendingUp size={12} />
                            <span>+2.4%</span>
                        </div>
                    </div>
                </div>

                <div class="mt-4 relative z-10">
                    <h3 class="font-bold text-lg leading-tight">
                        {asset.name}
                    </h3>
                    <p class="text-sm text-muted-foreground mt-1">
                        {asset.location || "Location not specified"}
                    </p>
                </div>

                <!-- Custom Fields Display -->
                {#if asset.customAttributes && asset.customAttributes !== "{}"}
                    {@const customEntries = Object.entries(
                        JSON.parse(asset.customAttributes),
                    ).filter(([_, v]) => v !== undefined && v !== "")}
                    {#if customEntries.length > 0}
                        <div
                            class="mt-4 pt-4 border-t border-slate-50 space-y-2 relative z-10"
                        >
                            {#each customEntries as [key, value]}
                                <div class="flex justify-between text-[11px]">
                                    <span
                                        class="text-slate-400 font-black uppercase tracking-widest"
                                        >{key}</span
                                    >
                                    <span class="text-slate-600 font-bold"
                                        >{value === true
                                            ? "Yes"
                                            : value === false
                                              ? "No"
                                              : value}</span
                                    >
                                </div>
                            {/each}
                        </div>
                    {/if}
                {/if}

                <!-- Mini Sparkline visualization -->
                <div class="mt-4 h-8 w-full opacity-25">
                    <svg
                        viewBox="0 0 100 30"
                        class="w-full h-full stroke-[#4A7C74] fill-none stroke-2"
                        preserveAspectRatio="none"
                    >
                        <polyline
                            points={getSparklinePoints(asset.valueHistory)}
                        />
                    </svg>
                </div>
            </div>
        {/each}

        <!-- Smart Default Empty State -->
        <!-- Smart Default Empty State -->
        {#if assets.length === 0}
            <div
                class="col-span-full border border-amber-200 bg-amber-50/50 rounded-xl p-4 mb-4 flex items-center gap-3 text-amber-800"
            >
                <Sparkles size={20} />
                <p class="text-sm font-medium">
                    Concierge Mode: Showing examples based on your region.
                </p>
            </div>

            {#each getSmartSamples($language)[module.id === "assets-main" ? "financial" : "property"] || [] as sample}
                {@const sampleValue =
                    (sample as any).valuation ?? (sample as any).value ?? 0}
                <GhostRow
                    name={sample.name}
                    subtitle={sample.type}
                    value={sampleValue}
                    type="Asset"
                    onclick={() => {
                        newAsset = {
                            ...newAsset,
                            name: sample.name,
                            type: sample.type as AssetType,
                            value: sampleValue,
                        };
                        showAddForm = true;
                    }}
                >
                    {#snippet icon()}
                        {@const Icon = getIcon(sample.type as AssetType)}
                        <Icon size={20} class="text-slate-400" />
                    {/snippet}
                </GhostRow>
            {/each}

            <div class="col-span-full flex justify-center mt-4">
                {#if $userRole !== "Family"}
                    <button
                        onclick={addStarterPack}
                        class="text-sm font-bold text-[#4A7C74] hover:bg-[#4A7C74]/5 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Sparkles size={14} /> Or use the Starter Pack
                    </button>
                    <!-- Fallback manual trigger -->
                    <button
                        onclick={() => (showAddForm = true)}
                        class="text-sm font-bold text-stone-400 hover:text-[#4A7C74] px-4 py-2"
                    >
                        Add Item Manually
                    </button>
                {/if}
            </div>
        {/if}
    </div>
</div>
