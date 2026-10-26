<script lang="ts">
    import { askConfirm } from "$lib/components/ui/ConfirmModal.svelte";
    import { fade, slide } from "svelte/transition";
    import Modal from "$lib/components/ui/Modal.svelte";
    import {
        Hammer,
        Phone,
        Key,
        Wifi,
        Plug,
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
        Save,
        Loader2,
    } from "lucide-svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import DataViewToggle from "$lib/components/ui/DataViewToggle.svelte";
    import { userPreferencesStore, type ViewMode } from "$lib/stores/userPreferencesStore.svelte";
    import { vendorStore, type Vendor } from "$lib/stores/vendorStore.svelte";
    import { homeAccessStore, type HomeAccess } from "$lib/stores/homeAccessStore.svelte";
    import { utilityStore, type Utility } from "$lib/stores/utilityStore.svelte";
    import { getStored } from "$lib/stores/persistence";
    import GhostRow from "$lib/components/ui/GhostRow.svelte";
    import { t, language } from "$lib/stores/localization";
    import { getSmartSamples } from "$lib/data/smartSamples";
    function utilityIcon(t: string | null | undefined) {
        switch ((t || "").trim().toLowerCase()) {
            case "water": return Droplets;
            case "electric":
            case "electricity": return Zap;
            case "gas": return Thermometer;
            case "internet":
            case "wifi":
            case "wi-fi": return Wifi;
            default: return Plug;
        }
    }
    function utilityLabel(t: string | null | undefined) {
        const v = (t || "").trim();
        return v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : "Utility";
    }
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";

    let viewMode = $state<ViewMode>('card');

    // One sync manager per endpoint: the stores own the keys (vendors, home_access, utilities)
    // and the mappers, so records keep their server ids across reloads.
    const vendorSync = vendorStore;
    const accessSync = homeAccessStore;
    const utilitySync = utilityStore;

    let activeTab = $state("vendors");
    // The session sync (layout) and a store's first registration each fetch once; the page shows
    // what they hold instead of fetching again. Wait only while there is nothing saved to show yet.
    const waiting = (st: { status: string; items: unknown[] }) =>
        st.items.length === 0 && (st.status === "idle" || st.status === "syncing");
    let isLoading = $derived(waiting(vendorSync) || waiting(accessSync) || waiting(utilitySync));

    // Modal States
    let showVendorModal = $state(false);
    let showCodeModal = $state(false);
    let showUtilityModal = $state(false);
    // Set while a modal is updating a saved record; null while it adds a new one.
    let editingVendorId = $state<number | null>(null);
    let editingCodeId = $state<number | null>(null);
    let editingUtilityId = $state<number | null>(null);

    // The shared modal's field, label and footer styles (UI standards 1.7, 2.1).
    const labelClass = "block text-xs font-bold uppercase text-slate-500 tracking-wide px-1 mb-1.5";
    const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800";
    const footerClass = "-mx-6 -mb-6 px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 mt-6";
    const cancelClass = "px-6 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-colors whitespace-nowrap";
    const saveClass = "px-6 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap";

    // Form States
    let vendorForm = $state({ category: "", name: "", phone: "" });
    let codeForm = $state({ location: "", code: "", instructions: "" });
    let utilityForm = $state({ service_type: "", provider: "", location: "" });

    // Handlers
    function openVendorModal() {
        editingVendorId = null;
        vendorForm = { category: "", name: "", phone: "" };
        showVendorModal = true;
    }

    function editVendor(vendor: Vendor) {
        editingVendorId = vendor.id ?? null;
        vendorForm = { category: vendor.category, name: vendor.name, phone: vendor.phone || "" };
        showVendorModal = true;
    }

    // One save at a time: while it is open the button waits, so a second click sends nothing.
    let saving = $state(false);
    async function saveVendor() {
        if (saving) return;
        saving = true;
        try {
            await saveVendorOnce();
        } finally {
            saving = false;
        }
    }

    async function saveVendorOnce() {
        if (!vendorForm.category || !vendorForm.name) return;
        const fields = {
            category: vendorForm.category,
            name: vendorForm.name,
            phone: vendorForm.phone,
        };
        if (editingVendorId != null) await vendorSync.update(editingVendorId, fields);
        else await vendorSync.create(fields);
        showVendorModal = false;
    }

    async function deleteVendor(id: number | undefined) {
        if (id == null) return;
        if (!(await askConfirm("Remove this item? You can add it back anytime."))) return;
        await vendorSync.delete(id);
    }

    function openCodeModal() {
        editingCodeId = null;
        codeForm = { location: "", code: "", instructions: "" };
        showCodeModal = true;
    }

    function editCode(item: HomeAccess) {
        editingCodeId = item.id ?? null;
        codeForm = {
            location: item.location,
            code: item.code_encrypted || "",
            instructions: item.instructions || "",
        };
        showCodeModal = true;
    }

    async function saveCode() {
        if (saving) return;
        saving = true;
        try {
            await saveCodeOnce();
        } finally {
            saving = false;
        }
    }

    async function saveCodeOnce() {
        if (!codeForm.location) return;
        const fields = {
            location: codeForm.location,
            code_encrypted: codeForm.code,
            instructions: codeForm.instructions,
        };
        if (editingCodeId != null) await accessSync.update(editingCodeId, fields);
        else await accessSync.create(fields);
        showCodeModal = false;
    }

    async function deleteCode(id: number | undefined) {
        if (id == null) return;
        if (!(await askConfirm("Remove this item? You can add it back anytime."))) return;
        await accessSync.delete(id);
    }

    function openUtilityModal() {
        editingUtilityId = null;
        utilityForm = { service_type: "", provider: "", location: "" };
        showUtilityModal = true;
    }

    function editUtility(item: Utility) {
        editingUtilityId = item.id ?? null;
        utilityForm = {
            service_type: item.service_type,
            provider: item.provider,
            location: item.location || "",
        };
        showUtilityModal = true;
    }

    async function saveUtility() {
        if (saving) return;
        saving = true;
        try {
            await saveUtilityOnce();
        } finally {
            saving = false;
        }
    }

    async function saveUtilityOnce() {
        if (!utilityForm.service_type) return;
        const fields = {
            service_type: utilityForm.service_type,
            provider: utilityForm.provider || "Unknown",
            location: utilityForm.location,
        };
        if (editingUtilityId != null) await utilitySync.update(editingUtilityId, fields);
        else await utilitySync.create(fields);
        showUtilityModal = false;
    }

    async function deleteUtility(id: number | undefined) {
        if (id == null) return;
        if (!(await askConfirm("Remove this item? You can add it back anytime."))) return;
        await utilitySync.delete(id);
    }
