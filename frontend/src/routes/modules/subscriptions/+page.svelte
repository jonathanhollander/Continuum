<script lang="ts">
    import {
        Receipt,
        Plus,
        CircleAlert,
        TrendingUp,
        Filter,
        X,
        Pencil,
    } from "lucide-svelte";
    import SubscriptionRow from "$lib/components/modules/subscriptions/SubscriptionRow.svelte";
    import EmptyStateGuide from "$lib/components/ui/EmptyStateGuide.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte"; // NEW IMPORT
    import { onMount, tick } from "svelte";
    import { estateProfile } from "$lib/stores/estateStore";
    import { activityLog } from "$lib/stores/activityLog";
    import { fade, scale } from "svelte/transition";
    import { FileText, Download, Printer } from "lucide-svelte";
    import { getStored, setStored } from "$lib/stores/persistence";

    type Subscription = {
        id: string;
        name: string;
        cost: number;
        cycle: "Monthly" | "Yearly";
        paymentMethod: string;
        nextBilling: string;
        difficulty: "Easy" | "Medium" | "Hard";
        cancellationInstructions: string;
        loginUrl?: string;
        notes?: string;
    };

    let subscriptions: Subscription[] = [];
    let showAddForm = false;
    let newSub: Partial<Subscription> & { id?: string } = {
        difficulty: "Easy",
        cycle: "Monthly",
        cost: 0,
    };

    let selectedSubForLetter: Subscription | null = null;
    let showLetterModal = false;
    let customLetterContent = "";

    function generateDefaultLetter(sub: Subscription) {
        return `
            <p>Dear Customer Service Team,</p>
            
            <p>Please accept this formal request to cancel the account and all associated services for <strong>${$estateProfile.ownerName || "[Name Not Set]"}</strong>, effective immediately.</p>
            
            <p><strong>Account Details:</strong></p>
            <ul>
                <li>Service: ${sub.name}</li>
                <li>Billing Address: ${$estateProfile.legalAddress || "[Address Not Set]"}</li>
                <li>Payment Method: ${sub.paymentMethod || "On File"}</li>
            </ul>

            <p>This request is being made on behalf of the estate by the designated executor. We request that you confirm this cancellation in writing and provide a final statement of account.</p>
            
            <p>Thank you for your prompt attention to this matter.</p>
        `;
    }

    onMount(() => {
        subscriptions = getStored("subscriptions", []);
    });

    function save() {
        setStored("subscriptions", subscriptions);
    }

    function saveSubscription() {
        if (!newSub.name) return;

        if (newSub.id) {
            // Edit Mode
            const oldSub = subscriptions.find((s) => s.id === newSub.id);
            const changes = [];

            if (oldSub) {
                if (oldSub.name !== newSub.name)
                    changes.push({
                        field: "name",
                        oldValue: oldSub.name,
                        newValue: newSub.name,
                    });
                if (oldSub.cost !== newSub.cost)
                    changes.push({
                        field: "cost",
                        oldValue: oldSub.cost,
                        newValue: newSub.cost,
                    });
                if (oldSub.cycle !== newSub.cycle)
                    changes.push({
                        field: "cycle",
                        oldValue: oldSub.cycle,
                        newValue: newSub.cycle,
                    });
            }

            subscriptions = subscriptions.map((s) =>
                s.id === newSub.id ? ({ ...newSub } as Subscription) : s,
            );

            // Log UPDATE
            activityLog.logEvent({
                module: "Subscriptions",
                action: "UPDATE",
                entityType: "Subscription",
                entityId: newSub.id,
                entityName: newSub.name || "Unnamed Subscription",
                changes,
                userContext: $estateProfile.ownerName || "User",
            });
        } else {
            // Create Mode
            const newId = crypto.randomUUID();
            subscriptions = [
                ...subscriptions,
                {
                    id: newId,
                    name: newSub.name || "Unknown Service",
                    cost: Number(newSub.cost) || 0,
                    cycle: newSub.cycle || "Monthly",
                    paymentMethod: newSub.paymentMethod || "",
                    nextBilling: newSub.nextBilling || "",
                    difficulty: newSub.difficulty || "Medium",
                    cancellationInstructions:
                        newSub.cancellationInstructions || "",
                    loginUrl: newSub.loginUrl || "",
                    notes: newSub.notes || "",
                },
            ];

            // Log CREATE
            activityLog.logEvent({
                module: "Subscriptions",
                action: "CREATE",
                entityType: "Subscription",
                entityId: newId,
                entityName: newSub.name || "Unknown Service",
                userContext: $estateProfile.ownerName || "User",
            });
        }

        save();
        resetForm();
    }

    function editSubscription(sub: Subscription) {
        newSub = { ...sub };
        showAddForm = true;
    }

    function resetForm() {
        showAddForm = false;
        newSub = {
            id: undefined,
            difficulty: "Easy",
            cycle: "Monthly",
            cost: 0,
            name: "",
            paymentMethod: "",
            nextBilling: "",
            cancellationInstructions: "",
            loginUrl: "",
            notes: "",
        };
    }

    function removeSubscription(id: string) {
        if (!confirm("Remove this subscription?")) return;
        const sub = subscriptions.find((s) => s.id === id);

        subscriptions = subscriptions.filter((s) => s.id !== id);
        save();

        // Log DELETE
        if (sub) {
            activityLog.logEvent({
                module: "Subscriptions",
                action: "DELETE",
                entityType: "Subscription",
                entityId: id,
                entityName: sub.name,
                userContext: $estateProfile.ownerName || "User",
            });
        }
    }

    function openLetterModal(sub: Subscription) {
        selectedSubForLetter = sub;
        customLetterContent = generateDefaultLetter(sub);
        showLetterModal = true;

        // Log EXPORT
        activityLog.logEvent({
            module: "Subscriptions",
            action: "EXPORT",
            entityType: "Cancellation Letter",
            entityId: sub.id,
            entityName: `${sub.name} Cancellation Letter`,
            userContext: $estateProfile.ownerName || "User",
        });
    }

    function resetLetter() {
        if (selectedSubForLetter) {
            customLetterContent = generateDefaultLetter(selectedSubForLetter);
        }
    }

    function closeLetterModal() {
        showLetterModal = false;
        selectedSubForLetter = null;
    }

    // Derived stats
    $: totalMonthly = subscriptions.reduce(
        (sum, s) => sum + (s.cycle === "Monthly" ? s.cost : s.cost / 12),
        0,
    );

    $: totalYearly = subscriptions.reduce(
        (sum, s) => sum + (s.cycle === "Monthly" ? s.cost * 12 : s.cost),
        0,
    );
