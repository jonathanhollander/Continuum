<script lang="ts">
    import { fade, slide } from "svelte/transition";
    import { onMount, onDestroy } from "svelte";
    import {
        Compass,
        CreditCard,
        Stethoscope,
        HeartHandshake,
        CircleCheck,
        CirclePlus,
        ArrowRight,
    } from "lucide-svelte";
    import { documentSync } from "$lib/stores/documentStore.svelte";
    import { financialAssetsSync, isDebt } from "$lib/stores/financialAssetsStore.svelte";
    import { directiveSync } from "$lib/stores/medicalStore.svelte";
    import { auth } from "$lib/stores/auth";
    import { captureSession, isCurrentSession } from "$lib/services/sessionOwnership";

    type Scenario = "wallet" | "medical" | "passing";
    let activeScenario: "none" | Scenario = "none";
    let simulationState: "idle" | "running" | "paused" | "complete" = "idle";
    let report: any[] = [];
    let overallStatus: "pass" | "fail" | "warn" = "pass";
    let runVersion = 0;
    let runOwner = captureSession();
    let pausedSources: { name: string; path: string }[] = [];
    let pauseMessage = "";

    onMount(() => auth.subscribe(() => {
        if (activeScenario !== "none" && !isCurrentSession(runOwner)) {
            runVersion++;
            report = [];
            pausedSources = [];
            pauseMessage = "The signed-in account changed. Try Again to read this scenario's records for the current account.";
            simulationState = "paused";
        }
    }));
    onDestroy(() => { runVersion++; });

    const scenarioSources = (id: Scenario) => [
        { manager: documentSync, name: "Document Vault", path: "/modules/legal-documents" },
        id === "medical"
            ? { manager: directiveSync, name: "Medical directives", path: "/modules/medical" }
            : { manager: financialAssetsSync, name: "Financial Accounts", path: "/modules/financial-accounts" },
    ];

    const named = (d: any, pattern: RegExp) =>
        pattern.test(`${d?.name ?? ""} ${d?.title ?? ""}`.toLowerCase());

    const scenarios = [
        {
            id: "wallet",
            title: "Lost Wallet",
            icon: CreditCard,
            color: "text-warning",
            bg: "bg-warning-soft",
            desc: "Your physical wallet is stolen while traveling.",
        },
        {
            id: "medical",
            title: "Sudden Hospitalization",
            icon: Stethoscope,
            color: "text-primary-hover",
            bg: "bg-primary-soft",
            desc: "Which care wishes and decision-maker records could someone look for?",
        },
        {
            id: "passing",
            title: "Unexpected Passing",
            icon: HeartHandshake,
            color: "text-muted-foreground",
            bg: "bg-muted",
            desc: "Which documents and beneficiary notes could your family review?",
        },
    ];

    async function runSimulation(id: Scenario) {
        const version = ++runVersion;
        const owner = captureSession();
        runOwner = owner;
        activeScenario = id;
        simulationState = "running";
        report = [];
        pausedSources = [];
        pauseMessage = "";

        const sources = scenarioSources(id);
        await Promise.allSettled(sources.map(({ manager }) => manager.sync()));
        if (version !== runVersion || activeScenario !== id || !isCurrentSession(owner)) return;
        // SyncManager catches read failures. A settled promise or a populated cache
        // alone does not establish that this scenario's required sources answered.
        pausedSources = sources.filter(({ manager }) => !manager.lastSync || manager.status !== "synced")
            .map(({ name, path }) => ({ name, path }));
        if (pausedSources.length > 0) {
            pauseMessage = "These sources have not been confirmed, so this walkthrough has no result yet. Existing device records are kept. Try Again to refresh the selected scenario.";
            simulationState = "paused";
            return;
        }
        const docs: any[] = documentSync.items;
        const assets: any[] = id === "medical" ? [] : financialAssetsSync.items.filter((a: any) => !a.is_closed);
        const directives: any[] = id === "medical" ? directiveSync.items : [];
        const checks: any[] = [];

        if (id === "wallet") {
            const hasIDs = docs.some((d) => d.type === "ID");
            const hasCards = assets.some(
                (a) => a.type === "Financial" || isDebt(a),
            );

            checks.push({
                check: "ID Record",
                status: hasIDs,
                msg: hasIDs
                    ? "A Document Vault record is categorized as ID. Open it to check the attachment or original's location."
                    : "No Document Vault record categorized as ID was found. Record where a copy or original can be found.",
            });
            checks.push({
                check: "Financial or Debt Record",
                status: hasCards,
                msg: hasCards
                    ? "An open Financial or debt record was found. Check that the actual cards and institution contact details are listed."
                    : "No open Financial or debt record was found. Record the actual accounts or cards and institution contacts.",
            });
            overallStatus = hasIDs && hasCards ? "pass" : "fail";
        }

        if (id === "medical") {
            // A care directive from the Medical page (a healthcare proxy counts toward
            // Power of Attorney below), or a vault document named as one
            const hasDirective = directives.some((d) =>
                ["living_will", "dnr", "palliative_care", "other"].includes(d.type),
            );
            const hasHealth =
                hasDirective ||
                docs.some((d) =>
                    named(d, /living will|advance directive|medical directive|health ?care directive|\bdnr\b/),
                );
            // A healthcare proxy from the Medical page, or a vault document named as a POA
            const hasProxy = directives.some((d) => d.type === "healthcare_proxy");
            const hasPOA =
                hasProxy || docs.some((d) => named(d, /power of attorney|\bpoa\b/));

            checks.push({
                check: "Medical Directive",
                status: hasHealth,
                msg: hasHealth
                    ? hasDirective
                        ? "A living-will, DNR, palliative-care or other directive record was found in Health & Medical."
                        : "A Document Vault title matches a healthcare-directive term. Review the actual document and original."
                    : "No matching directive record or document title was found. Record your wishes and where the relevant originals are kept.",
            });
            checks.push({
                check: "Proxy / Power-of-Attorney Record",
                status: hasPOA,
                msg: hasPOA
                    ? hasProxy
                        ? "A healthcare-proxy record was found in Health & Medical. Confirm the person, document and applicable authority."
                        : "A Document Vault title matches power of attorney or POA. Check its actual purpose and authority."
                    : "No healthcare-proxy record or matching power-of-attorney title was found. Record the person and location of the relevant document.",
            });
            overallStatus = hasHealth && hasPOA ? "pass" : "fail";
        }

        if (id === "passing") {
            const hasWill = docs.some((d) => d.type === "Will");
            const hasTrust = docs.some((d) => d.type === "Trust");
            const owned = assets.filter((a) => !isDebt(a));
            const withBen = owned.filter((a) =>
                String(a.beneficiaries ?? "").trim(),
            ).length;
            const benCov = withBen / Math.max(1, owned.length);

            checks.push({
                check: "Will / Trust",
                status: hasWill || hasTrust,
                msg:
                    hasWill || hasTrust
                        ? "A Document Vault record is categorized as Will or Trust. Review the document and original's location."
                        : "No Document Vault record categorized as Will or Trust was found. Record where the relevant documents or originals are kept.",
            });
            checks.push({
                check: "Beneficiary Fields",
                status: benCov > 0.8,
                msg:
                    withBen === 0
                        ? `Beneficiary text is recorded on 0 of ${owned.length} open non-debt assets. This check requires more than 80%; confirm designations with each institution.`
                        : withBen === owned.length
                          ? `Beneficiary text is recorded on ${withBen} of ${owned.length} open non-debt assets. Confirm the actual designations with each institution.`
                          : `Beneficiary text is recorded on ${withBen} of ${owned.length} open non-debt assets. This check requires more than 80%; confirm designations with each institution.`,
            });
            overallStatus =
                (hasWill || hasTrust) && benCov > 0.8 ? "pass" : "fail";
        }

        report = checks;
        simulationState = "complete";
    }

    function reset() {
        runVersion++;
        activeScenario = "none";
        simulationState = "idle";
        report = [];
        pausedSources = [];
        pauseMessage = "";
    }