</script>

{#if isLoading}
    <div class="flex items-center justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
{:else}
<!-- Vendor Modal -->
<Modal bind:open={showVendorModal} title="{editingVendorId != null ? 'Update' : 'Add'} Trusted Vendor" maxWidth="max-w-lg">
    <div class="space-y-4">
        <div>
            <label for="vendor-category" class={labelClass}>Vendor Role</label>
            <input
                id="vendor-category"
                type="text"
                bind:value={vendorForm.category}
                placeholder="e.g. Plumber, Electrician, HVAC"
                class={inputClass}
            />
        </div>

        <div>
            <label for="vendor-name" class={labelClass}>Name / Company</label>
            <input
                id="vendor-name"
                type="text"
                bind:value={vendorForm.name}
                placeholder="e.g. Joe's Plumbing"
                class={inputClass}
            />
        </div>

        <div>
            <label for="vendor-phone" class={labelClass}>Phone Number</label>
            <input
                id="vendor-phone"
                type="tel"
                bind:value={vendorForm.phone}
                placeholder="(555) 123-4567"
                class={inputClass}
            />
        </div>
    </div>

    <div class={footerClass}>
        <button onclick={() => (showVendorModal = false)} class={cancelClass}>Not right now</button>
        <button
            onclick={saveVendor}
            disabled={!vendorForm.category || !vendorForm.name || saving}
            aria-busy={saving}
            class={saveClass}
        >
            <Save size={16} /> {saving ? "Saving..." : "Save my helper"}
        </button>
    </div>
</Modal>

<!-- Access Code Modal -->
<Modal bind:open={showCodeModal} title="{editingCodeId != null ? 'Update' : 'Add'} Access Code" maxWidth="max-w-lg">
    <div class="space-y-4">
        <div>
            <label for="code-location" class={labelClass}>Code Label</label>
            <input
                id="code-location"
                type="text"
                bind:value={codeForm.location}
                placeholder="e.g. Gate, Garage, Alarm"
                class={inputClass}
            />
        </div>

        <div>
            <label for="code-value" class={labelClass}>Code</label>
            <input
                id="code-value"
                type="text"
                bind:value={codeForm.code}
                placeholder="e.g. 1234"
                class="{inputClass} font-mono text-lg tracking-widest"
            />
        </div>

        <div>
            <label for="code-instructions" class={labelClass}>Instructions</label>
            <textarea
                id="code-instructions"
                bind:value={codeForm.instructions}
                rows="3"
                placeholder="e.g. Enter the code, then press # within ten seconds"
                class="{inputClass} resize-none"
            ></textarea>
        </div>
    </div>

    <div class={footerClass}>
        <button onclick={() => (showCodeModal = false)} class={cancelClass}>Not right now</button>
        <button
            onclick={saveCode}
            disabled={!codeForm.location || saving}
            aria-busy={saving}
            class={saveClass}
        >
            <Save size={16} /> {saving ? "Saving..." : "Save my access code"}
        </button>
    </div>
</Modal>

<!-- Utility Modal -->
<Modal bind:open={showUtilityModal} title="{editingUtilityId != null ? 'Update' : 'Add'} Utility Shutoff" maxWidth="max-w-lg">
    <div class="space-y-4">
        <div>
            <label for="utility-type" class={labelClass}>Utility Type</label>
            <select id="utility-type" bind:value={utilityForm.service_type} class={inputClass}>
                <option value="">Select type...</option>
                <option value="Water">Water</option>
                <option value="Gas">Gas</option>
                <option value="Electric">Electric</option>
                <option value="Internet">Internet</option>
                <option value="Other">Other</option>
            </select>
        </div>

        <div>
            <label for="utility-provider" class={labelClass}>Provider Name</label>
            <input
                id="utility-provider"
                type="text"
                bind:value={utilityForm.provider}
                placeholder="e.g. City Water Dept, PG&E"
                class={inputClass}
            />
        </div>

        <div>
            <label for="utility-location" class={labelClass}>Shutoff Location</label>
            <input
                id="utility-location"
                type="text"
                bind:value={utilityForm.location}
                placeholder="e.g. Front yard, by the meter"
                class={inputClass}
            />
        </div>
    </div>

    <div class={footerClass}>
        <button onclick={() => (showUtilityModal = false)} class={cancelClass}>Not right now</button>
        <button
            onclick={saveUtility}
            disabled={!utilityForm.service_type || saving}
            aria-busy={saving}
            class={saveClass}
        >
            <Save size={16} /> {saving ? "Saving..." : "Save my utility details"}
        </button>
    </div>
</Modal>

<div class="max-w-6xl mx-auto p-6 md:p-8 animate-in fade-in duration-500">
    <!-- Header -->
    <LivingBlueprintHeader
        title="The Home Operating Manual"
        subtitle="The instruction manual for your physical house"
        detailedDescription="Document your trusted vendors, access codes, and utility shutoff locations. Don't leave your family guessing how to turn off the water or who to call when something breaks."
        whyMatters="In a crisis, your family needs immediate access to critical home information. Without these details, simple tasks become overwhelming challenges during an already difficult time."
    />

    <!-- AI Concierge Drafting Assistant -->
    <AIPromptBar
        context="home-manual"
        prompts={[
            "Help me document my home's maintenance schedule...",
            "Write instructions for shutting off my home's water, gas and power...",
            "Draft a guide to my home security system...",
            "What should my family know about the vendors who care for my home?"
        ]}
    />

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
                                        editingVendorId = null;
                                        vendorForm = {
                                            category: sample.category,
                                            name: sample.name,
                                            phone: sample.phone
                                        };
                                        showVendorModal = true;
                                    }}
                                >
                                    {#snippet icon()}
                                        <Phone size={20} class="text-slate-400" />
                                    {/snippet}
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
                                            <div class="flex items-center gap-2">
                                                <button
                                                    onclick={() => editVendor(vendor)}
                                                    aria-label="Update {vendor.name}"
                                                    class="text-slate-300 hover:text-primary"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onclick={() =>
                                                        deleteVendor(vendor.id)}
                                                    aria-label="Remove {vendor.name}"
                                                    class="text-slate-300 hover:text-red-500"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <h3
                                            class="font-bold text-slate-800 text-lg"
                                        >
                                            {vendor.name}
                                        </h3>
                                        <div class="mb-4"></div>

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
                                                <td class="px-4 py-3 text-slate-600 font-mono">{vendor.phone || '-'}</td>
                                                <td class="px-4 py-3 text-slate-500 text-sm max-w-[150px] truncate">{vendor.notes || '-'}</td>
                                                <td class="px-4 py-3 text-right">
                                                    <button
                                                        onclick={() => editVendor(vendor)}
                                                        aria-label="Update {vendor.name}"
                                                        class="text-slate-300 hover:text-primary transition-opacity mr-2"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        onclick={() => deleteVendor(vendor.id)}
                                                        aria-label="Remove {vendor.name}"
                                                        class="text-slate-300 hover:text-red-500 transition-opacity"
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
                                        editingCodeId = null;
                                        codeForm = {
                                            location: sample.location,
                                            code: sample.code_encrypted,
                                            instructions: sample.instructions || ""
                                        };
                                        showCodeModal = true;
                                    }}
                                >
                                    {#snippet icon()}
                                        <Key size={20} class="text-slate-400" />
                                    {/snippet}
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
                                            {#if item.code_encrypted}
                                                <div
                                                    class="font-mono text-xl tracking-widest text-slate-900 bg-slate-100 px-2 py-0.5 rounded inline-block mt-1"
                                                >
                                                    {item.code_encrypted}
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                    {#if item.instructions}
                                        <div
                                            class="text-xs text-slate-400 max-w-[150px] text-right"
                                        >
                                            {item.instructions}
                                        </div>
                                    {/if}
                                    <div class="flex items-center">
                                        <button
                                            onclick={() => editCode(item)}
                                            aria-label="Update {item.location}"
                                            class="text-slate-300 hover:text-primary p-2"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onclick={() => deleteCode(item.id)}
                                            aria-label="Remove {item.location}"
                                            class="text-slate-300 hover:text-red-500 p-2"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
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
                                    name={`${utilityLabel(sample.service_type)} Shutoff`}
                                    subtitle={sample.location}
                                    type="Utility"
                                    onClick={() => {
                                        editingUtilityId = null;
                                        utilityForm = {
                                            service_type: sample.service_type,
                                            provider: sample.provider,
                                            location: sample.location || ""
                                        };
                                        showUtilityModal = true;
                                    }}
                                >
                                    {#snippet icon()}
                                        {@const SampleIcon = utilityIcon(sample.service_type)}
                                        <SampleIcon size={20} class="text-slate-400" />
                                    {/snippet}
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
                                {@const UtilIcon = utilityIcon(item.service_type)}
                                <div
                                    class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start relative group"
                                >
                                    <div class="absolute top-4 right-4 flex items-center gap-2">
                                        <button
                                            onclick={() => editUtility(item)}
                                            aria-label="Update {item.service_type} shutoff"
                                            class="text-slate-300 hover:text-primary"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onclick={() => deleteUtility(item.id)}
                                            aria-label="Remove {item.service_type} shutoff"
                                            class="text-slate-300 hover:text-red-500"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div
                                        class="p-4 bg-primary/5 text-primary rounded-2xl shrink-0"
                                    >
                                        <UtilIcon size={32} />
                                    </div>

                                    <div class="flex-1 space-y-4">
                                        <div>
                                            <h3
                                                class="font-bold text-xl text-slate-800"
                                            >
                                                {utilityLabel(item.service_type)} Shutoff
                                            </h3>
                                            <p class="text-slate-500 text-sm">
                                                Provider: {item.provider}
                                            </p>
                                        </div>

                                        {#if item.location}
                                            <div class="bg-slate-50 p-4 rounded-lg">
                                                <div
                                                    class="text-xs font-bold uppercase text-slate-400 mb-1 flex items-center gap-1"
                                                >
                                                    <MapPin size={10} /> Location
                                                </div>
                                                <div class="font-medium text-slate-700">
                                                    {item.location}
                                                </div>
                                            </div>
                                        {/if}
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
