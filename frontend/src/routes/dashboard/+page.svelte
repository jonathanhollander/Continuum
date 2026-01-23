<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import ThePulse from "$lib/components/dashboard/ThePulse.svelte";
    import HolographicGrid from "$lib/components/dashboard/HolographicGrid.svelte";
    import FocusCard from "$lib/components/dashboard/FocusCard.svelte";
    import ExecutorHub from "$lib/components/executor/ExecutorHub.svelte";
    import ExecutorWelcome from "$lib/components/executor/ExecutorWelcome.svelte";
    import { estateAudit } from "$lib/stores/auditStore.svelte";
    import { estateProfile } from "$lib/stores/estateStore.svelte";
    import { familyStore } from "$lib/stores/familyStore.svelte";
    import { digitalAssetsStore } from "$lib/stores/digitalAssetsStore.svelte";
    import { insuranceStore } from "$lib/stores/insuranceStore.svelte";
    import { preferenceStore } from "$lib/stores/preferenceStore";
    import { fade, fly } from "svelte/transition";
    import {
        Shield,
        Users,
        Sparkles,
        BrainCircuit,
        UserCog,
        Wallet,
        Heart,
        Stethoscope,
        Files,
        Check,
    } from "lucide-svelte";
    import { t } from "$lib/stores/localization";
    import { browser } from "$app/environment";
    import { contextStore } from "$lib/stores/contextStore.svelte";
    import { getGreeting, getProgressMessage } from "$lib/utils/contextualMessages";

    // Executor mode welcome state
    let showExecutorWelcome = $state(false);

    // "The Pulse" State
    let pulseStatus = $state<"secure" | "active" | "critical" | "standby">(
        "standby",
    );
    let score = $state(0);
    let loading = $state(true);

    // "The Focus" Logic
    let focusItem = $state<{
        title: string;
        description: string;
        link: string;
        type: "critical" | "insight";
    } | null>(null);

    // Greeting Typewriter
    let greeting = $state("");
    // Reactive greeting target based on state and user role
    let fullGreeting = $derived(
        estateAudit.totalScore > 0
            ? getGreeting()
            : $t("system.initializing"),
    );

    // Dynamic Metrics
    let totalValue = $derived(estateProfile.current.totalValue || 0);
    let networkSize = $derived(familyStore.members.length);
    let coverageCount = $derived(
        digitalAssetsStore.items.filter(
            (a) => !a.isClosed && a.platform !== "Example",
        ).length +
            insuranceStore.policies.length +
            (estateAudit.moduleScores["financial"] ? 1 : 0),
    );

    // Areas documented (Option B) - shows what has been started without judgment
    let areasDocumented = $derived.by(() => {
        const modules = estateAudit.moduleScores;
        const areas = [
            { key: 'financial', label: 'Financial', icon: Wallet, started: modules['financial'] > 0 },
            { key: 'insurance', label: 'Insurance', icon: Shield, started: modules['insurance'] > 0 },
            { key: 'family', label: 'Contacts', icon: Users, started: modules['family'] > 0 },
            { key: 'medical', label: 'Medical', icon: Stethoscope, started: modules['medical'] > 0 },
            { key: 'digital', label: 'Digital', icon: Files, started: modules['digital'] > 0 },
        ];
        return {
            started: areas.filter(a => a.started),
            notStarted: areas.filter(a => !a.started),
            total: areas.length
        };
    });

    // Formatter
    const currency = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    });

    onMount(() => {
        estateAudit.runAudit();

        if (estateAudit.totalScore > 0) {
            pulseStatus = "active";
        }

        // Check if executor and first time
        if (browser && contextStore.isExecutor) {
            const hasSeenWelcome = localStorage.getItem('continuum_executor_welcome_seen');
            if (!hasSeenWelcome) {
                showExecutorWelcome = true;
            }
        }

        // Simulate "System Boot"
        let i = 0;
        const interval = setInterval(() => {
            // Check against current fullGreeting length (it might change if lang swaps, but that's edge case)
            if (i < fullGreeting.length) {
                greeting += fullGreeting[i];
                i++;
            } else {
                clearInterval(interval);
                loading = false;
                determineFocus();
            }
        }, 30); // Typewriter speed

        return () => clearInterval(interval);
    });

    $effect(() => {
        if (estateAudit.percentage !== undefined) {
            score = estateAudit.percentage;

            // Logic for Pulse Status
            if (score === 0) {
                pulseStatus = "standby";
            } else if (score > 80) {
                pulseStatus = "secure";
            } else if (score < 40) {
                pulseStatus = "critical";
            } else {
                pulseStatus = "active";
            }

            // Always recalculate focus when audit updates
            determineFocus();
        }
    });

    let hasAutoRedirected = false;

    function determineFocus() {
        // "The Algorithm" - Simple Simulation for now
        const issues = estateAudit.issues || [];
        const profile = estateProfile.current;

        if (score === 0) {
            // New User / System Initialization Mode
            // Redirect to new onboarding flow if not completed
            const skipped =
                typeof localStorage !== "undefined" &&
                localStorage.getItem("continuum_setup_skipped") === "true";

            if (
                browser &&
                !skipped &&
                !hasAutoRedirected &&
                !$preferenceStore.expertMode &&
                !$preferenceStore.onboardingComplete
            ) {
                hasAutoRedirected = true;
                // Use new comprehensive onboarding flow
                window.location.href = "/onboarding";
                return;
            }

            // If they skipped, the focus card should STILL point to onboarding
            focusItem = {
                title: contextStore.isExecutor || contextStore.isFamily
                    ? "Getting Started"
                    : "Begin When You're Ready",
                description: contextStore.isExecutor
                    ? "The estate profile is waiting for information. Take your time gathering what you need."
                    : contextStore.isFamily
                    ? "Estate information hasn't been added yet. Check back when you're ready."
                    : "This is important work that takes courage. We'll guide you through it at your own pace.",
                link: "/onboarding",
                type: "critical",
            };
            return;
        }

        if (issues.length > 0) {
            // Pick highest priority issue
            const issue = issues[0]; // Issues are usually sorted by impact in the store (or should be)
            let title = issue;
            let link = "/modules/timeline";

            // Map issues to routes (Concierge Logic) - using compassionate language
            if (
                issue.includes("Will") ||
                issue.includes("Executor") ||
                issue.includes("Legal")
            ) {
                title = "Important Documents";
                link = "/modules/legal-documents";
            } else if (
                issue.includes("Beneficiary") ||
                issue.includes("financial") ||
                issue.includes("account")
            ) {
                title = "Financial Information";
                link = "/modules/financial-accounts";
            } else if (issue.includes("Proxy") || issue.includes("Health")) {
                title = "Your Care Preferences";
                link = "/modules/medical-directives";
            } else if (
                issue.includes("Digital") ||
                issue.includes("Password") ||
                issue.includes("Phone")
            ) {
                title = "Digital Account Access";
                link = "/modules/digital-guardian";
            } else if (
                issue.includes("Insurance") ||
                issue.includes("policy")
            ) {
                title = "Protection for Your Family";
                link = "/modules/insurance";
            } else if (issue.includes("Family") || issue.includes("contact")) {
                title = "People Who Matter";
                link = "/modules/contacts";
            }

            focusItem = {
                title: title.replace(/\[.*?\]\s/, ""), // Clean raw strings
                description:
                    "When you're ready, this would be a meaningful next step for your family.",
                link: link,
                type: "critical",
            };
        } else {
            // All Good - use affirming, not celebratory language
            focusItem = {
                title: contextStore.isExecutor
                    ? "You've Done Meaningful Work"
                    : contextStore.isFamily
                    ? "Information Is Here"
                    : "You've Built Something Meaningful",
                description: contextStore.isExecutor
                    ? "The essential information has been gathered. Take a moment to rest."
                    : contextStore.isFamily
                    ? "Estate information is organized and available when needed."
                    : "Your family will have clarity when they need it most. Add a personal message when you're ready.",
                link: "/modules/letters",
                type: "insight",
            };
            pulseStatus = "secure";
        }
    }
