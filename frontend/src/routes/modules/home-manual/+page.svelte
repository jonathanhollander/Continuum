<script lang="ts">
    import { fade, slide } from "svelte/transition";
    import {
        Hammer,
        Phone,
        Key,
        Wifi,
        Droplets,
        Zap,
        Pencil,
        Trash2,
        Plus,
        Search,
        Home,
        Thermometer,
        MapPin,
        Shield,
        X,
        Save,
        Loader2,
    } from "lucide-svelte";
    import { fly } from "svelte/transition";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import EmptyStateGuide from "$lib/components/ui/EmptyStateGuide.svelte";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";
    import { userPreferencesStore, type ViewMode } from "$lib/stores/userPreferencesStore.svelte";
    import { onMount } from "svelte";
    import { registerSync } from "$lib/services/sync.svelte";
    import { getStored } from "$lib/stores/persistence";
    import GhostRow from "$lib/components/ui/GhostRow.svelte";
    import { t, language } from "$lib/stores/localization";
    import { getSmartSamples } from "$lib/data/smartSamples";

    let viewMode = $state<ViewMode>('card');

    // MAPPERS
    // Maps local/legacy objects to backend schema
    const vendorMapper = (item: any) => {
        const payload = { ...item };
        if (item.category === undefined && item.role)
            payload.category = item.role;
        // Backend requires 'category'
        payload.category = payload.category || "Other";
        delete payload.id;
        return payload;
    };

    const accessMapper = (item: any) => {
        const payload = { ...item };
        if (item.label && !item.location) payload.location = item.label;
        if (item.code && !item.code_encrypted)
            payload.code_encrypted = item.code;
        if (item.notes && !item.instructions) payload.instructions = item.notes;

        payload.location = payload.location || "Unknown";
        payload.code_encrypted = payload.code_encrypted || "****";
        delete payload.id;
        return payload;
    };

    const utilityMapper = (item: any) => {
        const payload = { ...item };
        if (item.type && !item.service_type) payload.service_type = item.type;
        if (item.shutoffInstructions && !item.instructions)
            payload.instructions = item.shutoffInstructions;
        delete payload.id;
        return payload;
    };

    // Interfaces (Frontend View)
    interface Vendor {
        id: number | string;
        category: string;
        name: string;
        phone?: string;
        company?: string;
        notes?: string;
    }
    interface AccessCode {
        id: number | string;
        location: string;
        code_encrypted: string;
        instructions?: string;
    }
    interface Utility {
        id: number | string;
        service_type: string;
        provider: string;
        location?: string;
        shutoffInstructions?: string;
    }

    // Initialize Services
    const vendorSync = registerSync<Vendor>(
        "home_vendors",
        "vendors",
        vendorMapper,
    ).setAffirmationContext("general");
    const accessSync = registerSync<AccessCode>(
        "home_access",
        "home_access",
        accessMapper,
    ).setAffirmationContext("general");
    const utilitySync = registerSync<Utility>(
        "home_utilities",
        "utilities",
        utilityMapper,
    ).setAffirmationContext("general");

    let activeTab = $state("vendors");
    let isLoading = $state(true);

    // Modal States
    let showVendorModal = $state(false);
    let showCodeModal = $state(false);
    let showUtilityModal = $state(false);

    // Form States
    let vendorForm = $state({ category: "", name: "", phone: "" });
    let codeForm = $state({ location: "", code: "" });
    let utilityForm = $state({ service_type: "", provider: "" });

    onMount(async () => {
        await Promise.all([
            vendorSync.init(),
            accessSync.init(),
            utilitySync.init(),
        ]);
        isLoading = false;
    });

    // Handlers
    function openVendorModal() {
        vendorForm = { category: "", name: "", phone: "" };
        showVendorModal = true;
    }

    async function saveVendor() {
        if (!vendorForm.category || !vendorForm.name) return;
        await vendorSync.create({
            category: vendorForm.category,
            name: vendorForm.name,
            phone: vendorForm.phone,
        });
        showVendorModal = false;
    }

    async function deleteVendor(id: number | string) {
        if (!confirm("Remove this item? You can add it back anytime.")) return;
        await vendorSync.delete(id);
    }

    function openCodeModal() {
        codeForm = { location: "", code: "" };
        showCodeModal = true;
    }

    async function saveCode() {
        if (!codeForm.location) return;
        await accessSync.create({
            location: codeForm.location,
            code_encrypted: codeForm.code || "****",
        });
        showCodeModal = false;
    }

    async function deleteCode(id: number | string) {
        if (!confirm("Remove this item? You can add it back anytime.")) return;
        await accessSync.delete(id);
    }

    function openUtilityModal() {
        utilityForm = { service_type: "", provider: "" };
        showUtilityModal = true;
    }

    async function saveUtility() {
        if (!utilityForm.service_type) return;
        await utilitySync.create({
            service_type: utilityForm.service_type,
            provider: utilityForm.provider || "Unknown",
        });
        showUtilityModal = false;
    }

    async function deleteUtility(id: number | string) {
        if (!confirm("Remove this item? You can add it back anytime.")) return;
        await utilitySync.delete(id);
    }
