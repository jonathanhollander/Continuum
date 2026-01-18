<script lang="ts">
    import {
        advancedAssetStore,
        type AssetTransaction,
        type MaintenanceLog,
        type InsuranceClaim,
    } from "$lib/stores/advancedAssetStore";
    import {
        digitalAssetsStore,
        type DigitalAccount,
        type ClosurePreference,
    } from "$lib/stores/digitalAssetsStore.svelte";
    import {
        Layers,
        Repeat,
        Wrench,
        FileCheck,
        Skull,
        Plus,
        Search,
        Filter,
        ArrowUpRight,
        ArrowDownLeft,
        MoreVertical,
        Trash2,
        Calendar,
        DollarSign,
        Clock,
        CircleCheck,
        CircleAlert,
        ShieldAlert,
        Monitor,
    } from "lucide-svelte";
    import { fade, slide, scale } from "svelte/transition";

    let activeTab = $state<
        "transactions" | "maintenance" | "claims" | "killswitch"
    >("transactions");
    let searchQuery = $state("");

    // Modals
    let showAddModal = $state(false);
    let addType = $state<"transaction" | "maintenance" | "claim" | "account">(
        "transaction",
    );

    // Temp Form States
    let newTx = $state<Partial<AssetTransaction>>({
        type: "purchase",
        amount: 0,
        description: "",
        date: new Date().toISOString().split("T")[0],
    });
    let newMaint = $state<Partial<MaintenanceLog>>({
        item: "",
        cost: 0,
        date: new Date().toISOString().split("T")[0],
    });
    let newClaim = $state<Partial<InsuranceClaim>>({
        status: "pending",
        amountClaimed: 0,
        dateFiled: new Date().toISOString().split("T")[0],
    });
    let newAccount = $state<Partial<DigitalAccount>>({
        platform: "",
        username: "",
        preference: "memorialize",
        priority: "medium",
    });

    function handleAdd() {
        if (addType === "transaction")
            advancedAssetStore.addTransaction(
                newTx as Omit<AssetTransaction, "id">,
            );
        if (addType === "maintenance")
            advancedAssetStore.addMaintenance(
                newMaint as Omit<MaintenanceLog, "id">,
            );
        if (addType === "claim")
            advancedAssetStore.addClaim(newClaim as Omit<InsuranceClaim, "id">);
        if (addType === "account")
            digitalAssetsStore.addAccount(
                newAccount as Omit<DigitalAccount, "id" | "isClosed">,
            );
        showAddModal = false;
    }

    const tabs = [
        { id: "transactions", label: "Transactions", icon: Repeat },
        { id: "maintenance", label: "Maintenance", icon: Wrench },
        { id: "claims", label: "Claims", icon: FileCheck },
        { id: "killswitch", label: "Kill Switch", icon: Skull },
    ];

    let filteredTransactions = $derived(
        $advancedAssetStore.transactions.filter((t) =>
            t.description.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );
    let filteredMaintenance = $derived(
        $advancedAssetStore.maintenance.filter((m) =>
            m.item.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );
    let filteredClaims = $derived(
        $advancedAssetStore.claims.filter(
            (c) =>
                c.claimNumber
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                c.note.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );
    let filteredAccounts = $derived(
        $digitalAssetsStore.filter((a) =>
            a.platform.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );
</script>

<div
    class="max-w-[1400px] mx-auto p-8 space-y-10 animate-in fade-in duration-500"
>
    <!-- Header -->
    <header
        class="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2"
    >
        <div class="space-y-2">
            <h1
                class="text-4xl font-black text-slate-900 tracking-tight font-serif flex items-center gap-4"
            >
                <Layers class="text-indigo-600" size={36} />
                Advanced Registry Hub
            </h1>
            <p class="text-slate-500 text-lg font-medium">
                Precision tracking for assets, maintenance, and digital
                legacies.
            </p>
        </div>

        <div class="flex items-center gap-4">
            <div class="relative w-full md:w-64">
                <Search
                    class="absolute left-3.5 top-2.5 text-slate-400"
                    size={18}
                />
                <input
                    bind:value={searchQuery}
                    placeholder="Search registry..."
                    class="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                />
            </div>
            <button
                onclick={() => {
                    addType =
                        activeTab === "killswitch"
                            ? "account"
                            : (activeTab as any);
                    showAddModal = true;
                }}
                class="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
            >
                <Plus size={18} />
                Add Record
            </button>
        </div>
    </header>

    <!-- Tabs -->
    <div
        class="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200 shadow-inner"
    >
        {#each tabs as tab}
            <button
                onclick={() => (activeTab = tab.id as any)}
                class="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all {activeTab ===
                tab.id
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}"
            >
                <svelte:component this={tab.icon} size={16} />
                {tab.label}
            </button>
        {/each}
    </div>

    <!-- Content Sections -->
    <div
        class="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col"
    >
        {#if activeTab === "transactions"}
            <div class="overflow-x-auto" in:fade>
                <table class="w-full text-left border-collapse">
                    <thead class="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th
                                class="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest"
                                >Date</th
                            >
                            <th
                                class="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest"
                                >Description</th
                            >
                            <th
                                class="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center"
                                >Type</th
                            >
                            <th
                                class="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right"
                                >Amount</th
                            >
                            <th
                                class="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right"
                                >Actions</th
                            >
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        {#each filteredTransactions as tx (tx.id)}
                            <tr
                                class="hover:bg-slate-50/50 transition-colors group"
                            >
                                <td
                                    class="px-8 py-5 text-sm font-bold text-slate-600 font-mono italic"
                                    >{tx.date}</td
                                >
                                <td class="px-8 py-5">
                                    <p
                                        class="text-sm font-black text-slate-900"
                                    >
                                        {tx.description}
                                    </p>
                                    <p
                                        class="text-[10px] text-slate-400 font-bold uppercase tracking-tighter"
                                    >
                                        Asset ID: {tx.assetId}
                                    </p>
                                </td>
                                <td class="px-8 py-5 text-center">
                                    <span
                                        class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border {tx.type ===
                                        'purchase'
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            : 'bg-amber-50 text-amber-600 border-amber-100'}"
                                    >
                                        {tx.type}
                                    </span>
                                </td>
                                <td
                                    class="px-8 py-5 text-right font-black text-slate-900 font-mono"
                                >
                                    {tx.type === "sale"
                                        ? "+"
                                        : "-"}${tx.amount.toLocaleString()}
                                </td>
                                <td class="px-8 py-5 text-right">
                                    <button
                                        onclick={() =>
                                            advancedAssetStore.removeTransaction(
                                                tx.id,
                                            )}
                                        class="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
                {#if filteredTransactions.length === 0}
                    <div class="p-20 text-center space-y-4">
                        <Repeat size={48} class="mx-auto text-slate-100" />
                        <p class="text-slate-400 font-medium italic">
                            No transactions recorded yet.
                        </p>
                    </div>
                {/if}
            </div>
        {:else if activeTab === "maintenance"}
            <!-- Similar table for maintenance -->
            <div class="p-10 space-y-6" in:fade>
                <div
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {#each filteredMaintenance as log (log.id)}
                        <div
                            class="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4 hover:shadow-md transition-all"
                        >
                            <div class="flex items-center justify-between">
                                <div
                                    class="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm"
                                >
                                    <Wrench size={20} />
                                </div>
                                <span
                                    class="px-3 py-1 bg-white text-[10px] font-black uppercase text-slate-400 rounded-full border border-slate-100"
                                    >{log.date}</span
                                >
                            </div>
                            <h3 class="font-bold text-slate-900">{log.item}</h3>
                            <div
                                class="flex items-center justify-between text-xs text-slate-500 font-medium"
                            >
                                <span>Provider: {log.provider}</span>
                                <span class="text-slate-900 font-black"
                                    >${log.cost}</span
                                >
                            </div>
                            {#if log.nextDueDate}
                                <div
                                    class="pt-3 border-t border-slate-100 flex items-center gap-2 text-[10px] font-black uppercase text-amber-600"
                                >
                                    <Clock size={12} />
                                    Next Due: {log.nextDueDate}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
                {#if filteredMaintenance.length === 0}
                    <div class="p-20 text-center space-y-4">
                        <Wrench size={48} class="mx-auto text-slate-100" />
                        <p class="text-slate-400 font-medium italic">
                            No maintenance logs found.
                        </p>
                    </div>
                {/if}
            </div>
        {:else if activeTab === "claims"}
            <!-- Claims view -->
            <div class="p-10" in:fade>
                <div class="space-y-4">
                    {#each filteredClaims as claim (claim.id)}
                        <div
                            class="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-3xl hover:border-indigo-200 transition-all group"
                        >
                            <div class="flex items-center gap-6">
                                <div
                                    class="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all"
                                >
                                    <FileCheck size={28} />
                                </div>
                                <div>
                                    <h3
                                        class="font-bold text-lg text-slate-900 uppercase"
                                    >
                                        Claim #{claim.claimNumber}
                                    </h3>
                                    <p
                                        class="text-sm text-slate-500 font-medium"
                                    >
                                        {claim.note}
                                    </p>
                                </div>
                            </div>
                            <div class="flex items-center gap-10">
                                <div class="text-right">
                                    <p
                                        class="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1"
                                    >
                                        Status
                                    </p>
                                    <span
                                        class="px-3 py-1 rounded-full text-[10px] font-black uppercase {claim.status ===
                                        'paid'
                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                            : 'bg-amber-50 text-amber-600 border border-amber-100'}"
                                    >
                                        {claim.status}
                                    </span>
                                </div>
                                <div class="text-right">
                                    <p
                                        class="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1"
                                    >
                                        Claimed
                                    </p>
                                    <p
                                        class="font-black text-slate-900 font-mono"
                                    >
                                        ${claim.amountClaimed.toLocaleString()}
                                    </p>
                                </div>
                                <button
                                    onclick={() =>
                                        advancedAssetStore.removeClaim(
                                            claim.id,
                                        )}
                                    class="p-2 text-slate-200 hover:text-rose-500 transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {:else if activeTab === "killswitch"}
            <!-- Digital Kill Switch center view -->
            <div class="p-10 space-y-10" in:fade>
                <div
                    class="bg-rose-50 border border-rose-100 p-8 rounded-[2rem] flex items-center gap-8 relative overflow-hidden"
                >
                    <div
                        class="absolute -right-10 -bottom-10 opacity-5 rotate-12 pointer-events-none"
                    >
                        <ShieldAlert size={200} />
                    </div>
                    <div
                        class="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center shrink-0 shadow-inner"
                    >
                        <Skull size={40} />
                    </div>
                    <div class="space-y-2 relative z-10">
                        <h2 class="text-2xl font-black text-rose-900">
                            Digital Inheritance Protocols
                        </h2>
                        <p
                            class="text-rose-800/70 max-w-2xl font-medium leading-relaxed"
                        >
                            Define exactly how your online presence should be
                            managed. High-priority accounts should include
                            explicit instructions for executors regarding
                            memorialization or total data deletion.
                        </p>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {#each filteredAccounts as acc (acc.id)}
                        <div
                            class="bg-white border-2 border-slate-50 rounded-[2.5rem] p-8 space-y-6 hover:border-indigo-100 transition-all shadow-sm"
                        >
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-4">
                                    <div
                                        class="p-3 bg-slate-900 text-white rounded-2xl"
                                    >
                                        <Monitor size={20} />
                                    </div>
                                    <div>
                                        <h3
                                            class="font-black text-slate-900 text-xl tracking-tight uppercase"
                                        >
                                            {acc.platform}
                                        </h3>
                                        <p
                                            class="text-[10px] font-black text-slate-400 tracking-[0.2em]"
                                        >
                                            {acc.username || "@username"}
                                        </p>
                                    </div>
                                </div>
                                <div class="flex flex-col items-end gap-2">
                                    <span
                                        class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider {acc.priority ===
                                        'high'
                                            ? 'bg-rose-100 text-rose-700'
                                            : 'bg-slate-100 text-slate-500'}"
                                    >
                                        {acc.priority} Priority
                                    </span>
                                    <button
                                        onclick={() =>
                                            digitalAssetsStore.toggleClosure(
                                                acc.id,
                                            )}
                                        class="flex items-center gap-2 group"
                                    >
                                        <div
                                            class="w-10 h-5 rounded-full relative transition-all {acc.isClosed
                                                ? 'bg-rose-500'
                                                : 'bg-slate-200'}"
                                        >
                                            <div
                                                class="absolute top-1 w-3 h-3 bg-white rounded-full transition-all {acc.isClosed
                                                    ? 'right-1'
                                                    : 'left-1'}"
                                            ></div>
                                        </div>
                                        <span
                                            class="text-[10px] font-black uppercase text-slate-400 group-hover:text-slate-900 transition-colors"
                                            >Closed</span
                                        >
                                    </button>
                                </div>
                            </div>

                            <div
                                class="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2"
                            >
                                <h4
                                    class="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"
                                >
                                    <ArrowUpRight
                                        size={12}
                                        class="text-indigo-600"
                                    />
                                    Final Instruction
                                </h4>
                                <p
                                    class="text-sm font-bold text-slate-700 italic"
                                >
                                    "{acc.instructions}"
                                </p>
                                <div
                                    class="pt-3 border-t border-slate-200 mt-2 flex items-center justify-between"
                                >
                                    <div class="flex items-center gap-2">
                                        <span
                                            class="w-2 h-2 rounded-full {acc.preference ===
                                            'delete'
                                                ? 'bg-rose-500'
                                                : 'bg-indigo-500'}"
                                        ></span>
                                        <span
                                            class="text-[10px] font-black uppercase text-slate-600 tracking-wider"
                                            >Protocol: {acc.preference}</span
                                        >
                                    </div>
                                    {#if acc.isClosed && acc.closureDate}
                                        <span
                                            class="text-[9px] font-bold text-rose-400 italic"
                                            >Deactivated on {new Date(
                                                acc.closureDate,
                                            ).toLocaleDateString()}</span
                                        >
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
</div>

{#if showAddModal}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
        transition:fade
    >
        <div
            class="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-white/20"
            transition:scale={{ start: 0.95, duration: 300 }}
        >
            <div
                class="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50"
            >
                <h3
                    class="text-xl font-black text-slate-900 uppercase tracking-tight"
                >
                    Add {addType}
                </h3>
                <button
                    onclick={() => (showAddModal = false)}
                    class="text-slate-400 hover:text-slate-900 transition-colors"
                >
                    <Trash2 size={24} />
                </button>
            </div>

            <div class="p-10 space-y-6">
                {#if addType === "transaction"}
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label
                                    for="asset-id"
                                    class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1"
                                    >Asset ID</label
                                >
                                <input
                                    id="asset-id"
                                    bind:value={newTx.assetId}
                                    class="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                                    placeholder="RE-101"
                                />
                            </div>
                            <div class="space-y-2">
                                <label
                                    for="tx-date"
                                    class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1"
                                    >Date</label
                                >
                                <input
                                    id="tx-date"
                                    type="date"
                                    bind:value={newTx.date}
                                    class="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                                />
                            </div>
                        </div>
                        <div class="space-y-2">
                            <label
                                for="tx-description"
                                class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1"
                                >Description</label
                            >
                            <input
                                id="tx-description"
                                bind:value={newTx.description}
                                class="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                                placeholder="Quarterly Valuation"
                            />
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label
                                    for="tx-type"
                                    class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1"
                                    >Type</label
                                >
                                <select
                                    id="tx-type"
                                    bind:value={newTx.type}
                                    class="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold appearance-none"
                                >
                                    <option value="purchase">Purchase</option>
                                    <option value="sale">Sale</option>
                                    <option value="valuation_update"
                                        >Valuation Update</option
                                    >
                                </select>
                            </div>
                            <div class="space-y-2">
                                <label
                                    for="tx-amount"
                                    class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1"
                                    >Amount ($)</label
                                >
                                <input
                                    id="tx-amount"
                                    type="number"
                                    bind:value={newTx.amount}
                                    class="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold font-mono"
                                />
                            </div>
                        </div>
                    </div>
                {:else if addType === "maintenance"}
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <label
                                for="maint-item"
                                class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1"
                                >Item / Task</label
                            >
                            <input
                                id="maint-item"
                                bind:value={newMaint.item}
                                class="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                                placeholder="Roof Inspection"
                            />
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label
                                    for="maint-cost"
                                    class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1"
                                    >Cost ($)</label
                                >
                                <input
                                    id="maint-cost"
                                    type="number"
                                    bind:value={newMaint.cost}
                                    class="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold font-mono"
                                />
                            </div>
                            <div class="space-y-2">
                                <label
                                    for="maint-date"
                                    class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1"
                                    >Date</label
                                >
                                <input
                                    id="maint-date"
                                    type="date"
                                    bind:value={newMaint.date}
                                    class="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                                />
                            </div>
                        </div>
                    </div>
                {:else if addType === "claim"}
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <label
                                for="claim-number"
                                class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1"
                                >Claim Number</label
                            >
                            <input
                                id="claim-number"
                                bind:value={newClaim.claimNumber}
                                class="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                                placeholder="CL-882299"
                            />
                        </div>
                        <div class="space-y-2">
                            <label
                                for="claim-note"
                                class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1"
                                >Note / Details</label
                            >
                            <textarea
                                id="claim-note"
                                bind:value={newClaim.note}
                                class="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                                rows="3"
                            ></textarea>
                        </div>
                    </div>
                {:else if addType === "account"}
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label
                                    for="platform-input"
                                    class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1"
                                    >Platform</label
                                >
                                <input
                                    id="platform-input"
                                    bind:value={newAccount.platform}
                                    class="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                                    placeholder="E.g. Netflix"
                                />
                            </div>
                            <div class="space-y-2">
                                <label
                                    for="username-input"
                                    class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1"
                                    >Username / ID</label
                                >
                                <input
                                    id="username-input"
                                    bind:value={newAccount.username}
                                    class="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                                    placeholder="user@gmail.com"
                                />
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label
                                    for="preference-select"
                                    class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1"
                                    >Preference</label
                                >
                                <select
                                    id="preference-select"
                                    bind:value={newAccount.preference}
                                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#304743] outline-none transition-all"
                                >
                                    <option value="memorialize"
                                        >Memorialize</option
                                    >
                                    <option value="delete"
                                        >Delete / Close</option
                                    >
                                    <option value="transfer"
                                        >Transfer Ownership</option
                                    >
                                </select>
                            </div>
                            <div class="space-y-2">
                                <label
                                    for="priority-select"
                                    class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1"
                                    >Priority</label
                                >
                                <select
                                    id="priority-select"
                                    bind:value={newAccount.priority}
                                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#304743] outline-none transition-all"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>
                        <div class="space-y-2">
                            <label
                                for="final-instructions"
                                class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1"
                                >Final Instructions</label
                            >
                            <textarea
                                id="final-instructions"
                                bind:value={newAccount.instructions}
                                placeholder="Any specific details about handling this item..."
                                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#304743] outline-none transition-all h-24 resize-none"
                            ></textarea>
                        </div>
                    </div>
                {/if}

                <div class="pt-6 flex items-center gap-4">
                    <button
                        onclick={handleAdd}
                        class="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
                    >
                        Confirm Registry Entry
                    </button>
                    <button
                        onclick={() => (showAddModal = false)}
                        class="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    :global(.paper-texture) {
        background-color: #fff;
        background-image: linear-gradient(
                90deg,
                transparent 79px,
                #abced4 79px,
                #abced4 81px,
                transparent 81px
            ),
            linear-gradient(#eee 0.1em, transparent 0.1em);
        background-size: 100% 1.2em;
    }
</style>
