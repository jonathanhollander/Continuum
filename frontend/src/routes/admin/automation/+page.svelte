<script lang="ts">
    import { onMount } from "svelte";
    import { Settings, Zap, ArrowLeft } from "lucide-svelte";
    import { automationRules } from "$lib/stores/automationStore.svelte";
    import AutomationCard from "$lib/components/admin/AutomationCard.svelte";
    import WebhookConfig from "$lib/components/admin/WebhookConfig.svelte";

    // Load this account's rules from the server.
    onMount(() => {
        automationRules.sync();
    });

    function toggleRule(id: string | number) {
        automationRules.toggleRule(id)?.catch(() => {});
    }
</script>

<div class="space-y-8 pb-20">
    <!-- Header -->
    <header class="border-b border-slate-800 pb-8">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
                <a aria-label="Back"
                    href="/admin"
                    class="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                </a>
                <div>
                    <h1
                        class="font-bold text-white text-3xl flex items-center gap-2"
                    >
                        <Zap size={20} class="text-gold-text" />
                        Automation Control Center
                    </h1>
                    <p
                        class="text-xs text-slate-400 font-mono uppercase tracking-wider"
                    >
                        System v4.0.1 • Admin Mode
                    </p>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <span class="w-2 h-2 rounded-full bg-success animate-pulse"
                ></span>
                <span class="text-sm font-bold text-slate-300"
                    >System Active</span
                >
            </div>
        </div>
    </header>

    <section>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left Column: Rules -->
            <div class="lg:col-span-2 space-y-6">
                <div
                    class="bg-slate-900 rounded-xl p-6 border border-slate-800"
                >
                    <h2 class="font-serif text-2xl text-white mb-6">
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
                    class="bg-primary-deep rounded-xl p-6 text-white text-center shadow-lg"
                >
                    <div
                        class="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                        <Zap size={32} class="text-gold-text" />
                    </div>
                    <h3 class="font-bold text-xl text-white mb-2">Automation Limits</h3>
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
                        class="w-full py-2 bg-white text-primary-deep rounded-lg font-bold text-sm hover:bg-white/90 transition-colors"
                    >
                        View Logs
                    </button>
                </div>

                <div
                    class="bg-warning-soft rounded-xl p-6 border border-warning/30 text-warning"
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
    </section>
</div>
