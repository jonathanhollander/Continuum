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
    import { onMount } from "svelte";

    let activeScenario: "none" | "wallet" | "medical" | "passing" = "none";
    let simulationState: "idle" | "running" | "complete" = "idle";
    let report: any[] = [];
    let overallStatus: "pass" | "fail" | "warn" = "pass";

    // Mock Data Store Access
    let docs: any[] = [];
    let assets: any[] = [];

    import { getStored } from "$lib/stores/persistence";

    // ...

    onMount(() => {
        docs = getStored<any[]>("docs_legal-vault", []);
        assets = getStored<any[]>("assets_assets-main", []);
    });

    const scenarios = [
        {
            id: "wallet",
            title: "Lost Wallet",
            icon: CreditCard,
            color: "text-amber-600",
            bg: "bg-amber-100",
            desc: "Your physical wallet is stolen while traveling.",
        },
        {
            id: "medical",
            title: " Sudden Hospitalization",
            icon: Stethoscope,
            color: "text-rose-600",
            bg: "bg-rose-100",
            desc: "You are incapacitated and cannot make decisions.",
        },
        {
            id: "passing",
            title: "Unexpected Passing",
            icon: Ghost,
            color: "text-stone-600",
            bg: "bg-stone-200",
            desc: "The unthinkable happens today.",
        },
    ];

    function runSimulation(id: "wallet" | "medical" | "passing") {
        activeScenario = id;
        simulationState = "running";
        report = [];

        setTimeout(() => {
            // Simulation Logic
            if (id === "wallet") {
                const hasIDs = docs.some((d) => d.type === "ID");
                const hasCards = assets.some((a) => a.type === "Financial");

                report.push({
                    check: "Digital ID Backup",
                    status: hasIDs,
                    msg: hasIDs
                        ? "Passport/ID copies found in Vault."
                        : "CRITICAL: No backup IDs found.",
                });
                report.push({
                    check: "Card List",
                    status: hasCards,
                    msg: hasCards
                        ? "Financial accounts listed."
                        : "WARNING: No card numbers recorded.",
                });
                overallStatus = hasIDs && hasCards ? "pass" : "fail";
            }

            if (id === "medical") {
                const hasPOA = docs.some(
                    (d) =>
                        d.name.toLowerCase().includes("power of attorney") ||
                        d.type === "Other",
                ); // broad check
                const hasHealth = docs.some(
                    (d) =>
                        d.name.toLowerCase().includes("health") ||
                        d.type === "Other",
                );

                report.push({
                    check: "Medical Directive",
                    status: hasHealth,
                    msg: hasHealth
                        ? "Healthcare Directive found."
                        : "CRITICAL: Doctors don't know your wishes.",
                });
                report.push({
                    check: "Power of Attorney",
                    status: hasPOA,
                    msg: hasPOA
                        ? "POA found."
                        : "CRITICAL: No one can pay your bills.",
                });
                overallStatus = hasHealth && hasPOA ? "pass" : "fail";
            }

            if (id === "passing") {
                const hasWill = docs.some((d) => d.type === "Will");
                const hasTrust = docs.some((d) => d.type === "Trust");
                const benCov =
                    assets.filter((a) => a.beneficiaries).length /
                    Math.max(1, assets.length);

                report.push({
                    check: "Will / Trust",
                    status: hasWill || hasTrust,
                    msg:
                        hasWill || hasTrust
                            ? "Legal structure found."
                            : "CRITICAL: Estate is Intestate (Court decides).",
                });
                report.push({
                    check: "Beneficiaries",
                    status: benCov > 0.8,
                    msg: `Beneficiaries named on ${Math.round(benCov * 100)}% of assets.`,
                });
                overallStatus =
                    (hasWill || hasTrust) && benCov > 0.8 ? "pass" : "fail";
            }

            simulationState = "complete";
        }, 1500);
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
            <h1 class="font-serif font-bold text-4xl text-[#304743] mb-2">
                Scenario Simulator
            </h1>
            <p class="text-lg text-muted-foreground">
                Stress-test your estate plan against real-world events.
            </p>
        </div>
        <div
            class="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
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
                    class="bg-white p-8 rounded-2xl border border-border hover:border-black/20 hover:shadow-xl transition-all text-left group"
                >
                    <div
                        class="w-16 h-16 rounded-2xl {s.bg} {s.color} flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform"
                    >
                        <svelte:component this={s.icon} size={32} />
                    </div>
                    <h3
                        class="font-bold font-serif text-xl text-[#304743] mb-2"
                    >
                        {s.title}
                    </h3>
                    <p
                        class="text-sm text-muted-foreground leading-relaxed mb-6"
                    >
                        {s.desc}
                    </p>
                    <div
                        class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black/40 group-hover:text-[#4A7C74]"
                    >
                        Run Simulation <ArrowRight size={14} />
                    </div>
                </button>
            {/each}
        </div>
    {/if}

    {#if activeScenario !== "none"}
        <div
            class="bg-white rounded-2xl border border-border shadow-2xl overflow-hidden"
            in:fade
        >
            <!-- Sim Header -->
            <div
                class="p-8 border-b border-border bg-stone-50 flex items-center justify-between"
            >
                <div class="flex items-center gap-4">
                    <button
                        on:click={reset}
                        class="text-muted-foreground hover:text-black"
                    >
                        ← Back
                    </button>
                    <h2 class="font-bold text-xl flex items-center gap-2">
                        Simulating: <span class="text-[#304743]"
                            >{scenarios.find((s) => s.id === activeScenario)
                                ?.title}</span
                        >
                    </h2>
                </div>
                {#if simulationState === "running"}
                    <div
                        class="flex items-center gap-2 text-[#4A7C74] font-bold animate-pulse"
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
                            class="w-20 h-20 border-4 border-[#4A7C74] border-t-transparent rounded-full animate-spin"
                        ></div>
                        <div class="space-y-2 text-center">
                            <p class="text-lg font-bold text-[#304743]">
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
                                    class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"
                                >
                                    <CircleCheck size={40} />
                                </div>
                                <h1
                                    class="font-serif font-bold text-3xl text-green-800"
                                >
                                    Plan Resilient
                                </h1>
                                <p class="text-green-700/80 mt-2">
                                    Your estate is prepared for this event.
                                </p>
                            {:else}
                                <!-- Warn case if needed -->
                            {/if}
                        </div>

                        <!-- Report Cards -->
                        <div class="space-y-4">
                            {#each report as item}
                                <div
                                    class="p-4 rounded-xl border flex items-start gap-4 transition-all {item.status
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-rose-50 border-rose-200'}"
                                >
                                    <div class="mt-1">
                                        {#if item.status}
                                            <CircleCheck
                                                class="text-green-600"
                                                size={20}
                                            />
                                        {:else}
                                            <CircleX
                                                class="text-rose-600"
                                                size={20}
                                            />
                                        {/if}
                                    </div>
                                    <div>
                                        <h4
                                            class="font-bold {item.status
                                                ? 'text-green-900'
                                                : 'text-rose-900'}"
                                        >
                                            {item.check}
                                        </h4>
                                        <p
                                            class="text-sm {item.status
                                                ? 'text-green-800'
                                                : 'text-rose-800'}"
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
                                class="text-[#4A7C74] font-bold hover:underline"
                                >Run Another Simulation</button
                            >
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>
