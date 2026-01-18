<script lang="ts">
    import { getRegistry, type SyncManager } from "$lib/services/sync.svelte";
    import { onMount } from "svelte";
    import { navGroups } from "$lib/config/navigation";
    import {
        RefreshCw,
        Database,
        Server,
        HardDrive,
        CheckCircle,
        AlertTriangle,
        ShieldCheck,
        Trash2,
        TestTube,
    } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";

    // Initialize Registry safely via lazy getter
    const syncRegistry = getRegistry();

    let syncingAll = $state(false);
    let generatingTest = $state(false);
    let purgingTest = $state(false);
    let selectedModule = $state<string | null>(null);
    let testDataFactory = $state<any>(null); // Dynamic import

    // Audit State
    let auditResults = $state<Record<string, any>>({});
    let lastAudit = $state<Date | null>(null);
    let isAuditing = $state(false);
    let showConfirmGenerate = $state(false);

    // Test Registry Cache (for highlighting)
    let testRegistry = $state<Record<string, string[]>>({});

    onMount(async () => {
        // Load factory client-side only to avoid SSR complications
        const module = await import("$lib/services/testDataFactory");
        testDataFactory = module.testDataFactory;

        if (testDataFactory) {
            testDataFactory.ensureInitialized();
            refreshTestRegistry();
        }
    });

    function refreshTestRegistry() {
        if (testDataFactory) {
            testRegistry = testDataFactory.getRegistry();
        }
    }

    async function runAudit() {
        isAuditing = true;
        const tasks = Object.entries(syncRegistry).map(
            async ([key, manager]) => {
                try {
                    const result = await manager.audit();
                    auditResults[key] = result;
                } catch (e) {
                    auditResults[key] = { error: true };
                }
            },
        );
        await Promise.all(tasks);
        lastAudit = new Date();
        isAuditing = false;
    }

    async function syncAll() {
        if (!testDataFactory) return;
        syncingAll = true;
        // Object.values works on the proxy
        const managers = Object.values(syncRegistry);
        await Promise.all(managers.map((m) => m.sync()));
        await runAudit();
        syncingAll = false;
    }

    async function generateTestData() {
        if (!testDataFactory) return;
        if (!showConfirmGenerate) {
            showConfirmGenerate = true;
            return;
        }

        showConfirmGenerate = false;

        generatingTest = true;
        await testDataFactory.generate();
        refreshTestRegistry();
        await syncAll();
        generatingTest = false;
    }

    async function purgeTestData() {
        if (!testDataFactory) return;
        if (!confirm("Clean up all generated test data?")) return;

        purgingTest = true;
        await testDataFactory.purge();
        refreshTestRegistry();
        await syncAll();
        purgingTest = false;
    }

    // Helper: isTestRow
    function isTestRow(moduleKey: string, id: string | number) {
        return testRegistry[moduleKey]?.includes(String(id));
    }

    // Nav Grouping Logic
    const syncGroupMap: Record<string, string> = {
        assets: "groupAssets",
        financial_accounts: "groupAssets",
        subscriptions: "groupAssets",
        letters: "groupLegacy",
        calendar_events: "groupLegacy",
        documents: "groupLogistics",
    };

    function getGroupKey(syncKey: string) {
        if (syncKey.startsWith("docs_")) return "groupLogistics";
        return syncGroupMap[syncKey] || "Other";
    }

    // Derived state for Other Modules (replacing illegal @const)
    let otherModules = $derived(
        Object.entries(syncRegistry).filter(([key]) => {
            const groupKey = getGroupKey(key);
            return (
                groupKey === "Other" ||
                !navGroups.find((g) => g.groupKey === groupKey)
            );
        }),
    );
</script>

<div
    class="max-w-6xl mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500"
