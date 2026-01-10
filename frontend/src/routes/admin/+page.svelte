<script lang="ts">
    import { onMount } from "svelte";
    import ReadinessMatrix from "$lib/components/admin/ReadinessMatrix.svelte";
    import ScenarioMode from "$lib/components/admin/ScenarioMode.svelte";
    import UserActivityLog from "$lib/components/admin/UserActivityLog.svelte";
    import { ShieldCheck } from "lucide-svelte";
</script>

<div class="min-h-screen bg-stone-50 pb-20">
    <!-- Header -->
    <div class="bg-[#304743] text-white pt-20 pb-32 relative overflow-hidden">
        <div class="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheck size={300} />
        </div>
        <div class="max-w-7xl mx-auto px-6 relative z-10">
            <div
                class="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-white/20"
            >
                System Administrator
            </div>
            <h1 class="text-5xl font-serif font-bold mb-4">
                Estate Readiness Hub
            </h1>
            <p class="text-emerald-100 text-lg max-w-2xl">
                The technical command center for monitoring data population,
                system health, and dormant "zombie" modules.
            </p>
        </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-6 -mt-20 space-y-8">
        <ScenarioMode />
        <ReadinessMatrix />

        <!-- Placeholder for future widgets like Zombie Detector -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <UserActivityLog />
            <div
                class="bg-white rounded-3xl border border-stone-200 shadow-sm p-8 opacity-50 grayscale"
            >
                <h3 class="font-bold text-lg mb-2">Zombie Data Detector</h3>
                <p class="text-sm">
                    Analysis of stale data points will appear here.
                </p>
            </div>
        </div>
        <div
            class="bg-white rounded-3xl border border-stone-200 shadow-sm p-8 opacity-50 grayscale"
        >
            <h3 class="font-bold text-lg mb-2">Raw JSON Inspector</h3>
            <p class="text-sm">Developer tools for deep data inspection.</p>
        </div>
    </div>
</div>
