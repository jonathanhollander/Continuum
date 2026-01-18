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
    import { estateAnalytics } from "$lib/stores/analyticsStore";
    import { estateProfile } from "$lib/stores/estateStore";

    const scenarios = [
        {
            id: "sudden_disability",
            title: "Scenario: Sudden Disability",
            description:
                "You are hospitalized and unable to communicate. Who takes over and what can they find?",
            icon: Activity,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            id: "passing",
            title: "Scenario: Final Passing",
            description:
                "The estate transition begins. Are the keys, wills, and guardians ready for the executor?",
            icon: Dna,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
        },
    ];

    let activeScenarioId = $state("sudden_disability");
    let activeScenario = $derived(
        scenarios.find((s) => s.id === activeScenarioId) || scenarios[0],
    );

    // Readiness logic for scenarios
    // Readiness logic for scenarios
    let readiness = $derived({
        hasExecutor: !!$estateProfile.executorName,
        hasProxy: $estateAnalytics.pillars.legal.metrics.hasMedicalProxy,
        hasLivingWill: $estateAnalytics.pillars.legal.metrics.hasLivingWill,
        hasHeirlooms: $estateAnalytics.pillars.legacy.metrics.heirloomCount > 0,
        hasDigital: $estateAnalytics.pillars.financial.metrics.digitalCount > 0,
        score: $estateAnalytics.overallHealth,
    });
</script>

