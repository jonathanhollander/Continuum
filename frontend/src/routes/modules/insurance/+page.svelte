<script lang="ts">
    import {
        insuranceStore,
        type InsurancePolicy,
    } from "$lib/stores/insuranceStore";
    import { activityLog } from "$lib/stores/activityLog";
    import { estateProfile } from "$lib/stores/estateStore";
    import { fade, slide, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import {
        Shield,
        Plus,
        Trash2,
        Pencil,
        ExternalLink,
        FileText,
        User,
        Activity,
        CircleAlert,
        CircleCheck,
        Clock,
        DollarSign,
        Calendar,
        ChevronRight,
        X,
        Search,
        Heart,
        Car,
        Home,
        Info,
        ArrowRight,
        Filter,
        Download,
    } from "lucide-svelte";

    let showAddModal = false;
    let isEditing = false;
    let searchQuery = "";
    let filterType: string = "All";

    let newPolicy: Partial<InsurancePolicy> = {
        policyName: "",
        insuranceType: "Life",
        insurer: "",
        policyNumber: "",
        premiumAmount: 0,
        premiumFrequency: "Monthly",
        beneficiaries: "",
        agentName: "",
        agentContact: "",
        claimsProcedure: "",
        status: "Active",
        notes: "",
    };

    $: policies = $insuranceStore;
    $: filteredPolicies = policies.filter((p) => {
        const matchesSearch =
            p.policyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.insurer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter =
            filterType === "All" || p.insuranceType === filterType;
        return matchesSearch && matchesFilter;
    });

    $: stats = insuranceStore.getTotalPremiums();
    $: types = ["All", "Life", "Health", "Auto", "Home", "Disability", "Other"];

    function resetForm() {
        newPolicy = {
            policyName: "",
            insuranceType: "Life",
            insurer: "",
            policyNumber: "",
            premiumAmount: 0,
            premiumFrequency: "Monthly",
            beneficiaries: "",
            agentName: "",
            agentContact: "",
            claimsProcedure: "",
            status: "Active",
            notes: "",
        };
        showAddModal = false;
        isEditing = false;
    }

    function handleAddPolicy() {
        if (!newPolicy.policyName || !newPolicy.insurer) return;

        if (isEditing && newPolicy.id) {
            const oldPolicy = insuranceStore.getPolicy(newPolicy.id);
            const changes = [];

            if (oldPolicy) {
                if (oldPolicy.policyName !== newPolicy.policyName)
                    changes.push({
                        field: "policyName",
                        oldValue: oldPolicy.policyName,
                        newValue: newPolicy.policyName,
                    });
                if (oldPolicy.premiumAmount !== newPolicy.premiumAmount)
                    changes.push({
                        field: "premiumAmount",
                        oldValue: oldPolicy.premiumAmount,
                        newValue: newPolicy.premiumAmount,
                    });
                if (oldPolicy.status !== newPolicy.status)
                    changes.push({
                        field: "status",
                        oldValue: oldPolicy.status,
                        newValue: newPolicy.status,
                    });
            }

            insuranceStore.updatePolicy(newPolicy.id, newPolicy);

            activityLog.logEvent({
                module: "Insurance",
                action: "UPDATE",
                entityType: "Policy",
                entityId: newPolicy.id,
                entityName: newPolicy.policyName,
                changes,
                userContext: $estateProfile.ownerName || "User",
            });
        } else {
            const created = insuranceStore.addPolicy(
                newPolicy as Omit<InsurancePolicy, "id">,
            );

            activityLog.logEvent({
                module: "Insurance",
                action: "CREATE",
                entityType: "Policy",
                entityId: created.id,
                entityName: created.policyName,
                userContext: $estateProfile.ownerName || "User",
            });
        }

        resetForm();
    }

    function editPolicy(policy: InsurancePolicy) {
        newPolicy = { ...policy };
        isEditing = true;
        showAddModal = true;
    }

    function deletePolicy(id: string, name: string) {
        if (confirm(`Are you sure you want to remove the policy "${name}"?`)) {
            insuranceStore.deletePolicy(id);

            activityLog.logEvent({
                module: "Insurance",
                action: "DELETE",
                entityType: "Policy",
                entityId: id,
                entityName: name,
                userContext: $estateProfile.ownerName || "User",
            });
        }
    }

    const typeIcons = {
        Life: Heart,
        Health: Activity,
        Auto: Car,
        Home: Home,
        Disability: CircleAlert,
        Other: FileText,
    };

    const statusColors = {
        Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
        Inactive: "bg-slate-100 text-slate-600 border-slate-200",
        Pending: "bg-amber-100 text-amber-700 border-amber-200",
    };

    const typeColors = {
        Life: "text-rose-600 bg-rose-50 border-rose-100",
        Health: "text-blue-600 bg-blue-50 border-blue-100",
        Auto: "text-indigo-600 bg-indigo-50 border-indigo-100",
        Home: "text-emerald-600 bg-emerald-50 border-emerald-100",
        Disability: "text-amber-600 bg-amber-50 border-amber-100",
        Other: "text-slate-600 bg-slate-50 border-slate-100",
    };
</script>

<div
    class="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700"
>
    <!-- Header Section -->
    <header
        class="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-2"
    >
        <div class="space-y-4">
            <nav
                class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400"
            >
                <Shield size={14} />
                <span>Concierge v4.0</span>
                <ChevronRight size={12} />
                <span class="text-indigo-600">Insurance Portfolio</span>
            </nav>
            <div>
                <h1
                    class="text-4xl font-extrabold text-slate-900 tracking-tight mb-2"
                >
                    Insurance <span class="text-indigo-600 font-light italic"
                        >&</span
                    > Policies
                </h1>
                <p class="text-slate-500 max-w-2xl text-lg leading-relaxed">
                    Centralize your coverage details, beneficiary designations,
                    and claims procedures to ensure your family's financial
                    security.
                </p>
            </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
            <div
                class="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm"
            >
                {#each types as type}
                    <button
                        on:click={() => (filterType = type)}
                        class="px-4 py-2 rounded-xl text-xs font-bold tracking-wider transition-all {filterType ===
                        type
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                            : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}"
                    >
                        {type}
                    </button>
                {/each}
            </div>

            <button
                on:click={() => (showAddModal = true)}
                class="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl transition-all shadow-xl shadow-slate-900/10 font-bold"
            >
                <Plus size={20} />
                Add Policy
            </button>
        </div>
    </header>

    <!-- Stats Dashboard -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
            class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
        >
            <div class="flex items-start justify-between mb-4">
                <div
                    class="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform"
                >
                    <DollarSign size={24} />
                </div>
                <div
                    class="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-bold"
                >
                    ANNUAL
                </div>
            </div>
            <p
                class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1"
            >
                Total Premiums
            </p>
            <p class="text-3xl font-black text-slate-900 tracking-tight">
                ${stats.annual.toLocaleString()}
            </p>
        </div>

        <div
            class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
        >
            <div class="flex items-start justify-between mb-4">
                <div
                    class="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform"
                >
                    <Activity size={24} />
                </div>
                <div
                    class="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg font-bold"
                >
                    MONTHLY
                </div>
            </div>
            <p
                class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1"
            >
                Monthly Average
            </p>
            <p class="text-3xl font-black text-slate-900 tracking-tight">
                ${Math.round(stats.monthly).toLocaleString()}
            </p>
        </div>

        <div
            class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
        >
            <div class="flex items-start justify-between mb-4">
                <div
                    class="p-3 bg-rose-50 rounded-2xl text-rose-600 group-hover:scale-110 transition-transform"
                >
                    <Heart size={24} />
                </div>
                <div
                    class="text-[10px] bg-rose-100 text-rose-700 px-2 py-1 rounded-lg font-bold"
                >
                    STATUS
                </div>
            </div>
            <p
                class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1"
            >
                Active Policies
            </p>
            <p class="text-3xl font-black text-slate-900 tracking-tight">
                {policies.filter((p) => p.status === "Active").length}
            </p>
        </div>

        <div
            class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
        >
            <div class="flex items-start justify-between mb-4">
                <div
                    class="p-3 bg-slate-50 rounded-2xl text-slate-600 group-hover:scale-110 transition-transform"
                >
                    <CircleCheck size={24} />
                </div>
                <div
                    class="text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded-lg font-bold"
                >
                    AUDIT
                </div>
            </div>
            <p
                class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1"
            >
                Completion Rate
            </p>
            <p class="text-3xl font-black text-slate-900 tracking-tight">
                100%
            </p>
        </div>
    </div>

    <!-- Search & Filters -->
    <div
        class="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 p-4 rounded-3xl border border-slate-100"
    >
        <div class="relative w-full md:w-96">
            <Search class="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
                type="text"
                bind:value={searchQuery}
                placeholder="Search policy name, carrier, or type..."
                class="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
            />
        </div>
        <div class="flex items-center gap-2">
            <span
                class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                >Showing {filteredPolicies.length} Policies</span
            >
            <button
                class="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-indigo-600 transition-colors shadow-sm"
            >
                <Download size={18} />
            </button>
        </div>
    </div>

    <!-- Policy Cards Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8">
        {#each filteredPolicies as policy (policy.id)}
            <div
                class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden group flex flex-col"
                transition:scale={{
                    duration: 400,
                    delay: 0,
                    opacity: 0,
                    start: 0.95,
                    easing: quintOut,
                }}
            >
                <div class="p-8 pb-0">
                    <!-- Card Top -->
                    <div class="flex items-start justify-between mb-8">
                        <div class="flex items-center gap-4">
                            <div
                                class="w-14 h-14 rounded-2xl shadow-inner flex items-center justify-center transition-all duration-500 {typeColors[
                                    policy.insuranceType
                                ]}"
                            >
                                <svelte:component
                                    this={typeIcons[policy.insuranceType] ||
                                        Shield}
                                    size={28}
                                    strokeWidth={2.5}
                                />
                            </div>
                            <div>
                                <h3
                                    class="text-xl font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors"
                                >
                                    {policy.policyName}
                                </h3>
                                <p
                                    class="text-slate-400 text-sm font-bold tracking-tight"
                                >
                                    {policy.insurer}
                                </p>
                            </div>
                        </div>
                        <div
                            class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0"
                        >
                            <button
                                on:click={() => editPolicy(policy)}
                                class="p-3 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all"
                            >
                                <Pencil size={18} />
                            </button>
                            <button
                                on:click={() =>
                                    deletePolicy(policy.id, policy.policyName)}
                                class="p-3 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    <!-- Mini Stats Grid -->
                    <div class="grid grid-cols-3 gap-4 mb-8">
                        <div
                            class="bg-slate-50 rounded-2xl p-4 border border-slate-100/50"
                        >
                            <p
                                class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1"
                            >
                                Premium
                            </p>
                            <p
                                class="text-sm font-black text-slate-700 tracking-tight"
                            >
                                ${policy.premiumAmount}
                            </p>
                        </div>
                        <div
                            class="bg-slate-50 rounded-2xl p-4 border border-slate-100/50"
                        >
                            <p
                                class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1"
                            >
                                Interval
                            </p>
                            <p
                                class="text-sm font-black text-slate-700 tracking-tight"
                            >
                                {policy.premiumFrequency}
                            </p>
                        </div>
                        <div
                            class="bg-slate-50 rounded-2xl p-4 border border-slate-100/50"
                        >
                            <p
                                class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1"
                            >
                                Status
                            </p>
                            <div class="flex items-center gap-1.5 mt-0.5">
                                <div
                                    class="w-2 h-2 rounded-full {policy.status ===
                                    'Active'
                                        ? 'bg-emerald-500 animate-pulse'
                                        : 'bg-slate-300'}"
                                ></div>
                                <span
                                    class="text-[11px] font-black text-slate-800 uppercase tracking-tight"
                                    >{policy.status}</span
                                >
                            </div>
                        </div>
                    </div>

                    <!-- Details Accordion Section (Simplified View) -->
                    <div class="space-y-5 mb-8">
                        <div class="flex items-center gap-4 text-slate-600">
                            <div
                                class="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"
                            >
                                <User size={14} />
                            </div>
                            <div>
                                <p
                                    class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                                >
                                    Key Beneficiary
                                </p>
                                <p
                                    class="text-sm font-bold text-slate-700 truncate max-w-[180px]"
                                >
                                    {policy.beneficiaries ||
                                        "No beneficiary specified"}
                                </p>
                            </div>
                        </div>
                        <div class="flex items-center gap-4 text-slate-600">
                            <div
                                class="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"
                            >
                                <FileText size={14} />
                            </div>
                            <div>
                                <p
                                    class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                                >
                                    Policy Number
                                </p>
                                <p
                                    class="text-sm font-bold text-slate-700 tracking-wider font-mono uppercase"
                                >
                                    {policy.policyNumber || "MISSING-ID"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Card Footer / Claims Procedure CTA -->
                <div class="mt-auto p-2">
                    <div
                        class="bg-indigo-600 rounded-[2rem] p-6 text-white flex items-center justify-between group/footer hover:bg-slate-900 transition-colors duration-500 cursor-pointer"
                    >
                        <div>
                            <p
                                class="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1"
                            >
                                Claims Procedure
                            </p>
                            <h4 class="font-bold text-sm tracking-tight">
                                Access Support Guides
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
            <div
                class="col-span-full py-32 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center gap-6"
            >
                <div
                    class="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200"
                >
                    <Shield size={48} />
                </div>
                <div>
                    <h3 class="text-2xl font-black text-slate-900 mb-2">
                        Portfolio Empty
                    </h3>
                    <p class="text-slate-400 max-w-sm mx-auto font-medium">
                        No policies found matching your search. Start building
                        your secure vault by adding your first insurance policy.
                    </p>
                </div>
                <button
                    on:click={() => (showAddModal = true)}
                    class="bg-indigo-600 text-white px-10 py-5 rounded-3xl font-black shadow-2xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all"
                >
                    Initialize Portfolio
                </button>
            </div>
        {/each}
    </div>
</div>

<!-- Premium Add/Edit Modal -->
{#if showAddModal}
    <div
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        transition:fade={{ duration: 300 }}
    >
        <div
            class="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            on:click={resetForm}
        ></div>

        <div
            class="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative"
            transition:slide={{ duration: 500, easing: quintOut }}
        >
            <!-- Modal Header -->
            <div class="p-10 pb-0 flex items-center justify-between">
                <div>
                    <nav
                        class="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-3"
                    >
                        <Activity size={12} />
                        <span>Data Management</span>
                    </nav>
                    <h2
                        class="text-4xl font-black text-slate-900 tracking-tighter"
                    >
                        {isEditing ? "Modify" : "Register"}
                        <span class="text-indigo-600">Policy</span>
                    </h2>
                </div>
                <button
                    on:click={resetForm}
                    class="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:rotate-90 transition-all duration-500"
                >
                    <X size={24} strokeWidth={3} />
                </button>
            </div>

            <div class="flex-1 overflow-y-auto p-10 space-y-12">
                <!-- Group 1: Identity -->
                <section>
                    <h3
                        class="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3"
                    >
                        <span class="w-6 h-[2px] bg-indigo-600 rounded-full"
                        ></span>
                        Policy Identity
                    </h3>
                    <div
                        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        <div class="space-y-3">
                            <label
                                class="text-[11px] font-black text-slate-800 uppercase tracking-wider pl-1"
                                >Policy Title</label
                            >
                            <input
                                type="text"
                                bind:value={newPolicy.policyName}
                                placeholder="e.g. Master Life Policy"
                                class="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                            />
                        </div>
                        <div class="space-y-3">
                            <label
                                class="text-[11px] font-black text-slate-800 uppercase tracking-wider pl-1"
                                >Insurance Classification</label
                            >
                            <select
                                bind:value={newPolicy.insuranceType}
                                class="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none cursor-pointer"
                            >
                                {#each types.filter((t) => t !== "All") as type}
                                    <option value={type}>{type}</option>
                                {/each}
                            </select>
                        </div>
                        <div class="space-y-3">
                            <label
                                class="text-[11px] font-black text-slate-800 uppercase tracking-wider pl-1"
                                >Insurance Carrier</label
                            >
                            <input
                                type="text"
                                bind:value={newPolicy.insurer}
                                placeholder="e.g. Prudential Financial"
                                class="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                            />
                        </div>
                    </div>
                </section>

                <!-- Group 2: Financial -->
                <section
                    class="bg-indigo-50/50 rounded-[2.5rem] p-8 border border-indigo-100/50"
                >
                    <h3
                        class="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-3"
                    >
                        <span class="w-6 h-[2px] bg-indigo-600 rounded-full"
                        ></span>
                        Premium Structure
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div class="space-y-3">
                            <label
                                class="text-[11px] font-black text-slate-800 uppercase tracking-wider pl-1 font-mono"
                                >Premium Amount ($)</label
                            >
                            <div class="relative">
                                <DollarSign
                                    size={16}
                                    class="absolute left-4 top-4.5 text-indigo-600"
                                />
                                <input
                                    type="number"
                                    bind:value={newPolicy.premiumAmount}
                                    class="w-full bg-white border-2 border-transparent focus:border-indigo-600 rounded-2xl p-4 pl-10 text-sm font-black outline-none transition-all shadow-sm"
                                />
                            </div>
                        </div>
                        <div class="space-y-3">
                            <label
                                class="text-[11px] font-black text-slate-800 uppercase tracking-wider pl-1"
                                >Billing Interval</label
                            >
                            <select
                                bind:value={newPolicy.premiumFrequency}
                                class="w-full bg-white border-2 border-transparent focus:border-indigo-600 rounded-2xl p-4 text-sm font-black outline-none transition-all shadow-sm appearance-none cursor-pointer"
                            >
                                <option>Monthly</option>
                                <option>Quarterly</option>
                                <option>Annually</option>
                            </select>
                        </div>
                        <div class="space-y-3">
                            <label
                                class="text-[11px] font-black text-slate-800 uppercase tracking-wider pl-1"
                                >Status Tracking</label
                            >
                            <div
                                class="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-100"
                            >
                                {#each ["Active", "Pending", "Inactive"] as status}
                                    <button
                                        type="button"
                                        on:click={() =>
                                            (newPolicy.status = status as any)}
                                        class="flex-1 py-3 text-[10px] font-black uppercase tracking-tighter rounded-xl transition-all {newPolicy.status ===
                                        status
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-slate-400 hover:bg-slate-50'}"
                                    >
                                        {status}
                                    </button>
                                {/each}
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Group 3: Legacy Details -->
                <section>
                    <h3
                        class="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3"
                    >
                        <span class="w-6 h-[2px] bg-rose-500 rounded-full"
                        ></span>
                        Legacy Information
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="space-y-3">
                            <label
                                class="text-[11px] font-black text-slate-800 uppercase tracking-wider pl-1"
                                >Designated Beneficiaries</label
                            >
                            <input
                                type="text"
                                bind:value={newPolicy.beneficiaries}
                                placeholder="Split 50/50 between children..."
                                class="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                            />
                        </div>
                        <div class="space-y-3">
                            <label
                                class="text-[11px] font-black text-slate-800 uppercase tracking-wider pl-1"
                                >Agent / Point of Contact</label
                            >
                            <input
                                type="text"
                                bind:value={newPolicy.agentName}
                                placeholder="Full name and company name"
                                class="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                            />
                        </div>
                        <div class="space-y-3 md:col-span-2">
                            <label
                                class="text-[11px] font-black text-slate-800 uppercase tracking-wider pl-1 flex items-center gap-2"
                            >
                                Claims Filing Instructions
                                <span
                                    class="bg-rose-100 text-rose-600 px-2 py-0.5 rounded-lg text-[8px] font-black tracking-[0.2em]"
                                    >CRITICAL</span
                                >
                            </label>
                            <textarea
                                bind:value={newPolicy.claimsProcedure}
                                rows="3"
                                placeholder="Detailed step-by-step for the family..."
                                class="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl p-6 text-sm font-bold outline-none transition-all resize-none leading-relaxed"
                            ></textarea>
                        </div>
                    </div>
                </section>
            </div>

            <!-- Modal Actions -->
            <div
                class="p-10 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-6"
            >
                <button
                    on:click={resetForm}
                    class="text-sm font-black text-slate-400 hover:text-slate-900 uppercase tracking-[0.2em] transition-colors"
                >
                    Discard Changes
                </button>
                <button
                    on:click={handleAddPolicy}
                    disabled={!newPolicy.policyName || !newPolicy.insurer}
                    class="bg-indigo-600 text-white px-12 py-5 rounded-3xl font-black shadow-2xl shadow-indigo-600/30 hover:scale-[1.03] active:scale-[0.98] transition-all disabled:opacity-30 disabled:hover:scale-100"
                >
                    Commit to Vault
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
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 1.25rem center;
        padding-right: 3rem;
    }

    /* Range and Number overrides */
    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
</style>
