<script lang="ts">
    import { fly, fade, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { onboardingStore } from "$lib/stores/onboardingStore.svelte";
    import {
        Sparkles,
        ArrowRight,
        ShieldCheck,
        Database,
        X,
    } from "lucide-svelte";

    let isOpen = $derived(!onboardingStore.hasSeenWelcome);
    let isPopulating = $state(false);

    function handleStart() {
        onboardingStore.markWelcomeSeen();
    }

    function handleDemo() {
        if (
            confirm(
                "This will populate your account with example data (Property, Family, Insurance, etc). Continue?",
            )
        ) {
            isPopulating = true;
            // Delay slightly for effect
            setTimeout(() => {
                onboardingStore.populateDemoData();
                // Modal will close automatically via $derived reactivity or store logic
            }, 800);
        }
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6"
        transition:fade={{ duration: 400 }}
    >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-md"></div>

        <!-- Modal Content -->
        <div
            class="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
            in:scale={{ start: 0.95, duration: 500, easing: quintOut }}
        >
            <!-- Left: Hero Image / Branding -->
            <div
                class="w-full md:w-2/5 bg-slate-900 relative overflow-hidden flex items-center justify-center p-8"
            >
                <div
                    class="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-emerald-600/20"
                ></div>
                <div
                    class="absolute top-0 left-0 w-full h-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"
                ></div>

                <div class="relative z-10 text-center">
                    <div
                        class="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/20"
                    >
                        <ShieldCheck size={40} class="text-emerald-400" />
                    </div>
                    <h2 class="text-2xl font-serif font-bold text-white mb-2">
                        Continuum
                    </h2>
                    <p
                        class="text-indigo-200 text-sm font-medium tracking-wide"
                    >
                        Legacy Preservation Engine
                    </p>
                </div>
            </div>

            <!-- Right: Content -->
            <div class="w-full md:w-3/5 p-8 md:p-10 flex flex-col">
                <div class="mb-auto space-y-4">
                    <h3
                        class="text-3xl font-black text-slate-800 tracking-tight"
                    >
                        Welcome Aboard.
                    </h3>
                    <p class="text-slate-500 leading-relaxed text-lg">
                        Your digital estate is ready to be secured. How would
                        you like to begin your journey?
                    </p>

                    <ul class="space-y-3 mt-6">
                        <li class="flex items-start gap-3">
                            <div
                                class="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5"
                            >
                                <span class="text-emerald-600 text-xs font-bold"
                                    >1</span
                                >
                            </div>
                            <span class="text-slate-600 font-medium"
                                >Catalog your physical and digital assets.</span
                            >
                        </li>
                        <li class="flex items-start gap-3">
                            <div
                                class="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5"
                            >
                                <span class="text-indigo-600 text-xs font-bold"
                                    >2</span
                                >
                            </div>
                            <span class="text-slate-600 font-medium"
                                >Designate executors and beneficiaries.</span
                            >
                        </li>
                        <li class="flex items-start gap-3">
                            <div
                                class="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5"
                            >
                                <span class="text-amber-600 text-xs font-bold"
                                    >3</span
                                >
                            </div>
                            <span class="text-slate-600 font-medium"
                                >Preserve memories and final wishes.</span
                            >
                        </li>
                    </ul>
                </div>

                <div class="mt-10 space-y-3">
                    <button
                        onclick={handleStart}
                        class="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-slate-900/20"
                    >
                        Start My Legacy
                        <ArrowRight
                            size={20}
                            class="group-hover:translate-x-1 transition-transform"
                        />
                    </button>

                    <button
                        onclick={handleDemo}
                        disabled={isPopulating}
                        class="w-full py-3 bg-white border-2 border-slate-100 text-slate-500 rounded-xl font-bold hover:border-slate-300 hover:text-slate-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {#if isPopulating}
                            <span class="animate-pulse"
                                >Injecting Demo Data...</span
                            >
                            else
                            <Database size={18} />
                            <span>Explore with Sample Data</span>
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}
