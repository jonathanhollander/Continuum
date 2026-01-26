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
        Loader2,
    } from "lucide-svelte";
    import SmartTextarea from "$lib/components/ui/SmartTextarea.svelte";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import EmptyStateGuide from "$lib/components/ui/EmptyStateGuide.svelte";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import GhostRow from "$lib/components/ui/GhostRow.svelte"; // NEW IMPORT
    import GriefSupportBanner from "$lib/components/GriefSupportBanner.svelte";
    import CustomFieldsManager from "$lib/components/ui/CustomFieldsManager.svelte";
    import { onMount } from "svelte";
    import { estateProfile } from "$lib/stores/estateStore.svelte";
    import { activityLog } from "$lib/stores/activityLog.svelte";
    import { UserCircle, MapPin as MapPinIcon, Cross } from "lucide-svelte";
    import { funeralStore, type FuneralWishes, type FuneralBudgetItem } from "$lib/stores/funeralStore.svelte";
    import FuneralWizard from "$lib/components/modules/funeral/FuneralWizard.svelte";
    import LegalDisclaimer from "$lib/components/common/LegalDisclaimer.svelte";
    import LivingBlueprintHeader from "$lib/components/LivingBlueprintHeader.svelte";
    import * as registryRaw from "$lib/data/registry.json";
    import { t, language } from "$lib/stores/localization";
    import { getSmartSamples } from "$lib/data/smartSamples";

    // Registry Data Handling
    const registryData = (registryRaw as any).default || registryRaw;
    const registry = Array.isArray(registryData) ? registryData : [];
    const module = registry.find((m) => m.id === "funeral");

    let activeTab = $state("wishes"); // 'wishes' | 'budget'
    let showAddExpense = $state(false);
    let newExpense = $state<Partial<FuneralBudgetItem>>({
        name: "",
        cost: 0,
    });
    let parsedCustomAttributes = $state<Record<string, any>>({});
    let isLoading = $state(true);

    onMount(async () => {
        await funeralStore.sync?.();
        isLoading = false;
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

        const customAttrsString = JSON.stringify(parsedCustomAttributes);

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
                              custom_attributes: customAttrsString,
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
                        custom_attributes: customAttrsString,
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
        try {
            parsedCustomAttributes = JSON.parse(item.custom_attributes || "{}");
        } catch {
            parsedCustomAttributes = {};
        }
        showAddExpense = true;
    }

    function resetExpenseForm() {
        newExpense = { id: undefined, name: "", cost: 0 };
        parsedCustomAttributes = {};
        showAddExpense = false;
    }

    function removeExpense(id: string) {
        if (!confirm("Remove this expense? You can add it back later.")) return;
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

{#if isLoading}
    <div class="flex items-center justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
{:else}
{#if module}
    <LivingBlueprintHeader
        title={module.title}
        subtitle={module.description}
        tier={module.role === "owner" ? "preparation" : "executor"}
    />
{/if}

<div class="max-w-6xl mx-auto p-8 animate-in fade-in duration-500">
    <div class="mb-12 text-center">
        <div class="max-w-xl mx-auto mb-8">
            <AIPromptBar context="obituary" />
        </div>

        <div class="max-w-3xl mx-auto text-left">
            <LegalDisclaimer
                variant="banner"
                title="Important Note"
                message="Funeral laws and requirements vary significantly by state and country. While these wishes guide your family, some jurisdictions require specific legal forms for binding disposition instructions."
            />
        </div>

        <div class="max-w-3xl mx-auto mt-8 text-left">
            <GriefSupportBanner compact={true} />
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
                Vision & Spirit
            </button>
            <button
                class="px-6 py-2.5 rounded-lg font-bold text-sm transition-all {activeTab ===
                'budget'
                    ? 'bg-white shadow-sm text-[#304743]'
                    : 'text-gray-500 hover:text-gray-900'}"
                onclick={() => (activeTab = "budget")}
            >
                Financial Care
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
                        Celebrating the Life of {$estateProfile.ownerName ||
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
                <div class="p-3 bg-white rounded-xl shadow-sm text-primary">
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
                <div class="p-3 bg-white rounded-xl shadow-sm text-primary">
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
                    <EmptyState
                        title="How you'd like to be remembered"
                        whyMatters="<strong>Without these instructions, your family will make these deeply personal choices while grieving—and wonder forever if they got it right.</strong> The music at your service, the flowers, the tone, the dress code—these details shape how people remember you.<br/><br/>Documenting your wishes isn't morbid. It's a gift. It lets your family focus on honoring you instead of guessing what you would have wanted."
                        encouragement="You don't have to decide everything now. Start with just one thing—maybe your favorite song or flower."
                        icon={Music}
                        iconClass="text-purple-500"
                        ctaLabel="Share your wishes"
                        onAction={prefillEstimates}
                        skipMessage="Come back to this when you're ready. There's no rush."
                    />

                    <!-- Sample Data GhostRows -->
                    <div class="mt-8">
                        <p class="text-xs font-bold uppercase text-slate-400 tracking-widest mb-4 text-center">Example entries to inspire you</p>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-60">
                            {#each getSmartSamples($language).funeral || [] as sample}
                                <GhostRow
                                    name={sample.name}
                                    subtitle={sample.description}
                                    type={sample.type}
                                    onClick={() => {
                                        newExpense = {
                                            name: sample.name,
                                            cost: 0
                                        };
                                        showAddExpense = true;
                                    }}
                                >
                                    <svelte:fragment slot="icon">
                                        {#if sample.type === 'music'}
                                            <Music size={20} class="text-slate-400" />
                                        {:else}
                                            <Flower size={20} class="text-slate-400" />
                                        {/if}
                                    </svelte:fragment>
                                </GhostRow>
                            {/each}
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
                                <DollarSign size={18} /> Financial Stewardship
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
                class="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                transition:fade
            >
                <div
                    class="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
                    transition:scale={{ start: 0.95 }}
                >
                    <div
                        class="bg-[#304743] p-6 flex justify-between items-start text-white"
                    >
                        <div class="flex-1 pr-4">
                            <h3 class="font-serif font-bold text-xl">
                                {newExpense.id
                                    ? "Update This Detail"
                                    : "Plan Ahead"}
                            </h3>
                            <p
                                class="text-emerald-100/80 text-sm mt-1 leading-relaxed"
                            >
                                {newExpense.id
                                    ? "Keep your estimates current—it helps your family plan with clarity."
                                    : "By thinking through these costs now, you're protecting your family from difficult financial decisions during an already hard time."}
                            </p>
                        </div>
                        <button
                            onclick={resetExpenseForm}
                            class="text-white/50 hover:text-white transition-colors mt-1"
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
                        <div class="pt-4 mt-4 border-t border-stone-100">
                            <CustomFieldsManager
                                entityType="funeral"
                                bind:data={parsedCustomAttributes}
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
{/if}
