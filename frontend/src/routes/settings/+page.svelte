<script>
    import ConciergeSettings from "$lib/components/concierge/ConciergeSettings.svelte";
    import { Settings } from "lucide-svelte";
    import { dict } from "$lib/stores/conciergeStore.svelte";
</script>

<div
    class="max-w-4xl px-6 py-6 md:py-10 space-y-8 animate-in fade-in duration-500"
>
    <div class="flex items-center gap-4 border-b border-border pb-6">
        <div class="p-3 bg-muted text-muted-foreground rounded-2xl">
            <Settings size={32} />
        </div>
        <div>
            <h1 class="font-serif text-3xl font-bold text-foreground">
                {$dict.settingsTitle}
            </h1>
            <p class="text-muted-foreground font-medium">
                {$dict.settingsDesc}
            </p>
        </div>
    </div>

    <div
        class="bg-card rounded-[2rem] border border-border shadow-sm p-6 md:p-8"
    >
        <ConciergeSettings />
    </div>
</div>
