<script lang="ts">
    /**
     * Support Resources Component
     *
     * Provides grief support and encouragement for executors
     */

    import { Heart, ExternalLink, Phone, Book } from 'lucide-svelte';
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
            link: '/modules/executor-toolkit',
            external: false
        }
    ];
</script>

<div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500/10 to-purple-500/10 border border-rose-500/20" in:fade>
    <div class="p-6">
        <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                <Heart size={20} class="text-rose-400" />
            </div>

            <div class="flex-1">
                <h3 class="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    Support is here for you
                </h3>
                <p class="text-slate-300 text-sm mb-4">
                    Managing an estate while grieving is hard work. You can lean on others,
                    and take breaks whenever you need them.
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
                        {/each}

                        <!-- Crisis Support -->
                        <div class="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                            <p class="text-xs text-slate-300">
                                <strong class="text-rose-400">If you need someone right now,</strong> 988 Suicide &amp; Crisis Lifeline, call or text
                                <a href="tel:988" class="underline hover:text-white transition-colors">988</a>
                            </p>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