>
    <!-- Header -->
    <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8"
    >
        <div>
            <div class="flex items-center gap-3 mb-2">
                <div class="p-2 bg-emerald-100/50 rounded-lg text-emerald-800">
                    <ShieldCheck size={32} />
                </div>
                <h1 class="font-bold text-3xl text-slate-900">
                    Data Confidence
                </h1>
            </div>
            <p class="text-slate-500 max-w-xl text-lg">
                System-wide persistence verification. Monitor the
                synchronization truth between your local device and the
                Continuum Secure Cloud.
            </p>
        </div>

        <div class="flex items-center gap-3">
            <button
                onclick={runAudit}
                disabled={isAuditing}
                class="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl flex items-center gap-2 font-semibold hover:bg-slate-50 transition-all shadow-sm"
            >
                <div class={isAuditing ? "animate-spin" : ""}>
                    <RefreshCw size={18} />
                </div>
                {isAuditing ? "Verifying..." : "Verify Truth"}
            </button>

            <button
                onclick={syncAll}
                disabled={syncingAll}
                class="px-5 py-2.5 bg-slate-900 text-white rounded-xl flex items-center gap-2 font-bold hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg shadow-slate-900/10"
            >
                <RefreshCw class={syncingAll ? "animate-spin" : ""} size={18} />
                {syncingAll ? "Syncing..." : "Sync All"}
            </button>
        </div>
    </div>

    <!-- Test Data Controls -->
    <div
        class="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6"
    >
        <div class="flex items-center gap-4">
            <div class="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                <TestTube size={24} />
            </div>
            <div>
                <h3 class="font-bold text-slate-900 text-lg">
                    Validation Suite
                </h3>
                <p class="text-indigo-600/80 text-sm font-medium">
                    Generate schematic-compliant data to prove persistence.
                </p>
            </div>
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto">
            <button
                onclick={generateTestData}
                disabled={generatingTest || !testDataFactory}
                class="flex-1 md:flex-none px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {#if generatingTest}<RefreshCw
                        class="animate-spin"
                        size={16}
                    />{/if}
                {showConfirmGenerate
                    ? "Click AGAIN to Confirm"
                    : "Generate Validation Data"}
            </button>
            <button
                onclick={purgeTestData}
                disabled={purgingTest || !testDataFactory}
                class="flex-1 md:flex-none px-4 py-2 bg-white border border-rose-200 text-rose-600 font-semibold rounded-lg hover:bg-rose-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {#if purgingTest}<RefreshCw
                        class="animate-spin"
                        size={16}
                    />{/if}
                Purge Validation Data
            </button>
        </div>
    </div>

    <!-- Module Grid -->
    <div class="space-y-12">
        {#each navGroups as group}
            {@const groupModules = Object.entries(syncRegistry).filter(
                ([key]) => getGroupKey(key) === group.groupKey,
            )}
            {#if groupModules.length > 0}
                <section>
                    <div
                        class="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4"
                    >
                        <h2 class="font-bold text-xl text-slate-800">
                            {group.groupLabel}
                        </h2>
                        <span class="text-slate-400 text-sm"
                            >{group.groupDescription}</span
                        >
                    </div>

                    <div
                        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {#each groupModules as [key, manager]}
                            {@const audit = auditResults[key]}
                            {@const isTest =
                                testRegistry[
                                    key === "properties" ? "assets" : key
                                ]?.length > 0}

                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                            <div
                                class="bg-white rounded-xl border transition-all cursor-pointer overflow-hidden group
                                    {selectedModule === key
                                    ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-xl'
                                    : 'border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300'}"
                                onclick={() =>
                                    (selectedModule =
                                        selectedModule === key ? null : key)}
                            >
                                <div
                                    class="p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50"
                                >
                                    <div class="flex items-center gap-3">
                                        <h3
                                            class="font-bold text-slate-800 capitalize text-lg"
                                        >
                                            {key
                                                .replace("home_", "")
                                                .replace("_", " ")}
                                        </h3>
                                        {#if isTest}
                                            <span
                                                class="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase rounded tracking-wider"
                                                >Test Active</span
                                            >
                                        {/if}
                                    </div>
                                    <div class="flex items-center gap-2">
                                        {#if manager.status === "syncing"}
                                            <RefreshCw
                                                size={16}
                                                class="text-indigo-500 animate-spin"
                                            />
                                        {:else if manager.status === "error"}
                                            <AlertTriangle
                                                size={16}
                                                class="text-rose-500"
                                            />
                                        {:else if audit?.matches}
                                            <CheckCircle
                                                size={18}
                                                class="text-emerald-500"
                                            />
                                        {:else}
                                            <div
                                                class="w-3 h-3 rounded-full bg-slate-300"
                                            ></div>
                                        {/if}
                                    </div>
                                </div>
                                <div
                                    class="grid grid-cols-2 divide-x divide-slate-100"
                                >
                                    <div class="p-4 text-center">
                                        <div
                                            class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1"
                                        >
                                            Local
                                        </div>
                                        <div
                                            class="text-2xl font-mono text-slate-700 font-bold"
                                        >
                                            {manager.items.length}
                                        </div>
                                    </div>
                                    <div class="p-4 text-center bg-slate-50/30">
                                        <div
                                            class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1"
                                        >
                                            Cloud DB
                                        </div>
                                        {#if audit}
                                            <div
                                                class="text-2xl font-mono font-bold {audit.matches
                                                    ? 'text-emerald-600'
                                                    : 'text-amber-600'}"
                                            >
                                                {audit.remoteCount}
                                            </div>
                                        {:else}
                                            <div
                                                class="text-sm text-slate-400 py-1.5 italic"
                                            >
                                                --
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </section>
            {/if}
        {/each}

        <!-- Other / Unassigned Modules -->
        {#if otherModules.length > 0}
            <section>
                <div
                    class="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4"
                >
                    <h2 class="font-bold text-xl text-slate-400">
                        Other Modules
                    </h2>
                </div>
                <div
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {#each otherModules as [key, manager]}
                        <div
                            class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center"
                        >
                            <h3 class="font-bold text-slate-800 capitalize">
                                {key.replace("_", " ")}
                            </h3>
                            <p class="text-sm text-slate-500">
                                {manager.items.length} items
                            </p>
                        </div>
                    {/each}
                </div>
            </section>
        {/if}
    </div>

    <!-- Drill Down View -->
    {#if selectedModule && syncRegistry[selectedModule]}
        {@const manager = syncRegistry[selectedModule]}
        {@const audit = auditResults[selectedModule]}

        <div
            transition:slide
            class="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden mt-4"
        >
            <div
                class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50"
            >
                <h3
                    class="font-bold text-xl text-slate-800 flex items-center gap-2"
                >
                    <Database size={20} class="text-slate-400" />
                    {selectedModule} Records
                </h3>
                <div class="text-sm text-slate-500">
                    Showing merged view of Local & Cloud State
                </div>
            </div>
            <div class="max-h-[500px] overflow-y-auto">
                <table class="w-full text-left text-sm">
                    <thead
                        class="bg-slate-50 sticky top-0 z-10 font-bold text-slate-500 uppercase tracking-wider text-xs"
                    >
                        <tr>
                            <th class="p-4 border-b">Status</th>
                            <th class="p-4 border-b">Type</th>
                            <th class="p-4 border-b">Name/Title</th>
                            <th class="p-4 border-b">Origin</th>
                            <th class="p-4 border-b font-mono text-right"
                                >Data ID</th
                            >
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        {#each manager.items as item}
                            {@const isTest = isTestRow(selectedModule, item.id)}
                            {@const inCloud = audit?.details?.remoteItems?.find(
                                (r) => String(r.id) === String(item.id),
                            )}
                            <tr
                                class="hover:bg-slate-50 transition-colors {isTest
                                    ? 'bg-indigo-50/30'
                                    : ''}"
                            >
                                <td class="p-4">
                                    {#if inCloud}
                                        <div
                                            class="flex items-center gap-2 text-emerald-600 font-bold"
                                        >
                                            <CheckCircle size={16} /> Synced
                                        </div>
                                    {:else}
                                        <div
                                            class="flex items-center gap-2 text-amber-600 font-bold"
                                        >
                                            <RefreshCw
                                                size={16}
                                                class="animate-spin"
                                            /> Pending
                                        </div>
                                    {/if}
                                </td>
                                <td class="p-4"
                                    ><span
                                        class="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200"
                                        >{item.type || "Generic"}</span
                                    ></td
                                >
                                <td class="p-4 font-medium text-slate-900"
                                    >{item.name || item.title || "Untitled"}</td
                                >
                                <td class="p-4">
                                    {#if isTest}
                                        <span
                                            class="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200"
                                            ><TestTube size={12} /> Validation</span
                                        >
                                    {:else}
                                        <span class="text-slate-500"
                                            >User Input</span
                                        >
                                    {/if}
                                </td>
                                <td
                                    class="p-4 font-mono text-xs text-slate-400 text-right"
                                    >{item.id}</td
                                >
                            </tr>
                        {/each}
                        {#if audit?.details?.onlyRemote}
                            {#each audit.details.onlyRemote as item}
                                <tr class="bg-stripe-slate">
                                    <td class="p-4 text-slate-400 italic"
                                        >Cloud Only</td
                                    >
                                    <td class="p-4 text-slate-400"
                                        >{item.type || "Generic"}</td
                                    >
                                    <td class="p-4 text-slate-400"
                                        >{item.name ||
                                            item.title ||
                                            "Untitled"}</td
                                    >
                                    <td class="p-4 text-slate-400">Unknown</td>
                                    <td
                                        class="p-4 font-mono text-xs text-slate-400 text-right"
                                        >{item.id}</td
                                    >
                                </tr>
                            {/each}
                        {/if}
                        {#if manager.items.length === 0 && (!audit?.details?.onlyRemote || audit.details.onlyRemote.length === 0)}
                            <tr
                                ><td
                                    colspan="5"
                                    class="p-12 text-center text-slate-400 italic"
                                    >No records found in this module.</td
                                ></tr
                            >
                        {/if}
                    </tbody>
                </table>
            </div>
        </div>
    {/if}
</div>
