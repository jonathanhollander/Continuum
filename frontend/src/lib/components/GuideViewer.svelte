<script lang="ts">
    import { focusTrap } from "$lib/actions/focusTrap";
    import { fade, fly } from "svelte/transition";
    import { LucideX, LucideHeart, LucideChevronRight } from "lucide-svelte";
    import type { Guide } from "$lib/data/familyGuides";

    interface Props {
        guide: Guide | null;
        onClose: () => void;
    }

    let { guide, onClose }: Props = $props();

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            onClose();
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if guide}
    <!-- Clicking the dimmed area closes the guide; Escape does the same through the window handler. -->
    <!-- svelte-ignore a11y_interactive_supports_focus, a11y_click_events_have_key_events -->
    <div use:focusTrap
        class="surface-dark fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
        transition:fade={{ duration: 200 }}
        onclick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
    >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"></div>

        <!-- Modal Content -->
        <div
            class="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border border-white/10 shadow-2xl"
            transition:fly={{ y: 20, duration: 300 }}
        >
            <!-- Header -->
            <div class="sticky top-0 z-10 px-8 py-6 bg-slate-900/95 backdrop-blur-xl border-b border-white/10">
                <div class="flex items-start justify-between gap-4">
                    <div class="flex items-start gap-4">
                        <div class="w-12 h-12 rounded-2xl bg-primary-soft flex items-center justify-center border border-primary/20 shrink-0">
                            <LucideHeart class="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 id="guide-title" class="text-2xl font-serif font-medium text-foreground">
                                {guide.title}
                            </h2>
                            <p class="text-sm text-muted-foreground mt-1">
                                {guide.subtitle}
                            </p>
                        </div>
                    </div>
                    <button
                        onclick={onClose}
                        class="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                        aria-label="Close guide"
                    >
                        <LucideX class="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>
            </div>

            <!-- Scrollable Content -->
            <div class="overflow-y-auto max-h-[calc(90vh-120px)] px-8 py-8 space-y-8">
                <!-- Introduction -->
                <div class="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <p class="text-foreground/90 leading-relaxed italic">
                        {guide.introduction}
                    </p>
                </div>

                <!-- Sections -->
                {#each guide.sections as section, i}
                    <div class="space-y-4">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-primary-soft flex items-center justify-center text-primary-hover text-sm font-medium">
                                {i + 1}
                            </div>
                            <h3 class="text-xl font-medium text-foreground">
                                {section.title}
                            </h3>
                        </div>
                        <div class="pl-11 prose prose-invert prose-slate max-w-none">
                            {#each section.content.split('\n\n') as paragraph}
                                {#if paragraph.startsWith('**') && paragraph.includes('**:')}
                                    <!-- Bold heading with content -->
                                    {@const [heading, ...rest] = paragraph.split(':')}
                                    <p class="mb-2">
                                        <strong class="text-foreground">{heading.replace(/\*\*/g, '')}:</strong>
                                        {rest.join(':')}
                                    </p>
                                {:else if paragraph.startsWith('\"') || paragraph.startsWith('"')}
                                    <!-- Quote -->
                                    <blockquote class="border-l-2 border-primary/30 pl-4 my-4 text-foreground/90 italic">
                                        {paragraph}
                                    </blockquote>
                                {:else if paragraph.startsWith('-')}
                                    <!-- List -->
                                    <ul class="space-y-1 my-3">
                                        {#each paragraph.split('\n') as item}
                                            {#if item.trim().startsWith('-')}
                                                <li class="flex items-start gap-2 text-foreground/90">
                                                    <LucideChevronRight class="w-4 h-4 text-primary mt-1 shrink-0" />
                                                    <span>{item.trim().substring(1).trim()}</span>
                                                </li>
                                            {/if}
                                        {/each}
                                    </ul>
                                {:else}
                                    <p class="text-foreground/90 leading-relaxed mb-3">
                                        {paragraph}
                                    </p>
                                {/if}
                            {/each}
                        </div>
                    </div>
                {/each}

                <!-- Closing Note -->
                <div class="p-6 rounded-2xl bg-primary-soft border border-primary/20">
                    <div class="flex items-start gap-4">
                        <LucideHeart class="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <p class="text-foreground leading-relaxed">
                            {guide.closingNote}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}
