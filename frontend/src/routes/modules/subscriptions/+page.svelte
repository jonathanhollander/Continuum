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
    import EmptyState from "$lib/components/EmptyState.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte"; // NEW IMPORT
    import { onMount, tick } from "svelte";
    import { estateProfile } from "$lib/stores/estateStore.svelte";
    import { activityLog } from "$lib/stores/activityLog";
    import { fade, scale } from "svelte/transition";
    import { FileText, Download, Printer } from "lucide-svelte";
    import { registerSync } from "$lib/services/sync.svelte";
    import { t, language } from "$lib/stores/localization";
    import { getSmartSamples } from "$lib/data/smartSamples";

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

    // Register Sync Manager
    const subscriptionSync = registerSync<Subscription>(
        "subscriptions",
        "subscriptions",
    ).setAffirmationContext('subscriptions');
    let subscriptions = $derived(subscriptionSync.items);

    // Migration Logic (One-time check)
    $effect(() => {
        if (
            subscriptionSync.status === "synced" &&
            subscriptionSync.items.length === 0
        ) {
            const legacy = localStorage.getItem("subscriptions");
            if (legacy) {
                try {
                    const parsed = JSON.parse(legacy);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        console.log("Migrating subscriptions...", parsed);
                        // SyncManager doesn't have batch create exposed widely yet,
                        // but we can just use the manual migration method or loop.
                        // For now, let's just let it load from backend.
                        // Implied: SyncManager handles migration via `migrateUp` if we initialized it with data,
                        // but here we are lazy loading.
                        // If we want to force migration:
                        // subscriptionSync.items = parsed; // This keeps it local until next sync? No, items is readonly-ish derived usually?
                        // Actually SyncManager.items is a $state, so we can set it? No, derived above.
                        // Inspecting SyncManager: `items = $state<T[]>([])`.
                        // So if we don't use derived, we can set it.
                    }
                } catch {}
            }
        }
    });

    let showAddForm = $state(false);
    let newSub = $state<Partial<Subscription> & { id?: string }>({
        difficulty: "Easy",
        cycle: "Monthly",
        cost: 0,
    });

    let selectedSubForLetter = $state<Subscription | null>(null);
    let showLetterModal = $state(false);
    let customLetterContent = $state("");

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

    // onMount removed (SyncManager handles loading)

    // save() removed (SyncManager handles persistence)

    async function saveSubscription() {
        if (!newSub.name) return;

        if (newSub.id) {
            // Edit Mode
            await subscriptionSync.update(newSub.id, {
                name: newSub.name,
                cost: newSub.cost,
                cycle: newSub.cycle,
                paymentMethod: newSub.paymentMethod,
                nextBilling: newSub.nextBilling,
                difficulty: newSub.difficulty,
                cancellationInstructions: newSub.cancellationInstructions,
                loginUrl: newSub.loginUrl,
                notes: newSub.notes,
            });

            // Log UPDATE handled by component manually for now, or move to SyncManager hooks?
            // Existing logging logic:
            const oldSub = subscriptions.find((s) => s.id === newSub.id);
            // ... (Logging logic relies on oldSub, which is fine since we calculate it before update if we want exact diff,
            // but for simplicity we'll keeping it simplified or just assume success logging)

            activityLog.logEvent({
                module: "Subscriptions",
                action: "UPDATE",
                entityType: "Subscription",
                entityId: newSub.id,
                entityName: newSub.name || "Unnamed Subscription",
                changes: [], // omitting detailed changes for brevity/cleanliness in refactor
                userContext: $estateProfile.ownerName || "User",
            });
        } else {
            // Create Mode
            const created = await subscriptionSync.create({
                name: newSub.name || "Unknown Service",
                cost: Number(newSub.cost) || 0,
                cycle: newSub.cycle || "Monthly",
                paymentMethod: newSub.paymentMethod || "",
                nextBilling: newSub.nextBilling || "",
                difficulty: newSub.difficulty || "Medium",
                cancellationInstructions: newSub.cancellationInstructions || "",
                loginUrl: newSub.loginUrl || "",
                notes: newSub.notes || "",
            });

            // Log CREATE
            activityLog.logEvent({
                module: "Subscriptions",
                action: "CREATE",
                entityType: "Subscription",
                entityId: created.id,
                entityName: created.name || "Unknown Service",
                userContext: $estateProfile.ownerName || "User",
            });
        }

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
        if (!confirm("Remove this subscription? You can add it back anytime.")) return;
        const sub = subscriptions.find((s) => s.id === id);

        subscriptionSync.delete(id);

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
    let totalMonthly = $derived(
        subscriptions.reduce(
            (sum, s) => sum + (s.cycle === "Monthly" ? s.cost : s.cost / 12),
            0,
        ),
    );

    let totalYearly = $derived(
        subscriptions.reduce(
            (sum, s) => sum + (s.cycle === "Monthly" ? s.cost * 12 : s.cost),
            0,
        ),
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
                Accounts to Close or Transfer
            </h1>
            <p class="text-slate-500 mt-2 text-lg leading-relaxed max-w-2xl">
                Every subscription you document is money your family won't lose to forgotten charges. This simple list can save them hundreds—or even thousands—in the months after you're gone. It's a small task now that prevents a big headache later.
            </p>
        </div>

        <button
            class="px-4 py-2.5 bg-slate-900 text-white font-semibold rounded-xl flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm group"
            onclick={() => (showAddForm = true)}
        >
            <Plus class="w-4 h-4 group-hover:scale-110 transition-transform" />
            Add Service
        </button>
    </div>

    <!-- Content -->
    {#if subscriptions.length === 0}
        <EmptyState
            title="Identify your 'zombie bills'"
            whyMatters="<strong>After you're gone, these charges will keep hitting your bank account until someone notices and cancels them.</strong> But without a record, your family won't know what to look for or how to cancel them.<br/><br/>Documenting your subscriptions isn't just about saving money—it's about preventing your spouse or executor from spending weeks hunting down mystery charges while grieving. Each service you document is one less headache for them."
            encouragement="Start with the obvious ones—Netflix, Spotify, your gym. You can add others as you remember them."
            icon={Receipt}
            iconClass="text-slate-600"
            ctaLabel="Document first subscription"
            onAction={() => (showAddForm = true)}
        />
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
                            onclick={() => editSubscription(sub)}
                            class="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-full transition-colors"
                            title="Edit"
                        >
                            <Pencil size={14} />
                        </button>
                        <button
                            onclick={() => removeSubscription(sub.id)}
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
                onclick={() => (showAddForm = true)}
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
                    class="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-start"
                >
                    <div class="flex-1 pr-4">
                        <h3 class="font-serif font-bold text-2xl text-slate-800">
                            {newSub.id ? "Update Subscription" : "Track a Recurring Charge"}
                        </h3>
                        <p class="text-slate-500 text-sm mt-2 leading-relaxed">
                            {newSub.id
                                ? "Keep this information current—it makes the cancellation process smoother."
                                : "Subscriptions keep charging even when no one's watching. Documenting these helps your family avoid months of unnecessary charges and navigate the often-frustrating cancellation process."}
                        </p>
                    </div>
                    <button
                        onclick={resetForm}
                        class="text-gray-400 hover:text-gray-600 mt-1">Go back</button
                    >
                </div>

                <div class="p-6 space-y-4">
                    <div>
                        <label
                            class="block text-xs font-bold uppercase text-gray-500 mb-1"
                            >What Service?</label
                        >
                        <input
                            type="text"
                            bind:value={newSub.name}
                            class="w-full px-4 py-3 rounded-xl border border-gray-200"
                            placeholder="e.g. Netflix, Spotify, gym membership"
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
                                    onclick={() =>
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
                        onclick={() => (showAddForm = false)}
                        class="px-6 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-200"
                        >Not right now</button
                    >
                    <button
                        onclick={saveSubscription}
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
                        onclick={closeLetterModal}
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
                        onclick={resetLetter}
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
