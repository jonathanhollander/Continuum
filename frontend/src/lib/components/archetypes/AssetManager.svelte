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
    import EmptyStateGuide from "$lib/components/ui/EmptyStateGuide.svelte";
    import { language } from "$lib/stores/localization";
    import { encouragementMode, userRole } from "$lib/stores/concierge";
    import { estateProfile } from "$lib/stores/estateStore";
    import { activityLog } from "$lib/stores/activityLog";
    import { fly, scale, slide, fade } from "svelte/transition";
    import { getStored, setStored } from "$lib/stores/persistence";
    import { getSmartSamples } from "$lib/data/smartSamples";
    import { conciergeEngine } from "$lib/stores/conciergeEngine";

    let { module } = $props<{ module: any }>();

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
    }

    let assets = $state<Asset[]>([]);
    let showAddForm = $state(false);

    let newAsset = $state<Partial<Asset> & { id?: string }>({
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
        closureNotes: "",
    });

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

    const storageKey = `assets_${module.id}`;

    onMount(() => {
        assets = getStored(storageKey, []);
    });

    function save() {
        setStored(storageKey, assets);
    }

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

    function saveAsset() {
        if (!newAsset.name) return;

        if (newAsset.id) {
            // Edit Mode
            const oldAsset = assets.find((a) => a.id === newAsset.id);
            const changes = [];

            if (oldAsset) {
                if (oldAsset.name !== newAsset.name)
                    changes.push({
                        field: "name",
                        oldValue: oldAsset.name,
                        newValue: newAsset.name,
                    });
                if (oldAsset.value !== newAsset.value)
                    changes.push({
                        field: "value",
                        oldValue: oldAsset.value,
                        newValue: newAsset.value,
                    });
                if (oldAsset.beneficiaries !== newAsset.beneficiaries)
                    changes.push({
                        field: "beneficiaries",
                        oldValue: oldAsset.beneficiaries,
                        newValue: newAsset.beneficiaries,
                    });
                if (oldAsset.location !== newAsset.location)
                    changes.push({
                        field: "location",
                        oldValue: oldAsset.location,
                        newValue: newAsset.location,
                    });
            }

            assets = assets.map((a) =>
                a.id === newAsset.id
                    ? ({
                          ...newAsset,
                          value: Number(newAsset.value) || 0,
                          ownershipPercentage: Number(
                              newAsset.ownershipPercentage,
                          ),
                          valueHistory: a.valueHistory,
                      } as Asset)
                    : a,
            );

            // Log UPDATE
            activityLog.logEvent({
                module: module.name || "Asset Manager",
                action: "UPDATE",
                entityType: "Asset",
                entityId: newAsset.id,
                entityName: newAsset.name || "Unnamed Asset",
                changes,
                userContext: $estateProfile.ownerName || "User",
            });
        } else {
            // Create Mode
            const newId = crypto.randomUUID();
            assets = [
                ...assets,
                {
                    id: newId,
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
                    closureNotes: newAsset.closureNotes || "",
                    valueHistory: generateMockHistory(
                        Number(newAsset.value) || 0,
                    ),
                },
            ];

            // Log CREATE
            activityLog.logEvent({
                module: module.name || "Asset Manager",
                action: "CREATE",
                entityType: "Asset",
                entityId: newId,
                entityName: newAsset.name!,
                userContext: $estateProfile.ownerName || "User",
            });
        }

        save();
        resetForm();
    }

    function editAsset(asset: Asset) {
        newAsset = { ...asset };
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
            closureNotes: "",
        };
        showAddForm = false;
    }

    function removeAsset(id: string) {
        if (!confirm("Are you sure you want to delete this asset?")) return;
        const asset = assets.find((a) => a.id === id);

        assets = assets.filter((a) => a.id !== id);
        save();

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

    function addStarterPack() {
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

        const newAssets = starterItems.map((item) => ({
            id: crypto.randomUUID(),
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
        }));

        assets = [...assets, ...newAssets];
        save();
    }

    const totalValue = $derived(
        assets.reduce(
            (sum, asset) =>
                sum + asset.value * ((asset.ownershipPercentage || 100) / 100),
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
            <a
                href="https://unclaimed.org/"
                target="_blank"
                class="px-4 py-2 rounded-lg border border-dashed border-[#4A7C74] text-[#4A7C74] text-sm font-bold hover:bg-[#4A7C74]/5 transition-colors flex items-center gap-2"
            >
                <MapPin size={16} /> Treasure Hunt
            </a>
            <button
                on:click={exportToCSV}
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
        {#if showAddForm}
            <div
                transition:slide
                class="bg-white rounded-xl shadow-lg border border-[#4A7C74]/20 p-6 relative overflow-hidden"
            >
                <div
                    class="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"
                >
                    <Sparkles size={120} />
                </div>

                <div
                    class="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10"
                >
                    <div class="space-y-2">
                        <label
                            class="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                            >Asset Name</label
                        >
                        <input
                            type="text"
                            bind:value={newAsset.name}
                            placeholder="e.g. Chase Checking, Tesla Model Y"
                            class="w-full p-2 rounded-lg border transition-all {$conciergeEngine
                                .lastExtractedData?.name ||
                            $conciergeEngine.lastExtractedData?.asset?.name ||
                            $conciergeEngine.lastExtractedData
                                ?.financial_account?.name
                                ? 'amber-glow border-amber-500/50'
                                : 'bg-secondary/20 focus:ring-2 focus:ring-[#4A7C74] focus:border-[#4A7C74] outline-none'}"
                        />
                    </div>
                    <div class="space-y-2">
                        <label
                            class="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                            >Type</label
                        >
                        <select
                            bind:value={newAsset.type}
                            class="w-full p-2 rounded-lg border bg-secondary/20 focus:ring-2 focus:ring-[#4A7C74] outline-none transition-all"
                        >
                            <option value="Financial">Financial</option>
                            <option value="Property">Property</option>
                            <option value="Vehicle">Vehicle</option>
                            <option value="Business">Business</option>
                            <option value="Digital">Digital</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="space-y-2">
                        <label
                            class="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                            >Estimated Value</label
                        >
                        <div class="relative">
                            <span
                                class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                >$</span
                            >
                            <input
                                type="number"
                                bind:value={newAsset.value}
                                class="w-full p-2 pl-7 rounded-lg border bg-secondary/20 focus:ring-2 focus:ring-[#4A7C74] outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label
                            class="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                            >Location / Institution</label
                        >
                        <input
                            bind:value={newAsset.location}
                            placeholder="e.g. 123 Main St, Wallet"
                            class="w-full p-2 rounded-lg border bg-secondary/20 focus:ring-2 focus:ring-[#4A7C74] outline-none transition-all"
                        />
                    </div>

                    {#if newAsset.type === "Financial" || newAsset.type === "Digital"}
                        <div class="space-y-2">
                            <label
                                class="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                                >Login URL</label
                            >
                            <input
                                type="text"
                                bind:value={newAsset.loginUrl}
                                placeholder="https://..."
                                class="w-full p-2 rounded-lg border bg-secondary/20 focus:ring-2 focus:ring-[#4A7C74] outline-none transition-all"
                            />
                        </div>
                    {/if}

                    <div class="space-y-2">
                        <label
                            class="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                            >Beneficiary Name</label
                        >
                        <input
                            type="text"
                            bind:value={newAsset.beneficiaries}
                            placeholder="Who inherits this?"
                            class="w-full p-2 rounded-lg border bg-secondary/20 focus:ring-2 focus:ring-[#4A7C74] outline-none transition-all"
                        />
                    </div>

                    <div class="space-y-2">
                        <label
                            class="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                            >Beneficiary Email</label
                        >
                        <input
                            type="text"
                            bind:value={newAsset.beneficiaryEmail}
                            placeholder="Contact for beneficiary..."
                            class="w-full p-2 rounded-lg border bg-secondary/20 focus:ring-2 focus:ring-[#4A7C74] outline-none transition-all"
                        />
                    </div>

                    <div class="col-span-full space-y-2">
                        <label
                            class="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                            >Closure / Transfer Notes</label
                        >
                        <textarea
                            bind:value={newAsset.closureNotes}
                            placeholder="Instructions for the Executor on how to find/close/transfer this..."
                            class="w-full p-2 rounded-lg border bg-secondary/20 focus:ring-2 focus:ring-[#4A7C74] outline-none transition-all h-20 resize-none"
                        ></textarea>
                    </div>
                </div>

                <div class="flex justify-end gap-3 mt-6 relative z-10">
                    <button
                        on:click={resetForm}
                        class="px-4 py-2 rounded-lg hover:bg-muted transition-colors text-sm font-semibold"
                    >
                        Cancel
                    </button>
                    <button
                        on:click={saveAsset}
                        class="px-6 py-2 rounded-lg bg-[#4A7C74] hover:bg-[#3b635d] text-white font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                    >
                        {#if newAsset.id}
                            <Sparkles size={16} /> Update Asset
                        {:else}
                            <Plus size={16} /> Add Asset
                        {/if}
                    </button>
                </div>
            </div>
        {/if}
    {/if}

    <!-- Asset Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <!-- ... (Each asset block remains same) ... -->
        {#each assets as asset (asset.id)}
            <div
                transition:scale={{ duration: 300 }}
                class="group bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-transparent hover:border-[#4A7C74]/20 relative overflow-hidden"
            >
                <div
                    class="absolute top-2 right-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <button
                        on:click={() => editAsset(asset)}
                        class="p-2 bg-white/80 rounded-full text-blue-400 hover:text-blue-600 hover:bg-blue-50"
                        title="Edit Asset"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        on:click={() => removeAsset(asset.id)}
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
                        <svelte:component
                            this={getIcon(asset.type)}
                            size={24}
                        />
                    </div>
                    <div class="text-right">
                        {#if $userRole !== "Family"}
                            <div class="font-bold text-lg text-foreground">
                                ${asset.value.toLocaleString()}
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
                    onClick={() => {
                        newAsset = {
                            ...newAsset,
                            name: sample.name,
                            type: sample.type as AssetType,
                            value: sampleValue,
                        };
                        showAddForm = true;
                    }}
                >
                    <svelte:fragment slot="icon">
                        <svelte:component
                            this={getIcon(sample.type as AssetType)}
                            size={20}
                            class="text-slate-400"
                        />
                    </svelte:fragment>
                </GhostRow>
            {/each}

            <div class="col-span-full flex justify-center mt-4">
                {#if $userRole !== "Family"}
                    <button
                        on:click={addStarterPack}
                        class="text-sm font-bold text-[#4A7C74] hover:bg-[#4A7C74]/5 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Sparkles size={14} /> Or use the Starter Pack
                    </button>
                    <!-- Fallback manual trigger -->
                    <button
                        on:click={() => (showAddForm = true)}
                        class="text-sm font-bold text-stone-400 hover:text-[#4A7C74] px-4 py-2"
                    >
                        Add Item Manually
                    </button>
                {/if}
            </div>
        {/if}
    </div>
</div>
