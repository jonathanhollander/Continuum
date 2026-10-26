<script lang="ts">
    import { fade, slide, scale } from "svelte/transition";
    import {
        Siren,
        ShieldAlert,
        ChevronRight,
        CircleCheck,
        CircleX,
        TriangleAlert,
        Activity,
        Users,
        Dna,
        Wallet,
        Cloud,
    } from "lucide-svelte";
    import { estateAnalytics, estateExecutorName } from "$lib/stores/analyticsStore";

    const scenarios = [
        {
            id: "sudden_disability",
            title: "Scenario: Sudden Disability",
            description:
                "You are in hospital and someone you trust decides for you. Who takes over and what can they find?",
            icon: Activity,
            color: "text-info",
            bg: "bg-info/10",
        },
        {
            id: "passing",
            title: "Scenario: Final Passing",
            description:
                "The estate transition begins. Are the keys, wills, and guardians ready for the executor?",
            icon: Dna,
            color: "text-primary-hover",
            bg: "bg-primary-soft",
        },
    ];

    let activeScenarioId = $state("sudden_disability");
    let activeScenario = $derived(
        scenarios.find((s) => s.id === activeScenarioId) || scenarios[0],
    );

    // Readiness logic for scenarios
    let readiness = $derived({
        hasExecutor: !!$estateExecutorName,
        hasProxy: $estateAnalytics.pillars.legal.metrics.hasMedicalProxy,
        hasLivingWill: $estateAnalytics.pillars.legal.metrics.hasLivingWill,
        hasHeirlooms: $estateAnalytics.pillars.legacy.metrics.heirloomCount > 0,
        hasDigital: $estateAnalytics.pillars.financial.metrics.digitalCount > 0,
        score: $estateAnalytics.overallHealth,
    });

    // The drill checks shown below, in each scenario's order of priority.
    // `goal` reuses each check's own wording for its met state.
    type CheckKey = "hasExecutor" | "hasProxy" | "hasDigital" | "hasHeirlooms";
    const checks: Record<CheckKey, { label: string; goal: string }> = {
        hasProxy: {
            label: "Healthcare Proxy",
            goal: "decisions can be made immediately",
        },
        hasExecutor: {
            label: "Executor",
            goal: "they know their role",
        },
        hasDigital: {
            label: "Digital Kill Switch Readiness",
            goal: "there are instructions for all accounts",
        },
        hasHeirlooms: {
            label: "Physical Heirloom Protocol",
            goal: "pet & object care instructions are found",
        },
    };
    const scenarioChecks: Record<string, CheckKey[]> = {
        sudden_disability: ["hasProxy", "hasExecutor", "hasDigital", "hasHeirlooms"],
        passing: ["hasExecutor", "hasDigital", "hasHeirlooms", "hasProxy"],
    };
    let nextCheck = $derived.by(() => {
        const key = (scenarioChecks[activeScenarioId] ?? []).find(
            (k) => !readiness[k],
        );
        return key ? checks[key] : null;
    });
</script>

