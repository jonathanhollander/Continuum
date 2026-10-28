<script lang="ts">
    import { fly, fade, slide } from "svelte/transition";
    import { estateAnalytics, findExecutorName } from "$lib/stores/analyticsStore";
    import { estateProfile } from "$lib/stores/estateStore.svelte";
    import { contactSync } from "$lib/stores/familyStore.svelte";
    import { auditReadiness } from "$lib/utils/auditReadiness.svelte";
    import AuditSourceStatus from "$lib/components/AuditSourceStatus.svelte";
    let auditSources = $derived(auditReadiness());
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
    let profileConfirmed = $derived(estateProfile.status === "synced");
    // A confirmed executor contact proves the positive presence check even while
    // the profile is unavailable. An absent contact cannot prove an empty profile.
    let executorContactConfirmed = $derived(
        auditSources.sources.find((source) => source.id === "family_members")?.state === "ready" &&
        !!findExecutorName({}, contactSync.items),
    );
    let legalSourcesKnown = $derived(profileConfirmed || executorContactConfirmed);
    let retryingProfile = $state(false);
    async function retryProfile() {
        retryingProfile = true;
        try { await estateProfile.sync(); } finally { retryingProfile = false; }
    }

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
    class="min-h-screen bg-background text-foreground p-8 relative overflow-hidden"
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
        <header class="flex flex-col gap-6 sm:flex-row justify-between items-start mb-12">
            <div in:fly={{ y: -20, duration: 800 }}>
                <div class="flex items-center gap-3 mb-2 opacity-60">
                    <Activity size={20} class="text-primary" />
                    <span class="text-xs font-bold uppercase tracking-widest"
                        >Where Things Stand</span
                    >
                </div>
                <h1 class="text-5xl font-serif font-bold text-foreground mb-2">
                    Recorded Information
                </h1>
                <p class="text-muted-foreground text-lg max-w-2xl mb-6">
                    See which record checks are filled across legal, financial
                    and personal information, then open the source records to review them.
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
                class="text-left sm:text-right"
                in:fly={{ x: 20, duration: 800, delay: 200 }}
            >
                <div class="text-xs font-bold uppercase text-muted-foreground mb-1">
                    Record coverage score
                </div>
                {#if auditSources.canScore}<div class="flex items-baseline justify-start sm:justify-end gap-2">
                    <span
                        class={`text-6xl font-sans font-bold ${getHealthColor(health)}`}
                        data-testid="analytics-readiness"
                    >
                        {health}
                    </span>
                    <span class="text-muted-foreground text-xl">%</span>
                </div>{/if}
            </div>
        </header>

        <AuditSourceStatus state={auditSources} />
        {#if auditSources.canScore}
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
                        class={`text-2xl font-bold ${legalSourcesKnown ? getHealthColor(pillars.legal.score) : "text-muted-foreground"}`}
                        data-testid="analytics-legal-coverage"
                    >
                        {legalSourcesKnown ? `${pillars.legal.score}%` : "—"}
                    </span>
                </div>
                <h3 class="text-xl font-bold text-foreground mb-2">
                    Legal Records
                </h3>
                <p class="text-muted-foreground text-sm mb-6 min-h-10">
                    Three presence checks: an executor name, a healthcare proxy
                    record and a living-will record. Each contributes one third.
                </p>
                {#if !profileConfirmed}
                    <div class="mb-6 space-y-3 text-sm text-muted-foreground" role="status" data-testid="analytics-profile-status">
                        <p>{estateProfile.status === "error"
                            ? "Your estate profile needs a fresh check. Try Again to confirm the recorded executor name."
                            : "Gathering your estate profile before checking the recorded executor name."}</p>
                        {#if executorContactConfirmed}
                            <p>The executor check uses a confirmed contact record. Profile-dependent review topics are still waiting.</p>
                        {/if}
                        {#if estateProfile.status === "error"}
                            <button class="rounded-lg border border-border px-3 py-2 font-medium text-foreground disabled:opacity-60" disabled={retryingProfile} onclick={retryProfile}>
                                {retryingProfile ? "Gathering your estate profile..." : "Try Again"}
                            </button>
                        {/if}
                    </div>
                {/if}
                {#if legalSourcesKnown}
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
                {/if}
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
                    Financial Records
                </h3>
                <p class="text-muted-foreground text-sm mb-6 min-h-10">
                    Points for open account fields and any insurance record.
                    Recorded beneficiaries still need checking with the institution.
                </p>
                <div class="space-y-3">
                    <div class="flex items-center gap-3 text-sm">
                        <div class="w-full">
                            <div class="flex justify-between mb-1">
                                <span class="text-muted-foreground">Recorded net value</span>
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
                                >Beneficiary name recorded</span
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
                    Personal & Digital Records
                </h3>
                <p class="text-muted-foreground text-sm mb-6 min-h-10">
                    Points for heirlooms, letters, funeral wishes, a memory
                    and digital account records. Review their words and attachments.
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
                            <span class="text-foreground">Funeral wishes recorded</span>
                        {/if}
                    </div>
                </div>
            </div>
        </div>

        {/if}
        <!-- Next steps, written as invitations -->
        {#if !profileConfirmed}
            <p class="text-muted-foreground" role="status" data-testid="analytics-topics-loading">Review topics will appear once your estate profile has been confirmed.</p>
        {:else if gaps.length > 0}
            <div in:slide={{ duration: 400 }}>
                <h2
                    class="text-xl font-bold text-foreground mb-6 flex items-center gap-2"
                >
                    <Heart size={20} class="text-primary" />
                    Questions to review
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
        {:else if $estateAnalytics.guardians.loaded && auditSources.confirmed}
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
                    Every topic here has an entry
                </h2>
                <p class="text-muted-foreground max-w-lg mx-auto">
                    The topics listed here have recorded information or setup choices.
                    This list is separate from the score checks above. Review details,
                    originals, sharing choices and the handover preview with the people involved.
                </p>
            </div>
        {:else}
            <p class="text-muted-foreground" role="status">Gathering your circle...</p>
        {/if}
    </div>
</div>
