<script lang="ts">
    import PulseContactsManager from "$lib/components/modules/pulse/PulseContactsManager.svelte";
    import { Activity } from "lucide-svelte";
</script>

<div class="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-serif text-slate-100 flex items-center gap-2">
            <Activity class="text-teal-400" />
            Escalation Plan
        </h1>
        <a
            href="/modules/pulse"
            class="text-sm text-teal-400 hover:text-teal-300 transition-colors"
            >Back to Dashboard</a
        >
    </div>

    <div class="bg-slate-900/30 p-6 rounded-2xl border border-slate-800">
        <p class="text-slate-400 mb-6 max-w-2xl">
            Configure the <strong>Action Tiers</strong>. Determine how long
            Continuum waits before contacting each group of Guardians.
        </p>
        <PulseContactsManager
            userId={1}
            showHeader={false}
            viewMode="escalation"
        />
    </div>
</div>
