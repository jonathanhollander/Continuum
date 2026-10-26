<script lang="ts" module>
    import { executorTasks } from '$lib/data/executorTasks';
    import { executorSteps, STEP_RECORDS } from '$lib/stores/executorStepsStore.svelte';

    /**
     * Tailwind only builds classes it sees written out in full, so every colour an executor
     * surface uses is spelled out here (a class built from a string at runtime gets no style).
     */
    export const TONES = {
        rose: { tile: 'bg-rose-500/10', icon: 'text-rose-400', bar: 'bg-rose-500', border: 'hover:border-rose-500/30', borderStrong: 'hover:border-rose-500/50', link: 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' },
        indigo: { tile: 'bg-indigo-500/10', icon: 'text-indigo-400', bar: 'bg-indigo-500', border: 'hover:border-indigo-500/30', borderStrong: 'hover:border-indigo-500/50', link: 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30' },
        emerald: { tile: 'bg-emerald-500/10', icon: 'text-emerald-400', bar: 'bg-emerald-500', border: 'hover:border-emerald-500/30', borderStrong: 'hover:border-emerald-500/50', link: 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' },
        amber: { tile: 'bg-amber-500/10', icon: 'text-amber-400', bar: 'bg-amber-500', border: 'hover:border-amber-500/30', borderStrong: 'hover:border-amber-500/50', link: 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' },
        cyan: { tile: 'bg-cyan-500/10', icon: 'text-cyan-400', bar: 'bg-cyan-500', border: 'hover:border-cyan-500/30', borderStrong: 'hover:border-cyan-500/50', link: 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' },
        purple: { tile: 'bg-purple-500/10', icon: 'text-purple-400', bar: 'bg-purple-500', border: 'hover:border-purple-500/30', borderStrong: 'hover:border-purple-500/50', link: 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' },
        blue: { tile: 'bg-blue-500/10', icon: 'text-blue-400', bar: 'bg-blue-500', border: 'hover:border-blue-500/30', borderStrong: 'hover:border-blue-500/50', link: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' },
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
            return "You've begun. Take it one step at a time.";
        } else if (completion < 30) {
            return "You've taken the first steps. That's meaningful.";
        } else if (completion < 60) {
            return "You're making steady progress. Remember to take breaks when you need them.";
        } else if (completion < 90) {
            return "Most of the steps are finished. You're doing well.";
        } else {
            return "You've done important work here.";
        }
    });

    const STATUS = {
        slate: { pct: 'text-slate-400', fill: 'from-slate-500 to-slate-400', pulse: 'bg-slate-400/30' },
        amber: { pct: 'text-amber-400', fill: 'from-amber-500 to-amber-400', pulse: 'bg-amber-400/30' },
        indigo: { pct: 'text-indigo-400', fill: 'from-indigo-500 to-indigo-400', pulse: 'bg-indigo-400/30' },
        emerald: { pct: 'text-emerald-400', fill: 'from-emerald-500 to-emerald-400', pulse: 'bg-emerald-400/30' },
    };

    let status = $derived(
        completion < 30 ? STATUS.slate : completion < 60 ? STATUS.amber : completion < 90 ? STATUS.indigo : STATUS.emerald
    );
</script>

<div class="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50" in:fade>
    <div class="flex items-start justify-between mb-4">
        <div>
            <h3 class="text-lg font-semibold text-white mb-1">
                Estate Settlement Progress
            </h3>
            <p class="text-sm text-slate-400">
                {statusMessage}
            </p>
        </div>
        <div class="text-3xl font-bold {status.pct}">
            {completion}%
        </div>
    </div>

    <!-- Progress Bar -->
    <div class="relative w-full h-3 bg-slate-700 rounded-full overflow-hidden mb-4">
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

    <p class="text-xs text-slate-400" data-testid="executor-steps-count">
        {progress.done} of {progress.total} steps finished in the
        <a href="/modules/executor-toolkit" class="underline hover:text-white transition-colors">Executor Guide</a>
    </p>
</div>
