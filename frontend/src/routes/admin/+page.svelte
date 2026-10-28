<script lang="ts">
    import ReadinessMatrix from "$lib/components/admin/ReadinessMatrix.svelte";
    import ScenarioMode from "$lib/components/admin/ScenarioMode.svelte";
    import UserActivityLog from "$lib/components/admin/UserActivityLog.svelte";
    import { ShieldCheck } from "lucide-svelte";
</script>

<div class="min-h-screen pb-20">
    <!-- Header -->
    <div class="bg-primary-deep text-white pt-20 pb-32 relative overflow-hidden">
        <div class="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheck size={300} />
        </div>
        <div class="max-w-7xl mx-auto px-6 relative z-10">
            <h1 class="text-5xl font-serif font-bold mb-4 text-white">
                Recorded Information Overview
            </h1>
            <p class="text-white/80 text-lg max-w-2xl">
                Review recorded items and practice settings.
            </p>
        </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-6 -mt-20 space-y-8 relative">
        <ScenarioMode />
        <ReadinessMatrix />

        <div class="mt-6">
            <UserActivityLog />
        </div>
    </div>
</div>
