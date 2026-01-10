<script lang="ts">
    import { Settings, Zap, ArrowLeft } from "lucide-svelte";
    import { automationRules } from "$lib/stores/automation";
    import AutomationCard from "$lib/components/admin/AutomationCard.svelte";
    import WebhookConfig from "$lib/components/admin/WebhookConfig.svelte";

    function toggleRule(id: string) {
        automationRules.update((rules) =>
            rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
        );
    }
</script>

<div class="min-h-screen bg-[#F3F4F6] pb-20">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div
            class="container mx-auto px-6 py-4 flex items-center justify-between"
        >
            <div class="flex items-center gap-4">
                <a
                    href="/admin"
                    class="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                >
                    <ArrowLeft size={20} />
                </a>
                <div>
                    <h1
                        class="font-bold text-[#304743] text-xl flex items-center gap-2"
                    >
                        <Zap size={20} class="text-[#D4AF37]" />
                        Automation Control Center
                    </h1>
                    <p
                        class="text-xs text-gray-400 font-mono uppercase tracking-wider"
                    >
                        System v4.0.1 • Admin Mode
                    </p>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"
                ></span>
                <span class="text-sm font-bold text-gray-600"
                    >System Active</span
                >
            </div>
        </div>
    </header>

    <main class="container mx-auto px-6 py-8 max-w-5xl">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left Column: Rules -->
            <div class="lg:col-span-2 space-y-6">
                <div
                    class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
                >
                    <h2 class="font-serif text-2xl text-[#304743] mb-6">
                        Active Rules
                    </h2>
                    <div class="space-y-4">
                        {#each $automationRules as rule (rule.id)}
                            <AutomationCard {rule} onToggle={toggleRule} />
                        {/each}
                    </div>
                </div>

                <!-- Developer Zone -->
                <WebhookConfig />
            </div>

            <!-- Right Column: Sidebar -->
            <div class="space-y-6">
                <div
                    class="bg-[#304743] rounded-xl p-6 text-white text-center shadow-lg shadow-[#304743]/20"
                >
                    <div
                        class="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                        <Zap size={32} class="text-[#D4AF37]" />
                    </div>
                    <h3 class="font-bold text-xl mb-2">Automation Limits</h3>
                    <div class="space-y-2 text-sm text-white/70 mb-6">
                        <p>
                            Rate Limit: <span class="font-mono text-white"
                                >2.5 req/s</span
                            >
                        </p>
                        <p>
                            Daily Usage: <span class="font-mono text-white"
                                >12%</span
                            >
                        </p>
                    </div>
                    <button
                        class="w-full py-2 bg-white text-[#304743] rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors"
                    >
                        View Logs
                    </button>
                </div>

                <div
                    class="bg-yellow-50 rounded-xl p-6 border border-yellow-200 text-yellow-800"
                >
                    <h4 class="font-bold flex items-center gap-2 mb-2">
                        <Settings size={16} />
                        Configuration
                    </h4>
                    <p class="text-sm leading-relaxed">
                        Automation rules are evaluated every 5 minutes. Changes
                        take effect on the next tick.
                    </p>
                </div>
            </div>
        </div>
    </main>
</div>
