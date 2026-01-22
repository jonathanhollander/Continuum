<script lang="ts">
    /**
     * Executor Progress Tracker
     *
     * Shows estate settlement progress with gentle, grief-aware messaging
     */

    import { CheckCircle2, Circle } from 'lucide-svelte';
    import { fade } from 'svelte/transition';

    interface Props {
        completion?: number;
    }

    let { completion = 0 }: Props = $props();

    let statusMessage = $derived(() => {
        if (completion === 0) {
            return "You're just getting started. Take it one step at a time.";
        } else if (completion < 30) {
            return "You've begun gathering information. That's a meaningful first step.";
        } else if (completion < 60) {
            return "You're making steady progress. Remember to take breaks when you need them.";
        } else if (completion < 90) {
            return "Most of the essential information has been documented. You're doing well.";
        } else {
            return "The estate profile is comprehensive. You've done important work here.";
        }
    });

    let statusColor = $derived(() => {
        if (completion < 30) return 'slate';
        if (completion < 60) return 'amber';
        if (completion < 90) return 'indigo';
        return 'emerald';
    });
</script>

<div class="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50" in:fade>
    <div class="flex items-start justify-between mb-4">
        <div>
            <h3 class="text-lg font-semibold text-white mb-1">
                Estate Settlement Progress
            </h3>
            <p class="text-sm text-slate-400">
                {statusMessage()}
            </p>
        </div>
        <div class="text-3xl font-bold text-{statusColor()}-400">
            {completion}%
        </div>
    </div>

    <!-- Progress Bar -->
    <div class="relative w-full h-3 bg-slate-700 rounded-full overflow-hidden mb-4">
        <div
            class="absolute inset-y-0 left-0 bg-gradient-to-r from-{statusColor()}-500 to-{statusColor()}-400
                   transition-all duration-700 ease-out rounded-full"
            style="width: {completion}%"
        ></div>
        <!-- Gentle pulse animation for active progress -->
        {#if completion > 0 && completion < 100}
            <div
                class="absolute inset-y-0 left-0 bg-{statusColor()}-400/30 rounded-full animate-pulse"
                style="width: {completion}%"
            ></div>
        {/if}
    </div>

    <!-- Phase Indicators (simplified to 4 key milestones) -->
    <div class="grid grid-cols-4 gap-2 text-xs">
        <div class="flex flex-col items-center gap-1">
            {#if completion >= 25}
                <CheckCircle2 size={16} class="text-emerald-400" />
            {:else}
                <Circle size={16} class="text-slate-600" />
            {/if}
            <span class="text-slate-400 text-center">Initial Documentation</span>
        </div>

        <div class="flex flex-col items-center gap-1">
            {#if completion >= 50}
                <CheckCircle2 size={16} class="text-emerald-400" />
            {:else}
                <Circle size={16} class="text-slate-600" />
            {/if}
            <span class="text-slate-400 text-center">Contact Network</span>
        </div>

        <div class="flex flex-col items-center gap-1">
            {#if completion >= 75}
                <CheckCircle2 size={16} class="text-emerald-400" />
            {:else}
                <Circle size={16} class="text-slate-600" />
            {/if}
            <span class="text-slate-400 text-center">Asset Inventory</span>
        </div>

        <div class="flex flex-col items-center gap-1">
            {#if completion >= 100}
                <CheckCircle2 size={16} class="text-emerald-400" />
            {:else}
                <Circle size={16} class="text-slate-600" />
            {/if}
            <span class="text-slate-400 text-center">Complete Profile</span>
        </div>
    </div>
</div>
