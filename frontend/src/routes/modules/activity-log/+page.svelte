<script lang="ts">
    import { askConfirm } from "$lib/components/ui/ConfirmModal.svelte";
    import { onMount } from "svelte";
    import {
        activityLog,
        type ActivityLogEntry,
    } from "$lib/stores/activityLog.svelte";
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
        Loader2,
        Sparkles,
    } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";
    import AIPromptBar from "$lib/components/concierge/AIPromptBar.svelte";
    import Affirmation from "$lib/components/Affirmation.svelte";
    import { pluralWord } from "$lib/utils/plural";

    let showAffirmation = $state(false);
    let isLoading = $state(true);

    let entries = $state<ActivityLogEntry[]>([]);
    let filteredEntries = $state<ActivityLogEntry[]>([]);
    let searchQuery = $state("");
    let selectedModule = $state("all");
    let selectedAction = $state("all");
    let todayCount = $state(0);

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
        "Health & Medical",
        "Insurance",
        "Property",
        "Heirlooms",
        "QR Center",
        "Letters",
        "Ethical Will",
        "Life Lessons",
        "System",
    ];

    // Action colors
    const actionColors: Record<string, string> = {
        CREATE: "bg-success/10 text-success border-success/20",
        UPDATE: "bg-info/10 text-info border-info/20",
        DELETE: "bg-muted text-muted-foreground border-border",
        EXPORT: "bg-primary-soft text-primary-hover border-primary/20",
        SETTINGS_CHANGE: "bg-warning-soft text-warning border-warning/20",
    };

    // Action icons
    const actionIcons: Record<string, any> = {
        CREATE: Plus,
        UPDATE: Edit,
        DELETE: X,
        EXPORT: FileDown,
        SETTINGS_CHANGE: Settings,
    };

    onMount(async () => {
        await activityLog.sync();
        entries = activityLog.getAll();
        filteredEntries = entries;
        todayCount = activityLog.getTodayCount();
        isLoading = false;
    });

    $effect(() => {
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
    });

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
        showAffirmation = true;
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
        showAffirmation = true;
    }

    async function clearLog() {
        if (
            !(await askConfirm(
                "Remove every entry in your activity log from your account? This is permanent.",
            ))
        )
            return;
        await activityLog.clear();
        // The store holds what the server still holds (a failed removal is rolled back).
        entries = activityLog.getAll();
        filteredEntries = entries;
        todayCount = activityLog.getTodayCount();
    }

    function resetFilters() {
        searchQuery = "";
        selectedModule = "all";
        selectedAction = "all";
    }
</script>

