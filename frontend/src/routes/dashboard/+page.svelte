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
        Grid,
        List as ListIcon,
        Check,
        BrainCircuit,
    } from "lucide-svelte";
    import { browser } from "$app/environment";
    import { contextStore } from "$lib/stores/contextStore.svelte.ts";
    import {
        getGreeting,
    } from "$lib/utils/contextualMessages";
    import * as registryRaw from "$lib/data/registry.json";

    // Import registry data
    const registryData = (registryRaw as any).default || registryRaw;
    const registry: Array<{id: string; title: string; description: string; icon: string; role: string}> = Array.isArray(registryData)
        ? registryData
        : Object.values(registryData).filter((x) => typeof x === "object");

    // Executor mode welcome state
    let showExecutorWelcome = $state(false);

    // "The Pulse" State
    let pulseStatus = $state<"secure" | "active" | "critical" | "standby">("standby");
    let score = $state(0);
    let loading = $state(true);

    // Search and view state
    let searchQuery = $state("");
    let viewMode = $state<"grid" | "list">("grid");

    // Greeting Typewriter
    let greeting = $state("");
    let fullGreeting = $derived(
        estateAudit.totalScore > 0 ? getGreeting() : "System Initializing..."
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

    // Module status mapping - connects registry modules to audit data and stores
    const moduleStatusMap: Record<string, { auditKey: string; getCount: () => number; label: string }> = {
        'contacts': { auditKey: 'family', getCount: () => familyStore.members.length, label: 'contacts' },
        'legal-documents': { auditKey: 'financial', getCount: () => propertyStore.items.length, label: 'assets' },
        'visual-memories': { auditKey: 'digital', getCount: () => 0, label: 'photos' },
        'subscriptions': { auditKey: 'digital', getCount: () => digitalAssetsStore.items.length, label: 'accounts' },
        'funeral': { auditKey: 'medical', getCount: () => medicalStore.directives.length, label: 'directives' },
        'family-hub': { auditKey: 'family', getCount: () => familyStore.members.length, label: 'members' },
        'timeline': { auditKey: 'family', getCount: () => 0, label: '' },
        'executor-hub': { auditKey: 'family', getCount: () => 0, label: '' },
        'preparation-hub': { auditKey: 'financial', getCount: () => 0, label: '' },
    };

    // Derived status for each module
    let moduleStatus = $derived.by(() => {
        const status: Record<string, { started: boolean; count: number; label: string }> = {};
        const scores = estateAudit.moduleScores;

        for (const module of registry) {
            const config = moduleStatusMap[module.id];
            if (config) {
                const auditScore = scores[config.auditKey] || 0;
                const count = config.getCount();
                status[module.id] = {
                    started: auditScore > 0 || count > 0,
                    count: count,
                    label: config.label
                };
            } else {
                // Default for modules not in map
                status[module.id] = {
                    started: false,
                    count: 0,
                    label: ''
                };
            }
        }
        return status;
    });

    // Filtered modules based on search
    let filteredModules = $derived.by(() => {
        if (searchQuery.trim() === "") {
            return registry;
        }
        return registry.filter(
            (m) =>
                m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (m.description &&
                    m.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
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

        // Simulate "System Boot"
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

    <main class="relative container mx-auto px-6 py-8">
        {#if contextStore.isExecutor}
            <!-- Executor Mode: Simplified Hub -->
            <ExecutorHub />
        {:else}
            <!-- Compact Hero: ThePulse + Quick Stats -->
            <div class="flex flex-col lg:flex-row items-center gap-8 mb-12" in:fade={{ duration: 600 }}>
                <!-- ThePulse (Scaled Down) -->
                <div class="flex-shrink-0 scale-75 origin-center -my-12">
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
                        <div class="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm" in:fly={{ y: 20, duration: 600, delay: 300 }}>
                            <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                                <BrainCircuit size={14} class="text-indigo-400" />
                                <span class="text-slate-400">
                                    {areasDocumented.started} of {areasDocumented.total} areas documented
                                </span>
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

            <!-- Search Bar + View Toggle -->
            {#if !loading}
                <div class="flex flex-col md:flex-row gap-4 justify-between items-center mb-8" in:fly={{ y: 20, duration: 600, delay: 400 }}>
                    <!-- Search Bar with Scan Line Effect -->
                    <div class="relative w-full md:w-96 group">
                        <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 size-4 transition-colors group-focus-within:text-indigo-400" />
                        <input
                            type="text"
                            bind:value={searchQuery}
                            placeholder="Search modules..."
                            class="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500/50 focus:outline-none transition-all backdrop-blur-sm"
                        />
                        <div class="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    </div>

                    <!-- View Toggle -->
                    <div class="flex items-center gap-2 border border-white/10 rounded-xl p-1 bg-slate-950/50 backdrop-blur-sm">
                        <button
                            onclick={() => viewMode = "grid"}
                            class="p-2.5 rounded-lg transition-all {viewMode === 'grid' ? 'bg-indigo-500/20 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.3)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}"
                        >
                            <Grid size={16} />
                        </button>
                        <button
                            onclick={() => viewMode = "list"}
                            class="p-2.5 rounded-lg transition-all {viewMode === 'list' ? 'bg-indigo-500/20 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.3)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}"
                        >
                            <ListIcon size={16} />
                        </button>
                    </div>
                </div>

                <!-- Module Catalog Grid -->
                {#if viewMode === "grid"}
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {#each filteredModules as module, i (module.id)}
                            <a
                                href={`/modules/${module.id}`}
                                class="block group"
                                in:fly={{ y: 30, duration: 600, delay: 100 + i * 80 }}
                            >
                                <!-- Glassmorphism Card with Hover Glow -->
                                <div class="relative rounded-2xl p-[1px] bg-gradient-to-br from-white/20 via-white/5 to-transparent overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.4)]">
                                    <div class="bg-slate-950/40 backdrop-blur-md h-full rounded-2xl p-5">
                                        <!-- Header: Icon + Status Badge -->
                                        <div class="flex items-start justify-between mb-3">
                                            <div class="size-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-2xl relative overflow-hidden">
                                                {module.icon}
                                                {#if moduleStatus[module.id]?.started}
                                                    <div class="absolute inset-0 rounded-xl bg-emerald-500/10 animate-pulse"></div>
                                                {/if}
                                            </div>
                                            {#if moduleStatus[module.id]?.started}
                                                <span class="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                                                    <Check size={12} /> Started
                                                </span>
                                            {:else}
                                                <span class="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-full">
                                                    Not Yet
                                                </span>
                                            {/if}
                                        </div>

                                        <!-- Title + Description -->
                                        <h3 class="font-medium text-white mb-1 group-hover:text-indigo-300 transition-colors">
                                            {module.title}
                                        </h3>
                                        <p class="text-sm text-slate-400 line-clamp-2">
                                            {module.description}
                                        </p>

                                        <!-- Progress Stats (if any) -->
                                        {#if moduleStatus[module.id]?.count > 0}
                                            <div class="mt-3 pt-3 border-t border-white/10 text-xs text-slate-500">
                                                {moduleStatus[module.id].count} {moduleStatus[module.id].label}
                                            </div>
                                        {/if}

                                        <!-- Role Badge -->
                                        <div class="mt-3 flex justify-between items-center">
                                            <span class="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                                                {module.role}
                                            </span>
                                            <span class="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                                                Open →
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Shine sweep on hover -->
                                    <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                                </div>
                            </a>
                        {/each}
                    </div>
                {/if}

                <!-- List View -->
                {#if viewMode === "list"}
                    <div class="space-y-2">
                        {#each filteredModules as module, i (module.id)}
                            <a
                                href={`/modules/${module.id}`}
                                class="flex items-center gap-4 p-4 rounded-xl bg-slate-950/40 backdrop-blur-md border border-white/10 hover:border-indigo-500/50 transition-all group"
                                in:fly={{ x: -20, duration: 400, delay: 50 + i * 40 }}
                            >
                                <div class="size-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-xl flex-shrink-0 relative">
                                    {module.icon}
                                    {#if moduleStatus[module.id]?.started}
                                        <div class="absolute -top-1 -right-1 size-3 bg-emerald-500 rounded-full border-2 border-slate-950"></div>
                                    {/if}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h3 class="font-medium truncate group-hover:text-indigo-300 transition-colors">
                                        {module.title}
                                    </h3>
                                    <p class="text-xs text-slate-500 truncate">
                                        {module.description}
                                    </p>
                                </div>
                                <div class="flex items-center gap-3 flex-shrink-0">
                                    {#if moduleStatus[module.id]?.count > 0}
                                        <span class="text-xs text-slate-400">
                                            {moduleStatus[module.id].count} {moduleStatus[module.id].label}
                                        </span>
                                    {/if}
                                    {#if moduleStatus[module.id]?.started}
                                        <span class="flex items-center gap-1 text-xs text-emerald-400">
                                            <Check size={12} />
                                        </span>
                                    {/if}
                                    <span class="text-[10px] font-bold uppercase text-slate-600 tracking-wider">
                                        {module.role}
                                    </span>
                                </div>
                            </a>
                        {/each}
                    </div>
                {/if}

                <!-- Empty State -->
                {#if filteredModules.length === 0}
                    <div class="text-center py-20 text-slate-500" in:fade>
                        <p>No modules found matching "{searchQuery}"</p>
                    </div>
                {/if}
            {:else}
                <!-- Loading State with Shimmer -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    {#each Array(6) as _, i}
                        <div class="h-48 rounded-2xl bg-slate-800/30 animate-pulse relative overflow-hidden">
                            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent shimmer-animation"></div>
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
