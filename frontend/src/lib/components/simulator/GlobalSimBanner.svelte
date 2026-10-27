<script lang="ts">
    import { fade, slide } from "svelte/transition";
    import { Siren, X, ArrowRight } from "lucide-svelte";
    import {
        currentScenario,
        isSimulationActive,
        scenarioStore,
    } from "$lib/stores/scenarioStore.svelte";

    function endSimulation() {
        // One write for both fields (two concurrent writes raced).
        scenarioStore
            .update({ isSimActive: false, currentScenario: "General" })
            .catch(() => {}); // the store rolls back and shows the gentle error
    }
</script>

{#if $isSimulationActive}
    <div
        class="bg-primary-deep text-white py-3 px-6 flex items-center justify-between sticky top-0 z-[100] shadow-md"
        transition:slide
    >
        <div class="flex items-center gap-4">
            <div class="bg-white/20 p-2 rounded-lg animate-pulse">
                <Siren size={20} />
            </div>
            <div>
                <p class="font-bold text-sm tracking-wide uppercase">
                    Fire Drill Active: <span class="text-white/85"
                        >{$currentScenario} Passing</span
                    >
                </p>
                <p class="text-xs text-white/85 hidden md:block">
                    The system is behaving as it would for the executor during
                    this scenario.
                </p>
            </div>
        </div>

        <div class="flex items-center gap-3">
            <a
                href="/modules/executor-toolkit"
                class="bg-white text-primary-deep px-4 py-1.5 rounded-full text-xs font-bold hover:bg-white/90 transition-colors flex items-center gap-2"
            >
                View Toolkit <ArrowRight size={14} />
            </a>
            <button
                on:click={endSimulation}
                class="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="End Simulation"
            >
                <X size={20} />
            </button>
        </div>
    </div>
{/if}
