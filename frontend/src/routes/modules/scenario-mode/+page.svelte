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
    import { estateProfile } from "$lib/stores/estateStore.svelte";
    import { contactSync } from "$lib/stores/familyStore.svelte";
    import { directiveSync } from "$lib/stores/medicalStore.svelte";
    import { digitalAssetsSync } from "$lib/stores/digitalAssetsStore.svelte";
    import { heirloomSync } from "$lib/stores/heirloomStore.svelte";
    import { auditReadiness } from "$lib/utils/auditReadiness.svelte";
    import AuditSourceStatus from "$lib/components/AuditSourceStatus.svelte";
    let auditSources = $derived(auditReadiness());

    const scenarios = [
        {
            id: "sudden_disability",
            title: "Scenario: Sudden Disability",
            description:
                "Review who is named for care decisions and which instructions are recorded.",
            icon: Activity,
            color: "text-info",
            bg: "bg-info/10",
        },
        {
            id: "passing",
            title: "Scenario: Final Passing",
            description:
                "Review the recorded executor name, account list, heirlooms and healthcare proxy.",
            icon: Dna,
            color: "text-primary-hover",
            bg: "bg-primary-soft",
        },
    ];

    let activeScenarioId = $state("sudden_disability");
    let activeScenario = $derived(
        scenarios.find((s) => s.id === activeScenarioId) || scenarios[0],
    );

    // These checks describe records, rather than authority, awareness or complete instructions.
    type CheckKey = "hasExecutor" | "hasProxy" | "hasDigital" | "hasHeirlooms";
    type SourceRecord = { id: string; label: string; href: string; details: string[] };
    let sources = $derived.by((): Record<CheckKey, SourceRecord[]> => {
        const executorName = $estateExecutorName;
        const profileName = String($estateProfile.executorName ?? "").trim();
        const executorContact = contactSync.items.find((c) =>
            (c.isExecutor || String(c.role).toLowerCase() === "executor") && String(c.name).trim() === executorName);
        const executor = !executorName ? [] : profileName
            ? [{ id: "estate_profile.executor_name", label: "Estate profile · Executor name", href: "/settings", details: [executorName] }]
            : executorContact ? [{ id: String(executorContact.id), label: executorContact.name, href: "/modules/contacts", details: ["Executor contact"] }] : [];
        return {
            hasExecutor: executor,
            hasProxy: directiveSync.items.filter((d) => d.type === "healthcare_proxy").map((d) => ({
                id: String(d.id), label: d.title || "Healthcare proxy record", href: "/modules/medical",
                details: [d.primaryContact, d.locationOfOriginal, d.summary].filter((v): v is string => !!v?.trim()),
            })),
            hasDigital: digitalAssetsSync.items.map((d) => ({
                id: String(d.id), label: d.platform || d.name || "Digital account", href: "/modules/digital-guardian",
                details: d.instructions?.trim() ? [d.instructions] : [],
            })),
            hasHeirlooms: heirloomSync.items.map((h) => ({
                id: String(h.id), label: h.name || "Heirloom", href: `/modules/heirlooms?id=${encodeURIComponent(h.id)}`,
                details: [h.recipient ? `Recipient: ${h.recipient}` : "", h.story, h.ownershipDetails].filter((v): v is string => !!v?.trim()),
            })),
        };
    });
    let readiness = $derived({
        hasExecutor: sources.hasExecutor.length > 0,
        hasProxy: sources.hasProxy.length > 0,
        hasDigital: sources.hasDigital.length > 0,
        hasHeirlooms: sources.hasHeirlooms.length > 0,
        score: $estateAnalytics.overallHealth,
    });
    // Keep the overall audit guard; these four facts wait for their own sources, including the profile.
    let scenarioSourcesKnown = $derived(
        ["medical_directives", "digital_assets", "heirlooms"].every((id) => auditSources.sources.find((s) => s.id === id)?.known) &&
        (readiness.hasExecutor || (estateProfile.status === "synced" &&
            !!auditSources.sources.find((s) => s.id === "family_members")?.known)));

    const countRecords = (n: number, label: string) => `${n} ${label} record${n === 1 ? "" : "s"}`;
    const checks: Record<CheckKey, { label: string; goal: string }> = {
        hasProxy: { label: "Healthcare Proxy", goal: "a healthcare proxy record is included" },
        hasExecutor: { label: "Executor", goal: "your executor is named in your records" },
        hasDigital: { label: "Digital Accounts", goal: "your digital account list is recorded" },
        hasHeirlooms: { label: "Heirlooms", goal: "your heirloom list is recorded" },
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

{#snippet recordedSources(key: CheckKey)}
    {#if sources[key].length > 0}
        <details class="mt-3 text-xs text-muted-foreground" data-scenario-sources={key}>
            <summary class="cursor-pointer font-semibold">Recorded sources</summary>
            <ul class="mt-2 space-y-3">
                {#each sources[key] as record (record.id)}
                    <li data-scenario-source={key} data-record-id={record.id}>
                        <a href={record.href} class="underline underline-offset-2 break-words">{record.label}</a>
                        <p class="mt-1 break-words">Source: {record.id}</p>
                        {#if record.id === "estate_profile.executor_name" && estateProfile.status !== "synced"}
                            <p class="mt-1">Device copy while your records refresh.</p>
                        {/if}
                        {#each record.details as detail}
                            <p class="mt-1 whitespace-pre-wrap break-words">{detail}</p>
                        {/each}
                    </li>
                {/each}
            </ul>
        </details>
    {/if}
{/snippet}

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
                Find selected records for a practice discussion.
            </p>
        </div>
        <div
            class="px-6 py-4 bg-card border border-border rounded-2xl text-foreground flex items-center gap-4"
        >
            <div
                class="text-xs font-black uppercase tracking-widest text-muted-foreground"
            >
                Record coverage score
            </div>
            {#if auditSources.canScore}<div class="text-2xl font-black">{readiness.score}%</div>{/if}
        </div>
    </header>

    <AuditSourceStatus state={auditSources} />

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
                <h4 class="font-bold text-lg mb-2 text-foreground">Review Your Records</h4>
                <p class="text-sm text-muted-foreground leading-relaxed">
                    These scenarios bring together recorded names, documents
                    and account lists to review with the people involved.
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
                        Scenario Record Review
                    </h2>
                    <span
                        class="px-4 py-1.5 bg-success/10 text-success rounded-full text-xs font-black uppercase tracking-tighter"
                        >Recorded Details</span
                    >
                </div>

                <div class="p-8 space-y-12">
                    {#if !scenarioSourcesKnown}
                        <p class="text-muted-foreground" data-testid="scenario-facts-loading">Gathering your records...</p>
                    {:else}
                    <!-- Section 1: Visibility -->
                    <section>
                        <h3
                            class="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2"
                        >
                            <Users size={14} /> People Named in Records
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div
                                data-scenario-check="hasExecutor" data-present={readiness.hasExecutor}
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
                                            Executor Name Recorded
                                        </p>
                                        <p
                                            class="text-xs text-success font-medium"
                                        >
                                            {$estateExecutorName} is named in your records.
                                        </p>
                                        {@render recordedSources("hasExecutor")}
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
                                            Record the intended executor's name, then confirm the arrangement and authority separately.
                                        </p>
                                    </div>
                                {/if}
                            </div>

                            <div
                                data-scenario-check="hasProxy" data-present={readiness.hasProxy}
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
                                            Healthcare Proxy Recorded
                                        </p>
                                        <p
                                            class="text-xs text-success font-medium"
                                        >
                                            {countRecords(sources.hasProxy.length, "healthcare proxy")}
                                        </p>
                                        {@render recordedSources("hasProxy")}
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
                                            Record the healthcare proxy and where the relevant original is kept.
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
                            <Wallet size={14} /> Recorded Account & Heirloom Lists
                        </h3>
                        <div class="space-y-4">
                            <div
                                data-scenario-check="hasDigital" data-present={readiness.hasDigital}
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
                                            Digital Accounts
                                        </h4>
                                        <p
                                            class="text-sm text-muted-foreground font-medium"
                                        >
                                            {readiness.hasDigital
                                                ? countRecords(sources.hasDigital.length, "digital account")
                                                : "Record your digital accounts and where approved recovery instructions are kept."}
                                        </p>
                                        {@render recordedSources("hasDigital")}
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
                                data-scenario-check="hasHeirlooms" data-present={readiness.hasHeirlooms}
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
                                            Heirlooms
                                        </h4>
                                        <p
                                            class="text-sm text-muted-foreground font-medium"
                                        >
                                            {readiness.hasHeirlooms
                                                ? countRecords(sources.hasHeirlooms.length, "heirloom")
                                                : "Record your heirlooms, their stories and intended recipients."}
                                        </p>
                                        {@render recordedSources("hasHeirlooms")}
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
                                One Record to Review Next
                            </h3>
                            <p
                                class="text-white/80 leading-relaxed font-medium"
                            >
                                {#if nextCheck}
                                    The first missing check in this walkthrough's fixed list is
                                    <strong>{nextCheck.label}</strong>. Review it so that {nextCheck.goal}.
                                    This list follows a fixed order, separate from legal or emergency priorities.
                                {:else}
                                    The records used in <strong>{activeScenario.title}</strong>
                                    are present. Review their details and access instructions.
                                {/if}
                            </p>
                        </div>
                        <a
                            href="/export/preview?scope=full"
                            class="px-8 py-4 bg-white text-primary-deep rounded-2xl font-black text-sm hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-black/10"
                        >
                            OPEN HANDOVER PREVIEW
                        </a>
                    </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>
