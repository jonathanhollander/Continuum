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
    } from "lucide-svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import EmptyStateGuide from "$lib/components/ui/EmptyStateGuide.svelte";
    import { onMount } from "svelte";
    import { estateProfile } from "$lib/stores/estateStore";
    import { activityLog } from "$lib/stores/activityLog";

    let activeTab = "vendors"; // vendors | access | utilities

    interface Vendor {
        id: string;
        role: string;
        name: string;
        company: string;
        phone: string;
        notes: string;
    }

    interface AccessCode {
        id: string;
        label: string;
        code: string;
        notes: string;
    }

    interface Utility {
        id: string;
        type: string;
        location: string;
        shutoffInstructions: string;
        provider: string;
    }

    let vendors: Vendor[] = [];

    let accessCodes: AccessCode[] = [];

    let utilities: Utility[] = [];

    import { getStored, setStored } from "$lib/stores/persistence";

    // ...

    onMount(() => {
        vendors = getStored<Vendor[]>("home_vendors", []);
        accessCodes = getStored<AccessCode[]>("home_access", []);
        utilities = getStored<Utility[]>("home_utilities", []);
    });

    function save() {
        setStored("home_vendors", vendors);
        setStored("home_access", accessCodes);
        setStored("home_utilities", utilities);
    }

    // Generic Add Handlers (Simplified for speed)
    function addVendor() {
        const role = prompt("Vendor Role (e.g. Plumber):");
        if (!role) return;
        const name = prompt("Name/Company:");
        const phone = prompt("Phone:");
        vendors = [
            ...vendors,
            {
                id: crypto.randomUUID(),
                role,
                name: name || "",
                company: "",
                phone: phone || "",
                notes: "",
            },
        ];
        save();
    }

    function addCode() {
        const label = prompt("Code Label (e.g. Gate Code):");
        if (!label) return;
        const code = prompt("Code:");
        accessCodes = [
            ...accessCodes,
            { id: crypto.randomUUID(), label, code: code || "****", notes: "" },
        ];
        save();
    }

    function addUtility() {
        const type = prompt("Utility Type (Water, Gas, Electric):");
        if (!type) return;
        const location = prompt("Shutoff Location:");
        utilities = [
            ...utilities,
            {
                id: crypto.randomUUID(),
                type: type as any,
                location: location || "",
                shutoffInstructions: "",
                provider: "",
            },
        ];
        save();
    }
</script>

