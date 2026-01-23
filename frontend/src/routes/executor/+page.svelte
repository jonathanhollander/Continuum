<script lang="ts">
    /**
     * Executor Portal - Dedicated page for estate executors
     *
     * Provides comprehensive guidance and resources with grief-aware language
     */

    import { onMount } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import {
        FileText,
        Users,
        DollarSign,
        Home,
        Heart,
        BookOpen,
        CheckCircle2,
        Clock,
        Shield
    } from 'lucide-svelte';
    import { contextStore } from "$lib/stores/contextStore.svelte.ts";
    import { estateAudit } from "$lib/stores/auditStore.svelte.ts";
    import ExecutorProgressTracker from '$lib/components/executor/ExecutorProgressTracker.svelte';
    import SupportResources from '$lib/components/executor/SupportResources.svelte';
    import { getEncouragementMessage } from '$lib/utils/contextualMessages';

    // Set executor mode if not already set
    onMount(() => {
        if (!contextStore.isExecutor) {
            contextStore.setRole('executor');
        }
        estateAudit.runAudit();
    });

    // Essential areas with progress tracking
    const essentialAreas = [
        {
            id: 'documents',
            icon: FileText,
            title: 'Important Documents',
            description: 'Death certificate, will, trust documents',
            link: '/modules/legal-documents',
            color: 'rose',
            tasks: [
                'Obtain certified copies of death certificate',
                'Locate will and trust documents',
                'Gather birth certificate and marriage license',
                'Find Social Security information'
            ]
        },
        {
            id: 'contacts',
            icon: Users,
            title: 'Notifications',
            description: 'People and organizations to notify',
            link: '/modules/contacts',
            color: 'indigo',
            tasks: [
                'Notify immediate family members',
                'Contact employer or former employers',
                'Inform Social Security Administration',
                'Notify banks and financial institutions'
            ]
        },
        {
            id: 'financial',
            icon: DollarSign,
            title: 'Financial Accounts',
            description: 'Bank accounts, investments, retirement funds',
            link: '/modules/financial-accounts',
            color: 'emerald',
            tasks: [
                'Identify all bank accounts',
                'Locate investment and retirement accounts',
                'Document outstanding debts',
                'Review credit card accounts'
            ]
        },
        {
            id: 'property',
            icon: Home,
            title: 'Property & Assets',
            description: 'Real estate, vehicles, valuable possessions',
            link: '/modules/property',
            color: 'amber',
            tasks: [
                'Secure real estate property',
                'Document vehicle ownership',
                'Inventory valuable items',
                'Arrange for property maintenance'
            ]
        }
    ];

    // Resources and guides
    const resources = [
        {
            title: 'Executor Responsibilities Guide',
            description: 'Understanding your role and legal obligations',
            icon: BookOpen,
            link: '/modules/executor-toolkit',
            color: 'purple'
        },
        {
            title: 'Timeline & Deadlines',
            description: 'Important dates and filing requirements',
            icon: Clock,
            link: '/modules/executor-toolkit#timeline',
            color: 'blue'
        },
        {
            title: 'Professional Help',
            description: 'When to consult attorneys and accountants',
            icon: Shield,
            link: '/modules/contacts#professionals',
            color: 'cyan'
        }
    ];

    let expandedArea = $state<string | null>(null);
    let encouragement = $state(getEncouragementMessage());

    // Calculate completion for essential areas
    let essentialCompletion = $derived.by(() => {
        const scores = estateAudit.moduleScores;
        const essentialIds = essentialAreas.map(a => a.id);
        const completed = essentialIds.filter(id => scores[id] > 50).length;
        return Math.round((completed / essentialIds.length) * 100);
    });

    function toggleArea(id: string) {
        expandedArea = expandedArea === id ? null : id;
    }
</script>

