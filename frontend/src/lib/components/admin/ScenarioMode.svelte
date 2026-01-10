<script lang="ts">
    import {
        currentScenario,
        isSimulationActive,
        SCENARIO_DESCRIPTIONS,
        type Scenario,
    } from "$lib/stores/scenario";
    import { Siren } from "lucide-svelte";

    // Explicitly type the keys to match the Scenario type
    const scenarios: Scenario[] = ["General", "Sudden", "Planned"];

    function setScenario(mode: Scenario) {
        currentScenario.set(mode);
        if (mode !== "General") {
            isSimulationActive.set(true);
        } else {
            isSimulationActive.set(false);
        }
    }

    function toggleSimulation() {
        isSimulationActive.update((v) => !v);
    }
</script>

<div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
    <div class="flex items-center justify-between mb-6">
        <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
                <span>🧭</span> Scenario Mode
            </h2>
            <p class="text-gray-400 text-sm mt-1">
                Configures the Executor Dashboard for specific situations.
            </p>
        </div>
        <div class="flex items-center gap-4">
            <button
                on:click={toggleSimulation}
                class="px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2
                {$isSimulationActive
                    ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}"
            >
                <Siren
                    size={16}
                    class={$isSimulationActive ? "animate-pulse" : ""}
                />
                {$isSimulationActive
                    ? "FIRE DRILL ACTIVE"
                    : "ACTIVATE FIRE DRILL"}
            </button>
            <div
                class="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider
                {$currentScenario === 'Sudden'
                    ? 'bg-red-900/50 text-red-400 border border-red-800'
                    : $currentScenario === 'Planned'
                      ? 'bg-green-900/50 text-green-400 border border-green-800'
                      : 'bg-blue-900/50 text-blue-400 border border-blue-800'}"
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
                    ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500'
                    : 'border-gray-800 hover:border-gray-700 bg-gray-800/50 hover:bg-gray-800'}"
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
                    <h3 class="font-semibold text-white">{mode} Passing</h3>
                </div>
                <p class="text-xs text-gray-400 leading-relaxed">
                    {SCENARIO_DESCRIPTIONS[mode]}
                </p>

                {#if $currentScenario === mode}
                    <div
                        class="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500"
                    ></div>
                {/if}
            </button>
        {/each}
    </div>

    {#if $currentScenario === "Sudden"}
        <div
            class="mt-4 p-4 bg-red-900/20 border border-red-900/30 rounded-lg flex gap-3 text-red-300 text-sm"
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
