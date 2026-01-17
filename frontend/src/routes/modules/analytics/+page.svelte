<script lang="ts">
    import { fly, fade, slide } from "svelte/transition";
    import { estateAnalytics } from "$lib/stores/analyticsStore";
    import {
        Activity,
        Shield,
        Briefcase,
        Heart,
        TriangleAlert,
        CircleCheck,
        ArrowRight,
        TrendingUp,
        Flame,
    } from "lucide-svelte";
    import FireDrill from "$lib/components/modules/analytics/FireDrill.svelte";

    // Computed derived values for easier access
    let health = $derived($estateAnalytics.overallHealth);
    let pillars = $derived($estateAnalytics.pillars);
    let gaps = $derived($estateAnalytics.gaps.filter((g) => !!g));

    let showFireDrill = false;

    function getHealthColor(score: number) {
        if (score >= 80) return "text-emerald-400";
        if (score >= 50) return "text-yellow-400";
        return "text-rose-400";
    }

    function getHealthBg(score: number) {
        if (score >= 80) return "bg-emerald-500/20";
        if (score >= 50) return "bg-yellow-500/20";
        return "bg-rose-500/20";
    }
</script>

<div
    class="min-h-screen bg-slate-950 text-slate-100 p-8 relative overflow-hidden"
>
    {#if showFireDrill}
        <FireDrill onclose={() => (showFireDrill = false)} />
    {/if}

    <!-- Background Gradient -->
    <div
        class="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-900/20 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"
    ></div>

    <div class="max-w-6xl mx-auto relative z-10">
        <!-- Header -->
        <header class="flex justify-between items-end mb-12">
            <div in:fly={{ y: -20, duration: 800 }}>
                <div class="flex items-center gap-3 mb-2 opacity-60">
                    <Activity size={20} class="text-indigo-400" />
                    <span class="text-xs font-bold uppercase tracking-widest"
                        >System Status</span
                    >
                </div>
                <h1 class="text-5xl font-serif font-bold text-white mb-2">
                    Continuum Health
                </h1>
                <p class="text-slate-400 text-lg max-w-2xl mb-6">
                    Monitor the vitality of your estate preparedness across
                    three core pillars: Legal, Financial, and Legacy.
                </p>
                <button
                    class="flex items-center gap-2 bg-slate-900 border border-slate-700 text-white px-6 py-3 rounded-2xl transition-all shadow-xl shadow-slate-900/40 hover:scale-105 active:scale-95 font-bold"
                    onclick={() => (showFireDrill = true)}
                >
                    <Flame size={18} />
                    Check System Integrity
                </button>
            </div>

            <div
                class="text-right"
                in:fly={{ x: 20, duration: 800, delay: 200 }}
            >
                <div class="text-xs font-bold uppercase text-slate-500 mb-1">
                    The Pulse
                </div>
                <div class="flex items-baseline justify-end gap-2">
                    <span
                        class={`text-6xl font-sans font-bold ${getHealthColor(health)}`}
                    >
                        {health}
                    </span>
                    <span class="text-slate-500 text-xl">/ 100</span>
                </div>
            </div>
        </header>

        <!-- Pillars Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <!-- Legal Pillar -->
            <div
                class="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors group"
                in:fly={{ y: 20, duration: 600, delay: 100 }}
            >
                <div class="flex justify-between items-start mb-6">
                    <div
                        class="bg-indigo-500/10 p-3 rounded-lg text-indigo-400 group-hover:bg-indigo-500/20 transition-colors"
                    >
                        <Shield size={24} />
                    </div>
                    <span
                        class={`text-2xl font-bold ${getHealthColor(pillars.legal.score)}`}
                    >
                        {pillars.legal.score}%
                    </span>
                </div>
                <h3 class="text-xl font-bold text-white mb-2">
                    Legal Readiness
                </h3>
                <p class="text-slate-400 text-sm mb-6 h-10">
                    Authority & medical proxies to ensure seamless decision
                    making.
                </p>
                <div class="space-y-3">
                    {#each Object.entries(pillars.legal.metrics) as [key, active]}
                        <div class="flex items-center gap-3 text-sm">
                            {#if active}
                                <CircleCheck
                                    size={16}
                                    class="text-emerald-400"
                                />
                                <span class="text-slate-300 capitalize"
                                    >{key
                                        .replace("has", "")
                                        .replace(/([A-Z])/g, " $1")
                                        .trim()}</span
                                >
                            {:else}
                                <div
                                    class="w-4 h-4 rounded-full border border-slate-700"
                                ></div>
                                <span class="text-slate-600 capitalize"
                                    >{key
                                        .replace("has", "")
                                        .replace(/([A-Z])/g, " $1")
                                        .trim()}</span
                                >
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>

            <!-- Financial Pillar -->
            <div
                class="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors group"
                in:fly={{ y: 20, duration: 600, delay: 200 }}
            >
                <div class="flex justify-between items-start mb-6">
                    <div
                        class="bg-emerald-500/10 p-3 rounded-lg text-emerald-400 group-hover:bg-emerald-500/20 transition-colors"
                    >
                        <Briefcase size={24} />
                    </div>
                    <span
                        class={`text-2xl font-bold ${getHealthColor(pillars.financial.score)}`}
                    >
                        {pillars.financial.score}%
                    </span>
                </div>
                <h3 class="text-xl font-bold text-white mb-2">
                    Financial Clarity
                </h3>
                <p class="text-slate-400 text-sm mb-6 h-10">
                    Asset organization and beneficiary designations for swift
                    transfer.
                </p>
                <div class="space-y-3">
                    <div class="flex items-center gap-3 text-sm">
                        <div class="w-full">
                            <div class="flex justify-between mb-1">
                                <span class="text-slate-400">Total Value</span>
                                <span class="text-slate-200"
                                    >{(
                                        pillars.financial.metrics.totalValue ||
                                        0
                                    ).toLocaleString("en-US", {
                                        style: "currency",
                                        currency: "USD",
                                        maximumFractionDigits: 0,
                                    })}</span
                                >
                            </div>
                            <div
                                class="h-1 bg-slate-800 rounded-full overflow-hidden"
                            >
                                <div
                                    class="h-full bg-emerald-500/50"
                                    style="width: {Math.min(
                                        100,
                                        (pillars.financial.metrics.totalValue /
                                            100000) *
                                            100,
                                    )}%"
                                ></div>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-3 text-sm">
                        {#if pillars.financial.metrics.hasBeneficiary}
                            <CircleCheck size={16} class="text-emerald-400" />
                            <span class="text-slate-300"
                                >Beneficiary Designated</span
                            >
                        {:else}
                            <div
                                class="w-4 h-4 rounded-full border border-slate-700"
                            ></div>
                            <span class="text-slate-600">No Beneficiary</span>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Legacy Pillar -->
            <div
                class="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors group"
                in:fly={{ y: 20, duration: 600, delay: 300 }}
            >
                <div class="flex justify-between items-start mb-6">
                    <div
                        class="bg-rose-500/10 p-3 rounded-lg text-rose-400 group-hover:bg-rose-500/20 transition-colors"
                    >
                        <Heart size={24} />
                    </div>
                    <span
                        class={`text-2xl font-bold ${getHealthColor(pillars.legacy.score)}`}
                    >
                        {pillars.legacy.score}%
                    </span>
                </div>
                <h3 class="text-xl font-bold text-white mb-2">
                    Legacy Vitality
                </h3>
                <p class="text-slate-400 text-sm mb-6 h-10">
                    Emotional wealth, heirlooms, and wishes preserved for the
                    future.
                </p>
                <div class="space-y-3">
                    <div class="flex items-center gap-3 text-sm">
                        <span class="text-slate-400 w-24">Heirlooms</span>
                        <span class="text-slate-200"
                            >{pillars.legacy.metrics.heirloomCount} cataloged</span
                        >
                    </div>
                    <div class="flex items-center gap-3 text-sm">
                        {#if pillars.legacy.metrics.wishesDefined}
                            <CircleCheck size={16} class="text-emerald-400" />
                            <span class="text-slate-300">Wishes Defined</span>
                        {:else}
                            <div
                                class="w-4 h-4 rounded-full border border-slate-700"
                            ></div>
                            <span class="text-slate-600">Wishes Undefined</span>
                        {/if}
                    </div>
                </div>
            </div>
        </div>

        <!-- Critical Alerts (Gaps) -->
        {#if gaps.length > 0}
            <div in:slide={{ duration: 400 }}>
                <h2
                    class="text-xl font-bold text-white mb-6 flex items-center gap-2"
                >
                    <TriangleAlert size={20} class="text-yellow-400" />
                    Critical Attention Needed
                </h2>
                <div class="space-y-4">
                    {#each gaps as gap}
                        <a
                            href={gap.link}
                            class="block bg-slate-900/80 border border-slate-800 p-4 rounded-lg hover:border-indigo-500/50 hover:bg-slate-800 transition-all group"
                        >
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-4">
                                    <div
                                        class={`w-2 h-2 rounded-full ${gap.type === "legal" ? "bg-indigo-400" : gap.type === "financial" ? "bg-emerald-400" : "bg-rose-400"}`}
                                    ></div>
                                    <div>
                                        <div
                                            class="text-white font-medium group-hover:text-indigo-300 transition-colors"
                                        >
                                            {gap.message}
                                        </div>
                                        <div
                                            class="text-slate-500 text-xs uppercase tracking-wider mt-1"
                                        >
                                            {gap.type} Pillar Impact
                                        </div>
                                    </div>
                                </div>
                                <ArrowRight
                                    size={18}
                                    class="text-slate-600 group-hover:text-white transition-colors"
                                />
                            </div>
                        </a>
                    {/each}
                </div>
            </div>
        {:else}
            <div
                in:slide={{ duration: 400 }}
                class="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-2xl text-center"
            >
                <div class="mb-4 flex justify-center">
                    <div class="bg-emerald-500/20 p-4 rounded-full">
                        <TrendingUp size={32} class="text-emerald-400" />
                    </div>
                </div>
                <h2 class="text-2xl font-bold text-white mb-2">
                    Systems Optimal
                </h2>
                <p class="text-emerald-200/80 max-w-lg mx-auto">
                    Your continuum health is excellent. All major pillars are
                    secured. Consider reviewing your beneficiaries annually or
                    adding more personal stories to your legacy.
                </p>
            </div>
        {/if}
    </div>
</div>