<div class="min-h-screen bg-slate-950 text-slate-200 p-6">
    <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8" in:fade>
            <div class="flex items-center gap-2 mb-3 text-rose-400">
                <Heart size={20} />
                <span class="text-sm font-medium uppercase tracking-wider">Executor Portal</span>
            </div>
            <h1 class="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
                Estate Administration Hub
            </h1>
            <p class="text-xl text-slate-300 max-w-3xl leading-relaxed mb-4">
                {#if contextStore.deceasedName}
                    You're managing {contextStore.deceasedName}'s estate. This is important work, and we're here to support you every step of the way.
                {:else}
                    You're managing their estate. This is important work, and we're here to support you every step of the way.
                {/if}
            </p>
            <p class="text-sm text-slate-400 italic">
                {encouragement}
            </p>
        </div>

        <!-- Progress Overview -->
        <div class="mb-8">
            <ExecutorProgressTracker completion={essentialCompletion} />
        </div>

        <!-- Support Resources -->
        <div class="mb-12">
            <SupportResources />
        </div>

        <!-- Essential Areas -->
        <div class="mb-12">
            <h2 class="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                <CheckCircle2 size={24} class="text-indigo-400" />
                Essential Areas
            </h2>
            <p class="text-slate-400 mb-6">
                These are the core areas you'll need to address. Start with what feels manageable, and take breaks when you need them.
            </p>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {#each essentialAreas as area, i}
                    {@const Icon = area.icon}
                    {@const score = estateAudit.moduleScores[area.id] || 0}
                    {@const isExpanded = expandedArea === area.id}

                    <div
                        class="rounded-2xl bg-slate-800/40 border border-slate-700/50 overflow-hidden
                               hover:border-{area.color}-500/30 transition-all duration-300"
                        in:fly={{ y: 20, duration: 500, delay: i * 100 }}
                    >
                        <!-- Area Header -->
                        <button
                            onclick={() => toggleArea(area.id)}
                            class="w-full p-6 flex items-start gap-4 text-left hover:bg-slate-800/60 transition-colors"
                        >
                            <div class="w-14 h-14 rounded-xl bg-{area.color}-500/10 flex items-center justify-center flex-shrink-0">
                                <Icon size={28} class="text-{area.color}-400" />
                            </div>

                            <div class="flex-1">
                                <h3 class="text-xl font-semibold text-white mb-1">
                                    {area.title}
                                </h3>
                                <p class="text-sm text-slate-400 mb-3">
                                    {area.description}
                                </p>

                                <!-- Progress Bar -->
                                {#if score > 0}
                                    <div class="flex items-center gap-2 text-xs">
                                        <div class="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                class="h-full bg-{area.color}-500 transition-all duration-500"
                                                style="width: {score}%"
                                            ></div>
                                        </div>
                                        <span class="text-{area.color}-400 font-medium">{score}%</span>
                                    </div>
                                {:else}
                                    <span class="text-xs text-slate-500">Not yet started</span>
                                {/if}
                            </div>

                            <div class="text-slate-500 transition-transform {isExpanded ? 'rotate-180' : ''}">
                                ▼
                            </div>
                        </button>

                        <!-- Expanded Task List -->
                        {#if isExpanded}
                            <div class="px-6 pb-6 space-y-3" in:fade>
                                <div class="text-sm text-slate-400 mb-3 border-t border-slate-700 pt-4">
                                    Key tasks to consider:
                                </div>
                                {#each area.tasks as task}
                                    <div class="flex items-start gap-2 text-sm">
                                        <div class="w-5 h-5 rounded border border-slate-600 flex-shrink-0 mt-0.5"></div>
                                        <span class="text-slate-300">{task}</span>
                                    </div>
                                {/each}

                                <a
                                    href={area.link}
                                    class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-{area.color}-500/20 text-{area.color}-400
                                           hover:bg-{area.color}-500/30 rounded-lg font-medium transition-colors"
                                >
                                    Go to {area.title}
                                    <span class="opacity-70">→</span>
                                </a>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>

        <!-- Additional Resources -->
        <div class="mb-12">
            <h2 class="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                <BookOpen size={24} class="text-purple-400" />
                Guidance & Resources
            </h2>
            <p class="text-slate-400 mb-6">
                These resources can help you understand your responsibilities and make informed decisions.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                {#each resources as resource}
                    {@const Icon = resource.icon}
                    <a
                        href={resource.link}
                        class="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50
                               hover:border-{resource.color}-500/30 hover:bg-slate-800/60
                               transition-all duration-300 group"
                    >
                        <div class="w-12 h-12 rounded-xl bg-{resource.color}-500/10 flex items-center justify-center mb-4
                                    group-hover:scale-110 transition-transform">
                            <Icon size={24} class="text-{resource.color}-400" />
                        </div>
                        <h3 class="text-lg font-semibold text-white mb-2">
                            {resource.title}
                        </h3>
                        <p class="text-sm text-slate-400">
                            {resource.description}
                        </p>
                    </a>
                {/each}
            </div>
        </div>

        <!-- Footer Note -->
        <div class="text-center py-8 border-t border-slate-800">
            <p class="text-sm text-slate-500">
                Remember: You can work at your own pace. Save your progress at any time and return when you're ready.
            </p>
        </div>
    </div>
</div>
