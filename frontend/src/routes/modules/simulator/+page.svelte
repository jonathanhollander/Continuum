<script lang="ts">
    import { fade, slide } from "svelte/transition";
    import {
        TriangleAlert,
        Siren,
        CreditCard,
        Stethoscope,
        Ghost,
        CircleCheck,
        CircleX,
        ArrowRight,
    } from "lucide-svelte";
    import { documentStore } from "$lib/stores/documentStore.svelte";
    import { financialAssetsSync, isDebt } from "$lib/stores/financialAssetsStore.svelte";
    import { medicalStore } from "$lib/stores/medicalStore.svelte";

    let activeScenario: "none" | "wallet" | "medical" | "passing" = "none";
    let simulationState: "idle" | "running" | "complete" = "idle";
    let report: any[] = [];
    let overallStatus: "pass" | "fail" | "warn" = "pass";

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
            title: " Sudden Hospitalization",
            icon: Stethoscope,
            color: "text-primary-hover",
            bg: "bg-primary-soft",
            desc: "You are in hospital and someone you trust decides for you.",
        },
        {
            id: "passing",
            title: "Unexpected Passing",
            icon: Ghost,
            color: "text-muted-foreground",
            bg: "bg-muted",
            desc: "Your family steps in today to carry out your wishes.",
        },
    ];

    async function runSimulation(id: "wallet" | "medical" | "passing") {
        activeScenario = id;
        simulationState = "running";
        report = [];

        // The records saved in the Document Vault, Financial Accounts and Medical pages
        await Promise.allSettled([
            documentStore.sync(),
            financialAssetsSync.sync(),
            medicalStore.sync(),
        ]);
        if (activeScenario !== id) return; // went back while the records loaded
        const docs: any[] = documentStore.items;
        const assets: any[] = financialAssetsSync.items.filter((a: any) => !a.is_closed);
        const directives: any[] = medicalStore.directives;
        const checks: any[] = [];

        if (id === "wallet") {
            const hasIDs = docs.some((d) => d.type === "ID");
            const hasCards = assets.some(
                (a) => a.type === "Financial" || isDebt(a),
            );

            checks.push({
                check: "Digital ID Backup",
                status: hasIDs,
                msg: hasIDs
                    ? "Passport/ID copies found in Vault."
                    : "A copy of your passport or ID in the Vault keeps you covered.",
            });
            checks.push({
                check: "Card List",
                status: hasCards,
                msg: hasCards
                    ? "Financial accounts listed."
                    : "Listing your cards in Financial Accounts makes them quick to replace.",
            });
            overallStatus = hasIDs && hasCards ? "pass" : "fail";
        }

        if (id === "medical") {
            // A directive from the Medical page, or a vault document named as one
            const hasHealth =
                directives.length > 0 ||
                docs.some((d) =>
                    named(d, /health|living will|advance directive|medical directive/),
                );
            const hasPOA = docs.some((d) => named(d, /power of attorney|\bpoa\b/));

            checks.push({
                check: "Medical Directive",
                status: hasHealth,
                msg: hasHealth
                    ? "Healthcare Directive found."
                    : "A healthcare directive lets your doctors follow your wishes.",
            });
            checks.push({
                check: "Power of Attorney",
                status: hasPOA,
                msg: hasPOA
                    ? "POA found."
                    : "A power of attorney lets someone you trust pay your bills.",
            });
            overallStatus = hasHealth && hasPOA ? "pass" : "fail";
        }

        if (id === "passing") {
            const hasWill = docs.some((d) => d.type === "Will");
            const hasTrust = docs.some((d) => d.type === "Trust");
            const owned = assets.filter((a) => !isDebt(a));
            const benCov =
                owned.filter((a) => String(a.beneficiaries ?? "").trim()).length /
                Math.max(1, owned.length);

            checks.push({
                check: "Will / Trust",
                status: hasWill || hasTrust,
                msg:
                    hasWill || hasTrust
                        ? "Legal structure found."
                        : "A will or trust lets you decide where your estate goes.",
            });
            checks.push({
                check: "Beneficiaries",
                status: benCov > 0.8,
                msg:
                    benCov > 0
                        ? `Beneficiaries named on ${Math.round(benCov * 100)}% of assets.`
                        : "Naming a beneficiary on each asset lets it pass straight to the people you choose.",
            });
            overallStatus =
                (hasWill || hasTrust) && benCov > 0.8 ? "pass" : "fail";
        }

        report = checks;
        simulationState = "complete";
    }

    function reset() {
        activeScenario = "none";
        simulationState = "idle";
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
                See how your saved plan answers real-life moments.
            </p>
        </div>
        <div
            class="bg-primary-soft text-primary-hover px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
        >
            <Siren size={18} /> Fire Drill Mode
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
                        Run Simulation <ArrowRight size={14} />
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
                        Simulating: <span class="text-primary-hover"
                            >{scenarios.find((s) => s.id === activeScenario)
                                ?.title}</span
                        >
                    </h2>
                </div>
                {#if simulationState === "running"}
                    <div
                        class="flex items-center gap-2 text-primary font-bold animate-pulse"
                    >
                        <Siren size={18} /> Running Checks...
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
                                Audit in Progress
                            </p>
                            <p class="text-muted-foreground">
                                Checking Vault... scanning Assets... verifying
                                Roles...
                            </p>
                        </div>
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
                                    Plan Resilient
                                </h1>
                                <p class="text-muted-foreground mt-2">
                                    Your estate is prepared for this event.
                                </p>
                            {:else}
                                <h1
                                    class="font-serif font-bold text-3xl text-foreground"
                                >
                                    Room to Strengthen
                                </h1>
                                <p class="text-muted-foreground mt-2">
                                    A few additions will prepare your estate for this event.
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
                                            <CircleX
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
                                >Run Another Simulation</button
                            >
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>
