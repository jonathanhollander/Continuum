<script lang="ts">
    import { onMount } from "svelte";
    import ThePulse from "$lib/components/dashboard/ThePulse.svelte";
    import HolographicGrid from "$lib/components/dashboard/HolographicGrid.svelte";
    import ExecutorHub from "$lib/components/executor/ExecutorHub.svelte";
    import ExecutorWelcome from "$lib/components/executor/ExecutorWelcome.svelte";
    import { auth } from "$lib/stores/auth";
    import { estateAudit } from "$lib/stores/auditStore.svelte.ts";
    import { estateProfile } from "$lib/stores/estateStore.svelte.ts";
    import { familyStore } from "$lib/stores/familyStore.svelte.ts";
    import { digitalAssetsStore } from "$lib/stores/digitalAssetsStore.svelte.ts";
    import { insuranceStore } from "$lib/stores/insuranceStore.svelte.ts";
    import { medicalStore } from "$lib/stores/medicalStore.svelte.ts";
    import { propertyStore } from "$lib/stores/propertyStore.svelte.ts";
    import { preferenceStore } from "$lib/stores/preferenceStore.ts";
    import { fade, fly } from "svelte/transition";
    import {
        Search,
        Check,
        ChevronDown,
        ChevronRight,
        Zap,
    } from "lucide-svelte";
    import { browser } from "$app/environment";
    import { contextStore } from "$lib/stores/contextStore.svelte.ts";
    import { getGreeting } from "$lib/utils/contextualMessages";
    import { navGroups, catalogCategories, type NavItem, type NavGroup } from "$lib/config/navigation";
    import { t, userRole } from "$lib/stores/conciergeStore.svelte.ts";

    // Executor mode welcome state
    let showExecutorWelcome = $state(false);

    // "The Pulse" State
    let pulseStatus = $state<"secure" | "active" | "critical" | "standby">("standby");
    let score = $state(0);
    let loading = $state(true);

    // Search state
    let searchQuery = $state("");

    // Collapsed sections state (secondary groups start collapsed)
    let collapsedSections = $state<Set<string>>(new Set(['groupSecondary', 'groupLegacy']));

    // Greeting Typewriter
    let greeting = $state("");
    let fullGreeting = $derived(
        estateAudit.totalScore > 0 ? getGreeting() : "Taking a moment..."
    );

    // Dynamic Metrics
    let totalValue = $derived(estateProfile.current.totalValue || 0);
    let networkSize = $derived(familyStore.members.length);
    let coverageCount = $derived(
        digitalAssetsStore.items.filter(
            (a) => !a.isClosed && a.platform !== "Example"
        ).length +
            insuranceStore.policies.length +
            (estateAudit.moduleScores["financial"] ? 1 : 0)
    );

    // Filter nav groups by user role
    let filteredNavGroups = $derived(
        navGroups
            .map((group) => ({
                ...group,
                items: group.items.filter((item) =>
                    item.allowedRoles.includes($userRole) && item.key !== 'dashboard'
                ),
            }))
            .filter((group) => group.items.length > 0)
    );

    // Module status mapping - connects nav items to audit data and stores
    function getModuleStatus(item: NavItem): { inProgress: boolean; count: number; label: string } {
        const scores = estateAudit.moduleScores;

        switch (item.key) {
            case 'contacts':
                return {
                    inProgress: scores['family'] > 0 || familyStore.members.length > 0,
                    count: familyStore.members.length,
                    label: 'people'
                };
            case 'financial':
                return {
                    inProgress: scores['financial'] > 0 || propertyStore.items.length > 0,
                    count: propertyStore.items.length,
                    label: 'accounts'
                };
            case 'insurance':
                return {
                    inProgress: scores['insurance'] > 0 || insuranceStore.policies.length > 0,
                    count: insuranceStore.policies.length,
                    label: 'policies'
                };
            case 'documents':
                return {
                    inProgress: scores['financial'] > 0,
                    count: 0,
                    label: ''
                };
            case 'medical':
                return {
                    inProgress: scores['medical'] > 0 || medicalStore.directives.length > 0,
                    count: medicalStore.directives.length,
                    label: 'directives'
                };
            case 'subscriptions':
            case 'guardian':
                return {
                    inProgress: scores['digital'] > 0 || digitalAssetsStore.items.length > 0,
                    count: digitalAssetsStore.items.length,
                    label: 'accounts'
                };
            case 'property':
                return {
                    inProgress: propertyStore.items.length > 0,
                    count: propertyStore.items.length,
                    label: 'properties'
                };
            default:
                return { inProgress: false, count: 0, label: '' };
        }
    }

    // Filter items by search
    let searchResults = $derived.by(() => {
        if (searchQuery.trim() === "") return null;

        const query = searchQuery.toLowerCase();
        const results: NavItem[] = [];

        for (const group of filteredNavGroups) {
            for (const item of group.items) {
                const label = $t[item.key] || item.label;
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
                    if (label.toLowerCase().includes(query) && !results.find(r => r.key === item.key)) {
                        results.push(item);
                    }
                }
            }
        }

        return results;
    });

    // Areas documented summary
    let areasDocumented = $derived.by(() => {
        const modules = estateAudit.moduleScores;
        const areas = ['financial', 'insurance', 'family', 'medical', 'digital'];
        const started = areas.filter(a => modules[a] > 0);
        return {
            started: started.length,
            total: areas.length
        };
    });

    // Formatter
    const currency = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
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

        if (estateAudit.totalScore > 0) {
            pulseStatus = "active";
        }

        // Check if executor and first time
        if (browser && contextStore.isExecutor) {
            const hasSeenWelcome = localStorage.getItem("continuum_executor_welcome_seen");
            if (!hasSeenWelcome) {
                showExecutorWelcome = true;
            }
        }

        // Gentle typewriter effect
        let i = 0;
        const interval = setInterval(() => {
            if (i < fullGreeting.length) {
                greeting += fullGreeting[i];
                i++;
            } else {
                clearInterval(interval);
                loading = false;
            }
        }, 30);

        return () => clearInterval(interval);
    });

    $effect(() => {
        if (estateAudit.percentage !== undefined) {
            score = estateAudit.percentage;

            if (score === 0) {
                pulseStatus = "standby";
            } else if (score > 80) {
                pulseStatus = "secure";
            } else if (score < 40) {
                pulseStatus = "critical";
            } else {
                pulseStatus = "active";
            }
        }
    });

    // Check for onboarding redirect
    $effect(() => {
        if (score === 0 && browser && !loading) {
            const skipped = localStorage.getItem("continuum_setup_skipped") === "true";
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

<div class="min-h-screen text-slate-200 font-sans selection:bg-indigo-500/30">
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
            <!-- Compact Hero: ThePulse + Quick Stats -->
            <div class="flex flex-col lg:flex-row items-center gap-6 mb-10" in:fade={{ duration: 600 }}>
                <!-- ThePulse (Scaled Down) -->
                <div class="flex-shrink-0 scale-[0.6] origin-center -my-16 -mx-8">
                    <ThePulse status={pulseStatus} {score} />
                </div>

                <!-- Status + Quick Stats -->
                <div class="flex-1 text-center lg:text-left">
                    <!-- System Status -->
                    <div class="font-mono text-sm text-indigo-300/60 uppercase tracking-[0.2em] mb-3">
                        {greeting}<span class="animate-pulse">_</span>
                    </div>

                    <!-- Quick Summary -->
                    {#if !loading}
                        <div class="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-sm" in:fly={{ y: 20, duration: 600, delay: 300 }}>
                            <div class="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                                {areasDocumented.started} of {areasDocumented.total} areas documented
                            </div>
                            {#if networkSize > 0}
                                <div class="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                                    {networkSize} people
                                </div>
                            {/if}
                            {#if coverageCount > 0}
                                <div class="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                                    {coverageCount} items
                                </div>
                            {/if}
                            {#if totalValue > 0}
                                <div class="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                                    {currency.format(totalValue)} protected
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Search Bar -->
            {#if !loading}
                <div class="mb-8" in:fly={{ y: 20, duration: 600, delay: 400 }}>
                    <div class="relative w-full max-w-md mx-auto lg:mx-0 group">
                        <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 size-4 transition-colors group-focus-within:text-indigo-400" />
                        <input
                            type="text"
                            bind:value={searchQuery}
                            placeholder="Find what you need..."
                            class="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500/50 focus:outline-none transition-all backdrop-blur-sm"
                        />
                        <div class="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    </div>
                </div>

                <!-- Search Results -->
                {#if searchResults !== null}
                    <div class="mb-8" in:fade={{ duration: 300 }}>
                        <h2 class="text-sm text-slate-400 mb-4">
                            {searchResults.length === 0
                                ? `Nothing found for "${searchQuery}"`
                                : `${searchResults.length} result${searchResults.length === 1 ? '' : 's'}`}
                        </h2>
                        {#if searchResults.length > 0}
                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {#each searchResults as item, i (item.key)}
                                    {@const status = getModuleStatus(item)}
                                    <a
                                        href={item.href}
                                        class="block group"
                                        in:fly={{ y: 20, duration: 400, delay: i * 50 }}
                                    >
                                        <div class="relative rounded-xl p-[1px] bg-gradient-to-br from-white/15 via-white/5 to-transparent overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_-10px_rgba(99,102,241,0.3)]">
                                            <div class="bg-slate-950/60 backdrop-blur-md rounded-xl p-4 h-full">
                                                <div class="flex items-center gap-3">
                                                    <div class="size-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                                        <svelte:component this={item.icon} size={18} class="text-indigo-400" />
                                                    </div>
                                                    <div class="flex-1 min-w-0">
                                                        <h3 class="font-medium text-white truncate group-hover:text-indigo-300 transition-colors">
                                                            {$t[item.key] || item.label}
                                                        </h3>
                                                        {#if status.count > 0}
                                                            <p class="text-xs text-slate-500">{status.count} {status.label}</p>
                                                        {/if}
                                                    </div>
                                                    {#if status.inProgress}
                                                        <div class="size-2 rounded-full bg-emerald-500"></div>
                                                    {/if}
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {:else}
                    <!-- Navigation Groups -->
                    <div class="space-y-6">
                        {#each filteredNavGroups as group, groupIndex (group.groupKey)}
                            {@const isCollapsed = !group.isPrimary && collapsedSections.has(group.groupKey)}

                            <section
                                class="rounded-2xl bg-slate-950/30 backdrop-blur-sm border border-white/5 overflow-hidden"
                                in:fly={{ y: 30, duration: 600, delay: 500 + groupIndex * 100 }}
                            >
                                <!-- Group Header -->
                                {#if group.isPrimary}
                                    <div class="px-5 py-4 border-b border-white/5">
                                        <div class="flex items-center gap-2">
                                            <Zap size={14} class="text-amber-400" />
                                            <h2 class="text-sm font-semibold text-amber-400/90 uppercase tracking-wider">
                                                {$t[group.groupKey] || group.groupLabel}
                                            </h2>
                                        </div>
                                        {#if group.groupDescription}
                                            <p class="text-xs text-slate-500 mt-1 pl-6">
                                                {group.groupDescription}
                                            </p>
                                        {/if}
                                    </div>
                                {:else}
                                    <button
                                        class="w-full px-5 py-4 border-b border-white/5 text-left hover:bg-white/5 transition-colors"
                                        onclick={() => toggleSection(group.groupKey)}
                                    >
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <h2 class="text-sm font-medium text-slate-300">
                                                    {$t[group.groupKey] || group.groupLabel}
                                                </h2>
                                                {#if group.groupDescription}
                                                    <p class="text-xs text-slate-500 mt-0.5">
                                                        {group.groupDescription}
                                                    </p>
                                                {/if}
                                            </div>
                                            {#if isCollapsed}
                                                <ChevronRight size={16} class="text-slate-500" />
                                            {:else}
                                                <ChevronDown size={16} class="text-slate-500" />
                                            {/if}
                                        </div>
                                    </button>
                                {/if}

                                <!-- Group Items -->
                                {#if !isCollapsed}
                                    <div class="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                        {#each group.items as item, i (item.key)}
                                            {@const status = getModuleStatus(item)}
                                            <a
                                                href={item.href}
                                                class="block group"
                                                in:fly={{ y: 15, duration: 400, delay: i * 40 }}
                                            >
                                                <div class="relative rounded-xl p-[1px] bg-gradient-to-br from-white/10 via-white/5 to-transparent overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_-10px_rgba(99,102,241,0.25)] {status.inProgress ? 'from-emerald-500/20' : ''}">
                                                    <div class="bg-slate-950/50 backdrop-blur-md rounded-xl p-4 h-full">
                                                        <!-- Icon + Status -->
                                                        <div class="flex items-start justify-between mb-3">
                                                            <div class="size-10 rounded-lg bg-indigo-500/10 flex items-center justify-center relative {status.inProgress ? 'bg-emerald-500/10' : ''}">
                                                                <svelte:component
                                                                    this={item.icon}
                                                                    size={18}
                                                                    class="{status.inProgress ? 'text-emerald-400' : 'text-indigo-400'}"
                                                                />
                                                            </div>
                                                            {#if status.inProgress}
                                                                <span class="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                                                                    <Check size={10} /> In progress
                                                                </span>
                                                            {:else}
                                                                <span class="text-[10px] text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">
                                                                    When you're ready
                                                                </span>
                                                            {/if}
                                                        </div>

                                                        <!-- Title -->
                                                        <h3 class="font-medium text-sm text-white group-hover:text-indigo-300 transition-colors leading-tight">
                                                            {$t[item.key] || item.label}
                                                        </h3>

                                                        <!-- Count (if any) -->
                                                        {#if status.count > 0}
                                                            <p class="text-xs text-slate-500 mt-1">
                                                                {status.count} {status.label}
                                                            </p>
                                                        {/if}
                                                    </div>

                                                    <!-- Hover shine -->
                                                    <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                                                </div>
                                            </a>
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
                            <div class="h-6 w-40 bg-slate-700/30 rounded mb-4 animate-pulse"></div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {#each Array(4) as _}
                                    <div class="h-24 rounded-xl bg-slate-800/30 animate-pulse relative overflow-hidden">
                                        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent shimmer-animation"></div>
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
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }
    .shimmer-animation {
        animation: shimmer 2s infinite;
    }
</style>
