<script lang="ts">
    import { onMount, untrack } from "svelte";
    import HolographicGrid from "$lib/components/dashboard/HolographicGrid.svelte";
    import ExecutorHub from "$lib/components/executor/ExecutorHub.svelte";
    import ExecutorWelcome from "$lib/components/executor/ExecutorWelcome.svelte";
    import SyncBadge from "$lib/components/ui/SyncBadge.svelte";
    import { auth } from "$lib/stores/auth";
    import { estateAudit } from "$lib/stores/auditStore.svelte";
    import { familyStore } from "$lib/stores/familyStore.svelte";
    import { digitalAssetsStore } from "$lib/stores/digitalAssetsStore.svelte";
    import { insuranceStore } from "$lib/stores/insuranceStore.svelte";
    import { medicalStore } from "$lib/stores/medicalStore.svelte";
    import { propertyStore } from "$lib/stores/propertyStore.svelte";
    import {
        financialAssetsStore,
        estateTotals,
        isDebt,
    } from "$lib/stores/financialAssetsStore.svelte";
    import { preferenceStore } from "$lib/stores/preferenceStore";
    import {
        getModuleSyncStatus,
        moduleManagers,
        syncStatusStore,
    } from "$lib/stores/syncStatusStore.svelte";
    import { fade, fly } from "svelte/transition";
    import {
        Search,
        ChevronDown,
        ChevronRight,
        Zap,
        Users,
        Shield,
        FileText,
        Heart,
    } from "lucide-svelte";
    import { browser } from "$app/environment";
    import { contextStore } from "$lib/stores/contextStore.svelte";
    import { getGreeting } from "$lib/utils/contextualMessages";
    import {
        navGroups,
        catalogCategories,
        type NavItem,
        type NavGroup,
    } from "$lib/config/navigation";
    import { dict, userRole } from "$lib/stores/conciergeStore.svelte";

    import { notifications } from "$lib/stores/notificationStore";
    import Tooltip from "$lib/components/ui/Tooltip.svelte";
    import { documentStore } from "$lib/stores/documentStore.svelte";
    import { pluralWord } from "$lib/utils/plural";
    import { Loader2 } from "lucide-svelte";
    import { contactSync } from "$lib/stores/familyStore.svelte";
    import { insuranceSync } from "$lib/stores/insuranceStore.svelte";
    import { financialAssetsSync } from "$lib/stores/financialAssetsStore.svelte";
    import { directiveSync } from "$lib/stores/medicalStore.svelte";
    import { digitalAssetsSync } from "$lib/stores/digitalAssetsStore.svelte";

    // Executor mode welcome state
    let showExecutorWelcome = $state(false);

    // Loading state
    let loading = $state(true);

    // Search state
    let searchQuery = $state("");

    // Status filter state
    import type { CompassionateSyncStatus } from "$lib/components/ui/SyncBadge.svelte";
    let filterByStatus = $state<CompassionateSyncStatus | null>(null);

    // Collapsed sections state: groups marked isCollapsedByDefault in navigation.ts
    // (My Finances, My Instructions, People & Check-ins, Extras) start collapsed;
    // My Legacy opens, as the one section the dashboard showed open before E1.
    let collapsedSections = $state<Set<string>>(
        new Set(navGroups.filter((g) => g.isCollapsedByDefault).map((g) => g.groupKey)),
    );

    // Greeting Typewriter
    let greeting = $state("");
    let fullGreeting = $derived(
        estateAudit.totalScore > 0 ? getGreeting() : "Ready when you are",
    );

    // Dynamic Metrics
    // The same net the financial page shows: open assets less open debts
    let totalValue = $derived(estateTotals(financialAssetsStore.items).net);

    // Filter nav groups by user role
    let filteredNavGroups = $derived(
        navGroups
            .map((group) => ({
                ...group,
                items: group.items.filter(
                    (item) =>
                        item.allowedRoles.includes($userRole) &&
                        item.key !== "dashboard",
                ),
            }))
            .filter((group) => group.items.length > 0),
    );

    // Module status mapping - connects nav items to audit data and stores
    function getModuleStatus(item: NavItem): {
        inProgress: boolean;
        count: number;
        label: string;
    } {
        const scores = estateAudit.moduleScores;

        switch (item.key) {
            case "contacts":
                return {
                    inProgress:
                        scores["family"] > 0 || familyStore.members.length > 0,
                    count: familyStore.members.length,
                    label: pluralWord(familyStore.members.length, "person", "people"),
                };
            case "financial":
                // A debt is recorded here too, but it is no account (the audit's "financial" score reads these records)
                return {
                    inProgress: financialAssetsStore.items.length > 0,
                    count: accountCount,
                    label: pluralWord(accountCount, "account"),
                };
            case "insurance":
                return {
                    inProgress:
                        scores["insurance"] > 0 ||
                        insuranceStore.policies.length > 0,
                    count: insuranceStore.policies.length,
                    label: pluralWord(insuranceStore.policies.length, "policy", "policies"),
                };
            case "documents":
                return {
                    inProgress: documentStore.items.length > 0,
                    count: documentStore.items.length,
                    label: pluralWord(documentStore.items.length, "document"),
                };
            case "medical":
                return {
                    inProgress:
                        scores["medical"] > 0 ||
                        medicalStore.directives.length > 0,
                    count: medicalStore.directives.length,
                    label: pluralWord(medicalStore.directives.length, "directive"),
                };
            case "subscriptions":
            case "guardian":
                return {
                    inProgress:
                        scores["digital"] > 0 ||
                        digitalAssetsStore.items.length > 0,
                    count: digitalAssetsStore.items.length,
                    label: pluralWord(digitalAssetsStore.items.length, "account"),
                };
            case "property":
                return {
                    inProgress: propertyStore.items.length > 0,
                    count: propertyStore.items.length,
                    label: pluralWord(propertyStore.items.length, "property", "properties"),
                };
            default:
                return { inProgress: false, count: 0, label: "" };
        }
    }

    // Filter items by search
    let searchResults = $derived.by(() => {
        if (searchQuery.trim() === "") return null;

        const query = searchQuery.toLowerCase();
        const results: NavItem[] = [];

        for (const group of filteredNavGroups) {
            for (const item of group.items) {
                const label = $dict[item.key] || item.label;
                if (label.toLowerCase().includes(query)) {
                    results.push(item);
                }
            }
        }

        // Also search catalog categories
        for (const category of catalogCategories) {
            for (const item of category.items) {
                if (item.allowedRoles.includes($userRole)) {
                    const label = item.label;
                    if (
                        label.toLowerCase().includes(query) &&
                        !results.find((r) => r.key === item.key)
                    ) {
                        results.push(item);
                    }
                }
            }
        }

        return results;
    });

    // Filter modules by status
    let statusFilteredGroups = $derived.by(() => {
        if (!filterByStatus) return null;

        return filteredNavGroups
            .map((group) => ({
                ...group,
                items: group.items.filter(
                    (item) => getModuleSyncStatus(item.key) === filterByStatus,
                ),
            }))
            .filter((g) => g.items.length > 0);
    });

    // Toggle status filter
    function toggleStatusFilter(status: CompassionateSyncStatus) {
        filterByStatus = filterByStatus === status ? null : status;
    }

    // Concrete progress counts for stats row
    let contactCount = $derived(familyStore.members.length);
    let policyCount = $derived(insuranceStore.policies.length);
    // Open accounts only: a debt is something owed, so it is no account
    let accountCount = $derived(
        financialAssetsStore.items.filter((a) => !a.is_closed && !isDebt(a))
            .length,
    );
    let medicalCount = $derived(medicalStore.directives.length);
    // A tile shows a gentle cue, not 0, until its store's first server answer
    // (unless this device already holds those records), as the letters page does.
    const awaitingFirstSync = (m: { lastSync: Date | null; status: string; items: unknown[] }) =>
        m.lastSync === null && m.status !== "error" && m.items.length === 0;
    let contactsLoading = $derived(awaitingFirstSync(contactSync));
    let policiesLoading = $derived(awaitingFirstSync(insuranceSync));
    let accountsLoading = $derived(awaitingFirstSync(financialAssetsSync));
    let medicalLoading = $derived(awaitingFirstSync(directiveSync));
    // The audit's 0% means nothing is recorded only once every store it reads has answered.
    let auditLoading = $derived(
        contactsLoading || policiesLoading || accountsLoading || medicalLoading ||
            awaitingFirstSync(digitalAssetsSync),
    );

    // A store's first load sets the same "syncing" status as a save, so a card shows no badge
    // until each store its badge reads (syncStatusStore's moduleSyncKeys) has answered.
    function cardLoading(key: string): boolean {
        return moduleManagers(key).some((m) => m.lastSync === null && m.status !== "error");
    }

    // Sync status summary for color key
    let statusSummary = $derived(syncStatusStore.getSummary());
    // The chips count first loads as "Saving" and empty stores as "0 Kept safe": they show the
    // gentle cue until the audit stores have answered and no first load is still running.
    let chipsAnswered = $state(false);
    $effect(() => {
        if (!auditLoading && statusSummary.saving === 0) chipsAnswered = true;
    });

    // Formatter
    const currency = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    });

    let hasAutoRedirected = false;

    function toggleSection(groupKey: string) {
        if (collapsedSections.has(groupKey)) {
            collapsedSections.delete(groupKey);
        } else {
            collapsedSections.add(groupKey);
        }
        collapsedSections = new Set(collapsedSections); // Trigger reactivity
    }

    function handleNavigation(event: MouseEvent, item: any) {
        if (item.behaviour === "background-tab") {
            event.preventDefault();
            const newWindow = window.open(item.href, "_blank");
            if (newWindow) {
                newWindow.blur();
                window.focus();
            }
            notifications.showInfo(
                "We've opened the Treasure Hunt in a new tab for you so you don't lose your place here.",
                "Treasure Hunt Opened",
            );
        }
    }

    onMount(() => {
        estateAudit.runAudit();

        // Check if executor and first time
        if (browser && contextStore.isExecutor) {
            const hasSeenWelcome = localStorage.getItem(
                "continuum_executor_welcome_seen",
            );
            if (!hasSeenWelcome) {
                showExecutorWelcome = true;
            }
        }

        // The rest of the page waits for the greeting only when the greeting can be typed now;
        // otherwise its tiles show their own cue meanwhile.
        if (auditLoading) loading = false;
        return () => clearInterval(typing);
    });

    // Gentle typewriter effect. The greeting is chosen once, after the audit stores have
    // answered, so the loading score never picks it.
    let typing: ReturnType<typeof setInterval> | undefined;
    $effect(() => {
        if (auditLoading || typing) return;
        const text = untrack(() => fullGreeting);
        let i = 0;
        typing = setInterval(() => {
            if (i < text.length) {
                greeting += text[i];
                i++;
            } else {
                clearInterval(typing);
                loading = false;
            }
        }, 30);
    });

    // Check for onboarding redirect
    $effect(() => {
        if (estateAudit.percentage === 0 && browser && !loading && !auditLoading) {
            const skipped =
                localStorage.getItem("continuum_setup_skipped") === "true";
            if (
                !skipped &&
                !hasAutoRedirected &&
                !$preferenceStore.expertMode &&
                !$preferenceStore.onboardingComplete &&
                !$auth.loading
            ) {
                hasAutoRedirected = true;
                window.location.href = "/onboarding";
            }
        }
    });
