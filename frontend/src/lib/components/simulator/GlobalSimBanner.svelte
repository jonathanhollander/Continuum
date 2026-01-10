<script lang="ts">
    import { fade, slide } from "svelte/transition";
    import { Siren, X, ArrowRight } from "lucide-svelte";
    import { currentScenario, isSimulationActive } from "$lib/stores/scenario";

    function endSimulation() {
        isSimulationActive.set(false);
        currentScenario.set("General");
    }
</script>

{#if $isSimulationActive}
    <div
        class="bg-red-600 text-white py-3 px-6 flex items-center justify-between sticky top-0 z-[100] shadow-[0_4px_20px_rgba(220,38,38,0.4)]"
        transition:slide
    >
        <div class="flex items-center gap-4">
            <div class="bg-white/20 p-2 rounded-lg animate-pulse">
                <Siren size={20} />
            </div>
            <div>
                <p class="font-bold text-sm tracking-wide uppercase">
                    Fire Drill Active: <span class="text-red-100"
                        >{$currentScenario} Passing</span
                    >
                </p>
                <p class="text-xs text-red-100 opacity-90 hidden md:block">
                    The system is behaving as it would for the executor during
                    this scenario.
                </p>
            </div>
        </div>

        <div class="flex items-center gap-3">
            <a
                href="/modules/executor-toolkit"
                class="bg-white text-red-600 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-red-50 transition-colors flex items-center gap-2"
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
