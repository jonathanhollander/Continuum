<script lang="ts">
    /**
     * Executor Hub - Simplified dashboard for estate executors
     *
     * Focuses on essential tasks with grief-aware language
     */

    import { FileText, Users, DollarSign, Home, Heart, Clock } from 'lucide-svelte';
    import { fade, fly } from 'svelte/transition';
    import { contextStore } from "$lib/stores/contextStore.svelte.ts";
    import { estateAudit } from "$lib/stores/auditStore.svelte.ts";
    import { possessive } from '$lib/utils/contextualMessages';
    import SupportResources from './SupportResources.svelte';
    import ExecutorProgressTracker from './ExecutorProgressTracker.svelte';

    // Essential modules for executors (prioritized)
    const essentialModules = [
        {
            id: 'documents',
            icon: FileText,
            title: 'Important Documents',
            description: 'Death certificate, will, and legal documents',
            link: '/modules/documents',
            color: 'rose'
        },
        {
            id: 'contacts',
            icon: Users,
            title: 'Contact Directory',
            description: 'People who need to be notified',
            link: '/modules/contacts',
            color: 'indigo'
        },
        {
            id: 'financial',
            icon: DollarSign,
            title: 'Financial Accounts',
            description: 'Bank accounts, investments, and assets',
            link: '/modules/financial-accounts',
            color: 'emerald'
        },
        {
            id: 'property',
            icon: Home,
            title: 'Property & Assets',
            description: 'Real estate and valuable possessions',
            link: '/modules/property',
            color: 'amber'
        }
    ];

    // Calculate completion for essential areas
    let essentialCompletion = $derived.by(() => {
        const scores = estateAudit.moduleScores;
        const essentialIds = ['documents', 'contacts', 'financial', 'property'];
        const completed = essentialIds.filter(id => scores[id] > 50).length;
        return Math.round((completed / essentialIds.length) * 100);
    });
</script>

<div class="max-w-6xl mx-auto" in:fade>
    <!-- Compassionate Header -->
    <div class="mb-8">
        <div class="flex items-center gap-2 mb-2 text-slate-400">
            <Heart size={16} />
            <span class="text-sm font-medium">Executor Portal</span>
        </div>
        <h1 class="text-3xl font-serif font-bold text-white mb-3">
            We're here to help
        </h1>
        <p class="text-lg text-slate-300 max-w-2xl leading-relaxed">
            {#if contextStore.deceasedName}
                You're gathering information about {contextStore.deceasedName}'s estate. Take your time—there's no rush. We've organized everything you need in one place.
            {:else}
                You're gathering information about their estate. Take your time—there's no rush. We've organized everything you need in one place.
            {/if}
        </p>
    </div>

    <!-- Progress Tracker -->
    <div class="mb-8">
        <ExecutorProgressTracker completion={essentialCompletion} />
    </div>

    <!-- Support Resources Banner -->
    <div class="mb-8">
        <SupportResources />
    </div>

    <!-- Essential Areas Grid -->
    <div class="mb-6">
        <h2 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Clock size={20} class="text-indigo-400" />
            Essential Areas
        </h2>
        <p class="text-sm text-slate-400 mb-6">
            Focus on these key areas first. Everything else can wait until you're ready.
        </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {#each essentialModules as module, i}
            {@const Icon = module.icon}
            {@const score = estateAudit.moduleScores[module.id] || 0}
            {@const isStarted = score > 0}

            <a
                href={module.link}
                class="group relative p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50
                       hover:border-{module.color}-500/50 hover:bg-slate-800/60
                       transition-all duration-300"
                in:fly={{ y: 20, duration: 500, delay: i * 100 }}
            >
                <!-- Status Indicator -->
                <div class="absolute top-4 right-4">
                    {#if score >= 80}
                        <div class="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                    {:else if isStarted}
                        <div class="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                    {:else}
                        <div class="w-3 h-3 rounded-full bg-slate-600"></div>
                    {/if}
                </div>

                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 rounded-xl bg-{module.color}-500/10 flex items-center justify-center text-{module.color}-400 group-hover:scale-110 transition-transform">
                        <Icon size={24} />
                    </div>

                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-white mb-1">
                            {module.title}
                        </h3>
                        <p class="text-sm text-slate-400 mb-3">
                            {module.description}
                        </p>

                        {#if isStarted}
                            <div class="flex items-center gap-2 text-xs text-{module.color}-400">
                                <div class="w-full max-w-[120px] h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        class="h-full bg-{module.color}-500 transition-all duration-500"
                                        style="width: {score}%"
                                    ></div>
                                </div>
                                <span>{score}%</span>
                            </div>
                        {:else}
                            <span class="text-xs text-slate-500">Not yet started</span>
                        {/if}
                    </div>
                </div>
            </a>
        {/each}
    </div>

    <!-- Gentle CTA for Additional Resources -->
    <div class="mt-12 p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
        <h3 class="text-lg font-semibold text-white mb-2">
            Need to explore more?
        </h3>
        <p class="text-slate-300 mb-4">
            Beyond these essentials, there are many other modules available—but only when you're ready.
            Focus on what matters most right now.
        </p>
        <a
            href="/modules"
            class="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
            View all modules
            <span class="opacity-50">→</span>
        </a>
    </div>
</div>
