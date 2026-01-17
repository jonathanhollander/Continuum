<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import ThePulse from "$lib/components/dashboard/ThePulse.svelte";
    import HolographicGrid from "$lib/components/dashboard/HolographicGrid.svelte";
    import FocusCard from "$lib/components/dashboard/FocusCard.svelte";
    import { estateAudit } from "$lib/stores/auditStore";
    import { estateProfile } from "$lib/stores/estateStore";
    import { fade, fly } from "svelte/transition";
    import {
        Shield,
        Users,
        Sparkles,
        BrainCircuit,
        UserCog,
    } from "lucide-svelte";
    import { preferenceStore } from "$lib/stores/preferenceStore";

    import { t } from "$lib/stores/localization";
    import { browser } from "$app/environment";

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
    // Reactive greeting target based on state
    let fullGreeting = $derived(
        $estateAudit.totalScore > 0
            ? $t("system.analyzing")
            : $t("system.initializing"),
    );

    import { familyMembers } from "$lib/stores/familyStore";
    import { digitalAssetsStore } from "$lib/stores/digitalAssetsStore";
    import { insuranceStore } from "$lib/stores/insuranceStore";

    // Dynamic Metrics
    let totalValue = $derived($estateProfile.totalValue || 0);
    let networkSize = $derived($familyMembers.length);
    let coverageCount = $derived(
        $digitalAssetsStore.filter(
            (a) => !a.isClosed && a.platform !== "Example",
        ).length +
            $insuranceStore.length +
            ($estateAudit.moduleScores["financial"] ? 1 : 0),
    );

    // Formatter
    const currency = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    });

    onMount(() => {
        estateAudit.runAudit();

        if ($estateAudit.totalScore > 0) {
            pulseStatus = "active";
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
        if ($estateAudit.percentage !== undefined) {
            score = $estateAudit.percentage;

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
        const issues = $estateAudit.issues || [];
        const profile = $estateProfile;

        if (score === 0) {
            // New User / System Initialization Mode
            // Only redirect if they haven't explicitly skipped setup
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
                window.location.href = "/start";
                return;
            }

            // If they skipped, the focus card should STILL point to initialization
            focusItem = {
                title: "System Initialization Required",
                description:
                    "Your digital estate is currently unconfigured. The wizard will guide you through core setup in 30 seconds.",
                link: "/start?force=true",
                type: "critical",
            };
            return;
        }

        if (issues.length > 0) {
            // Pick highest priority issue
            const issue = issues[0]; // Issues are usually sorted by impact in the store (or should be)
            let title = issue;
            let link = "/modules/timeline";

            // Map issues to routes (Concierge Logic)
            // Map issues to routes (Concierge Logic)
            if (
                issue.includes("Will") ||
                issue.includes("Executor") ||
                issue.includes("Legal")
            ) {
                title = "Legal Core Missing";
                link = "/modules/legal-documents";
            } else if (
                issue.includes("Beneficiary") ||
                issue.includes("financial") ||
                issue.includes("account")
            ) {
                title = "Asset Security Gap";
                link = "/modules/financial-accounts";
            } else if (issue.includes("Proxy") || issue.includes("Health")) {
                title = "Healthcare Vulnerability";
                link = "/modules/medical-directives";
            } else if (
                issue.includes("Digital") ||
                issue.includes("Password") ||
                issue.includes("Phone")
            ) {
                title = "Digital Access Risk";
                link = "/modules/digital-guardian";
            } else if (
                issue.includes("Insurance") ||
                issue.includes("policy")
            ) {
                title = "Insurance Coverage Gap";
                link = "/modules/insurance";
            } else if (issue.includes("Family") || issue.includes("contact")) {
                title = "Notification Network Empty";
                link = "/modules/contacts";
            }

            focusItem = {
                title: title.replace(/\[.*?\]\s/, ""), // Clean raw strings
                description:
                    "This is the single highest-impact action you can take to secure your legacy right now.",
                link: link,
                type: "critical",
            };
        } else {
            // All Good
            focusItem = {
                title: "Legacy Secured",
                description:
                    "All core systems are nominal. Consider adding a personal touch to your timeline.",
                link: "/modules/letters",
                type: "insight",
            };
            pulseStatus = "secure";
        }
    }
</script>

<div class="min-h-screen text-slate-200 font-sans selection:bg-indigo-500/30">
    <HolographicGrid />

    <main
        class="relative container mx-auto px-6 py-12 flex flex-col lg:flex-row items-center justify-center min-h-[80vh] gap-12 lg:gap-24"
    >
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
                        ? "Initialize System"
                        : "Resolve Now"}
                />

                <!-- Dynamic secondary stats -->
                <div
                    class="mt-8 grid grid-cols-2 gap-4 opacity-50 hover:opacity-100 transition-opacity"
                >
                    <div
                        class="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm flex items-center gap-3"
                    >
                        <Shield size={20} class="text-emerald-400" />
                        <div>
                            <div
                                class="text-[10px] uppercase font-bold text-slate-400"
                            >
                                Estate Value
                            </div>
                            <div class="font-bold text-white tracking-tight">
                                {currency.format(totalValue)}
                            </div>
                        </div>
                    </div>
                    <div
                        class="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm flex items-center gap-3"
                    >
                        <Users size={20} class="text-indigo-400" />
                        <div>
                            <div
                                class="text-[10px] uppercase font-bold text-slate-400"
                            >
                                Registered
                            </div>
                            <div class="font-bold text-white">
                                {networkSize} Member{networkSize !== 1
                                    ? "s"
                                    : ""}
                            </div>
                        </div>
                    </div>
                    <div
                        class="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm flex items-center gap-3"
                    >
                        <Sparkles size={20} class="text-amber-400" />
                        <div>
                            <div
                                class="text-[10px] uppercase font-bold text-slate-400"
                            >
                                Registry Coverage
                            </div>
                            <div class="font-bold text-white">
                                {coverageCount} Cataloged
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    </main>
</div>
