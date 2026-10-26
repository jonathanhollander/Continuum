<script lang="ts">
    import PulseContactsManager from "$lib/components/modules/pulse/PulseContactsManager.svelte";
    import { Activity } from "lucide-svelte";
</script>

<div class="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-serif text-foreground flex items-center gap-2">
            <Activity class="text-primary" />
            Escalation Plan
        </h1>
        <a
            href="/modules/pulse"
            class="text-sm text-primary hover:text-primary-hover transition-colors"
            >Back to Wellness Check-in</a
        >
    </div>

    <div class="bg-background/30 p-6 rounded-2xl border border-slate-800">
        <p class="text-muted-foreground mb-6 max-w-2xl">
            Choose how long Continuum waits before reaching out to each group of
            your guardians.
        </p>
        <PulseContactsManager
            userId={1}
            showHeader={false}
            viewMode="escalation"
        />
    </div>
</div>