</script>

<div class="min-h-screen text-slate-200 font-sans selection:bg-indigo-500/30">
    <HolographicGrid />

    <!-- Executor Welcome Modal -->
    {#if showExecutorWelcome}
        <ExecutorWelcome onComplete={() => showExecutorWelcome = false} />
    {/if}

    <main
        class="relative container mx-auto px-6 py-12 flex flex-col lg:flex-row items-center justify-center min-h-[80vh] gap-12 lg:gap-24"
    >
        {#if contextStore.isExecutor}
            <!-- Executor Mode: Simplified Hub -->
            <ExecutorHub />
        {:else}
            <!-- Standard Dashboard: The Pulse + Focus Card -->
            <!-- Left: The Visual Core -->
            <div class="flex-1 flex flex-col items-center relative">
                <ThePulse status={pulseStatus} {score} />

                <!-- System Status Text -->
                <div
                    class="mt-8 font-mono text-sm text-indigo-300/60 uppercase tracking-[0.2em]"
                >
                    {greeting}<span class="animate-pulse">_</span>
                </div>
            </div>

            <!-- Right: The Singular Focus -->
            {#if !loading && focusItem}
            <div
                class="flex-1 w-full max-w-xl"
                in:fly={{ x: 50, duration: 1000 }}
            >
                <div class="mb-6 flex items-center gap-3 opacity-60">
                    <BrainCircuit size={18} class="text-indigo-400" />
                    <span class="text-xs font-bold uppercase tracking-widest"
                        >{$preferenceStore.expertMode
                            ? "Expert Dashboard"
                            : "AI Concierge Priority"}</span
                    >
                </div>

                {#if $preferenceStore.expertMode}
                    <div
                        class="mb-6 p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 text-xs text-slate-400"
                        in:fade
                    >
                        <UserCog size={16} class="text-slate-500" />
                        <p>
                            Expert Mode Active: Proactive AI guidance is
                            disabled. You have full manual control.
                        </p>
                    </div>
                {/if}

                <FocusCard
                    title={focusItem.title}
                    description={focusItem.description}
                    actionLink={focusItem.link}
                    type={focusItem.type}
                    actionLabel={score === 0
                        ? "Begin when ready"
                        : "Take this step"}
                />

                <!-- Areas Documented (Option B + C combination) -->
                <div class="mt-8 p-5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                    <div class="flex items-center justify-between mb-4">
                        <span class="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                            What You've Documented
                        </span>
                        <span class="text-xs text-slate-500">
                            {areasDocumented.started.length} of {areasDocumented.total} areas
                        </span>
                    </div>

                    <!-- Visual area indicators -->
                    <div class="flex flex-wrap gap-2">
                        {#each areasDocumented.started as area}
                            <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                                <svelte:component this={area.icon} size={14} class="text-emerald-400" />
                                <span class="text-xs text-emerald-300">{area.label}</span>
                            </div>
                        {/each}
                        {#each areasDocumented.notStarted as area}
                            <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 opacity-50">
                                <svelte:component this={area.icon} size={14} class="text-slate-500" />
                                <span class="text-xs text-slate-500">{area.label}</span>
                            </div>
                        {/each}
                    </div>

                    <!-- Summary stats -->
                    {#if areasDocumented.started.length > 0}
                        <div class="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div class="text-lg font-bold text-white">{networkSize}</div>
                                <div class="text-[10px] text-slate-500 uppercase">People</div>
                            </div>
                            <div>
                                <div class="text-lg font-bold text-white">{coverageCount}</div>
                                <div class="text-[10px] text-slate-500 uppercase">Items</div>
                            </div>
                            {#if totalValue > 0}
                                <div>
                                    <div class="text-lg font-bold text-white">{currency.format(totalValue)}</div>
                                    <div class="text-[10px] text-slate-500 uppercase">Protected</div>
                                </div>
                            {:else}
                                <div>
                                    <div class="text-lg font-bold text-white">{areasDocumented.started.length}</div>
                                    <div class="text-[10px] text-slate-500 uppercase">Areas</div>
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
            </div>
            {/if}
        {/if}
    </main>
</div>
