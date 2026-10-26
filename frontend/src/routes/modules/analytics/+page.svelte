<script lang="ts">
    import { fly, fade, slide } from "svelte/transition";
    import { estateAnalytics } from "$lib/stores/analyticsStore";
    import {
        Activity,
        Shield,
        Briefcase,
        Heart,
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

    let showFireDrill = $state(false);

    function getHealthColor(score: number) {
        if (score >= 80) return "text-success";
        if (score >= 50) return "text-info";
        return "text-warning";
    }

    function getHealthBg(score: number) {
        if (score >= 80) return "bg-success/20";
        if (score >= 50) return "bg-info/20";
        return "bg-warning/20";
    }
</script>

<div
    class="surface-dark min-h-screen bg-background text-foreground p-8 relative overflow-hidden"
>
    {#if showFireDrill}
        <FireDrill on:close={() => (showFireDrill = false)} />
    {/if}

    <!-- Background Gradient -->
    <div
        class="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"
    ></div>

    <div class="max-w-6xl mx-auto relative z-10">
        <!-- Header -->
        <header class="flex justify-between items-start mb-12">
            <div in:fly={{ y: -20, duration: 800 }}>
                <div class="flex items-center gap-3 mb-2 opacity-60">
                    <Activity size={20} class="text-primary" />
                    <span class="text-xs font-bold uppercase tracking-widest"
                        >Where Things Stand</span
                    >
                </div>
                <h1 class="text-5xl font-serif font-bold text-foreground mb-2">
                    Insights
                </h1>
                <p class="text-muted-foreground text-lg max-w-2xl mb-6">
                    A gentle look at how your plans are coming together across
                    three pillars: Legal, Financial, and Legacy.
                </p>
                <button
                    class="flex items-center gap-2 bg-card border border-border text-foreground px-6 py-3 rounded-2xl transition-all shadow-xl shadow-black/40 hover:scale-105 active:scale-95 font-bold"
                    onclick={() => (showFireDrill = true)}
                >
                    <Flame size={18} />
                    Try the Fire Drill
                </button>
            </div>

            <div
                class="text-right"
                in:fly={{ x: 20, duration: 800, delay: 200 }}
            >
                <div class="text-xs font-bold uppercase text-muted-foreground mb-1">
                    The Pulse
                </div>
                <div class="flex items-baseline justify-end gap-2">
                    <span
                        class={`text-6xl font-sans font-bold ${getHealthColor(health)}`}
                        data-testid="analytics-readiness"
                    >
                        {health}
                    </span>
                    <span class="text-muted-foreground text-xl">%</span>
                </div>
            </div>
        </header>

        <!-- Pillars Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <!-- Legal Pillar -->
            <div
                class="bg-card/50 backdrop-blur border border-border/60 rounded-xl p-6 hover:border-border transition-colors group"
                in:fly={{ y: 20, duration: 600, delay: 100 }}
            >
                <div class="flex justify-between items-start mb-6">
                    <div
                        class="bg-primary/10 p-3 rounded-lg text-primary group-hover:bg-primary/20 transition-colors"
                    >
                        <Shield size={24} />
                    </div>
                    <span
                        class={`text-2xl font-bold ${getHealthColor(pillars.legal.score)}`}
                    >
                        {pillars.legal.score}%
                    </span>
                </div>
                <h3 class="text-xl font-bold text-foreground mb-2">
                    Legal Readiness
                </h3>
                <p class="text-muted-foreground text-sm mb-6 h-10">
                    Authority & medical proxies to ensure seamless decision
                    making.
                </p>
                <div class="space-y-3">
                    {#each Object.entries(pillars.legal.metrics).filter(([, v]) => typeof v === "boolean") as [key, active]}
                        <div class="flex items-center gap-3 text-sm">
                            {#if active}
                                <CircleCheck
                                    size={16}
                                    class="text-success"
                                />
                                <span class="text-foreground capitalize"
                                    >{key
                                        .replace("has", "")
                                        .replace(/([A-Z])/g, " $1")
                                        .trim()}</span
                                >
                            {:else}
                                <div
                                    class="w-4 h-4 rounded-full border border-border"
                                ></div>
                                <span class="text-muted-foreground capitalize"
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
                class="bg-card/50 backdrop-blur border border-border/60 rounded-xl p-6 hover:border-border transition-colors group"
                in:fly={{ y: 20, duration: 600, delay: 200 }}
            >
                <div class="flex justify-between items-start mb-6">
                    <div
                        class="bg-success/10 p-3 rounded-lg text-success group-hover:bg-success/20 transition-colors"
                    >
                        <Briefcase size={24} />
                    </div>
                    <span
                        class={`text-2xl font-bold ${getHealthColor(pillars.financial.score)}`}
                    >
                        {pillars.financial.score}%
                    </span>
                </div>
                <h3 class="text-xl font-bold text-foreground mb-2">
                    Financial Clarity
                </h3>
                <p class="text-muted-foreground text-sm mb-6 h-10">
                    Asset organization and beneficiary designations for swift
                    transfer.
                </p>
                <div class="space-y-3">
                    <div class="flex items-center gap-3 text-sm">
                        <div class="w-full">
                            <div class="flex justify-between mb-1">
                                <span class="text-muted-foreground">Total Value</span>
                                <span class="text-foreground"
                                    >{(
                                        pillars.financial.metrics.totalValue ||
                                        0
                                    ).toLocaleString("en-US", {
                                        style: "currency",
                                        currency: "USD",
                                    })}</span
                                >
                            </div>
                            <div
                                class="h-1 bg-border rounded-full overflow-hidden"
                            >
                                <div
                                    class="h-full bg-success/50"
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
                            <CircleCheck size={16} class="text-success" />
                            <span class="text-foreground"
                                >Beneficiary Designated</span
                            >
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Legacy Pillar -->
            <div
                class="bg-card/50 backdrop-blur border border-border/60 rounded-xl p-6 hover:border-border transition-colors group"
                in:fly={{ y: 20, duration: 600, delay: 300 }}
            >
                <div class="flex justify-between items-start mb-6">
                    <div
                        class="bg-warning/10 p-3 rounded-lg text-warning group-hover:bg-warning/20 transition-colors"
                    >
                        <Heart size={24} />
                    </div>
                    <span
                        class={`text-2xl font-bold ${getHealthColor(pillars.legacy.score)}`}
                    >
                        {pillars.legacy.score}%
                    </span>
                </div>
                <h3 class="text-xl font-bold text-foreground mb-2">
                    Legacy Vitality
                </h3>
                <p class="text-muted-foreground text-sm mb-6 h-10">
                    Emotional wealth, heirlooms, and wishes preserved for the
                    future.
                </p>
                <div class="space-y-3">
                    <div class="flex items-center gap-3 text-sm">
                        <span class="text-muted-foreground w-24">Heirlooms</span>
                        <span class="text-foreground"
                            >{pillars.legacy.metrics.heirloomCount} cataloged</span
                        >
                    </div>
                    <div class="flex items-center gap-3 text-sm">
                        {#if pillars.legacy.metrics.wishesDefined}
                            <CircleCheck size={16} class="text-success" />
                            <span class="text-foreground">Wishes Defined</span>
                        {/if}
                    </div>
                </div>
            </div>
        </div>

        <!-- Next steps, written as invitations -->
        {#if gaps.length > 0}
            <div in:slide={{ duration: 400 }}>
                <h2
                    class="text-xl font-bold text-foreground mb-6 flex items-center gap-2"
                >
                    <Heart size={20} class="text-primary" />
                    When you're ready
                </h2>
                <div class="space-y-4">
                    {#each gaps as gap}
                        <a
                            href={gap.link}
                            class="block bg-card/80 border border-border p-4 rounded-lg hover:border-primary/50 hover:bg-card transition-all group"
                        >
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-4">
                                    <div
                                        class={`w-2 h-2 rounded-full ${gap.type === "legal" ? "bg-primary" : gap.type === "financial" ? "bg-success" : "bg-warning"}`}
                                    ></div>
                                    <div>
                                        <div
                                            class="text-foreground font-medium group-hover:text-primary-hover transition-colors"
                                        >
                                            {gap.message}
                                        </div>
                                        <div
                                            class="text-muted-foreground text-xs uppercase tracking-wider mt-1"
                                        >
                                            {gap.type} pillar
                                        </div>
                                    </div>
                                </div>
                                <ArrowRight
                                    size={18}
                                    class="text-muted-foreground group-hover:text-foreground transition-colors"
                                />
                            </div>
                        </a>
                    {/each}
                </div>
            </div>
        {:else if $estateAnalytics.guardians.loaded}
            <div
                in:slide={{ duration: 400 }}
                class="bg-success/10 border border-success/20 p-8 rounded-2xl text-center"
            >
                <div class="mb-4 flex justify-center">
                    <div class="bg-success/20 p-4 rounded-full">
                        <TrendingUp size={32} class="text-success" />
                    </div>
                </div>
                <h2 class="text-2xl font-bold text-foreground mb-2">
                    All in order
                </h2>
                <p class="text-muted-foreground max-w-lg mx-auto">
                    Each pillar is in good shape. A yearly look at your
                    beneficiaries, and a new story now and then, keeps your
                    legacy current.
                </p>
            </div>
        {:else}
            <p class="text-muted-foreground" role="status">Gathering your circle...</p>
        {/if}
    </div>
</div>
