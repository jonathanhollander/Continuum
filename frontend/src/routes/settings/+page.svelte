<script>
    import ConciergeSettings from "$lib/components/concierge/ConciergeSettings.svelte";
    import { Settings, Database, ArrowRight } from "lucide-svelte";
    import { dict } from "$lib/stores/conciergeStore.svelte";
    import { auth } from "$lib/stores/auth";
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
        {#if $auth.user?.email}
            <div class="flex items-center justify-between gap-4 mb-6 text-sm">
                <p class="text-muted-foreground">Signed in as <span class="text-foreground font-medium">{$auth.user.email}</span></p>
                {#if $auth.user.is_admin === true}
                    <a href="/admin/users" class="text-primary-hover font-semibold hover:underline">Administrator settings</a>
                {/if}
            </div>
        {/if}
        <ConciergeSettings />
    </div>

    <a
        href="/settings/data"
        class="group flex items-center gap-4 bg-card rounded-[2rem] border border-border shadow-sm p-6 md:p-8 hover:border-primary/40 transition-colors"
    >
        <div class="p-3 bg-primary-soft text-primary-hover rounded-2xl">
            <Database size={24} />
        </div>
        <div class="flex-1">
            <div class="font-serif text-xl font-bold text-foreground">Your record copies</div>
            <p class="text-muted-foreground">See what is saved on this device and in your Continuum space.</p>
        </div>
        <ArrowRight size={20} class="text-muted-foreground group-hover:text-primary-hover transition-colors" />
    </a>
</div>
