<script>
    import ConciergeSettings from "$lib/components/concierge/ConciergeSettings.svelte";
    import { Settings } from "lucide-svelte";
    import { t } from "$lib/stores/concierge";
</script>

<div
    class="max-w-4xl mx-auto p-6 md:p-10 space-y-8 animate-in fade-in duration-500"
>
    <div class="flex items-center gap-4 border-b border-slate-200 pb-6">
        <div class="p-3 bg-slate-100 text-slate-600 rounded-2xl">
            <Settings size={32} />
        </div>
        <div>
            <h1 class="font-serif text-3xl font-bold text-slate-900">
                {$t.settingsTitle}
            </h1>
            <p class="text-slate-500 font-medium">
                {$t.settingsDesc}
            </p>
        </div>
    </div>

    <div
        class="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 md:p-8"
    >
        <ConciergeSettings />
    </div>
</div>