</script>

<div class="max-w-5xl mx-auto p-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="mb-12 flex items-center justify-between">
        <div>
            <h1 class="font-serif font-bold text-4xl text-foreground mb-2">
                Practice Run
            </h1>
            <p class="text-lg text-muted-foreground">
                Look for selected record categories and fields in a practice scenario.
                This does not test document validity, attachments, access or a complete response to an emergency.
            </p>
        </div>
        <div
            class="bg-primary-soft text-primary-hover px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
        >
            <Compass size={18} /> Practice walkthrough
        </div>
    </div>

    {#if activeScenario === "none"}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6" in:fade>
            {#each scenarios as s}
                <button
                    on:click={() =>
                        runSimulation(s.id as "wallet" | "medical" | "passing")}
                    class="bg-card p-8 rounded-2xl border border-border hover:border-primary/30 hover:shadow-xl transition-all text-left group flex flex-col items-start justify-start"
                >
                    <div
                        class="w-16 h-16 rounded-2xl {s.bg} {s.color} flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform"
                    >
                        <svelte:component this={s.icon} size={32} />
                    </div>
                    <h3
                        class="font-bold font-serif text-xl text-foreground mb-2"
                    >
                        {s.title}
                    </h3>
                    <p
                        class="text-sm text-muted-foreground leading-relaxed mb-6"
                    >
                        {s.desc}
                    </p>
                    <div
                        class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary-hover"
                    >
                        Walk through this moment <ArrowRight size={14} />
                    </div>
                </button>
            {/each}
        </div>
    {/if}

    {#if activeScenario !== "none"}
        <div
            class="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
            in:fade
        >
            <!-- Sim Header -->
            <div
                class="p-8 border-b border-border bg-muted flex items-center justify-between"
            >
                <div class="flex items-center gap-4">
                    <button
                        on:click={reset}
                        class="text-muted-foreground hover:text-foreground"
                    >
                        ← Back
                    </button>
                    <h2 class="font-bold text-xl flex items-center gap-2">
                        Moment: <span class="text-primary-hover"
                            >{scenarios.find((s) => s.id === activeScenario)
                                ?.title}</span
                        >
                    </h2>
                </div>
                {#if simulationState === "running"}
                    <div
                        class="flex items-center gap-2 text-primary font-bold animate-pulse"
                    >
                        <Compass size={18} /> Looking over your plan…
                    </div>
                {/if}
            </div>

            <div class="p-12 min-h-[400px]">
                {#if simulationState === "running"}
                    <div
                        class="flex flex-col items-center justify-center h-full space-y-6 pt-12"
                    >
                        <div
                            class="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin"
                        ></div>
                        <div class="space-y-2 text-center">
                            <p class="text-lg font-bold text-foreground">
                                Looking over your plan
                            </p>
                            <p class="text-muted-foreground">
                                Reading your Document Vault and {activeScenario === "medical" ? "medical directives" : "Financial Accounts"}…
                            </p>
                        </div>
                    </div>
                {:else if simulationState === "paused"}
                    <div class="max-w-2xl mx-auto space-y-6" role="status" data-testid="simulation-paused">
                        <h2 class="font-serif font-bold text-3xl text-foreground">Records Not Confirmed</h2>
                        <p class="text-muted-foreground">{pauseMessage}</p>
                        {#if pausedSources.length > 0}
                            <ul class="space-y-2">
                                {#each pausedSources as source}
                                    <li><a class="text-primary underline underline-offset-2" href={source.path}>{source.name}</a></li>
                                {/each}
                            </ul>
                        {/if}
                        <button
                            on:click={() => activeScenario !== "none" && runSimulation(activeScenario)}
                            class="px-5 py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary-hover"
                        >Try Again</button>
                    </div>
                {:else if simulationState === "complete"}
                    <div class="max-w-2xl mx-auto" in:slide>
                        <!-- Result Header -->
                        <div class="text-center mb-12">
                            {#if overallStatus === "pass"}
                                <div
                                    class="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4"
                                >
                                    <CircleCheck size={40} />
                                </div>
                                <h1
                                    class="font-serif font-bold text-3xl text-success"
                                >
                                    Records Found for This Walkthrough
                                </h1>
                                <p class="text-muted-foreground mt-2">
                                    The selected record checks passed. Open the actual records and confirm their details and availability.
                                </p>
                            {:else}
                                <h1
                                    class="font-serif font-bold text-3xl text-foreground"
                                >
                                    Questions to Review
                                </h1>
                                <p class="text-muted-foreground mt-2">
                                    One or more selected record checks did not pass. Use the findings below to review the source records.
                                </p>
                            {/if}
                        </div>

                        <!-- Report Cards -->
                        <div class="space-y-4">
                            {#each report as item}
                                <div
                                    class="p-4 rounded-xl border flex items-start gap-4 transition-all {item.status
                                        ? 'bg-success/10 border-success/20'
                                        : 'bg-warning-soft border-warning/20'}"
                                >
                                    <div class="mt-1">
                                        {#if item.status}
                                            <CircleCheck
                                                class="text-success"
                                                size={20}
                                            />
                                        {:else}
                                            <CirclePlus
                                                class="text-warning"
                                                size={20}
                                            />
                                        {/if}
                                    </div>
                                    <div>
                                        <h4
                                            class="font-bold {item.status
                                                ? 'text-foreground'
                                                : 'text-foreground'}"
                                        >
                                            {item.check}
                                        </h4>
                                        <p
                                            class="text-sm {item.status
                                                ? 'text-success'
                                                : 'text-warning'}"
                                        >
                                            {item.msg}
                                        </p>
                                    </div>
                                </div>
                            {/each}
                        </div>

                        <div class="mt-12 text-center">
                            <button
                                on:click={reset}
                                class="text-primary font-bold hover:underline"
                                >Walk through another moment</button
                            >
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>
