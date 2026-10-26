<script lang="ts">
    /**
     * Executor Hub - Simplified dashboard for estate executors
     *
     * Focuses on essential tasks with grief-aware language
     */

    import { FileText, Users, DollarSign, Home, Heart, Clock, Stethoscope } from 'lucide-svelte';
    import { fade, fly } from 'svelte/transition';
    import { contextStore } from "$lib/stores/contextStore.svelte";
    import SupportResources from './SupportResources.svelte';
    import ExecutorProgressTracker, { TONES, stepsFor, type Tone } from './ExecutorProgressTracker.svelte';

    // The name given in the executor welcome is saved with the account, so it is here after a reload too.
    let deceasedName = $derived(contextStore.deceasedName || '');

    // Essential modules for executors (prioritized)
    const essentialModules = [
        {
            id: 'documents',
            icon: FileText,
            title: 'Important Documents',
            description: 'Death certificate, will, and legal documents',
            link: '/modules/legal-documents',
            color: 'rose' as Tone
        },
        {
            id: 'contacts',
            icon: Users,
            title: 'Contact Directory',
            description: "People to let know when you're ready",
            link: '/modules/contacts',
            color: 'indigo' as Tone
        },
        {
            id: 'financial',
            icon: DollarSign,
            title: 'Financial Accounts',
            description: 'Bank accounts, investments, and assets',
            link: '/modules/financial-accounts',
            color: 'emerald' as Tone
        },
        {
            id: 'property',
            icon: Home,
            title: 'Property & Assets',
            description: 'Real estate and valuable possessions',
            link: '/modules/property',
            color: 'amber' as Tone
        },
        {
            id: 'medical',
            icon: Stethoscope,
            title: 'Medical Wishes',
            description: 'Healthcare directives and donation wishes',
            link: '/modules/medical',
            color: 'cyan' as Tone
        }
    ];

</script>

<div class="max-w-6xl mx-auto" in:fade>
    <!-- Compassionate Header -->
    <div class="mb-8">
        <div class="flex items-center gap-2 mb-2 text-muted-foreground">
            <Heart size={16} />
            <span class="text-sm font-medium">Executor Portal</span>
        </div>
        <h1 class="text-3xl font-serif font-bold text-foreground mb-3">
            We're here to help
        </h1>
        <p class="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            {#if deceasedName}
                You're gathering information about {deceasedName}'s estate. Take your time. We've organized everything you need in one place.
            {:else}
                You're gathering information about their estate. Take your time. We've organized everything you need in one place.
            {/if}
        </p>
    </div>

    <!-- Progress Tracker -->
    <div class="mb-8">
        <ExecutorProgressTracker />
    </div>

    <!-- Support Resources Banner -->
    <div class="mb-8">
        <SupportResources />
    </div>

    <!-- Essential Areas Grid -->
    <div class="mb-6">
        <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock size={20} class="text-info" />
            Essential Areas
        </h2>
        <p class="text-sm text-muted-foreground mb-6">
            These areas may help most first. Everything else can wait until you're ready.
        </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {#each essentialModules as module, i}
            {@const Icon = module.icon}
            {@const tone = TONES[module.color]}
            {@const steps = stepsFor(module.link)}
            {@const score = steps.pct}
            {@const isStarted = score > 0}

            <a
                href={module.link}
                class="group relative p-6 rounded-2xl bg-card/40 border border-border/50
                       {tone.borderStrong} hover:bg-card/60
                       transition-all duration-300"
                in:fly={{ y: 20, duration: 500, delay: i * 100 }}
            >
                <!-- Status Indicator -->
                <div class="absolute top-4 right-4">
                    {#if score >= 80}
                        <div class="w-3 h-3 rounded-full bg-success shadow-[0_0_10px_color-mix(in_srgb,var(--color-success)_50%,transparent)]"></div>
                    {:else if isStarted}
                        <div class="w-3 h-3 rounded-full bg-warning shadow-[0_0_10px_color-mix(in_srgb,var(--color-warning)_50%,transparent)]"></div>
                    {:else}
                        <div class="w-3 h-3 rounded-full bg-muted-foreground/40"></div>
                    {/if}
                </div>

                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 rounded-xl {tone.tile} flex items-center justify-center {tone.icon} group-hover:scale-110 transition-transform">
                        <Icon size={24} />
                    </div>

                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-foreground mb-1">
                            {module.title}
                        </h3>
                        <p class="text-sm text-muted-foreground mb-3">
                            {module.description}
                        </p>

                        {#if isStarted}
                            <div class="flex items-center gap-2 text-xs {tone.icon}">
                                <div class="w-full max-w-[120px] h-1.5 bg-border rounded-full overflow-hidden">
                                    <div
                                        class="h-full {tone.bar} transition-all duration-500"
                                        style="width: {score}%"
                                    ></div>
                                </div>
                                <span class="whitespace-nowrap">{steps.done} of {steps.total} steps</span>
                            </div>
                        {/if}
                    </div>
                </div>
            </a>
        {/each}
    </div>

    <!-- Gentle CTA for Additional Resources -->
    <div class="mt-12 p-6 rounded-2xl bg-info/10 border border-info/20">
        <h3 class="text-lg font-semibold text-foreground mb-2">
            Explore more, whenever you like
        </h3>
        <p class="text-muted-foreground mb-4">
            Beyond these essentials, there are many other modules available—but only when you're ready.
            Rest with what matters most right now.
        </p>
        <a
            href="/catalog"
            class="inline-flex items-center gap-2 text-info hover:text-foreground font-medium transition-colors"
        >
            View all modules
            <span aria-hidden="true">→</span>
        </a>
    </div>
</div>