```html
<div class="max-w-6xl mx-auto p-6 md:p-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="mb-8">
        <div class="flex items-center gap-4 mb-2">
            <div
                class="p-3 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-200"
            >
                <Hammer size={32} />
            </div>
            <div>
                <h1 class="font-serif font-bold text-3xl text-slate-900">
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
    <div class="flex gap-2 mb-8 border-b border-slate-200 pb-1">
        <button
            on:click={() => (activeTab = "vendors")}
            class="px-5 py-2.5 font-bold text-sm rounded-t-xl transition-all border-b-2
            {activeTab === 'vendors'
                ? 'border-orange-500 text-orange-600 bg-orange-50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}"
        >
            Trusted Vendors
        </button>
        <button
            on:click={() => (activeTab = "access")}
            class="px-5 py-2.5 font-bold text-sm rounded-t-xl transition-all border-b-2
            {activeTab === 'access'
                ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}"
        >
            Access Codes
        </button>
        <button
            on:click={() => (activeTab = "utilities")}
            class="px-5 py-2.5 font-bold text-sm rounded-t-xl transition-all border-b-2
            {activeTab === 'utilities'
                ? 'border-sky-500 text-sky-600 bg-sky-50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}"
        >
            Utilities & Shutoffs
        </button>
    </div>

    <!-- Tab Content -->
    <div class="min-h-[400px]">
        {#if activeTab === "vendors"}
            <div in:fade class="h-full">
                {#if vendors.length === 0}
                    <EmptyStateGuide type="home" onAdd={addVendor} />
                {:else}
                    <div class="space-y-6">
                        <div class="flex justify-between items-center">
                            <h2 class="font-bold text-slate-700 text-lg">
                                Who To Call
                            </h2>
                            <button
                                on:click={addVendor}
                                class="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 flex items-center gap-2"
                            >
                                <Plus size={16} /> Add Vendor
                            </button>
                        </div>

                        <div
                            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            {#each vendors as vendor}
                                <div
                                    class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-orange-200 transition-all group"
                                >
                                    <div
                                        class="flex justify-between items-start mb-3"
                                    >
                                        <span
                                            class="px-2 py-1 bg-orange-100 text-orange-700 text-[10px] font-bold uppercase rounded-md tracking-wider"
                                            >{vendor.role}</span
                                        >
                                        <button
                                            on:click={() => {
                                                vendors = vendors.filter(
                                                    (v) => v.id !== vendor.id,
                                                );
                                                save();
                                            }}
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
                                on:click={addVendor}
                                class="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-slate-300 hover:bg-slate-50 transition-all min-h-[200px]"
                            >
                                <Plus size={24} class="mb-2" />
                                <span class="font-bold text-sm"
                                    >Add New Contact</span
                                >
                            </button>
                        </div>
                    </div>
                {/if}
            </div>
        {:else if activeTab === "access"}
            <div in:fade class="h-full">
                {#if accessCodes.length === 0}
                    <EmptyStateGuide type="home" onAdd={addCode} />
                {:else}
                    <div class="space-y-6">
                        <div class="flex justify-between items-center">
                            <h2 class="font-bold text-slate-700 text-lg">
                                Codes & Keys
                            </h2>
                            <button
                                on:click={addCode}
                                class="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 flex items-center gap-2"
                            >
                                <Plus size={16} /> Add Code
                            </button>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {#each accessCodes as item}
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
                                                {item.label}
                                            </h3>
                                            <div
                                                class="font-mono text-xl tracking-widest text-slate-900 bg-slate-100 px-2 py-0.5 rounded inline-block mt-1"
                                            >
                                                {item.code}
                                            </div>
                                        </div>
                                    </div>
                                    {#if item.notes}
                                        <div
                                            class="text-xs text-slate-400 max-w-[150px] text-right"
                                        >
                                            {item.notes}
                                        </div>
                                    {/if}
                                    <button
                                        on:click={() => {
                                            accessCodes = accessCodes.filter(
                                                (c) => c.id !== item.id,
                                            );
                                            save();
                                        }}
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
                {#if utilities.length === 0}
                    <EmptyStateGuide type="home" onAdd={addUtility} />
                {:else}
                    <div class="space-y-6">
                        <div class="flex justify-between items-center">
                            <h2 class="font-bold text-slate-700 text-lg">
                                Critical Shutoffs
                            </h2>
                            <button
                                on:click={addUtility}
                                class="px-4 py-2 bg-sky-600 text-white rounded-lg font-bold text-sm hover:bg-sky-700 flex items-center gap-2"
                            >
                                <Plus size={16} /> Add Utility
                            </button>
                        </div>

                        <div class="grid grid-cols-1 gap-4">
                            {#each utilities as item}
                                <div
                                    class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start relative group"
                                >
                                    <button
                                        on:click={() => {
                                            utilities = utilities.filter(
                                                (u) => u.id !== item.id,
                                            );
                                            save();
                                        }}
                                        class="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        &times;
                                    </button>
                                    <div
                                        class="p-4 bg-sky-50 text-sky-600 rounded-2xl shrink-0"
                                    >
                                        {#if item.type === "Water"}
                                            <Droplets size={32} />
                                        {:else if item.type === "Electric"}
                                            <Zap size={32} />
                                        {:else if item.type === "Gas"}
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
                                                {item.type} Shutoff
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
