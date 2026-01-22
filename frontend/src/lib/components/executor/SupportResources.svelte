<script lang="ts">
    /**
     * Support Resources Component
     *
     * Provides grief support and encouragement for executors
     */

    import { Heart, ExternalLink, Coffee, Phone, Book } from 'lucide-svelte';
    import { fade } from 'svelte/transition';

    let isExpanded = $state(false);

    const resources = [
        {
            title: 'Grief Support Hotline',
            description: '24/7 support from trained counselors',
            icon: Phone,
            link: 'https://www.griefhelpline.org',
            external: true
        },
        {
            title: 'Executor Guidance Library',
            description: 'Step-by-step guides for estate administration',
            icon: Book,
            link: '/resources/executor-guide',
            external: false
        },
        {
            title: 'Take a Break',
            description: 'Pause notifications and reminders',
            icon: Coffee,
            action: 'pause',
            external: false
        }
    ];

    function handlePauseAction() {
        // TODO: Implement pause functionality
        console.log('Pause notifications');
    }
</script>

<div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500/10 to-purple-500/10 border border-rose-500/20" in:fade>
    <div class="p-6">
        <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                <Heart size={20} class="text-rose-400" />
            </div>

            <div class="flex-1">
                <h3 class="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    Need Support?
                </h3>
                <p class="text-slate-300 text-sm mb-4">
                    Managing an estate while grieving is difficult work. You don't have to do this alone.
                    Take breaks whenever you need them.
                </p>

                <button
                    onclick={() => isExpanded = !isExpanded}
                    class="text-sm font-medium text-rose-400 hover:text-rose-300 transition-colors"
                >
                    {isExpanded ? 'Show less' : 'View support resources →'}
                </button>

                {#if isExpanded}
                    <div class="mt-4 space-y-3" in:fade>
                        {#each resources as resource}
                            {@const Icon = resource.icon}

                            {#if resource.action === 'pause'}
                                <button
                                    onclick={handlePauseAction}
                                    class="w-full flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800/80
                                           border border-slate-700/50 hover:border-slate-600 transition-all text-left"
                                >
                                    <div class="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                        <Icon size={16} class="text-purple-400" />
                                    </div>
                                    <div class="flex-1">
                                        <div class="font-medium text-white text-sm">
                                            {resource.title}
                                        </div>
                                        <div class="text-xs text-slate-400">
                                            {resource.description}
                                        </div>
                                    </div>
                                </button>
                            {:else}
                                <a
                                    href={resource.link}
                                    target={resource.external ? '_blank' : '_self'}
                                    rel={resource.external ? 'noopener noreferrer' : ''}
                                    class="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800/80
                                           border border-slate-700/50 hover:border-slate-600 transition-all"
                                >
                                    <div class="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                        <Icon size={16} class="text-purple-400" />
                                    </div>
                                    <div class="flex-1">
                                        <div class="font-medium text-white text-sm flex items-center gap-1">
                                            {resource.title}
                                            {#if resource.external}
                                                <ExternalLink size={12} class="text-slate-500" />
                                            {/if}
                                        </div>
                                        <div class="text-xs text-slate-400">
                                            {resource.description}
                                        </div>
                                    </div>
                                </a>
                            {/if}
                        {/each}

                        <!-- Crisis Support -->
                        <div class="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                            <p class="text-xs text-slate-300">
                                <strong class="text-rose-400">In crisis?</strong> National Suicide Prevention Lifeline:
                                <a href="tel:988" class="underline hover:text-white transition-colors">988</a>
                            </p>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
