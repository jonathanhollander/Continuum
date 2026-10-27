<script lang="ts">
    /**
     * Executor Portal - Dedicated page for estate executors
     *
     * Provides comprehensive guidance and resources with grief-aware language
     */

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
        Shield,
        Stethoscope
    } from 'lucide-svelte';
    import { contextStore } from "$lib/stores/contextStore.svelte";
    import ExecutorProgressTracker, { TONES, stepsFor, type Tone } from '$lib/components/executor/ExecutorProgressTracker.svelte';
    import SupportResources from '$lib/components/executor/SupportResources.svelte';
    import { getEncouragementMessage } from '$lib/utils/contextualMessages';

    // Viewing this page leaves the saved role as it is; the Perspective switch in settings changes it.
    // The name given in the executor welcome is saved with the account, so it is here after a reload too.
    let deceasedName = $derived(contextStore.deceasedName || '');

    // Essential areas with progress tracking
    const essentialAreas = [
        {
            id: 'documents',
            icon: FileText,
            title: 'Important Documents',
            description: 'Death certificate, will, trust documents',
            link: '/modules/legal-documents',
            color: 'rose' as Tone,
            tasks: [
                "Gather certified copies of the death certificate when you're ready",
                'Find the will and trust documents',
                'Gather the birth certificate and marriage license',
                'Find the Social Security information'
            ]
        },
        {
            id: 'contacts',
            icon: Users,
            title: 'Notifications',
            description: 'People and organizations to let know',
            link: '/modules/contacts',
            color: 'indigo' as Tone,
            tasks: [
                'Let close family know',
                'Let the employer or former employers know',
                'Let Social Security know',
                'Let the banks know'
            ]
        },
        {
            id: 'financial',
            icon: DollarSign,
            title: 'Financial Accounts',
            description: 'Bank accounts, investments, retirement funds',
            link: '/modules/financial-accounts',
            color: 'emerald' as Tone,
            tasks: [
                'Gather the bank accounts',
                'Find the investment and retirement accounts',
                'Note any debts',
                'Look over the credit card accounts'
            ]
        },
        {
            id: 'property',
            icon: Home,
            title: 'Property & Assets',
            description: 'Real estate, vehicles, valuable possessions',
            link: '/modules/property',
            color: 'amber' as Tone,
            tasks: [
                'Look after the property',
                'Note who owns each vehicle',
                'List the valuable items',
                'Arrange care for the home'
            ]
        },
        {
            id: 'medical',
            icon: Stethoscope,
            title: 'Medical Wishes',
            description: 'Healthcare directives, donation wishes, care providers',
            link: '/modules/medical',
            color: 'cyan' as Tone,
            tasks: [
                'Find the healthcare directive and living will',
                'Check organ and tissue donation wishes',
                'List doctors and care providers to inform',
                'Gather medical records the estate may need'
            ]
        }
    ];

    // Resources and guides
    const resources = [
        {
            title: 'Executor Guide',
            description: 'Questions, record links and saved notes for each practical step',
            icon: BookOpen,
            link: '/modules/executor-toolkit',
            color: 'purple' as Tone
        },
        {
            title: 'Gov & Bureaus',
            description: 'Find the government and court questions to confirm',
            icon: Clock,
            link: '/modules/executor-toolkit?tab=bureau',
            color: 'blue' as Tone
        },
        {
            title: 'Professional Help',
            description: 'Find the advisers and contact details recorded for this estate',
            icon: Shield,
            link: '/modules/contacts',
            color: 'cyan' as Tone
        }
    ];

    let expandedArea = $state<string | null>(null);
    let encouragement = $state(getEncouragementMessage());

    function toggleArea(id: string) {
        expandedArea = expandedArea === id ? null : id;
    }
</script>

