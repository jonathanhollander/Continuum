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
        moduleSyncKeys,
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
    import { dict, language, userRole } from "$lib/stores/conciergeStore.svelte";
    import { letterStore } from "$lib/stores/letterStore.svelte";
    import { subscriptionStore } from "$lib/stores/subscriptionStore.svelte";
    import { petStore } from "$lib/stores/petStore.svelte";
    import { calendarStore } from "$lib/stores/calendarStore.svelte";
    import { homeAccessStore } from "$lib/stores/homeAccessStore.svelte";
    import { utilityStore } from "$lib/stores/utilityStore.svelte";
    import { vendorStore } from "$lib/stores/vendorStore.svelte";
    import { heirloomStore } from "$lib/stores/heirloomStore.svelte";
    import { journalStore } from "$lib/stores/journalStore.svelte";
    import { visualMemories } from "$lib/stores/visualMemoryStore.svelte";
    import { timeCapsuleStore } from "$lib/stores/timeCapsuleStore.svelte";
    import { timelineStore } from "$lib/stores/timelineStore.svelte";

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
    let fullGreeting = $derived.by(() => {
        const english = estateAudit.totalScore > 0 ? getGreeting() : "Ready when you are";
        return ($dict.dashGreet as Record<string, string>)[english] ?? english;
    });

    // Dynamic Metrics
    // The same net the financial page shows: open assets less open debts
    let totalValue = $derived(estateTotals(financialAssetsStore.items).net);

    // English names come from navigation.ts, the same names the sidebar shows;
    // other languages read the dictionary by key (as the sidebar does).
    const navText = (key: string, label: string) =>
        $language === "en" ? label : $dict[key] || label;
    // Group subtitles and card tooltips read navDesc / navTip the same way (X232).
    const navDesc = (key: string, text?: string) =>
        !text || $language === "en" ? (text ?? "") : ($dict.navDesc as Record<string, string>)[key] || text;
    const navTip = (key: string, text?: string) =>
        !text || $language === "en" ? (text ?? "") : ($dict.navTip as Record<string, string>)[key] || text;

    // Dictionary text (X237): `{name}` slots filled in, and a count picks its plural form
    // by the active language's rules.
    const fill = (text: string, vars: Record<string, string | number>) =>
        text.replace(/\{(\w+)\}/g, (slot, k) => String(vars[k] ?? slot));
    const countWord = (forms: Record<string, string>, n: number) =>
        forms[new Intl.PluralRules($language).select(n)] ?? forms.other;
    const tileWord = (tile: string, n: number) =>
        countWord(($dict.dashTile as Record<string, Record<string, string>>)[tile], n);

    // Only cards that hold saved records show a save badge (not Settings, the catalog, tools).
    const holdsRecords = (key: string) => key in moduleSyncKeys;

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

    // A stats tile shows only when the current role can open its page (the layout's
    // role guard sends other roles back here).
    const navItems = navGroups.flatMap((g) => g.items);
    const canOpen = (href: string) =>
        navItems.find((i) => i.href === href)?.allowedRoles.includes($userRole) ?? true;
    let showPolicies = $derived(canOpen("/modules/insurance"));
    let showAccounts = $derived(canOpen("/modules/financial-accounts"));
    let tileCount = $derived(2 + (showPolicies ? 1 : 0) + (showAccounts ? 1 : 0));

    // The status chips' own names, also used for the filtered list's heading.
    let statusName = $derived($dict.dashStatus as Record<string, string>);

    function recordCount(count: number, one: string, many?: string) {
        return { inProgress: count > 0, count, label: pluralWord(count, one, many) };
    }

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
                    label: pluralWord(accountCount, "open account"),
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
                return {
                    inProgress: subscriptionStore.items.length > 0,
                    count: subscriptionStore.items.length,
                    label: pluralWord(subscriptionStore.items.length, "subscription"),
                };
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
            case "letters":
                return recordCount(letterStore.items.length, "letter");
            case "heirlooms":
                return recordCount(heirloomStore.items.length, "heirloom");
            case "journal":
                return recordCount(journalStore.items.length, "entry", "entries");
            case "visual-memories":
                return recordCount(visualMemories.items.length, "memory", "memories");
            case "capsule":
                return recordCount(timeCapsuleStore.items.length, "message");
            case "timeline":
                return recordCount(timelineStore.items.length, "moment");
            case "pets":
                return recordCount(petStore.items.length, "pet");
            case "calendar":
                return recordCount(calendarStore.items.length, "event");
            case "home-manual":
                return recordCount(
                    homeAccessStore.items.length +
                        utilityStore.items.length +
                        vendorStore.items.length,
                    "entry",
                    "entries",
                );
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
                const label = navText(item.key, item.label);
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
                    (item) =>
                        holdsRecords(item.key) &&
                        getModuleSyncStatus(item.key) === filterByStatus,
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