{#if isLoading}
    <div class="flex items-center justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
{:else}
<div
    class="max-w-6xl mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500"
>
    <!-- Header -->
    <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-6"
    >
        <div>
            <h1
                class="font-serif font-bold text-3xl text-foreground flex items-center gap-3"
            >
                <div class="p-2.5 bg-primary-soft rounded-xl text-primary-hover">
                    <History class="w-8 h-8" />
                </div>
                Activity History
            </h1>
            <p class="text-muted-foreground mt-2 text-lg">
                Complete audit trail of all changes across your estate plan.
            </p>
        </div>

        <div class="flex items-center gap-3">
            {#if todayCount > 0}
                <div
                    class="px-4 py-2 bg-primary-soft text-primary-hover rounded-xl font-bold text-sm"
                >
                    {todayCount}
                    {pluralWord(todayCount, "event")} today
                </div>
            {/if}
        </div>
    </div>

    <!-- Affirmation Message -->
    <Affirmation module="general" bind:show={showAffirmation} />

    <!-- AI Concierge Drafting Assistant (the log itself stays on this page; chips ask about the plan) -->
    <AIPromptBar context="activity-log" />

    <!-- Filters & Actions -->
    <div
        class="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4"
    >
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Search -->
            <div class="relative">
                <Search
                    class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                />
                <input
                    type="text"
                    bind:value={searchQuery}
                    aria-label="Search activities"
                    placeholder="Search activities..."
                    class="w-full pl-10 pr-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
            </div>

            <!-- Module Filter -->
            <select
                bind:value={selectedModule}
                aria-label="Modules"
                class="px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                aria-label="Actions"
                class="px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
                <option value="all">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Remove</option>
                <option value="EXPORT">Export</option>
                <option value="SETTINGS_CHANGE">Settings Change</option>
            </select>
        </div>

        <!-- Action Buttons -->
        <div
            class="flex flex-wrap items-center gap-3 pt-4 border-t border-border"
        >
            <button
                onclick={resetFilters}
                class="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
                Reset Filters
            </button>
            <div class="flex-1"></div>
            {#if entries.length > 0}
            <button
                onclick={exportAsJSON}
                class="px-4 py-2 text-sm font-bold text-primary-hover bg-primary-soft hover:bg-primary/20 rounded-lg transition-colors flex items-center gap-2"
            >
                <Download size={16} />
                Export JSON
            </button>
            <button
                onclick={exportAsCSV}
                class="px-4 py-2 text-sm font-bold text-success bg-success/10 hover:bg-success/20 rounded-lg transition-colors flex items-center gap-2"
            >
                <FileText size={16} />
                Export CSV
            </button>
            <button
                onclick={clearLog}
                class="px-4 py-2 text-sm font-bold text-muted-foreground bg-muted hover:text-danger hover:bg-danger-soft rounded-lg transition-colors flex items-center gap-2"
            >
                <Trash2 size={16} />
                Clear Log
            </button>
            {/if}
        </div>
    </div>

    <!-- Timeline -->
    <div class="space-y-4">
        {#if filteredEntries.length === 0}
            <div
                class="bg-card rounded-2xl border border-border shadow-sm p-12 text-center"
            >
                <div
                    class="p-4 bg-muted rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center"
                >
                    <History class="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 class="font-bold text-lg text-foreground mb-2">
                    Your activity appears here
                </h3>
                <p class="text-muted-foreground">
                    {searchQuery ||
                    selectedModule !== "all" ||
                    selectedAction !== "all"
                        ? "Try adjusting your filters"
                        : "Each change you save will appear here."}
                </p>
            </div>
        {:else}
            {#each filteredEntries as entry (entry.id)}
                {@const Icon = actionIcons[entry.action]}
                <div
                    class="bg-card rounded-xl border border-border shadow-sm p-5 hover:shadow-md transition-all group"
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
                                <Icon
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
                                        <span class="font-bold text-foreground"
                                            >{entry.entityName}</span
                                        >
                                        <span class="text-muted-foreground">•</span>
                                        <span class="text-sm text-muted-foreground"
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
                                        <span class="text-xs text-muted-foreground"
                                            >{entry.entityType}</span
                                        >
                                    </div>
                                </div>
                                <div class="text-right shrink-0">
                                    <div
                                        class="text-sm font-medium text-muted-foreground"
                                        title={getAbsoluteTimestamp(
                                            entry.timestamp,
                                        )}
                                    >
                                        {formatTimestamp(entry.timestamp)}
                                    </div>
                                    <div class="text-xs text-muted-foreground mt-0.5">
                                        by {entry.userContext}
                                    </div>
                                </div>
                            </div>

                            <!-- Changes Detail -->
                            {#if entry.changes && entry.changes.length > 0}
                                <div
                                    class="mt-3 p-3 bg-muted rounded-lg border border-border"
                                >
                                    <div
                                        class="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2"
                                    >
                                        Changes
                                    </div>
                                    <div class="space-y-1.5">
                                        {#each entry.changes as change}
                                            <div class="text-sm">
                                                <span
                                                    class="font-medium text-foreground"
                                                    >{change.field}:</span
                                                >
                                                <span
                                                    class="text-muted-foreground line-through ml-2"
                                                    >{change.oldValue ||
                                                        "(empty)"}</span
                                                >
                                                <span
                                                    class="text-muted-foreground mx-2"
                                                    >→</span
                                                >
                                                <span
                                                    class="text-foreground font-medium"
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
            class="bg-muted rounded-xl p-4 text-center text-sm text-muted-foreground"
        >
            Showing <span class="font-bold text-foreground"
                >{filteredEntries.length}</span
            >
            of
            <span class="font-bold text-foreground">{entries.length}</span> total
            {pluralWord(entries.length, "event")}
        </div>
    {/if}
</div>
{/if}