<div class="max-w-6xl mx-auto space-y-8 p-4 md:p-8">
    <!-- Header -->
    <header
        class="flex flex-col md:flex-row md:items-center justify-between gap-6"
    >
        <div>
            <h1
                class="text-3xl font-bold text-gray-900 flex items-center gap-3"
            >
                <div
                    class="p-3 bg-red-100 text-red-600 rounded-2xl animate-pulse"
                >
                    <Siren size={32} />
                </div>
                Scenario Mode: The Fire Drill
            </h1>
            <p class="text-gray-500 mt-2 text-lg">
                Stress-test your estate's readiness for real-world scenarios.
            </p>
        </div>
        <div
            class="px-6 py-4 bg-gray-900 rounded-3xl text-white flex items-center gap-4"
        >
            <div
                class="text-xs font-black uppercase tracking-widest text-gray-400"
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
                        ? 'bg-white border-red-200 shadow-xl ring-1 ring-red-100'
                        : 'bg-white border-gray-100 hover:border-gray-300'}"
                >
                    <div class="relative z-10">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="p-2 {sc.bg} {sc.color} rounded-xl">
                                <sc.icon size={20} />
                            </div>
                            <h3 class="font-bold text-gray-900">{sc.title}</h3>
                        </div>
                        <p
                            class="text-sm text-gray-500 leading-relaxed font-medium"
                        >
                            {sc.description}
                        </p>
                    </div>
                </button>
            {/each}

            <div
                class="p-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[40px] text-white"
            >
                <ShieldAlert class="text-red-400 mb-4" size={32} />
                <h4 class="font-bold text-lg mb-2">Proactive Protection</h4>
                <p class="text-sm text-gray-400 leading-relaxed">
                    Running these drills identifies "Dead Zones" in your
                    legacy—information that exists but is inaccessible when
                    needed most.
                </p>
            </div>
        </div>

        <!-- Audit Results -->
        <div class="lg:col-span-8 space-y-8 pb-20">
            <div
                class="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden"
            >
                <div
                    class="p-8 border-b border-gray-50 flex items-center justify-between"
                >
                    <h2 class="text-2xl font-black text-gray-900">
                        Drill Audit Report
                    </h2>
                    <span
                        class="px-4 py-1.5 bg-green-50 text-green-600 rounded-full text-xs font-black uppercase tracking-tighter"
                        >Live Analysis</span
                    >
                </div>

                <div class="p-8 space-y-12">
                    <!-- Section 1: Visibility -->
                    <section>
                        <h3
                            class="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2"
                        >
                            <Users size={14} /> Chain of Command
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div
                                class="p-6 {readiness.hasExecutor
                                    ? 'bg-green-50 border-green-100'
                                    : 'bg-red-50 border-red-100'} border-2 rounded-3xl flex items-center gap-4 transition-colors"
                            >
                                {#if readiness.hasExecutor}
                                    <CircleCheck
                                        class="text-green-600"
                                        size={24}
                                    />
                                    <div>
                                        <p class="font-bold text-green-900">
                                            Executor Designated
                                        </p>
                                        <p
                                            class="text-xs text-green-700 font-medium"
                                        >
                                            {$estateProfile.executorName} knows their
                                            role.
                                        </p>
                                    </div>
                                {:else}
                                    <CircleX class="text-red-600" size={24} />
                                    <div>
                                        <p class="font-bold text-red-900">
                                            No Executor Named
                                        </p>
                                        <p
                                            class="text-xs text-red-700 font-medium"
                                        >
                                            CRITICAL: The estate will be
                                            intestate.
                                        </p>
                                    </div>
                                {/if}
                            </div>

                            <div
                                class="p-6 {readiness.hasProxy
                                    ? 'bg-green-50 border-green-100'
                                    : 'bg-red-50 border-red-100'} border-2 rounded-3xl flex items-center gap-4 transition-colors"
                            >
                                {#if readiness.hasProxy}
                                    <CircleCheck
                                        class="text-green-600"
                                        size={24}
                                    />
                                    <div>
                                        <p class="font-bold text-green-900">
                                            Healthcare Proxy Active
                                        </p>
                                        <p
                                            class="text-xs text-green-700 font-medium"
                                        >
                                            Decisions can be made immediately.
                                        </p>
                                    </div>
                                {:else}
                                    <CircleX class="text-red-600" size={24} />
                                    <div>
                                        <p class="font-bold text-red-900">
                                            Medical Proxy Missing
                                        </p>
                                        <p
                                            class="text-xs text-red-700 font-medium"
                                        >
                                            Hospitals will default to state law.
                                        </p>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </section>

                    <!-- Section 2: Asset Accessibility -->
                    <section>
                        <h3
                            class="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2"
                        >
                            <Wallet size={14} /> Asset Pathfinding
                        </h3>
                        <div class="space-y-4">
                            <div
                                class="flex items-center justify-between p-6 bg-gray-50 rounded-3xl group hover:bg-white hover:shadow-md hover:border-gray-200 border border-transparent transition-all"
                            >
                                <div class="flex items-center gap-4">
                                    <div
                                        class="p-3 bg-white text-gray-400 rounded-2xl group-hover:text-indigo-600 transition-colors"
                                    >
                                        <Cloud size={24} />
                                    </div>
                                    <div>
                                        <h4 class="font-bold text-gray-900">
                                            Digital Kill Switch Readiness
                                        </h4>
                                        <p
                                            class="text-sm text-gray-500 font-medium"
                                        >
                                            {readiness.hasDigital
                                                ? "Active: Instructions for all accounts"
                                                : "Inactive: Passwords will be lost"}
                                        </p>
                                    </div>
                                </div>
                                {#if readiness.hasDigital}
                                    <CircleCheck
                                        class="text-green-500"
                                        size={20}
                                    />
                                {:else}
                                    <TriangleAlert
                                        class="text-orange-400"
                                        size={20}
                                    />
                                {/if}
                            </div>

                            <div
                                class="flex items-center justify-between p-6 bg-gray-50 rounded-3xl group hover:bg-white hover:shadow-md hover:border-gray-200 border border-transparent transition-all"
                            >
                                <div class="flex items-center gap-4">
                                    <div
                                        class="p-3 bg-white text-gray-400 rounded-2xl group-hover:text-amber-600 transition-colors"
                                    >
                                        <ShieldAlert size={24} />
                                    </div>
                                    <div>
                                        <h4 class="font-bold text-gray-900">
                                            Physical Heirloom Protocol
                                        </h4>
                                        <p
                                            class="text-sm text-gray-500 font-medium"
                                        >
                                            {readiness.hasHeirlooms
                                                ? "Verified: Pet & Object care instructions found"
                                                : "Missing: Directives not detected"}
                                        </p>
                                    </div>
                                </div>
                                {#if readiness.hasHeirlooms}
                                    <CircleCheck
                                        class="text-green-500"
                                        size={20}
                                    />
                                {:else}
                                    <TriangleAlert
                                        class="text-orange-400"
                                        size={20}
                                    />
                                {/if}
                            </div>
                        </div>
                    </section>

                    <div
                        class="p-10 bg-indigo-600 rounded-[48px] text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-indigo-200"
                    >
                        <div class="flex-1">
                            <h3 class="text-2xl font-black mb-2">
                                Drill Recommendations
                            </h3>
                            <p
                                class="text-indigo-100/80 leading-relaxed font-medium"
                            >
                                Based on the <strong
                                    >{activeScenario.title}</strong
                                >, your highest priority is to define a
                                Healthcare Proxy. Without this, your medical
                                wishes may be overruled during hospitalization.
                            </p>
                        </div>
                        <button
                            class="px-8 py-4 bg-white text-indigo-600 rounded-3xl font-black text-sm hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-black/10"
                        >
                            GENERATE PDF REPORT
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
