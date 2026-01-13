<script lang="ts">
    import { Clock, CheckCircle2, Circle, ArrowRight } from "lucide-svelte";
    import { slide } from "svelte/transition";

    export let title: string; // "Establish Key Medical Contacts"
    export let description: string; // "Your estate needs to know who to call in an emergency."
    export let timeEstimate: string = "5 mins";
    export let steps: { label: string; completed: boolean }[] = [];

    // Computed Progress
    $: completedCount = steps.filter((s) => s.completed).length;
    $: progressPercent =
        steps.length > 0 ? (completedCount / steps.length) * 100 : 0;
    $: isComplete = steps.length > 0 && completedCount === steps.length;

    let expanded = true;
</script>

<div
    class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8 transition-all duration-500 {!isComplete
        ? 'ring-2 ring-indigo-500/10'
        : ''}"
>
    <!-- Header -->
    <div
        class="bg-slate-50/80 p-4 border-b border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
        on:click={() => (expanded = !expanded)}
    >
        <div class="flex items-center gap-3">
            <div
                class="flex items-center justify-center w-8 h-8 rounded-full {isComplete
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-indigo-100 text-indigo-600'}"
            >
                {#if isComplete}
                    <CheckCircle2 size={18} />
                {:else}
                    <span class="text-xs font-bold"
                        >{Math.round(progressPercent)}%</span
                    >
                {/if}
            </div>
            <div>
                <h3
                    class="font-bold text-slate-800 text-sm uppercase tracking-wide"
                >
                    Blueprint: {title}
                </h3>
                {#if !expanded && !isComplete}
                    <p class="text-xs text-slate-500 truncate max-w-md">
                        {description}
                    </p>
                {/if}
            </div>
        </div>

        <div class="flex items-center gap-4">
            {#if !isComplete}
                <div
                    class="hidden sm:flex items-center gap-1 text-xs font-medium text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-200"
                >
                    <Clock size={12} />
                    {timeEstimate}
                </div>
            {/if}
            <div
                class="transition-transform duration-300 {expanded
                    ? 'rotate-180'
                    : ''}"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="text-slate-400"><path d="m6 9 6 6 6-6" /></svg
                >
            </div>
        </div>
    </div>

    <!-- Content (Collapsible) -->
    {#if expanded}
        <div class="p-6" transition:slide>
            <div class="flex flex-col md:flex-row gap-8">
                <!-- Left: Description -->
                <div class="md:w-1/3 space-y-4">
                    <h2
                        class="font-serif text-2xl text-slate-800 font-medium leading-tight"
                    >
                        {description}
                    </h2>
                    <p class="text-slate-500 text-sm leading-relaxed">
                        Completing this blueprint ensures your estate is
                        prepared. Follow the steps on the right to reach 100%.
                    </p>
                </div>

                <!-- Right: Steps -->
                <div class="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {#each steps as step, i}
                        <div
                            class="flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 {step.completed
                                ? 'bg-emerald-50/50 border-emerald-100'
                                : 'bg-white border-slate-100 hover:border-indigo-200'}"
                        >
                            <div class="shrink-0">
                                {#if step.completed}
                                    <CheckCircle2
                                        class="text-emerald-500"
                                        size={20}
                                    />
                                {:else}
                                    <Circle class="text-slate-300" size={20} />
                                {/if}
                            </div>
                            <span
                                class="text-sm font-medium {step.completed
                                    ? 'text-slate-600 line-through opacity-70'
                                    : 'text-slate-700'}"
                            >
                                {step.label}
                            </span>
                        </div>
                    {/each}
                </div>
            </div>
        </div>

        <!-- Progress Bar (Bottom) -->
        <div class="h-1 bg-slate-100 w-full">
            <div
                class="h-full {isComplete
                    ? 'bg-emerald-500'
                    : 'bg-indigo-500'} transition-all duration-1000 ease-out"
                style="width: {progressPercent}%"
            ></div>
        </div>
    {/if}
</div>