</script>

<div class="min-h-screen text-slate-200 font-sans selection:bg-primary/30">
    <HolographicGrid />

    <!-- Executor Welcome Modal -->
    {#if showExecutorWelcome}
        <ExecutorWelcome onComplete={() => (showExecutorWelcome = false)} />
    {/if}

    <main class="relative container mx-auto px-6 py-8 max-w-6xl">
        {#if contextStore.isExecutor}
            <!-- Executor Mode: Simplified Hub -->
            <ExecutorHub />
        {:else}
            <!-- Welcome Header -->
            <div class="mb-8" in:fade={{ duration: 600 }}>
                <div
                    class="font-mono text-sm text-primary/60 uppercase tracking-[0.2em] mb-2"
                >
                    {greeting}<span class="animate-pulse">_</span>
                </div>
                <h1 class="font-serif text-3xl font-bold tracking-tight text-white">Dashboard</h1>
                {#if totalValue > 0}
                    <div class="text-sm text-emerald-400/80">
                        {currency.format(totalValue)} net across your documented accounts
                    </div>
                {/if}
            </div>

            <!-- Compact Progress Stats -->
            {#if !loading}
                <div
                    class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
                    in:fly={{ y: 20, duration: 600, delay: 200 }}
                >
                    <a
                        href="/modules/contacts"
                        class="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:bg-white/10 hover:border-primary/30 hover:scale-[1.02] transition-all cursor-pointer block"
                    >
                        <div class="flex items-center justify-center mb-2">
                            <Users size={20} class="text-primary" />
                        </div>
                        {#if contactsLoading}
                            <div class="flex h-8 items-center justify-center" role="status" data-testid="tile-loading">
                                <Loader2 size={20} class="animate-spin text-primary" />
                                <span class="sr-only">Gathering your records...</span>
                            </div>
                        {:else}
                            <div class="text-2xl font-bold text-white">
                                {contactCount}
                            </div>
                        {/if}
                        <div class="text-sm text-slate-400">
                            {pluralWord(contactCount, "Contact")}
                        </div>
                    </a>
                    <a
                        href="/modules/insurance"
                        class="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:bg-white/10 hover:border-primary/30 hover:scale-[1.02] transition-all cursor-pointer block"
                    >
                        <div class="flex items-center justify-center mb-2">
                            <Shield size={20} class="text-primary" />
                        </div>
                        {#if policiesLoading}
                            <div class="flex h-8 items-center justify-center" role="status" data-testid="tile-loading">
                                <Loader2 size={20} class="animate-spin text-primary" />
                                <span class="sr-only">Gathering your records...</span>
                            </div>
                        {:else}
                            <div class="text-2xl font-bold text-white">
                                {policyCount}
                            </div>
                        {/if}
                        <div class="text-sm text-slate-400">
                            {pluralWord(policyCount, "Policy", "Policies")}
                        </div>
                    </a>
                    <a
                        href="/modules/financial-accounts"
                        class="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:bg-white/10 hover:border-primary/30 hover:scale-[1.02] transition-all cursor-pointer block"
                    >
                        <div class="flex items-center justify-center mb-2">
                            <FileText size={20} class="text-primary" />
                        </div>
                        {#if accountsLoading}
                            <div class="flex h-8 items-center justify-center" role="status" data-testid="tile-loading">
                                <Loader2 size={20} class="animate-spin text-primary" />
                                <span class="sr-only">Gathering your records...</span>
                            </div>
                        {:else}
                            <div class="text-2xl font-bold text-white">
                                {accountCount}
                            </div>
                        {/if}
                        <div class="text-sm text-slate-400">
                            {pluralWord(accountCount, "Account")}
                        </div>
                    </a>
                    <a
                        href="/modules/medical"
                        class="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:bg-white/10 hover:border-primary/30 hover:scale-[1.02] transition-all cursor-pointer block"
                    >
                        <div class="flex items-center justify-center mb-2">
                            <Heart size={20} class="text-primary" />
                        </div>
                        {#if medicalLoading}
                            <div class="flex h-8 items-center justify-center" role="status" data-testid="tile-loading">
                                <Loader2 size={20} class="animate-spin text-primary" />
                                <span class="sr-only">Gathering your records...</span>
                            </div>
                        {:else}
                            <div class="text-2xl font-bold text-white">
                                {medicalCount}
                            </div>
                        {/if}
                        <div class="text-sm text-slate-400">Medical</div>
                    </a>
                </div>
            {/if}

            <!-- Search Bar -->
            {#if !loading}
                <div class="mb-8" in:fly={{ y: 20, duration: 600, delay: 400 }}>
                    <div class="relative w-full max-w-md mx-auto lg:mx-0 group">
                        <Search
                            class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 size-4 transition-colors group-focus-within:text-primary"
                        />
                        <input
                            type="text"
                            bind:value={searchQuery}
                            placeholder="Find what you need..."
                            class="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:border-primary/50 focus:outline-none transition-all backdrop-blur-sm"
                        />
                        <div
                            class="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity"
                        ></div>
                    </div>
                </div>

                <!-- Status Key Cards (clickable to filter) -->
                {#if !chipsAnswered}
                    <div class="mb-6 flex items-center gap-2" role="status" data-testid="chips-loading">
                        <Loader2 size={14} class="animate-spin text-primary" />
                        <span class="text-xs text-slate-500">Gathering your records...</span>
                    </div>
                {:else}
                <div
                    class="mb-6 flex flex-wrap items-center gap-2"
                    in:fly={{ y: 10, duration: 400, delay: 450 }}
                >
                    <button
                        onclick={() => toggleStatusFilter("safe")}
                        class="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5 flex items-center gap-2 cursor-pointer transition-all hover:bg-emerald-500/20 {filterByStatus ===
                        'safe'
                            ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-900'
                            : ''}"
                    >
                        <span
                            class="w-2 h-2 rounded-full bg-emerald-400 shadow-sm"
                            style="box-shadow: 0 0 4px rgb(52 211 153 / 0.4);"
                        ></span>
                        <span class="text-sm font-medium text-emerald-400"
                            >{statusSummary.safe}</span
                        >
                        <span class="text-xs text-emerald-400/70"
                            >Kept safe</span
                        >
                    </button>
                    {#if statusSummary.saving > 0}
                        <button
                            onclick={() => toggleStatusFilter("saving")}
                            class="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5 flex items-center gap-2 cursor-pointer transition-all hover:bg-amber-500/20 {filterByStatus ===
                            'saving'
                                ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900'
                                : ''}"
                        >
                            <span
                                class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"
                            ></span>
                            <span class="text-sm font-medium text-amber-400"
                                >{statusSummary.saving}</span
                            >
                            <span class="text-xs text-amber-400/70">Saving</span
                            >
                        </button>
                    {/if}
                    {#if statusSummary.local > 0}
                        <button
                            onclick={() => toggleStatusFilter("local")}
                            class="bg-sky-500/10 border border-sky-500/20 rounded-lg px-3 py-1.5 flex items-center gap-2 cursor-pointer transition-all hover:bg-sky-500/20 {filterByStatus ===
                            'local'
                                ? 'ring-2 ring-sky-400 ring-offset-1 ring-offset-slate-900'
                                : ''}"
                        >
                            <span class="w-2 h-2 rounded-full bg-sky-400"
                            ></span>
                            <span class="text-sm font-medium text-sky-400"
                                >{statusSummary.local}</span
                            >
                            <span class="text-xs text-sky-400/70"
                                >On device</span
                            >
                        </button>
                    {/if}
                    {#if statusSummary.attention > 0}
                        <button
                            onclick={() =>
                                toggleStatusFilter("attention-needed")}
                            class="bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-1.5 flex items-center gap-2 cursor-pointer transition-all hover:bg-orange-500/20 {filterByStatus ===
                            'attention-needed'
                                ? 'ring-2 ring-orange-400 ring-offset-1 ring-offset-slate-900'
                                : ''}"
                        >
                            <span class="w-2 h-2 rounded-full bg-orange-400"
                            ></span>
                            <span class="text-sm font-medium text-orange-400"
                                >{statusSummary.attention}</span
                            >
                            <span class="text-xs text-orange-400/70"
                                >Needs attention</span
                            >
                        </button>
                    {/if}
                    <button
                        onclick={() => toggleStatusFilter("ready")}
                        class="bg-slate-500/10 border border-slate-500/20 rounded-lg px-3 py-1.5 flex items-center gap-2 cursor-pointer transition-all hover:bg-slate-500/20 {filterByStatus ===
                        'ready'
                            ? 'ring-2 ring-slate-400 ring-offset-1 ring-offset-slate-900'
                            : ''}"
                    >
                        <span class="w-2 h-2 rounded-full bg-slate-400"></span>
                        <span class="text-sm font-medium text-slate-400"
                            >{statusSummary.ready}</span
                        >
                        <span class="text-xs text-slate-400/70">Ready</span>
                    </button>
                    {#if filterByStatus}
                        <button
                            onclick={() => (filterByStatus = null)}
                            class="ml-2 text-xs text-slate-500 hover:text-slate-300 underline"
                        >
                            Clear filter
                        </button>
                    {/if}
                </div>
                {/if}

                <!-- Search Results -->
                {#if searchResults !== null}
                    <div class="mb-8" in:fade={{ duration: 300 }}>
                        <h2 class="text-lg text-slate-300 mb-5">
                            {searchResults.length === 0
                                ? `Nothing found for "${searchQuery}"`
                                : `${searchResults.length} result${searchResults.length === 1 ? "" : "s"}`}
                        </h2>
                        {#if searchResults.length > 0}
                            <div
                                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                            >
                                {#each searchResults as item, i (item.key)}
                                    {@const status = getModuleStatus(item)}
                                    <Tooltip
                                        content={item.tooltip}
                                        position="top"
                                        delay={500}
                                    >
                                        <a
                                            href={item.href}
                                            class="block group"
                                            onclick={(e) =>
                                                handleNavigation(e, item)}
                                            in:fly={{
                                                y: 20,
                                                duration: 400,
                                                delay: i * 50,
                                            }}
                                        >
                                            <div
                                                class="relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] {status.inProgress
                                                    ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/40'
                                                    : 'bg-white/5 border border-white/10 hover:border-indigo-500/40 hover:bg-white/10'}"
                                            >
                                                <div
                                                    class="p-5 h-full flex items-center gap-4"
                                                >
                                                    <div
                                                        class="size-12 rounded-xl flex items-center justify-center flex-shrink-0 {status.inProgress
                                                            ? 'bg-emerald-500/20'
                                                            : 'bg-indigo-500/10'}"
                                                    >
                                                        <svelte:component
                                                            this={item.icon}
                                                            size={24}
                                                            class={status.inProgress
                                                                ? "text-emerald-400"
                                                                : "text-indigo-400"}
                                                        />
                                                    </div>
                                                    <div class="flex-1 min-w-0">
                                                        <h3
                                                            class="font-semibold text-lg text-white truncate group-hover:text-indigo-300 transition-colors"
                                                        >
                                                            {$dict[item.key] ||
                                                                item.label}
                                                        </h3>
                                                        {#if item.isPreview}<span class="inline-block text-xs font-medium px-2 py-0.5 rounded-md bg-white/10 text-slate-300" data-testid="preview-tag">Early preview</span>{/if}
                                                        {#if status.count > 0}
                                                            <p
                                                                class="text-sm text-emerald-400/80"
                                                            >
                                                                {status.count}
                                                                {status.label}
                                                            </p>
                                                        {/if}
                                                    </div>
                                                    <!-- Sync Badge with label -->
                                                    {#if !cardLoading(item.key)}
                                                    <SyncBadge
                                                        status={getModuleSyncStatus(
                                                            item.key,
                                                        )}
                                                        size="md"
                                                        showLabel={true}
                                                    />
                                                    {/if}
                                                </div>
                                            </div>
                                        </a>
                                    </Tooltip>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {:else if statusFilteredGroups !== null}
                    <!-- Status Filtered Results -->
                    <div class="mb-8" in:fade={{ duration: 300 }}>
                        <h2 class="text-lg text-slate-300 mb-5">
                            Showing modules with "{filterByStatus ===
                            "attention-needed"
                                ? "needs attention"
                                : filterByStatus}" status
                        </h2>
                        {#if statusFilteredGroups.length === 0}
                            <p class="text-slate-400 text-center py-8">
                                No modules with this status
                            </p>
                        {:else}
                            <div class="space-y-6">
                                {#each statusFilteredGroups as group, groupIndex (group.groupKey)}
                                    <section
                                        class="rounded-2xl bg-slate-950/30 backdrop-blur-sm border border-white/5 overflow-hidden"
                                        in:fly={{
                                            y: 20,
                                            duration: 400,
                                            delay: groupIndex * 80,
                                        }}
                                    >
                                        <div
                                            class="px-6 py-4 border-b border-white/5"
                                        >
                                            <h2
                                                class="text-lg font-semibold text-slate-200"
                                            >
                                                {$dict[group.groupKey] ||
                                                    group.groupLabel}
                                            </h2>
                                        </div>
                                        <div
                                            class="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                                        >
                                            {#each group.items as item, i (item.key)}
                                                {@const status =
                                                    getModuleStatus(item)}
                                                <Tooltip
                                                    content={item.tooltip}
                                                    position="top"
                                                    delay={500}
                                                >
                                                    <a
                                                        href={item.href}
                                                        class="block group"
                                                        onclick={(e) =>
                                                            handleNavigation(
                                                                e,
                                                                item,
                                                            )}
                                                        in:fly={{
                                                            y: 15,
                                                            duration: 400,
                                                            delay: i * 40,
                                                        }}
                                                    >
                                                        <div
                                                            class="relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] {status.inProgress
                                                                ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/40'
                                                                : 'bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/10'}"
                                                        >
                                                            <div
                                                                class="p-5 h-full flex items-center gap-4"
                                                            >
                                                                <div
                                                                    class="size-12 rounded-xl flex items-center justify-center flex-shrink-0 {status.inProgress
                                                                        ? 'bg-emerald-500/20'
                                                                        : 'bg-primary/10'}"
                                                                >
                                                                    <svelte:component
                                                                        this={item.icon}
                                                                        size={24}
                                                                        class={status.inProgress
                                                                            ? "text-emerald-400"
                                                                            : "text-primary"}
                                                                    />
                                                                </div>
                                                                <div
                                                                    class="flex-1 min-w-0"
                                                                >
                                                                    <h3
                                                                        class="font-semibold text-lg text-white group-hover:text-primary transition-colors truncate"
                                                                    >
                                                                        {$dict[
                                                                            item
                                                                                .key
                                                                        ] ||
                                                                            item.label}
                                                                    </h3>
                                                                    {#if status.inProgress && status.count > 0}
                                                                        <p
                                                                            class="text-sm text-emerald-400/80 mt-0.5"
                                                                        >
                                                                            {status.count}
                                                                            {status.label}
                                                                        </p>
                                                                    {:else if status.inProgress}
                                                                        <p
                                                                            class="text-sm text-emerald-400/80 mt-0.5"
                                                                        >
                                                                            Started
                                                                        </p>
                                                                    {/if}
                                                                </div>
                                                                {#if !cardLoading(item.key)}
                                                                <SyncBadge
                                                                    status={getModuleSyncStatus(
                                                                        item.key,
                                                                    )}
                                                                    size="md"
                                                                    showLabel={true}
                                                                />
                                                                {/if}
                                                            </div>
                                                        </div>
                                                    </a>
                                                </Tooltip>
                                            {/each}
                                        </div>
                                    </section>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {:else}
                    <!-- Navigation Groups -->
                    <div class="space-y-6">
                        {#each filteredNavGroups as group, groupIndex (group.groupKey)}
                            {@const isCollapsed =
                                !group.isPrimary &&
                                collapsedSections.has(group.groupKey)}

                            <section
                                class="rounded-2xl bg-slate-950/30 backdrop-blur-sm border border-white/5 overflow-hidden"
                                in:fly={{
                                    y: 30,
                                    duration: 600,
                                    delay: 500 + groupIndex * 100,
                                }}
                            >
                                <!-- Group Header -->
                                {#if group.isPrimary}
                                    <div
                                        class="px-6 py-5 border-b border-white/5"
                                    >
                                        <div class="flex items-center gap-3">
                                            <Zap
                                                size={20}
                                                class="text-amber-400"
                                            />
                                            <h2
                                                class="text-lg font-bold text-amber-400 uppercase tracking-wide"
                                            >
                                                {$dict[group.groupKey] ||
                                                    group.groupLabel}
                                            </h2>
                                        </div>
                                        {#if group.groupDescription}
                                            <p
                                                class="text-base text-slate-400 mt-2 pl-8"
                                            >
                                                {group.groupDescription}
                                            </p>
                                        {/if}
                                    </div>
                                {:else}
                                    <button
                                        class="w-full px-6 py-5 border-b border-white/5 text-left hover:bg-white/5 transition-colors"
                                        onclick={() =>
                                            toggleSection(group.groupKey)}
                                    >
                                        <div
                                            class="flex items-center justify-between"
                                        >
                                            <div>
                                                <h2
                                                    class="text-lg font-semibold text-slate-200"
                                                >
                                                    {$dict[group.groupKey] ||
                                                        group.groupLabel}
                                                </h2>
                                                {#if group.groupDescription}
                                                    <p
                                                        class="text-base text-slate-500 mt-1"
                                                    >
                                                        {group.groupDescription}
                                                    </p>
                                                {/if}
                                            </div>
                                            {#if isCollapsed}
                                                <ChevronRight
                                                    size={20}
                                                    class="text-slate-400"
                                                />
                                            {:else}
                                                <ChevronDown
                                                    size={20}
                                                    class="text-slate-400"
                                                />
                                            {/if}
                                        </div>
                                    </button>
                                {/if}

                                <!-- Group Items -->
                                {#if !isCollapsed}
                                    <div
                                        class="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                                    >
                                        {#each group.items as item, i (item.key)}
                                            {@const status =
                                                getModuleStatus(item)}
                                            <Tooltip
                                                content={item.tooltip}
                                                position="top"
                                                delay={500}
                                            >
                                                <a
                                                    href={item.href}
                                                    class="block group"
                                                    onclick={(e) =>
                                                        handleNavigation(
                                                            e,
                                                            item,
                                                        )}
                                                    in:fly={{
                                                        y: 15,
                                                        duration: 400,
                                                        delay: i * 40,
                                                    }}
                                                >
                                                    <div
                                                        class="relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] {status.inProgress
                                                            ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/40'
                                                            : 'bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/10'}"
                                                    >
                                                        <div
                                                            class="p-5 h-full flex items-center gap-4"
                                                        >
                                                            <!-- Icon -->
                                                            <div
                                                                class="size-12 rounded-xl flex items-center justify-center flex-shrink-0 {status.inProgress
                                                                    ? 'bg-emerald-500/20'
                                                                    : 'bg-primary/10'}"
                                                            >
                                                                <svelte:component
                                                                    this={item.icon}
                                                                    size={24}
                                                                    class={status.inProgress
                                                                        ? "text-emerald-400"
                                                                        : "text-primary"}
                                                                />
                                                            </div>

                                                            <!-- Content -->
                                                            <div
                                                                class="flex-1 min-w-0"
                                                            >
                                                                <h3
                                                                    class="font-semibold text-lg text-white group-hover:text-primary transition-colors truncate"
                                                                >
                                                                    {$dict[
                                                                        item.key
                                                                    ] ||
                                                                        item.label}
                                                                </h3>
                                                                {#if status.inProgress && status.count > 0}
                                                                    <p
                                                                        class="text-sm text-emerald-400/80 mt-0.5"
                                                                    >
                                                                        {status.count}
                                                                        {status.label}
                                                                    </p>
                                                                {:else if status.inProgress}
                                                                    <p
                                                                        class="text-sm text-emerald-400/80 mt-0.5"
                                                                    >
                                                                        Started
                                                                    </p>
                                                                {/if}
                                                            </div>

                                                            <!-- Sync Badge with label -->
                                                            {#if !cardLoading(item.key)}
                                                            <SyncBadge
                                                                status={getModuleSyncStatus(
                                                                    item.key,
                                                                )}
                                                                size="md"
                                                                showLabel={true}
                                                            />
                                                            {/if}
                                                        </div>
                                                    </div>
                                                </a>
                                            </Tooltip>
                                        {/each}
                                    </div>
                                {/if}
                            </section>
                        {/each}
                    </div>
                {/if}
            {:else}
                <!-- Loading State with Shimmer -->
                <div class="space-y-6 mt-8">
                    {#each [1, 2] as section}
                        <div class="rounded-2xl bg-slate-800/20 p-4">
                            <div
                                class="h-6 w-40 bg-slate-700/30 rounded mb-4 animate-pulse"
                            ></div>
                            <div
                                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
                            >
                                {#each Array(4) as _}
                                    <div
                                        class="h-24 rounded-xl bg-slate-800/30 animate-pulse relative overflow-hidden"
                                    >
                                        <div
                                            class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent shimmer-animation"
                                        ></div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        {/if}
    </main>
</div>

<style>
    @keyframes shimmer {
        0% {
            transform: translateX(-100%);
        }
        100% {
            transform: translateX(100%);
        }
    }
    .shimmer-animation {
        animation: shimmer 2s infinite;
    }
</style>
