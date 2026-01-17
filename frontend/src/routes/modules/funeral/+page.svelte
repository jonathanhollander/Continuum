<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import {
        Music,
        Flower,
        MapPin,
        Users,
        DollarSign,
        Scroll,
        CircleCheck,
        Palette,
        Trash2,
        Pencil,
        Plus,
        X,
        Sparkles,
    } from "lucide-svelte";
    import SmartTextarea from "$lib/components/ui/SmartTextarea.svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import EmptyStateGuide from "$lib/components/ui/EmptyStateGuide.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte"; // NEW IMPORT
    import { onMount } from "svelte";
    import { estateProfile } from "$lib/stores/estateStore";
    import { activityLog } from "$lib/stores/activityLog";
    import { UserCircle, MapPin as MapPinIcon, Cross } from "lucide-svelte";
    import FuneralWizard from "$lib/components/modules/funeral/FuneralWizard.svelte";

    import {
        funeralStore,
        type FuneralBudgetItem,
        type FuneralWishes,
    } from "$lib/stores/funeralStore";
    import LegalDisclaimer from "$lib/components/common/LegalDisclaimer.svelte";

    let activeTab = $state("wishes"); // 'wishes' | 'budget'
    let showAddExpense = $state(false);
    let newExpense = $state<Partial<FuneralBudgetItem>>({
        name: "",
        cost: 0,
    });

    let wishes = $derived($funeralStore.wishes);
    let budgetItems = $derived($funeralStore.budget);

    // Quick Edit Helpers for Wishes
    function editWish(field: keyof FuneralWishes, label: string) {
        if (field === "music" || field === "colors") return;
        const current = $funeralStore.wishes[field];
        const val = prompt(`Update ${label}:`, String(current));
        if (val !== null) {
            funeralStore.update((data) => ({
                ...data,
                wishes: { ...data.wishes, [field]: val },
            }));
        }
    }

    function addSong() {
        const song = prompt("Enter song name (Artist - Title):");
        if (song) {
            funeralStore.update((data) => ({
                ...data,
                wishes: { ...data.wishes, music: [...data.wishes.music, song] },
            }));
        }
    }

    function removeSong(index: number) {
        funeralStore.update((data) => ({
            ...data,
            wishes: {
                ...data.wishes,
                music: data.wishes.music.filter((_, i) => i !== index),
            },
        }));
    }

    function saveExpense() {
        if (!newExpense.name) return;

        if (newExpense.id) {
            // Edit Mode
            funeralStore.update((data) => ({
                ...data,
                budget: data.budget.map((item) =>
                    item.id === newExpense.id
                        ? ({
                              ...item,
                              ...newExpense,
                              cost: Number(newExpense.cost),
                              estimated: Number(newExpense.cost),
                          } as FuneralBudgetItem)
                        : item,
                ),
            }));

            // Log UPDATE
            activityLog.logEvent({
                module: "Funeral Planning",
                action: "UPDATE",
                entityType: "Budget Item",
                entityId: newExpense.id,
                entityName: newExpense.name || "Unnamed Item",
                changes: [], // Simplified for now
                userContext: $estateProfile.ownerName || "User",
            });
        } else {
            // Create Mode
            const newId = crypto.randomUUID();
            funeralStore.update((data) => ({
                ...data,
                budget: [
                    ...data.budget,
                    {
                        id: newId,
                        name: newExpense.name || "Expense",
                        cost: Number(newExpense.cost),
                        estimated: Number(newExpense.cost),
                    },
                ],
            }));

            // Log CREATE
            activityLog.logEvent({
                module: "Funeral Planning",
                action: "CREATE",
                entityType: "Budget Item",
                entityId: newId,
                entityName: newExpense.name,
                userContext: $estateProfile.ownerName || "User",
            });
        }
        resetExpenseForm();
    }

    function editExpense(item: FuneralBudgetItem) {
        newExpense = { ...item };
        showAddExpense = true;
    }

    function resetExpenseForm() {
        newExpense = { id: undefined, name: "", cost: 0 };
        showAddExpense = false;
    }

    function removeExpense(id: string) {
        if (!confirm("Remove expense?")) return;
        funeralStore.update((data) => ({
            ...data,
            budget: data.budget.filter((i) => i.id !== id),
        }));
    }

    function updateMood(mood: string) {
        funeralStore.update((data) => ({
            ...data,
            wishes: { ...data.wishes, mood },
        }));
    }

    // Reactive Updates
    let totalBudget = $derived(
        $funeralStore.budget.reduce((acc, item) => acc + item.cost, 0),
    );
    let totalEstimated = $derived(
        $funeralStore.budget.reduce(
            (acc, item) => acc + (item.estimated || item.cost),
            0,
        ),
    );
    let variance = $derived(totalEstimated - totalBudget);

    function prefillEstimates() {
        if (
            !confirm(
                "This will add standard industry average costs (2021 NFDA) to your budget. Continue?",
            )
        )
            return;

        const standardItems = [
            { name: "Basic Services Fees", cost: 2300, estimated: 2300 },
            { name: "Embalming & Prep", cost: 775, estimated: 775 },
            { name: "Viewing / Visitation", cost: 450, estimated: 450 },
            { name: "Funeral Ceremony", cost: 515, estimated: 515 },
            { name: "Hearse", cost: 350, estimated: 350 },
            { name: "Transfer of Remains", cost: 350, estimated: 350 },
            { name: "Casket (Metal)", cost: 2500, estimated: 2500 },
            { name: "Vault", cost: 1572, estimated: 1572 },
            { name: "Memorial Printed Package", cost: 183, estimated: 183 },
        ];

        standardItems.forEach((std) => {
            funeralStore.update((data) => ({
                ...data,
                budget: [
                    ...data.budget,
                    {
                        id: crypto.randomUUID(),
                        name: std.name,
                        cost: std.cost,
                        estimated: std.estimated,
                    },
                ],
            }));
        });
    }
