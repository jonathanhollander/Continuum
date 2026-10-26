<script lang="ts">
    /**
     * Support Resources Component
     *
     * Provides grief support and encouragement for executors
     */

    import { Heart, ExternalLink, Book } from 'lucide-svelte';
    import { fade } from 'svelte/transition';

    let isExpanded = $state(false);

    const resources = [
        {
            title: 'Executor Guidance Library',
            description: 'Step-by-step guides for estate administration',
            icon: Book,
            link: '/modules/executor-toolkit',
            external: false
        }
    ];
</script>

<div class="surface-dark relative overflow-hidden rounded-2xl bg-primary/10 border border-primary/20" in:fade>
    <div class="p-6">
        <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Heart size={20} class="text-primary" />
            </div>

            <div class="flex-1">
                <h3 class="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    Support is here for you
                </h3>
                <p class="text-muted-foreground text-sm mb-4">
                    Managing an estate while grieving is hard work. You can lean on others,
                    and take breaks whenever you need them.
                </p>

                <button
                    onclick={() => isExpanded = !isExpanded}
                    class="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
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
                                class="flex items-start gap-3 p-3 rounded-xl bg-card/60 hover:bg-card
                                       border border-border/50 hover:border-muted-foreground/50 transition-all"
                            >
                                <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Icon size={16} class="text-primary" />
                                </div>
                                <div class="flex-1">
                                    <div class="font-medium text-foreground text-sm flex items-center gap-1">
                                        {resource.title}
                                        {#if resource.external}
                                            <ExternalLink size={12} class="text-muted-foreground" />
                                        {/if}
                                    </div>
                                    <div class="text-xs text-muted-foreground">
                                        {resource.description}
                                    </div>
                                </div>
                            </a>
                        {/each}

                        <!-- Crisis Support -->
                        <div class="mt-4 p-3 rounded-lg bg-warning-soft border border-warning/20">
                            <p class="text-xs text-muted-foreground">
                                <strong class="text-warning">If you need someone right now,</strong> 988 Suicide &amp; Crisis Lifeline, call or text
                                <a href="tel:988" class="underline hover:text-foreground transition-colors">988</a>
                            </p>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