</script>

{#if isLoading}
    <div class="flex items-center justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
{:else}
<!-- Vendor Modal -->
{#if showVendorModal}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
        transition:fade
    >
        <div
            class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            in:fly={{ y: 20 }}
        >
            <div class="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 class="font-serif font-bold text-xl text-[#304743]">
                    Add Trusted Vendor
                </h3>
                <button
                    onclick={() => (showVendorModal = false)}
                    class="text-slate-400 hover:text-slate-600"
                >
                    <X size={20} />
                </button>
            </div>

            <div class="p-6 space-y-4">
                <div class="space-y-2">
                    <label class="text-xs font-bold uppercase text-slate-500 tracking-wider">
                        Vendor Role
                    </label>
                    <input
                        type="text"
                        bind:value={vendorForm.category}
                        placeholder="e.g. Plumber, Electrician, HVAC"
                        class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-medium"
                    />
                </div>

                <div class="space-y-2">
                    <label class="text-xs font-bold uppercase text-slate-500 tracking-wider">
                        Name / Company
                    </label>
                    <input
                        type="text"
                        bind:value={vendorForm.name}
                        placeholder="e.g. Joe's Plumbing"
                        class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-medium"
                    />
                </div>

                <div class="space-y-2">
                    <label class="text-xs font-bold uppercase text-slate-500 tracking-wider">
                        Phone Number
                    </label>
                    <input
                        type="tel"
                        bind:value={vendorForm.phone}
                        placeholder="(555) 123-4567"
                        class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-medium"
                    />
                </div>
            </div>

            <div class="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                    onclick={() => (showVendorModal = false)}
                    class="px-4 py-2 font-bold text-slate-500 hover:text-slate-700 text-sm"
                >
                    Cancel
                </button>
                <button
                    onclick={saveVendor}
                    disabled={!vendorForm.category || !vendorForm.name}
                    class="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                    <Save size={16} /> Save Vendor
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Access Code Modal -->
{#if showCodeModal}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
        transition:fade
    >
        <div
            class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            in:fly={{ y: 20 }}
        >
            <div class="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 class="font-serif font-bold text-xl text-[#304743]">
                    Add Access Code
                </h3>
                <button
                    onclick={() => (showCodeModal = false)}
                    class="text-slate-400 hover:text-slate-600"
                >
                    <X size={20} />
                </button>
            </div>

            <div class="p-6 space-y-4">
                <div class="space-y-2">
                    <label class="text-xs font-bold uppercase text-slate-500 tracking-wider">
                        Code Label
                    </label>
                    <input
                        type="text"
                        bind:value={codeForm.location}
                        placeholder="e.g. Gate, Garage, Alarm"
                        class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-medium"
                    />
                </div>

                <div class="space-y-2">
                    <label class="text-xs font-bold uppercase text-slate-500 tracking-wider">
                        Code
                    </label>
                    <input
                        type="text"
                        bind:value={codeForm.code}
                        placeholder="e.g. 1234"
                        class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-mono text-lg tracking-widest"
                    />
                </div>
            </div>

            <div class="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                    onclick={() => (showCodeModal = false)}
                    class="px-4 py-2 font-bold text-slate-500 hover:text-slate-700 text-sm"
                >
                    Cancel
                </button>
                <button
                    onclick={saveCode}
                    disabled={!codeForm.location}
                    class="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                    <Save size={16} /> Save Code
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Utility Modal -->
{#if showUtilityModal}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
        transition:fade
    >
        <div
            class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            in:fly={{ y: 20 }}
        >
            <div class="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 class="font-serif font-bold text-xl text-[#304743]">
                    Add Utility Shutoff
                </h3>
                <button
                    onclick={() => (showUtilityModal = false)}
                    class="text-slate-400 hover:text-slate-600"
                >
                    <X size={20} />
                </button>
            </div>

            <div class="p-6 space-y-4">
                <div class="space-y-2">
                    <label class="text-xs font-bold uppercase text-slate-500 tracking-wider">
                        Utility Type
                    </label>
                    <select
                        bind:value={utilityForm.service_type}
                        class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-medium"
                    >
                        <option value="">Select type...</option>
                        <option value="Water">Water</option>
                        <option value="Gas">Gas</option>
                        <option value="Electric">Electric</option>
                        <option value="Internet">Internet</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div class="space-y-2">
                    <label class="text-xs font-bold uppercase text-slate-500 tracking-wider">
                        Provider Name
                    </label>
                    <input
                        type="text"
                        bind:value={utilityForm.provider}
                        placeholder="e.g. City Water Dept, PG&E"
                        class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-medium"
                    />
                </div>
            </div>

            <div class="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                    onclick={() => (showUtilityModal = false)}
                    class="px-4 py-2 font-bold text-slate-500 hover:text-slate-700 text-sm"
                >
                    Cancel
                </button>
                <button
                    onclick={saveUtility}
                    disabled={!utilityForm.service_type}
                    class="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                    <Save size={16} /> Save Utility
                </button>
            </div>
        </div>
    </div>
{/if}

<div class="max-w-6xl mx-auto p-6 md:p-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="mb-8">
        <div class="flex items-center gap-4 mb-2">
            <div
                class="p-3 bg-primary/10 text-primary rounded-xl shadow-lg shadow-primary/10"
            >
                <Hammer size={32} />
            </div>
            <div>
                <h1 class="font-serif font-bold text-3xl text-foreground">
                    The Home Operating Manual
                </h1>
                <p class="text-slate-500">
                    The "Instruction Manual" for your physical house. Don't
                    leave them guessing how to turn off the water.
                </p>
            </div>
        </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex items-center justify-between mb-8 border-b border-slate-200 pb-1">
        <div class="flex gap-2">
            <button
                onclick={() => (activeTab = "vendors")}
                class="px-5 py-2.5 font-bold text-sm rounded-t-xl transition-all border-b-2
                {activeTab === 'vendors'
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}"
            >
                Trusted Vendors
            </button>
            <button
                onclick={() => (activeTab = "access")}
                class="px-5 py-2.5 font-bold text-sm rounded-t-xl transition-all border-b-2
                {activeTab === 'access'
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}"
            >
                Access Codes
            </button>
            <button
                onclick={() => (activeTab = "utilities")}
                class="px-5 py-2.5 font-bold text-sm rounded-t-xl transition-all border-b-2
                {activeTab === 'utilities'
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}"
            >
                Utilities & Shutoffs
            </button>
        </div>
        <DataViewToggle module="home-manual" onchange={(mode) => viewMode = mode} />
    </div>

    <!-- Tab Content -->
    <div class="min-h-[400px]">
        {#if activeTab === "vendors"}
            <div in:fade class="h-full">
                {#if vendorSync.items.length === 0}
                    <EmptyState
                        title="The people who keep your home running"
                        whyMatters="<strong>When something breaks, your family won't know who to call.</strong> The plumber you trust, the electrician who knows your wiring, the HVAC tech who's serviced your system for years—these relationships took time to build.<br/><br/>Documenting your trusted vendors means your family won't have to start from scratch during a crisis. They'll have the direct numbers, the names to ask for, and the context of your history with each provider."
                        encouragement="Start with whoever you'd call in an emergency—plumber, electrician, or handyman."
                        icon={Phone}
                        iconClass="text-primary"
                        ctaLabel="Share your first vendor"
                        onAction={openVendorModal}
                    />

                    <!-- Sample Data GhostRows -->
                    <div class="mt-8">
                        <p class="text-xs font-bold uppercase text-slate-400 tracking-widest mb-4 text-center">Example entries to inspire you</p>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                            {#each getSmartSamples($language).homeManual?.vendors || [] as sample}
                                <GhostRow
                                    name={sample.name}
                                    subtitle={`${sample.category} - ${sample.phone}`}
                                    type="Vendor"
                                    onClick={() => {
                                        vendorForm = {
                                            category: sample.category,
                                            name: sample.name,
                                            phone: sample.phone
                                        };
                                        showVendorModal = true;
                                    }}
                                >
                                    <svelte:fragment slot="icon">
                                        <Phone size={20} class="text-slate-400" />
                                    </svelte:fragment>
                                </GhostRow>
                            {/each}
                        </div>
                    </div>
                {:else}
                    <div class="space-y-6">
                        <div class="flex justify-between items-center">
                            <h2 class="font-bold text-slate-700 text-lg">
                                Who To Call
                            </h2>
                            <button
                                onclick={openVendorModal}
                                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm shadow-md shadow-primary/10 hover:scale-[1.02] flex items-center gap-2"
                            >
                                <Plus size={16} /> Include a trusted vendor
                            </button>
                        </div>

                        {#if viewMode === 'card'}
                            <div
                                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                            >
                                {#each vendorSync.items as vendor}
                                    <div
                                        class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-orange-200 transition-all group"
                                    >
                                        <div
                                            class="flex justify-between items-start mb-3"
                                        >
                                            <span
                                                class="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded-md tracking-wider"
                                                >{vendor.category}</span
                                            >
                                            <button
                                                onclick={() =>
                                                    deleteVendor(vendor.id)}
                                                class="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                        <h3
                                            class="font-bold text-slate-800 text-lg"
                                        >
                                            {vendor.name}
                                        </h3>
                                        <div class="text-sm text-slate-500 mb-4">
                                            {vendor.company}
                                        </div>

                                        <div
                                            class="flex items-center gap-2 text-slate-600 font-mono bg-slate-50 p-2 rounded-lg mb-3"
                                        >
                                            <Phone size={14} />
                                            {vendor.phone}
                                        </div>

                                        {#if vendor.notes}
                                            <p
                                                class="text-xs text-slate-400 italic"
                                            >
                                                "{vendor.notes}"
                                            </p>
                                        {/if}
                                    </div>
                                {/each}

                                <!-- Empty State Add -->
                                <button
                                    onclick={openVendorModal}
                                    class="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-slate-300 hover:bg-slate-50 transition-all min-h-[200px]"
                                >
                                    <Plus size={24} class="mb-2" />
                                    <span class="font-bold text-sm"
                                        >Include a helper</span
                                    >
                                </button>
                            </div>
                        {:else}
                            <!-- Table View -->
                            <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <table class="w-full">
                                    <thead class="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Name</th>
                                            <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Category</th>
                                            <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Company</th>
                                            <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Phone</th>
                                            <th class="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Notes</th>
                                            <th class="text-right px-4 py-3 text-xs font-bold uppercase text-slate-500">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-slate-100">
                                        {#each vendorSync.items as vendor}
                                            <tr class="hover:bg-slate-50 transition-colors group">
                                                <td class="px-4 py-3 font-medium text-slate-800">{vendor.name}</td>
                                                <td class="px-4 py-3">
                                                    <span class="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                                                        {vendor.category}
                                                    </span>
                                                </td>
                                                <td class="px-4 py-3 text-slate-600">{vendor.company || '-'}</td>
                                                <td class="px-4 py-3 text-slate-600 font-mono">{vendor.phone || '-'}</td>
                                                <td class="px-4 py-3 text-slate-500 text-sm max-w-[150px] truncate">{vendor.notes || '-'}</td>
                                                <td class="px-4 py-3 text-right">
                                                    <button
                                                        onclick={() => deleteVendor(vendor.id)}
                                                        class="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        {/each}
                                    </tbody>
                                </table>
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        {:else if activeTab === "access"}
            <div in:fade class="h-full">
                {#if accessSync.items.length === 0}
                    <EmptyState
                        title="Keys to your kingdom"
                        whyMatters="<strong>Alarm codes, garage door combinations, WiFi passwords, safe combinations—these are the invisible barriers that could lock your family out of their own home.</strong><br/><br/>Documenting access codes ensures your family can enter the house, disable alarms without triggering a police response, and access secured areas. It's one less thing for them to figure out during an already overwhelming time."
                        encouragement="Start with your most critical code—the alarm system or front door."
                        icon={Key}
                        iconClass="text-primary"
                        ctaLabel="Share your first code"
                        onAction={openCodeModal}
                    />

                    <!-- Sample Data GhostRows -->
                    <div class="mt-8">
                        <p class="text-xs font-bold uppercase text-slate-400 tracking-widest mb-4 text-center">Example entries to inspire you</p>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                            {#each getSmartSamples($language).homeManual?.accessCodes || [] as sample}
                                <GhostRow
                                    name={sample.location}
                                    subtitle={sample.instructions}
                                    type="Code"
                                    onClick={() => {
                                        codeForm = {
                                            location: sample.location,
                                            code: sample.code_encrypted
                                        };
                                        showCodeModal = true;
                                    }}
                                >
                                    <svelte:fragment slot="icon">
                                        <Key size={20} class="text-slate-400" />
                                    </svelte:fragment>
                                </GhostRow>
                            {/each}
                        </div>
                    </div>
                {:else}
                    <div class="space-y-6">
                        <div class="flex justify-between items-center">
                            <h2 class="font-bold text-slate-700 text-lg">
                                Codes & Keys
                            </h2>
                            <button
                                onclick={openCodeModal}
                                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm shadow-md shadow-primary/10 hover:scale-[1.02] flex items-center gap-2"
                            >
                                <Plus size={16} /> Share an access code
                            </button>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {#each accessSync.items as item}
                                <div
                                    class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between"
                                >
                                    <div class="flex items-center gap-4">
                                        <div
                                            class="p-3 bg-indigo-50 text-indigo-600 rounded-lg"
                                        >
                                            <Key size={20} />
                                        </div>
                                        <div>
                                            <h3
                                                class="font-bold text-slate-700"
                                            >
                                                {item.location}
                                            </h3>
                                            <div
                                                class="font-mono text-xl tracking-widest text-slate-900 bg-slate-100 px-2 py-0.5 rounded inline-block mt-1"
                                            >
                                                {item.code_encrypted}
                                            </div>
                                        </div>
                                    </div>
                                    {#if item.instructions}
                                        <div
                                            class="text-xs text-slate-400 max-w-[150px] text-right"
                                        >
                                            {item.instructions}
                                        </div>
                                    {/if}
                                    <button
                                        onclick={() => deleteCode(item.id)}
                                        class="text-slate-300 hover:text-red-500 p-2"
                                    >
                                        &times;
                                    </button>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        {:else if activeTab === "utilities"}
            <div in:fade class="h-full">
                {#if utilitySync.items.length === 0}
                    <EmptyState
                        title="When seconds matter"
                        whyMatters="<strong>A burst pipe at 2am. A gas leak. A tripped breaker during a storm.</strong> In emergencies, knowing exactly where to find the water shutoff, gas valve, or electrical panel can prevent thousands in damage—or even save lives.<br/><br/>Documenting these critical locations means your family won't be searching frantically in a crisis. They'll know exactly where to go and what to do."
                        encouragement="Start with your water main shutoff—it's the most common emergency need."
                        icon={Droplets}
                        iconClass="text-primary"
                        ctaLabel="Share your first shutoff"
                        onAction={openUtilityModal}
                    />

                    <!-- Sample Data GhostRows -->
                    <div class="mt-8">
                        <p class="text-xs font-bold uppercase text-slate-400 tracking-widest mb-4 text-center">Example entries to inspire you</p>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                            {#each getSmartSamples($language).homeManual?.utilities || [] as sample}
                                <GhostRow
                                    name={`${sample.service_type} Shutoff`}
                                    subtitle={sample.location}
                                    type="Utility"
                                    onClick={() => {
                                        utilityForm = {
                                            service_type: sample.service_type,
                                            provider: sample.provider
                                        };
                                        showUtilityModal = true;
                                    }}
                                >
                                    <svelte:fragment slot="icon">
                                        {#if sample.service_type === 'Water'}
                                            <Droplets size={20} class="text-slate-400" />
                                        {:else if sample.service_type === 'Gas'}
                                            <Thermometer size={20} class="text-slate-400" />
                                        {:else}
                                            <Zap size={20} class="text-slate-400" />
                                        {/if}
                                    </svelte:fragment>
                                </GhostRow>
                            {/each}
                        </div>
                    </div>
                {:else}
                    <div class="space-y-6">
                        <div class="flex justify-between items-center">
                            <h2 class="font-bold text-slate-700 text-lg">
                                Critical Shutoffs
                            </h2>
                            <button
                                onclick={openUtilityModal}
                                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm shadow-md shadow-primary/10 hover:scale-[1.02] flex items-center gap-2"
                            >
                                <Plus size={16} /> Share utility details
                            </button>
                        </div>

                        <div class="grid grid-cols-1 gap-4">
                            {#each utilitySync.items as item}
                                <div
                                    class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start relative group"
                                >
                                    <button
                                        onclick={() => deleteUtility(item.id)}
                                        class="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        &times;
                                    </button>
                                    <div
                                        class="p-4 bg-primary/5 text-primary rounded-2xl shrink-0"
                                    >
                                        {#if item.service_type === "Water"}
                                            <Droplets size={32} />
                                        {:else if item.service_type === "Electric"}
                                            <Zap size={32} />
                                        {:else if item.service_type === "Gas"}
                                            <Thermometer size={32} />
                                        {:else}
                                            <Wifi size={32} />
                                        {/if}
                                    </div>

                                    <div class="flex-1 space-y-4">
                                        <div>
                                            <h3
                                                class="font-bold text-xl text-slate-800"
                                            >
                                                {item.service_type} Shutoff
                                            </h3>
                                            <p class="text-slate-500 text-sm">
                                                Provider: {item.provider ||
                                                    "Unknown"}
                                            </p>
                                        </div>

                                        <div
                                            class="grid grid-cols-1 md:grid-cols-2 gap-4"
                                        >
                                            <div
                                                class="bg-slate-50 p-4 rounded-lg"
                                            >
                                                <div
                                                    class="text-xs font-bold uppercase text-slate-400 mb-1 flex items-center gap-1"
                                                >
                                                    <MapPin size={10} /> Location
                                                </div>
                                                <div
                                                    class="font-medium text-slate-700"
                                                >
                                                    {item.location}
                                                </div>
                                            </div>
                                            <div
                                                class="bg-slate-50 p-4 rounded-lg"
                                            >
                                                <div
                                                    class="text-xs font-bold uppercase text-slate-400 mb-1 flex items-center gap-1"
                                                >
                                                    <Shield size={10} /> Instructions
                                                </div>
                                                <div
                                                    class="font-medium text-slate-700"
                                                >
                                                    {item.shutoffInstructions ||
                                                        "No instructions set."}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>
{/if}