<div class="max-w-6xl mx-auto space-y-8 p-4 md:p-8">
    <!-- Header -->
    <header
        class="flex flex-col md:flex-row md:items-center justify-between gap-6"
    >
        <div>
            <h1
                class="text-3xl font-bold text-foreground flex items-center gap-3"
            >
                <div
                    class="p-3 bg-warning-soft text-warning rounded-2xl"
                >
                    <Siren size={32} />
                </div>
                Future Scenarios
            </h1>
            <p class="text-muted-foreground mt-2 text-lg">
                Stress-test your estate's readiness for real-world scenarios.
            </p>
        </div>
        <div
            class="px-6 py-4 bg-card border border-border rounded-2xl text-foreground flex items-center gap-4"
        >
            <div
                class="text-xs font-black uppercase tracking-widest text-muted-foreground"
            >
                Current Rating
            </div>
            <div class="text-2xl font-black">{readiness.score}% READY</div>
        </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Scenario Selector -->
        <div class="lg:col-span-4 space-y-4">
            {#each scenarios as sc}
                <button
                    onclick={() => (activeScenarioId = sc.id)}
                    class="w-full p-6 text-left rounded-[32px] border transition-all relative overflow-hidden group
                    {activeScenarioId === sc.id
                        ? 'bg-card border-primary/40 shadow-xl ring-1 ring-primary/20'
                        : 'bg-card border-border hover:border-primary/30'}"
                >
                    <div class="relative z-10">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="p-2 {sc.bg} {sc.color} rounded-xl">
                                <sc.icon size={20} />
                            </div>
                            <h3 class="font-bold text-foreground">{sc.title}</h3>
                        </div>
                        <p
                            class="text-sm text-muted-foreground leading-relaxed font-medium"
                        >
                            {sc.description}
                        </p>
                    </div>
                </button>
            {/each}

            <div
                class="surface-dark p-8 bg-gradient-to-br from-card to-background rounded-[40px] text-foreground"
            >
                <ShieldAlert class="text-gold-text mb-4" size={32} />
                <h4 class="font-bold text-lg mb-2 text-foreground">Proactive Protection</h4>
                <p class="text-sm text-muted-foreground leading-relaxed">
                    Running these drills shows which parts of your legacy
                    your loved ones can find and use when they need them
                    most.
                </p>
            </div>
        </div>

        <!-- Audit Results -->
        <div class="lg:col-span-8 space-y-8 pb-20">
            <div
                class="bg-card rounded-[40px] border border-border shadow-sm overflow-hidden"
            >
                <div
                    class="p-8 border-b border-border flex items-center justify-between"
                >
                    <h2 class="text-2xl font-black text-foreground">
                        Drill Audit Report
                    </h2>
                    <span
                        class="px-4 py-1.5 bg-success/10 text-success rounded-full text-xs font-black uppercase tracking-tighter"
                        >Live Analysis</span
                    >
                </div>

                <div class="p-8 space-y-12">
                    <!-- Section 1: Visibility -->
                    <section>
                        <h3
                            class="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2"
                        >
                            <Users size={14} /> Chain of Command
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div
                                class="p-6 {readiness.hasExecutor
                                    ? 'bg-success/10 border-success/20'
                                    : 'bg-warning-soft border-warning/20'} border-2 rounded-2xl flex items-center gap-4 transition-colors"
                            >
                                {#if readiness.hasExecutor}
                                    <CircleCheck
                                        class="text-success"
                                        size={24}
                                    />
                                    <div>
                                        <p class="font-bold text-foreground">
                                            Executor Designated
                                        </p>
                                        <p
                                            class="text-xs text-success font-medium"
                                        >
                                            {$estateExecutorName} knows their
                                            role.
                                        </p>
                                    </div>
                                {:else}
                                    <CircleX class="text-warning" size={24} />
                                    <div>
                                        <p class="font-bold text-foreground">
                                            Choosing an Executor
                                        </p>
                                        <p
                                            class="text-xs text-warning font-medium"
                                        >
                                            An executor carries out your wishes.
                                        </p>
                                    </div>
                                {/if}
                            </div>

                            <div
                                class="p-6 {readiness.hasProxy
                                    ? 'bg-success/10 border-success/20'
                                    : 'bg-warning-soft border-warning/20'} border-2 rounded-2xl flex items-center gap-4 transition-colors"
                            >
                                {#if readiness.hasProxy}
                                    <CircleCheck
                                        class="text-success"
                                        size={24}
                                    />
                                    <div>
                                        <p class="font-bold text-foreground">
                                            Healthcare Proxy Active
                                        </p>
                                        <p
                                            class="text-xs text-success font-medium"
                                        >
                                            Decisions can be made immediately.
                                        </p>
                                    </div>
                                {:else}
                                    <CircleX class="text-warning" size={24} />
                                    <div>
                                        <p class="font-bold text-foreground">
                                            Healthcare Proxy
                                        </p>
                                        <p
                                            class="text-xs text-warning font-medium"
                                        >
                                            A proxy lets someone you trust decide.
                                        </p>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </section>

                    <!-- Section 2: Asset Accessibility -->
                    <section>
                        <h3
                            class="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2"
                        >
                            <Wallet size={14} /> Asset Pathfinding
                        </h3>
                        <div class="space-y-4">
                            <div
                                class="flex items-center justify-between p-6 bg-muted rounded-2xl group hover:bg-card hover:shadow-md hover:border-border border border-transparent transition-all"
                            >
                                <div class="flex items-center gap-4">
                                    <div
                                        class="p-3 bg-card text-muted-foreground rounded-2xl group-hover:text-primary transition-colors"
                                    >
                                        <Cloud size={24} />
                                    </div>
                                    <div>
                                        <h4 class="font-bold text-foreground">
                                            Digital Kill Switch Readiness
                                        </h4>
                                        <p
                                            class="text-sm text-muted-foreground font-medium"
                                        >
                                            {readiness.hasDigital
                                                ? "Active: Instructions for all accounts"
                                                : "Listing your digital accounts lets your family find each one."}
                                        </p>
                                    </div>
                                </div>
                                {#if readiness.hasDigital}
                                    <CircleCheck
                                        class="text-success"
                                        size={20}
                                    />
                                {:else}
                                    <TriangleAlert
                                        class="text-warning"
                                        size={20}
                                    />
                                {/if}
                            </div>

                            <div
                                class="flex items-center justify-between p-6 bg-muted rounded-2xl group hover:bg-card hover:shadow-md hover:border-border border border-transparent transition-all"
                            >
                                <div class="flex items-center gap-4">
                                    <div
                                        class="p-3 bg-card text-muted-foreground rounded-2xl group-hover:text-primary transition-colors"
                                    >
                                        <ShieldAlert size={24} />
                                    </div>
                                    <div>
                                        <h4 class="font-bold text-foreground">
                                            Physical Heirloom Protocol
                                        </h4>
                                        <p
                                            class="text-sm text-muted-foreground font-medium"
                                        >
                                            {readiness.hasHeirlooms
                                                ? "Verified: Pet & Object care instructions found"
                                                : "Listing your heirlooms lets your family care for each one."}
                                        </p>
                                    </div>
                                </div>
                                {#if readiness.hasHeirlooms}
                                    <CircleCheck
                                        class="text-success"
                                        size={20}
                                    />
                                {:else}
                                    <TriangleAlert
                                        class="text-warning"
                                        size={20}
                                    />
                                {/if}
                            </div>
                        </div>
                    </section>

                    <div
                        class="p-10 bg-primary-deep rounded-[48px] text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-primary/20"
                    >
                        <div class="flex-1">
                            <h3 class="text-2xl font-black mb-2 text-white">
                                Drill Recommendations
                            </h3>
                            <p
                                class="text-white/80 leading-relaxed font-medium"
                            >
                                {#if nextCheck}
                                    Based on the <strong
                                        >{activeScenario.title}</strong
                                    >, your highest priority is the
                                    <strong>{nextCheck.label}</strong>, so that {nextCheck.goal}.
                                {:else}
                                    Every check for the <strong
                                        >{activeScenario.title}</strong
                                    > is in place.
                                {/if}
                            </p>
                        </div>
                        <a
                            href="/export/preview?scope=full"
                            class="px-8 py-4 bg-white text-primary-deep rounded-2xl font-black text-sm hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-black/10"
                        >
                            GENERATE PDF REPORT
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
