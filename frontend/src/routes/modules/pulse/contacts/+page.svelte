<script lang="ts">
    import PulseContactsManager from "$lib/components/modules/pulse/PulseContactsManager.svelte";
    import { Users } from "lucide-svelte";
</script>

<div class="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-serif text-foreground flex items-center gap-2">
            <Users class="text-primary" />
            Trusted Contacts
        </h1>
        <a
            href="/modules/pulse"
            class="text-sm text-primary hover:text-primary-hover transition-colors"
            >Back to Wellness Check-in</a
        >
    </div>

    <div class="bg-background/30 p-6 rounded-2xl border border-border">
        <p class="text-muted-foreground mb-6 max-w-2xl">
            These people are assigned to Pulse alert tiers. An explicit Pulse tier takes precedence;
            otherwise Pulse uses the call order in Family &amp; Contacts (Tier 1, 2 or 3).
            “Kept private” stays off that call order; an explicit Pulse tier still applies.
            Review waits on your <a href="/modules/pulse/escalation" class="text-primary hover:underline">Escalation Plan</a>.
        </p>
        <PulseContactsManager
            userId={1}
            showHeader={false}
            viewMode="contacts"
        />
    </div>
</div>