<div class="surface-dark min-h-screen bg-background text-foreground p-6">
    <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8" in:fade>
            <div class="flex items-center gap-2 mb-3 text-primary">
                <Heart size={20} />
                <span class="text-sm font-medium uppercase tracking-wider">Executor Portal</span>
            </div>
            <h1 class="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
                Estate Administration Hub
            </h1>
            <p class="text-xl text-muted-foreground max-w-3xl leading-relaxed mb-4">
                {#if deceasedName}
                    Find {deceasedName}'s records, people to contact and practical steps to review.
                {:else}
                    Find the recorded information, people to contact and practical steps to review.
                {/if}
            </p>
            <p class="text-sm text-muted-foreground italic">
                {encouragement}
            </p>
        </div>

        <!-- Progress Overview -->
        <div class="mb-8">
            <ExecutorProgressTracker />
        </div>

        <!-- Support Resources -->
        <div class="mb-12">
            <SupportResources />
        </div>

        <!-- Essential Areas -->
        <div class="mb-12">
            <h2 class="text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
                <CheckCircle2 size={24} class="text-primary" />
                Essential Areas
            </h2>
            <p class="text-muted-foreground mb-6">
                Open an area to find its records. Use the Executor Guide to note who you spoke with, what they require and the next action.
            </p>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {#each essentialAreas as area, i}
                    {@const Icon = area.icon}
                    {@const tone = TONES[area.color]}
                    {@const steps = stepsFor(area.link)}
                    {@const score = steps.pct}
                    {@const isExpanded = expandedArea === area.id}

                    <div
                        class="rounded-2xl bg-card/40 border border-border/50 overflow-hidden
                               {tone.border} transition-all duration-300"
                        in:fly={{ y: 20, duration: 500, delay: i * 100 }}
                    >
                        <!-- Area Header -->
                        <button
                            onclick={() => toggleArea(area.id)}
                            class="w-full p-6 flex items-start gap-4 text-left hover:bg-card/60 transition-colors"
                        >
                            <div class="w-14 h-14 rounded-xl {tone.tile} flex items-center justify-center flex-shrink-0">
                                <Icon size={28} class={tone.icon} />
                            </div>

                            <div class="flex-1">
                                <h3 class="text-xl font-semibold text-foreground mb-1">
                                    {area.title}
                                </h3>
                                <p class="text-sm text-muted-foreground mb-3">
                                    {area.description}
                                </p>

                                <!-- Progress Bar -->
                                {#if score > 0}
                                    <div class="flex items-center gap-2 text-xs">
                                        <div class="w-full h-2 bg-border rounded-full overflow-hidden">
                                            <div
                                                class="h-full {tone.bar} transition-all duration-500"
                                                style="width: {score}%"
                                            ></div>
                                        </div>
                                        <span class="{tone.icon} font-medium whitespace-nowrap">{steps.done} of {steps.total} steps</span>
                                    </div>
                                {/if}
                            </div>

                            <div class="text-muted-foreground transition-transform {isExpanded ? 'rotate-180' : ''}">
                                ▼
                            </div>
                        </button>

                        <!-- Expanded Task List -->
                        {#if isExpanded}
                            <div class="px-6 pb-6 space-y-3" in:fade>
                                <div class="text-sm text-muted-foreground mb-3 border-t border-border pt-4">
                                    Key tasks to consider:
                                </div>
                                {#each area.tasks as task}
                                    <div class="flex items-start gap-2 text-sm">
                                        <span class="w-1.5 h-1.5 rounded-full bg-muted-foreground flex-shrink-0 mt-2"></span>
                                        <span class="text-muted-foreground">{task}</span>
                                    </div>
                                {/each}

                                <a
                                    href={area.link}
                                    class="mt-4 inline-flex items-center gap-2 px-4 py-2 {tone.link} rounded-lg font-medium transition-colors"
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
            <h2 class="text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
                <BookOpen size={24} class="text-primary" />
                Guidance & Resources
            </h2>
            <p class="text-muted-foreground mb-6">
                Confirm requirements with the court, institution or adviser handling the matter. Being named here does not establish authority to act.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                {#each resources as resource}
                    {@const Icon = resource.icon}
                    {@const tone = TONES[resource.color]}
                    <a
                        href={resource.link}
                        class="p-6 rounded-2xl bg-card/40 border border-border/50
                               {tone.border} hover:bg-card/60
                               transition-all duration-300 group"
                    >
                        <div class="w-12 h-12 rounded-xl {tone.tile} flex items-center justify-center mb-4
                                    group-hover:scale-110 transition-transform">
                            <Icon size={24} class={tone.icon} />
                        </div>
                        <h3 class="text-lg font-semibold text-foreground mb-2">
                            {resource.title}
                        </h3>
                        <p class="text-sm text-muted-foreground">
                            {resource.description}
                        </p>
                    </a>
                {/each}
            </div>
        </div>

        <!-- Footer Note -->
        <div class="text-center py-8 border-t border-border">
            <p class="text-sm text-muted-foreground">
                Remember: You can work at your own pace and return whenever you're ready.
            </p>
        </div>
    </div>
</div>
