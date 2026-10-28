<script lang="ts" module>
    import { executorTasks } from '$lib/data/executorTasks';
    import { executorSteps, STEP_RECORDS } from '$lib/stores/executorStepsStore.svelte';

    /**
     * Tailwind only builds classes it sees written out in full, so every colour an executor
     * surface uses is spelled out here (a class built from a string at runtime gets no style).
     * The keys stay as the pages name them; each one reads from a V0e token, so it follows the light or dark theme
     * and keeps the person's accent. Four calm families, no alarm reds.
     */
    const PRIMARY = { tile: 'bg-primary/10', icon: 'text-primary', bar: 'bg-primary', border: 'hover:border-primary/30', borderStrong: 'hover:border-primary/50', link: 'bg-primary/20 text-primary hover:bg-primary/30' };
    const INFO = { tile: 'bg-info/10', icon: 'text-info', bar: 'bg-info', border: 'hover:border-info/30', borderStrong: 'hover:border-info/50', link: 'bg-info/20 text-info hover:bg-info/30' };
    const SUCCESS = { tile: 'bg-success/10', icon: 'text-success', bar: 'bg-success', border: 'hover:border-success/30', borderStrong: 'hover:border-success/50', link: 'bg-success/20 text-success hover:bg-success/30' };
    const GOLD = { tile: 'bg-gold-text/10', icon: 'text-gold-text', bar: 'bg-gold-text', border: 'hover:border-gold-text/30', borderStrong: 'hover:border-gold-text/50', link: 'bg-gold-text/20 text-gold-text hover:bg-gold-text/30' };
    export const TONES = {
        rose: PRIMARY,
        indigo: INFO,
        emerald: SUCCESS,
        amber: GOLD,
        cyan: PRIMARY,
        purple: INFO,
        blue: INFO,
    } as const;
    export type Tone = keyof typeof TONES;

    /** Executor Guide steps finished, overall or for the steps that lean on one record page. */
    export function stepsFor(href?: string) {
        const ids = executorTasks.map((t) => t.id).filter((id) => !href || STEP_RECORDS[id]?.href === href);
        const done = ids.filter((id) => executorSteps.isDone(id)).length;
        return { done, total: ids.length, pct: ids.length ? Math.round((done / ids.length) * 100) : 0 };
    }
</script>

<script lang="ts">
    /**
     * Executor Progress Tracker
     *
     * The Executor Guide steps finished so far (saved with the account), with gentle messaging
     */

    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';

    onMount(() => {
        executorSteps.sync();
    });

    let progress = $derived(stepsFor());
    let completion = $derived(progress.pct);

    let statusMessage = $derived.by(() => {
        if (progress.done === 0) {
            return "Mark guide steps as finished to track your work here.";
        } else if (completion < 30) {
            return "These are the guide steps you have marked finished.";
        } else if (completion < 60) {
            return "Your saved checks track work through this guide.";
        } else if (completion < 90) {
            return "Most guide steps are marked finished. Review any remaining questions.";
        } else {
            return "Review your checks and notes with the people handling the estate.";
        }
    });

    const STATUS = {
        start: { pct: 'text-muted-foreground', fill: 'from-muted-foreground to-muted-foreground', pulse: 'bg-muted-foreground/30' },
        steady: { pct: 'text-primary', fill: 'from-primary to-primary-hover', pulse: 'bg-primary/30' },
        most: { pct: 'text-info', fill: 'from-info to-primary', pulse: 'bg-info/30' },
        done: { pct: 'text-success', fill: 'from-success to-success', pulse: 'bg-success/30' },
    };

    let status = $derived(
        completion < 30 ? STATUS.start : completion < 60 ? STATUS.steady : completion < 90 ? STATUS.most : STATUS.done
    );
</script>

<div class="p-6 rounded-2xl bg-card/40 border border-border/50" in:fade>
    <div class="flex items-start justify-between mb-4">
        <div>
            <h3 class="text-lg font-semibold text-foreground mb-1">
                Executor Guide progress
            </h3>
            <p class="text-sm text-muted-foreground">
                {statusMessage}
            </p>
        </div>
        <div class="text-3xl font-bold {status.pct}">
            {completion}%
        </div>
    </div>

    <!-- Progress Bar -->
    <div class="relative w-full h-3 bg-border rounded-full overflow-hidden mb-4">
        <div
            class="absolute inset-y-0 left-0 bg-gradient-to-r {status.fill}
                   transition-all duration-700 ease-out rounded-full"
            style="width: {completion}%"
        ></div>
        <!-- Gentle pulse animation for active progress -->
        {#if completion > 0 && completion < 100}
            <div
                class="absolute inset-y-0 left-0 {status.pulse} rounded-full animate-pulse"
                style="width: {completion}%"
            ></div>
        {/if}
    </div>

    <p class="text-xs text-muted-foreground" data-testid="executor-steps-count">
        {progress.done} of {progress.total} steps finished in the
        <a href="/modules/executor-toolkit" class="underline hover:text-foreground transition-colors">Executor Guide</a>
    </p>
</div>
