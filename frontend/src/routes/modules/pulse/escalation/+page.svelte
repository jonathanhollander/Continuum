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
            Choose the wait for each alert tier. Tier 1's wait starts after your check-in interval
            and grace period. Each later tier's wait starts when the previous tier is reached.
            A personal wait replaces that person's tier wait, from the same starting point.
            An explicit Pulse tier takes precedence over the call order in Family &amp; Contacts.
        </p>
        <PulseContactsManager
            userId={1}
            showHeader={false}
            viewMode="escalation"
        />
    </div>
</div>
