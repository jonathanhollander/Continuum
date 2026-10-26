<script lang="ts">
    import {
        currentScenario,
        isSimulationActive,
        scenarioStore,
        SCENARIO_DESCRIPTIONS,
        type Scenario,
    } from "$lib/stores/scenarioStore.svelte";
    import { Siren } from "lucide-svelte";

    // Explicitly type the keys to match the Scenario type
    const scenarios: Scenario[] = ["General", "Sudden", "Planned"];

    // One write carries both fields: two concurrent writes raced and the
    // later response could overwrite the other.
    function setScenario(mode: Scenario) {
        scenarioStore
            .update({ currentScenario: mode, isSimActive: mode !== "General" })
            .catch(() => {}); // the store rolls back and shows the gentle error
    }

    function toggleSimulation() {
        isSimulationActive.set(!$isSimulationActive).catch(() => {});
    }
</script>

<div class="bg-card rounded-xl p-6 border border-border">
    <div class="flex items-center justify-between mb-6">
        <div>
            <h2 class="text-xl font-bold text-foreground flex items-center gap-2">
                <span>🧭</span> Scenario Mode
            </h2>
            <p class="text-muted-foreground text-sm mt-1">
                Configures the Executor Dashboard for specific situations.
            </p>
        </div>
        <div class="flex items-center gap-4">
            <button
                on:click={toggleSimulation}
                class="px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2
                {$isSimulationActive
                    ? 'bg-warning-soft text-warning border border-warning/40'
                    : 'bg-background text-muted-foreground border border-border hover:text-foreground'}"
            >
                <Siren size={16} />
                {$isSimulationActive
                    ? "FIRE DRILL ACTIVE"
                    : "ACTIVATE FIRE DRILL"}
            </button>
            <div
                class="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider
                {$currentScenario === 'Sudden'
                    ? 'bg-warning-soft text-warning border border-warning/30'
                    : $currentScenario === 'Planned'
                      ? 'bg-success/10 text-success border border-success/30'
                      : 'bg-info/10 text-info border border-info/30'}"
            >
                {$currentScenario} Mode
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        {#each scenarios as mode}
            <button
                class="relative p-4 rounded-lg border text-left transition-all duration-200
                {$currentScenario === mode
                    ? 'border-primary bg-primary-soft ring-1 ring-primary'
                    : 'border-border hover:border-muted-foreground bg-background/50 hover:bg-background'}"
                on:click={() => setScenario(mode)}
            >
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-lg">
                        {mode === "General"
                            ? "📋"
                            : mode === "Sudden"
                              ? "🚨"
                              : "🕊️"}
                    </span>
                    <h3 class="font-semibold text-foreground">{mode} Passing</h3>
                </div>
                <p class="text-xs text-muted-foreground leading-relaxed">
                    {SCENARIO_DESCRIPTIONS[mode]}
                </p>

                {#if $currentScenario === mode}
                    <div
                        class="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary"
                    ></div>
                {/if}
            </button>
        {/each}
    </div>

    {#if $currentScenario === "Sudden"}
        <div
            class="mt-4 p-4 bg-info/10 border border-info/30 rounded-lg flex gap-3 text-info text-sm"
        >
            <span class="text-lg">ℹ️</span>
            <p>
                <strong>Sudden Passing Mode enabled:</strong> The Executor Dashboard
                will now highlight compassionate guidance and strictly prioritize
                immediate legal and physical security tasks.
            </p>
        </div>
    {/if}
</div>