</script>

<div
    class="max-w-5xl mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500"
>
    <!-- Header -->
    <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-6 mr-100"
    >
        <div>
            <h1
                class="font-serif font-bold text-3xl text-slate-900 flex items-center gap-3"
            >
                <div class="p-2.5 bg-indigo-100 rounded-xl text-indigo-700">
                    <Receipt class="w-8 h-8" />
                </div>
                Subscriptions & Services
            </h1>
            <p class="text-slate-500 mt-2 text-lg">
                Identify recurring charges to prevent "Zombie Bills" from
                draining the estate.
            </p>
        </div>

        <button
            class="px-4 py-2.5 bg-slate-900 text-white font-semibold rounded-xl flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm group"
            on:click={() => (showAddForm = true)}
        >
            <Plus class="w-4 h-4 group-hover:scale-110 transition-transform" />
            Add Service
        </button>
    </div>

    <!-- Content -->
    {#if subscriptions.length === 0}
        <!-- GHOST ROW IMPLEMENTATION -->
        <div class="space-y-4">
            <GhostRow
                type="Subscription"
                onClick={() => (showAddForm = true)}
            />
            <GhostRow
                type="Subscription"
                onClick={() => (showAddForm = true)}
            />
            <GhostRow
                type="Subscription"
                onClick={() => (showAddForm = true)}
            />

            <div class="flex justify-center mt-6">
                <button
                    on:click={() => (showAddForm = true)}
                    class="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-slate-900/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                    <Plus size={18} />
                    Add First Service
                </button>
            </div>
        </div>
    {:else}
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
                class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
            >
                <div
                    class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1"
                >
                    Monthly Burn
                </div>
                <div class="text-2xl font-bold text-slate-800">
                    {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                    }).format(totalMonthly)}
                </div>
            </div>
            <div
                class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
            >
                <div
                    class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1"
                >
                    Annual Impact
                </div>
                <div class="text-2xl font-bold text-slate-800">
                    {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                    }).format(totalYearly)}
                </div>
            </div>
            <div
                class="bg-amber-50 p-5 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4"
            >
                <div class="p-3 bg-white rounded-full text-amber-500 shadow-sm">
                    <TrendingUp class="w-6 h-6" />
                </div>
                <div>
                    <div class="text-sm text-amber-900 font-medium">
                        Inflation Alert
                    </div>
                    <div class="text-xs text-amber-700/80">
                        Review annually. Prices tend to creep up.
                    </div>
                </div>
            </div>
        </div>

        <!-- Main List -->
        <div class="space-y-4">
            <div
                class="flex items-center justify-between pb-2 border-b border-slate-200"
            >
                <h2 class="font-bold text-slate-700 flex items-center gap-2">
                    Active Recurring Charges
                    <span
                        class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs"
                        >{subscriptions.length}</span
                    >
                </h2>
                <button class="text-slate-400 hover:text-slate-600">
                    <Filter class="w-4 h-4" />
                </button>
            </div>

            {#each subscriptions as sub (sub.id)}
                <div class="relative group">
                    <SubscriptionRow
                        {sub}
                        onCancel={() => removeSubscription(sub.id)}
                        onGenerateLetter={() => openLetterModal(sub)}
                    />
                    <div
                        class="absolute top-3 right-2 flex gap-1 bg-white/50 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <button
                            on:click={() => editSubscription(sub)}
                            class="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-full transition-colors"
                            title="Edit"
                        >
                            <Pencil size={14} />
                        </button>
                        <button
                            on:click={() => removeSubscription(sub.id)}
                            class="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-full transition-colors"
                            title="Remove"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            {/each}

            <!-- Empty State Helper -->
            <button
                class="w-full border-2 border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-center text-slate-400 hover:border-slate-300 hover:bg-slate-50 transition-all group"
                on:click={() => (showAddForm = true)}
            >
                <Plus
                    class="w-4 h-4 mr-2 group-hover:scale-110 transition-transform"
                />
                Tracking {subscriptions.length} services... Add another?
            </button>
        </div>
    {/if}

    <!-- Add Form Modal -->
    {#if showAddForm}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
            <div
                class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto"
            >
                <div
                    class="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center"
                >
                    <h3 class="font-serif font-bold text-2xl text-slate-800">
                        Add Subscription
                    </h3>
                    <button
                        on:click={resetForm}
                        class="text-gray-400 hover:text-gray-600">Close</button
                    >
                </div>

                <div class="p-6 space-y-4">
                    <div>
                        <label
                            class="block text-xs font-bold uppercase text-gray-500 mb-1"
                            >Service Name</label
                        >
                        <input
                            type="text"
                            bind:value={newSub.name}
                            class="w-full px-4 py-3 rounded-xl border border-gray-200"
                            placeholder="e.g. Netflix"
                            autoFocus
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                class="block text-xs font-bold uppercase text-gray-500 mb-1"
                                >Cost</label
                            >
                            <input
                                type="number"
                                bind:value={newSub.cost}
                                class="w-full px-4 py-3 rounded-xl border border-gray-200"
                                placeholder="0.00"
                                step="0.01"
                            />
                        </div>
                        <div>
                            <label
                                class="block text-xs font-bold uppercase text-gray-500 mb-1"
                                >Cycle</label
                            >
                            <select
                                bind:value={newSub.cycle}
                                class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white"
                            >
                                <option>Monthly</option>
                                <option>Yearly</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label
                            class="block text-xs font-bold uppercase text-gray-500 mb-1"
                            >Difficulty to Cancel</label
                        >
                        <div class="flex gap-2">
                            {#each ["Easy", "Medium", "Hard"] as diff}
                                <button
                                    class="px-4 py-2 rounded-lg border text-sm font-bold transition-all {newSub.difficulty ===
                                    diff
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}"
                                    on:click={() =>
                                        (newSub.difficulty = diff as
                                            | "Easy"
                                            | "Medium"
                                            | "Hard")}
                                >
                                    {diff}
                                </button>
                            {/each}
                        </div>
                    </div>

                    <div>
                        <label
                            class="block text-xs font-bold uppercase text-gray-500 mb-1"
                            >Cancellation Instructions</label
                        >
                        <textarea
                            bind:value={newSub.cancellationInstructions}
                            class="w-full px-4 py-3 rounded-xl border border-gray-200 h-24"
                            placeholder="How do we turn this off?"
                        ></textarea>
                    </div>

                    <div>
                        <label
                            class="block text-xs font-bold uppercase text-gray-500 mb-1"
                            >Payment Method (Optional)</label
                        >
                        <input
                            type="text"
                            bind:value={newSub.paymentMethod}
                            class="w-full px-4 py-3 rounded-xl border border-gray-200"
                            placeholder="e.g. Chase ending in 1234"
                        />
                    </div>
                </div>

                <div class="p-6 bg-gray-50 flex justify-end gap-3">
                    <button
                        on:click={() => (showAddForm = false)}
                        class="px-6 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-200"
                        >Cancel</button
                    >
                    <button
                        on:click={saveSubscription}
                        disabled={!newSub.name}
                        class="px-6 py-2 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                        {newSub.id
                            ? "Update Subscription"
                            : "Save Subscription"}
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Cancellation Letter Modal -->
    {#if showLetterModal && selectedSubForLetter}
        <div
            class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
            transition:fade
        >
            <div
                class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                in:scale
            >
                <div
                    class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50"
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="p-2 bg-indigo-100 text-indigo-700 rounded-lg"
                        >
                            <FileText size={20} />
                        </div>
                        <h3 class="font-serif font-bold text-xl text-slate-800">
                            Cancellation Request
                        </h3>
                    </div>
                    <button
                        on:click={closeLetterModal}
                        class="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto p-8 bg-slate-50/30">
                    <!-- Letter Document -->
                    <div
                        class="bg-white shadow-sm border border-slate-200 p-12 aspect-[1/1.4] max-w-[500px] mx-auto text-sm text-slate-800 space-y-8 font-serif"
                    >
                        <div class="space-y-1">
                            <p class="font-bold">
                                Date: {new Date().toLocaleDateString()}
                            </p>
                            <p>
                                To: {selectedSubForLetter.name} Billing Department
                            </p>
                        </div>

                        <div class="space-y-4">
                            <p class="font-bold">
                                Subject: Account Cancellation Request - {selectedSubForLetter.name}
                            </p>

                            <div
                                contenteditable="true"
                                bind:innerHTML={customLetterContent}
                                class="prose prose-sm max-w-none focus:outline-none focus:ring-2 focus:ring-indigo-100 rounded-lg p-2 -m-2 transition-all min-h-[200px]"
                            ></div>

                            <div class="pt-8 space-y-1">
                                <p>Sincerely,</p>
                                <div
                                    class="w-48 h-12 border-b border-slate-300"
                                ></div>
                                <p class="font-bold">
                                    {$estateProfile.executorName ||
                                        "[Executor Name Not Set]"}
                                </p>
                                <p class="text-xs text-slate-500 italic">
                                    Executor of the Estate of {$estateProfile.ownerName}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    class="p-6 border-t border-slate-100 bg-white flex justify-end gap-3"
                >
                    <button
                        on:click={resetLetter}
                        class="mr-auto px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        Reset to Default
                    </button>
                    <button
                        class="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 flex items-center gap-2 transition-all"
                    >
                        <Printer size={16} /> Print
                    </button>
                    <button
                        class="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-200 hover:bg-indigo-700 flex items-center gap-2 transition-all"
                    >
                        <Download size={16} /> Download PDF
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>