</script>

<div class="max-w-6xl mx-auto p-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="mb-12 text-center">
        <div
            class="inline-flex items-center justify-center p-4 bg-teal-100 text-teal-800 rounded-full mb-6"
        >
            <Scroll size={48} />
        </div>

        <div class="max-w-xl mx-auto mb-6">
            <AIPromptBar context="obituary" />
        </div>

        <h1 class="font-serif font-bold text-4xl text-[#304743] mb-4">
            Funeral Planner
        </h1>
        <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
            Relieve the burden of decision-making. Plan the details, manage the
            budget, and ensure your wishes are honored.
        </p>

        <div class="mt-8 max-w-3xl mx-auto text-left">
            <LegalDisclaimer
                variant="banner"
                title="Important Note"
                message="Funeral laws and requirements vary significantly by state and country. While these wishes guide your family, some jurisdictions require specific legal forms for binding disposition instructions."
            />
        </div>
    </div>

    <!-- Tabs -->
    <div class="flex justify-center mb-8">
        <div class="bg-gray-100 p-1.5 rounded-xl inline-flex gap-2">
            <button
                class="px-6 py-2.5 rounded-lg font-bold text-sm transition-all {activeTab ===
                'wishes'
                    ? 'bg-white shadow-sm text-[#304743]'
                    : 'text-gray-500 hover:text-gray-900'}"
                onclick={() => (activeTab = "wishes")}
            >
                My Wishes & Vibe
            </button>
            <button
                class="px-6 py-2.5 rounded-lg font-bold text-sm transition-all {activeTab ===
                'budget'
                    ? 'bg-white shadow-sm text-[#304743]'
                    : 'text-gray-500 hover:text-gray-900'}"
                onclick={() => (activeTab = "budget")}
            >
                Budget Calculator
            </button>
        </div>
    </div>

    <div
        class="bg-white rounded-3xl border border-border shadow-sm overflow-hidden min-h-[500px] p-8"
    >
        <!-- Memorial Subject Header (Synced) -->
        <div
            class="mb-10 p-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6"
        >
            <div class="flex items-center gap-4">
                <div class="p-3 bg-white rounded-xl shadow-sm text-slate-400">
                    <UserCircle size={32} />
                </div>
                <div>
                    <h2 class="text-xl font-bold text-slate-800">
                        Memorial for {$estateProfile.ownerName ||
                            "Valued Member"}
                    </h2>
                    <p class="text-sm text-slate-500 italic">
                        Pre-filled from Estate Profile
                    </p>
                </div>
            </div>

            <div class="h-10 w-px bg-slate-200 hidden md:block"></div>

            <div class="flex items-center gap-4">
                <div class="text-right">
                    <p
                        class="text-xs font-bold uppercase tracking-widest text-slate-400"
                    >
                        Chief Coordinator
                    </p>
                    <p class="font-bold text-slate-700">
                        {$estateProfile.executorName || "None Designated"}
                    </p>
                </div>
                <div class="p-3 bg-white rounded-xl shadow-sm text-indigo-500">
                    <Users size={24} />
                </div>
            </div>

            <div class="h-10 w-px bg-slate-200 hidden md:block"></div>

            <div class="flex items-center gap-4">
                <div class="text-right">
                    <p
                        class="text-xs font-bold uppercase tracking-widest text-slate-400"
                    >
                        Local Area
                    </p>
                    <p class="font-bold text-slate-700">
                        {$estateProfile.legalCityState || "Not Set"}
                    </p>
                </div>
                <div class="p-3 bg-white rounded-xl shadow-sm text-emerald-500">
                    <MapPinIcon size={24} />
                </div>
            </div>
        </div>

        {#if activeTab === "wishes"}
            <FuneralWizard />
        {/if}
        {#if activeTab === "budget"}
            <!-- BUDGET TAB -->
            <div in:fade={{ duration: 300 }}>
                {#if budgetItems.length === 0}
                    <!-- GHOST ROWS -->
                    <div class="grid gap-4">
                        <GhostRow
                            type="Budget Item"
                            onClick={prefillEstimates}
                        />
                        <GhostRow
                            type="Budget Item"
                            onClick={prefillEstimates}
                        />
                        <GhostRow
                            type="Budget Item"
                            onClick={prefillEstimates}
                        />
                    </div>
                    <!-- <EmptyStateGuide type="funeral" onAdd={prefillEstimates} /> -->
                    <div class="text-center mt-6">
                        <p class="text-stone-500 text-sm mb-4">
                            Start with industry estimates or build your own.
                        </p>
                        <div class="flex justify-center gap-4">
                            <button
                                onclick={prefillEstimates}
                                class="text-[#4A7C74] font-bold text-sm bg-[#4A7C74]/10 px-4 py-2 rounded-lg hover:bg-[#4A7C74]/20 transition-colors"
                            >
                                Auto-Fill Common Costs
                            </button>
                            <button
                                onclick={() => {
                                    newExpense = {
                                        name: "New Expense",
                                        cost: 0,
                                    };
                                    showAddExpense = true;
                                }}
                                class="text-stone-500 font-bold text-sm hover:text-stone-700 hover:underline px-4 py-2"
                            >
                                Manually Add Item
                            </button>
                        </div>
                    </div>
                {:else}
                    <!-- Total Cost / Comparison -->
                    <div
                        class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-end"
                    >
                        <div
                            class="p-6 rounded-2xl bg-[#304743] text-white shadow-lg"
                        >
                            <div
                                class="text-xs font-bold uppercase tracking-wider opacity-70 mb-1"
                            >
                                Total Estimated Cost
                            </div>
                            <div class="text-4xl font-serif font-bold">
                                ${totalBudget.toLocaleString()}
                            </div>
                        </div>

                        <div
                            class="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm"
                        >
                            <div
                                class="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1"
                            >
                                Industry Avg. (Projected)
                            </div>
                            <div class="text-2xl font-bold text-stone-700">
                                ${totalEstimated.toLocaleString()}
                            </div>
                        </div>

                        <div
                            class="p-6 rounded-2xl h-fit {variance >= 0
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-rose-50 text-rose-800'}"
                        >
                            <div class="flex items-center gap-2 font-bold mb-1">
                                Saving vs. Avg
                            </div>
                            <p class="text-sm opacity-90 leading-relaxed">
                                {#if variance >= 0}
                                    You are projected to save <span
                                        class="font-bold underline"
                                        >${variance.toLocaleString()}</span
                                    > compared to the national average.
                                {:else}
                                    Your plan is currently <span
                                        class="font-bold underline"
                                        >${Math.abs(
                                            variance,
                                        ).toLocaleString()}</span
                                    > over the national average.
                                {/if}
                            </p>
                        </div>
                    </div>

                    <!-- Budget Table -->
                    <div
                        class="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden"
                    >
                        <div
                            class="px-6 py-4 border-b border-stone-100 flex justify-between items-center"
                        >
                            <h3
                                class="font-bold text-stone-700 flex items-center gap-2"
                            >
                                <DollarSign size={18} /> Budget Breakdown
                            </h3>
                            <div class="flex gap-2">
                                <button
                                    onclick={prefillEstimates}
                                    class="text-xs font-bold text-stone-500 hover:text-[#4A7C74] px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors"
                                >
                                    Auto-Fill Common Costs
                                </button>
                                <button
                                    onclick={() => {
                                        newExpense = { name: "", cost: 0 };
                                        showAddExpense = true;
                                    }}
                                    class="bg-[#4A7C74] hover:bg-[#3b635d] text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-all"
                                >
                                    + Add Item
                                </button>
                            </div>
                        </div>

                        <div class="divide-y divide-stone-100">
                            {#each budgetItems as item (item.id)}
                                <div
                                    class="px-6 py-4 flex items-center justify-between group hover:bg-stone-50 transition-colors"
                                >
                                    <div>
                                        <div class="font-bold text-stone-800">
                                            {item.name}
                                        </div>
                                        <div class="text-xs text-stone-400">
                                            Estimated: ${item.estimated?.toLocaleString()}
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-6">
                                        <div class="font-bold text-stone-700">
                                            ${item.cost.toLocaleString()}
                                        </div>
                                        <div
                                            class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <button
                                                onclick={() =>
                                                    editExpense(item)}
                                                class="p-2 text-stone-400 hover:text-[#4A7C74] bg-white border border-stone-200 rounded-full shadow-sm"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onclick={() =>
                                                    removeExpense(item.id)}
                                                class="p-2 text-stone-400 hover:text-red-500 bg-white border border-stone-200 rounded-full shadow-sm"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        {/if}

        <!-- Expense Modal -->
        {#if showAddExpense}
            <div
                class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                transition:fade
            >
                <div
                    class="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
                    transition:scale={{ start: 0.95 }}
                >
                    <div
                        class="bg-[#304743] p-6 flex justify-between items-start text-white"
                    >
                        <div>
                            <h3 class="font-serif font-bold text-xl">
                                {newExpense.id ? "Edit Item" : "New Expense"}
                            </h3>
                            <p class="text-emerald-100/80 text-sm mt-1">
                                Add a line item to your funeral budget.
                            </p>
                        </div>
                        <button
                            onclick={resetExpenseForm}
                            class="text-white/50 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <div class="p-6 space-y-4">
                        <div class="space-y-2">
                            <label
                                class="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                                >Item Name</label
                            >
                            <input
                                bind:value={newExpense.name}
                                class="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#4A7C74] outline-none font-medium"
                                placeholder="e.g. Venue Rental"
                            />
                        </div>
                        <div class="space-y-2">
                            <label
                                class="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                                >Cost ($)</label
                            >
                            <input
                                type="number"
                                bind:value={newExpense.cost}
                                class="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#4A7C74] outline-none font-medium"
                                placeholder="0.00"
                            />
                        </div>
                        <button
                            onclick={saveExpense}
                            disabled={!newExpense.name}
                            class="w-full py-4 bg-[#4A7C74] hover:bg-[#3b635d] text-white font-bold rounded-xl shadow-lg shadow-[#4A7C74]/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save Expense
                        </button>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>