<div class="min-h-screen text-foreground font-sans selection:bg-primary/30">
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
                    class="font-mono text-sm text-muted-foreground uppercase tracking-[0.2em] mb-2"
                >
                    {greeting}<span class="animate-pulse">_</span>
                </div>
                <h1 class="font-serif text-3xl font-bold tracking-tight text-foreground">{$dict.dashboard}</h1>
                {#if totalValue > 0}
                    <div class="text-sm text-success">
                        {fill($dict.dashNet, { amount: currency.format(totalValue) })}
                    </div>
                {/if}
            </div>

            <!-- Compact Progress Stats -->
            {#if !loading}
                <div
                    class="grid grid-cols-2 {tileCount === 4
                        ? 'sm:grid-cols-4'
                        : tileCount === 3
                          ? 'sm:grid-cols-3'
                          : ''} gap-4 mb-8"
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
                                <span class="sr-only">{$dict.dashGathering}</span>
                            </div>
                        {:else}
                            <div class="text-2xl font-bold text-foreground">
                                {contactCount}
                            </div>
                        {/if}
                        <div class="text-sm text-muted-foreground">
                            {tileWord("contacts", contactCount)}
                        </div>
                        {#if !contactsLoading && !cardLoading("contacts")}
                            <div class="mt-2 flex justify-center">
                                <SyncBadge status={getModuleSyncStatus("contacts")} size="md" showLabel={true} />
                            </div>
                        {/if}
                    </a>
                    {#if showPolicies}
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
                                <span class="sr-only">{$dict.dashGathering}</span>
                            </div>
                        {:else}
                            <div class="text-2xl font-bold text-foreground">
                                {policyCount}
                            </div>
                        {/if}
                        <div class="text-sm text-muted-foreground">
                            {tileWord("policies", policyCount)}
                        </div>
                        {#if !policiesLoading && !cardLoading("insurance")}
                            <div class="mt-2 flex justify-center">
                                <SyncBadge status={getModuleSyncStatus("insurance")} size="md" showLabel={true} />
                            </div>
                        {/if}
                    </a>
                    {/if}
                    {#if showAccounts}
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
                                <span class="sr-only">{$dict.dashGathering}</span>
                            </div>
                        {:else}
                            <div class="text-2xl font-bold text-foreground">
                                {accountCount}
                            </div>
                        {/if}
                        <div class="text-sm text-muted-foreground">
                            {tileWord("accounts", accountCount)}
                        </div>
                        {#if !accountsLoading && !cardLoading("financial")}
                            <div class="mt-2 flex justify-center">
                                <SyncBadge status={getModuleSyncStatus("financial")} size="md" showLabel={true} />
                            </div>
                        {/if}
                    </a>
                    {/if}
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
                                <span class="sr-only">{$dict.dashGathering}</span>
                            </div>
                        {:else}
                            <div class="text-2xl font-bold text-foreground">
                                {medicalCount}
                            </div>
                        {/if}
                        <div class="text-sm text-muted-foreground">{$dict.dashMedical}</div>
                        {#if !medicalLoading && !cardLoading("medical")}
                            <div class="mt-2 flex justify-center">
                                <SyncBadge status={getModuleSyncStatus("medical")} size="md" showLabel={true} />
                            </div>
                        {/if}
                    </a>
                </div>
            {/if}

            <!-- Search Bar -->
            {#if !loading}
                <div class="mb-8" in:fly={{ y: 20, duration: 600, delay: 400 }}>
                    <div class="relative w-full max-w-md mx-auto lg:mx-0 group">
                        <Search
                            class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground size-4 transition-colors group-focus-within:text-primary"
                        />
                        <input
                            type="text"
                            aria-label={$dict.dashFindLabel}
                            bind:value={searchQuery}
                            placeholder={$dict.dashFindPlaceholder}
                            class="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none transition-all backdrop-blur-sm"
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
                        <span class="text-xs text-muted-foreground">{$dict.dashGathering}</span>
                    </div>
                {:else}
                <div
                    class="mb-6 flex flex-wrap items-center gap-2"
                    in:fly={{ y: 10, duration: 400, delay: 450 }}
                >
                    <button
                        onclick={() => toggleStatusFilter("safe")}
                        class="bg-success/10 border border-success/20 rounded-lg px-3 py-1.5 flex items-center gap-2 cursor-pointer transition-all hover:bg-success/20 {filterByStatus ===
                        'safe'
                            ? 'ring-2 ring-success ring-offset-1 ring-offset-background'
                            : ''}"
                    >
                        <span
                            class="w-2 h-2 rounded-full bg-success shadow-sm"
                            style="box-shadow: 0 0 4px color-mix(in srgb, var(--color-success) 40%, transparent);"
                        ></span>
                        <span class="text-sm font-medium text-success"
                            >{statusSummary.safe}</span
                        >
                        <span class="text-xs text-success"
                            >{statusName.safe}</span
                        >
                    </button>
                    {#if statusSummary.saving > 0}
                        <button
                            onclick={() => toggleStatusFilter("saving")}
                            class="bg-info/10 border border-info/20 rounded-lg px-3 py-1.5 flex items-center gap-2 cursor-pointer transition-all hover:bg-info/20 {filterByStatus ===
                            'saving'
                                ? 'ring-2 ring-info ring-offset-1 ring-offset-background'
                                : ''}"
                        >
                            <span
                                class="w-2 h-2 rounded-full bg-info animate-pulse"
                            ></span>
                            <span class="text-sm font-medium text-info"
                                >{statusSummary.saving}</span
                            >
                            <span class="text-xs text-info">{statusName.saving}</span
                            >
                        </button>
                    {/if}
                    {#if statusSummary.local > 0}
                        <button
                            onclick={() => toggleStatusFilter("local")}
                            class="bg-muted-foreground/10 border border-muted-foreground/20 rounded-lg px-3 py-1.5 flex items-center gap-2 cursor-pointer transition-all hover:bg-muted-foreground/20 {filterByStatus ===
                            'local'
                                ? 'ring-2 ring-muted-foreground ring-offset-1 ring-offset-background'
                                : ''}"
                        >
                            <span class="w-2 h-2 rounded-full bg-muted-foreground"
                            ></span>
                            <span class="text-sm font-medium text-muted-foreground"
                                >{statusSummary.local}</span
                            >
                            <span class="text-xs text-muted-foreground"
                                >{statusName.local}</span
                            >
                        </button>
                    {/if}
                    {#if statusSummary.attention > 0}
                        <button
                            onclick={() =>
                                toggleStatusFilter("attention-needed")}
                            class="bg-warning/10 border border-warning/20 rounded-lg px-3 py-1.5 flex items-center gap-2 cursor-pointer transition-all hover:bg-warning/20 {filterByStatus ===
                            'attention-needed'
                                ? 'ring-2 ring-warning ring-offset-1 ring-offset-background'
                                : ''}"
                        >
                            <span class="w-2 h-2 rounded-full bg-warning"
                            ></span>
                            <span class="text-sm font-medium text-warning"
                                >{statusSummary.attention}</span
                            >
                            <span class="text-xs text-warning"
                                >{statusName["attention-needed"]}</span
                            >
                        </button>
                    {/if}
                    <button
                        onclick={() => toggleStatusFilter("ready")}
                        class="bg-muted-foreground/10 border border-muted-foreground/20 rounded-lg px-3 py-1.5 flex items-center gap-2 cursor-pointer transition-all hover:bg-muted-foreground/20 {filterByStatus ===
                        'ready'
                            ? 'ring-2 ring-muted-foreground ring-offset-1 ring-offset-background'
                            : ''}"
                    >
                        <span class="w-2 h-2 rounded-full bg-muted-foreground"></span>
                        <span class="text-sm font-medium text-muted-foreground"
                            >{statusSummary.ready}</span
                        >
                        <span class="text-xs text-muted-foreground">{statusName.ready}</span>
                    </button>
                    {#if filterByStatus}
                        <button
                            onclick={() => (filterByStatus = null)}
                            class="ml-2 text-xs text-muted-foreground hover:text-foreground underline"
                        >
                            {$dict.dashClearFilter}
                        </button>
                    {/if}
                </div>
                {/if}

                <!-- Search Results -->
                {#if searchResults !== null}
                    <div class="mb-8" in:fade={{ duration: 300 }}>
                        <h2 class="text-lg text-foreground mb-5">
                            {searchResults.length === 0
                                ? fill($dict.dashFindOther, { q: searchQuery })
                                : fill(countWord($dict.dashResults, searchResults.length), { n: searchResults.length })}
                        </h2>
                        {#if searchResults.length > 0}
                            <div
                                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                            >
                                {#each searchResults as item, i (item.key)}
                                    {@const status = getModuleStatus(item)}
                                    <Tooltip
                                        content={navTip(item.key, item.tooltip)}
                                        position="top"
                                        delay={500}
                                    >
                                        <a
                                            href={item.href}
                                            class="block h-full group"
                                            in:fly={{
                                                y: 20,
                                                duration: 400,
                                                delay: i * 50,
                                            }}
                                        >
                                            <div
                                                class="relative h-full rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] {status.inProgress
                                                    ? 'bg-gradient-to-br from-success/10 to-success/5 border border-success/20 hover:border-success/40'
                                                    : 'bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/10'}"
                                            >
                                                <div
                                                    class="p-5 h-full flex items-center gap-4"
                                                >
                                                    <div
                                                        class="size-12 rounded-xl flex items-center justify-center flex-shrink-0 {status.inProgress
                                                            ? 'bg-success/20'
                                                            : 'bg-primary/10'}"
                                                    >
                                                        <item.icon
                                                            size={24}
                                                            class={status.inProgress
                                                                ? "text-success"
                                                                : "text-primary"}
                                                        />
                                                    </div>
                                                    <div class="flex-1 min-w-0">
                                                        <h3
                                                            class="font-semibold text-lg text-foreground break-words group-hover:text-primary transition-colors"
                                                        >
                                                            {navText(item.key, item.label)}
                                                        </h3>
                                                        {#if item.isPreview}<span class="inline-block text-xs font-medium px-2 py-0.5 rounded-md bg-white/10 text-foreground" data-testid="preview-tag">{$dict.earlyPreview}</span>{/if}
                                                        {#if status.count > 0}
                                                            <p
                                                                class="text-sm text-success"
                                                            >
                                                                {status.count}
                                                                {status.label}
                                                            </p>
                                                        {/if}
                                                    </div>
                                                    <!-- Sync Badge with label -->
                                                    {#if holdsRecords(item.key) && !cardLoading(item.key)}
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
                        <h2 class="text-lg text-foreground mb-5">
                            {fill($dict.dashShowing, {
                                status: statusName[filterByStatus ?? ""] ?? filterByStatus ?? "",
                            })}
                        </h2>
                        {#if statusFilteredGroups.length === 0}
                            <p class="text-muted-foreground text-center py-8">
                                {$dict.dashStatusEmpty}
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
                                                class="text-lg font-semibold text-foreground"
                                            >
                                                {navText(group.groupKey, group.groupLabel)}
                                            </h2>
                                        </div>
                                        <div
                                            class="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                                        >
                                            {#each group.items as item, i (item.key)}
                                                {@const status =
                                                    getModuleStatus(item)}
                                                <Tooltip
                                                    content={navTip(item.key, item.tooltip)}
                                                    position="top"
                                                    delay={500}
                                                >
                                                    <a
                                                        href={item.href}
                                                        class="block h-full group"
                                                        in:fly={{
                                                            y: 15,
                                                            duration: 400,
                                                            delay: i * 40,
                                                        }}
                                                    >
                                                        <div
                                                            class="relative h-full rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] {status.inProgress
                                                                ? 'bg-gradient-to-br from-success/10 to-success/5 border border-success/20 hover:border-success/40'
                                                                : 'bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/10'}"
                                                        >
                                                            <div
                                                                class="p-5 h-full flex items-center gap-4"
                                                            >
                                                                <div
                                                                    class="size-12 rounded-xl flex items-center justify-center flex-shrink-0 {status.inProgress
                                                                        ? 'bg-success/20'
                                                                        : 'bg-primary/10'}"
                                                                >
                                                                    <item.icon
                                                                        size={24}
                                                                        class={status.inProgress
                                                                            ? "text-success"
                                                                            : "text-primary"}
                                                                    />
                                                                </div>
                                                                <div
                                                                    class="flex-1 min-w-0"
                                                                >
                                                                    <h3
                                                                        class="font-semibold text-lg text-foreground group-hover:text-primary transition-colors break-words"
                                                                    >
                                                                        {navText(item.key, item.label)}
                                                                    </h3>
                                                                    {#if item.isPreview}<span class="inline-block text-xs font-medium px-2 py-0.5 rounded-md bg-white/10 text-foreground" data-testid="preview-tag">{$dict.earlyPreview}</span>{/if}
{#if status.inProgress && status.count > 0}
                                                                        <p
                                                                            class="text-sm text-success mt-0.5"
                                                                        >
                                                                            {status.count}
                                                                            {status.label}
                                                                        </p>
                                                                    {:else if status.inProgress}
                                                                        <p
                                                                            class="text-sm text-success mt-0.5"
                                                                        >
                                                                            {$dict.dashStarted}
                                                                        </p>
                                                                    {/if}
                                                                </div>
                                                                {#if holdsRecords(item.key) && !cardLoading(item.key)}
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
                                                class="text-gold-text"
                                            />
                                            <h2
                                                class="text-lg font-bold text-gold-text uppercase tracking-wide"
                                            >
                                                {navText(group.groupKey, group.groupLabel)}
                                            </h2>
                                        </div>
                                        {#if group.groupDescription}
                                            <p
                                                class="text-base text-muted-foreground mt-2 pl-8"
                                            >
                                                {navDesc(group.groupKey, group.groupDescription)}
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
                                                    class="text-lg font-semibold text-foreground"
                                                >
                                                    {navText(group.groupKey, group.groupLabel)}
                                                </h2>
                                                {#if group.groupDescription}
                                                    <p
                                                        class="text-base text-muted-foreground mt-1"
                                                    >
                                                        {navDesc(group.groupKey, group.groupDescription)}
                                                    </p>
                                                {/if}
                                            </div>
                                            {#if isCollapsed}
                                                <ChevronRight
                                                    size={20}
                                                    class="text-muted-foreground"
                                                />
                                            {:else}
                                                <ChevronDown
                                                    size={20}
                                                    class="text-muted-foreground"
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
                                                content={navTip(item.key, item.tooltip)}
                                                position="top"
                                                delay={500}
                                            >
                                                <a
                                                    href={item.href}
                                                    class="block h-full group"
                                                    in:fly={{
                                                        y: 15,
                                                        duration: 400,
                                                        delay: i * 40,
                                                    }}
                                                >
                                                    <div
                                                        class="relative h-full rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] {status.inProgress
                                                            ? 'bg-gradient-to-br from-success/10 to-success/5 border border-success/20 hover:border-success/40'
                                                            : 'bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/10'}"
                                                    >
                                                        <div
                                                            class="p-5 h-full flex items-center gap-4"
                                                        >
                                                            <!-- Icon -->
                                                            <div
                                                                class="size-12 rounded-xl flex items-center justify-center flex-shrink-0 {status.inProgress
                                                                    ? 'bg-success/20'
                                                                    : 'bg-primary/10'}"
                                                            >
                                                                <item.icon
                                                                    size={24}
                                                                    class={status.inProgress
                                                                        ? "text-success"
                                                                        : "text-primary"}
                                                                />
                                                            </div>

                                                            <!-- Content -->
                                                            <div
                                                                class="flex-1 min-w-0"
                                                            >
                                                                <h3
                                                                    class="font-semibold text-lg text-foreground group-hover:text-primary transition-colors break-words"
                                                                >
                                                                    {navText(item.key, item.label)}
                                                                </h3>
                                                                {#if item.isPreview}<span class="inline-block text-xs font-medium px-2 py-0.5 rounded-md bg-white/10 text-foreground" data-testid="preview-tag">{$dict.earlyPreview}</span>{/if}
{#if status.inProgress && status.count > 0}
                                                                    <p
                                                                        class="text-sm text-success mt-0.5"
                                                                    >
                                                                        {status.count}
                                                                        {status.label}
                                                                    </p>
                                                                {:else if status.inProgress}
                                                                    <p
                                                                        class="text-sm text-success mt-0.5"
                                                                    >
                                                                        {$dict.dashStarted}
                                                                    </p>
                                                                {/if}
                                                            </div>

                                                            <!-- Sync Badge with label -->
                                                            {#if holdsRecords(item.key) && !cardLoading(item.key)}
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
