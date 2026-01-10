<script lang="ts">
    import { onMount } from "svelte";
    import {
        activityLog,
        type ActivityLogEntry,
    } from "$lib/stores/activityLog";
    import {
        History,
        Download,
        Trash2,
        Search,
        Filter,
        FileText,
        Plus,
        Edit,
        X,
        FileDown,
        Settings,
    } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";

    let entries: ActivityLogEntry[] = [];
    let filteredEntries: ActivityLogEntry[] = [];
    let searchQuery = "";
    let selectedModule = "all";
    let selectedAction = "all";
    let todayCount = 0;

    // Module list for filtering
    const modules = [
        "all",
        "Asset Manager",
        "Subscriptions",
        "Document Vault",
        "Pet Care",
        "Funeral Planning",
        "Digital Guardian",
        "Family Hub",
        "Estate Profile",
    ];

    // Action colors
    const actionColors: Record<string, string> = {
        CREATE: "bg-green-100 text-green-700 border-green-200",
        UPDATE: "bg-blue-100 text-blue-700 border-blue-200",
        DELETE: "bg-red-100 text-red-700 border-red-200",
        EXPORT: "bg-purple-100 text-purple-700 border-purple-200",
        SETTINGS_CHANGE: "bg-amber-100 text-amber-700 border-amber-200",
    };

    // Action icons
    const actionIcons: Record<string, any> = {
        CREATE: Plus,
        UPDATE: Edit,
        DELETE: X,
        EXPORT: FileDown,
        SETTINGS_CHANGE: Settings,
    };

    onMount(() => {
        entries = activityLog.getAll();
        filteredEntries = entries;
        todayCount = activityLog.getTodayCount();
    });

    $: {
        // Apply filters
        let result = entries;

        if (selectedModule !== "all") {
            result = result.filter((e) => e.module === selectedModule);
        }

        if (selectedAction !== "all") {
            result = result.filter((e) => e.action === selectedAction);
        }

        if (searchQuery) {
            result = activityLog.search(searchQuery);
        }

        filteredEntries = result;
    }

    function formatTimestamp(timestamp: string): string {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        return date.toLocaleDateString();
    }

    function getAbsoluteTimestamp(timestamp: string): string {
        return new Date(timestamp).toLocaleString();
    }

    function exportAsJSON() {
        const json = activityLog.exportAsJSON();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `activity-log-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function exportAsCSV() {
        const csv = activityLog.exportAsCSV();
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `activity-log-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function clearLog() {
        if (
            !confirm(
                "Are you sure you want to clear the entire activity log? This action cannot be undone.",
            )
        )
            return;
        activityLog.clear();
        entries = [];
        filteredEntries = [];
        todayCount = 0;
    }

    function resetFilters() {
        searchQuery = "";
        selectedModule = "all";
        selectedAction = "all";
    }
</script>

<div
    class="max-w-6xl mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500"
>
    <!-- Header -->
    <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-6"
    >
        <div>
            <h1
                class="font-serif font-bold text-3xl text-slate-900 flex items-center gap-3"
            >
                <div class="p-2.5 bg-indigo-100 rounded-xl text-indigo-700">
                    <History class="w-8 h-8" />
                </div>
                Activity Log
            </h1>
            <p class="text-slate-500 mt-2 text-lg">
                Complete audit trail of all changes across your estate plan.
            </p>
        </div>

        <div class="flex items-center gap-3">
            {#if todayCount > 0}
                <div
                    class="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm"
                >
                    {todayCount}
                    {todayCount === 1 ? "event" : "events"} today
                </div>
            {/if}
        </div>
    </div>

    <!-- Filters & Actions -->
    <div
        class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
    >
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Search -->
            <div class="relative">
                <Search
                    class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                />
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Search activities..."
                    class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            <!-- Module Filter -->
            <select
                bind:value={selectedModule}
                class="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
                {#each modules as module}
                    <option value={module === "all" ? "all" : module}>
                        {module === "all" ? "All Modules" : module}
                    </option>
                {/each}
            </select>

            <!-- Action Filter -->
            <select
                bind:value={selectedAction}
                class="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
                <option value="all">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="EXPORT">Export</option>
                <option value="SETTINGS_CHANGE">Settings Change</option>
            </select>
        </div>

        <!-- Action Buttons -->
        <div
            class="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100"
        >
            <button
                on:click={resetFilters}
                class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
                Reset Filters
            </button>
            <div class="flex-1"></div>
            <button
                on:click={exportAsJSON}
                class="px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-2"
            >
                <Download size={16} />
                Export JSON
            </button>
            <button
                on:click={exportAsCSV}
                class="px-4 py-2 text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-2"
            >
                <FileText size={16} />
                Export CSV
            </button>
            <button
                on:click={clearLog}
                class="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-2"
            >
                <Trash2 size={16} />
                Clear Log
            </button>
        </div>
    </div>

    <!-- Timeline -->
    <div class="space-y-4">
        {#if filteredEntries.length === 0}
            <div
                class="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center"
            >
                <div
                    class="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center"
                >
                    <History class="w-8 h-8 text-slate-400" />
                </div>
                <h3 class="font-bold text-lg text-slate-700 mb-2">
                    No Activity Found
                </h3>
                <p class="text-slate-500">
                    {searchQuery ||
                    selectedModule !== "all" ||
                    selectedAction !== "all"
                        ? "Try adjusting your filters"
                        : "Start making changes to see your activity log"}
                </p>
            </div>
        {:else}
            {#each filteredEntries as entry (entry.id)}
                <div
                    class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all group"
                    transition:slide
                >
                    <div class="flex items-start gap-4">
                        <!-- Action Badge -->
                        <div class="shrink-0">
                            <div
                                class="p-2.5 rounded-lg border {actionColors[
                                    entry.action
                                ]}"
                            >
                                <svelte:component
                                    this={actionIcons[entry.action]}
                                    size={18}
                                />
                            </div>
                        </div>

                        <!-- Content -->
                        <div class="flex-1 min-w-0">
                            <div
                                class="flex items-start justify-between gap-4 mb-2"
                            >
                                <div>
                                    <div
                                        class="flex items-center gap-2 flex-wrap"
                                    >
                                        <span class="font-bold text-slate-900"
                                            >{entry.entityName}</span
                                        >
                                        <span class="text-slate-400">•</span>
                                        <span class="text-sm text-slate-500"
                                            >{entry.module}</span
                                        >
                                    </div>
                                    <div class="flex items-center gap-2 mt-1">
                                        <span
                                            class="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full {actionColors[
                                                entry.action
                                            ]}"
                                        >
                                            {entry.action}
                                        </span>
                                        <span class="text-xs text-slate-400"
                                            >{entry.entityType}</span
                                        >
                                    </div>
                                </div>
                                <div class="text-right shrink-0">
                                    <div
                                        class="text-sm font-medium text-slate-600"
                                        title={getAbsoluteTimestamp(
                                            entry.timestamp,
                                        )}
                                    >
                                        {formatTimestamp(entry.timestamp)}
                                    </div>
                                    <div class="text-xs text-slate-400 mt-0.5">
                                        by {entry.userContext}
                                    </div>
                                </div>
                            </div>

                            <!-- Changes Detail -->
                            {#if entry.changes && entry.changes.length > 0}
                                <div
                                    class="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
                                >
                                    <div
                                        class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2"
                                    >
                                        Changes
                                    </div>
                                    <div class="space-y-1.5">
                                        {#each entry.changes as change}
                                            <div class="text-sm">
                                                <span
                                                    class="font-medium text-slate-700"
                                                    >{change.field}:</span
                                                >
                                                <span
                                                    class="text-slate-500 line-through ml-2"
                                                    >{change.oldValue ||
                                                        "(empty)"}</span
                                                >
                                                <span
                                                    class="text-slate-400 mx-2"
                                                    >→</span
                                                >
                                                <span
                                                    class="text-slate-900 font-medium"
                                                    >{change.newValue ||
                                                        "(empty)"}</span
                                                >
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}
        {/if}
    </div>

    <!-- Stats Footer -->
    {#if entries.length > 0}
        <div
            class="bg-slate-50 rounded-xl p-4 text-center text-sm text-slate-600"
        >
            Showing <span class="font-bold text-slate-900"
                >{filteredEntries.length}</span
            >
            of
            <span class="font-bold text-slate-900">{entries.length}</span> total
            events
        </div>
    {/if}
</div>
