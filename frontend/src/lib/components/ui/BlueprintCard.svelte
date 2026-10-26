<script lang="ts">
    import { Clock, CheckCircle2, Circle, ArrowRight } from "lucide-svelte";
    import { slide } from "svelte/transition";

    let {
        title, // "Establish Key Medical Contacts"
        description, // "Your estate needs to know who to call in an emergency."
        timeEstimate = "5 mins",
        steps = [],
    }: {
        title: string;
        description: string;
        timeEstimate?: string;
        steps?: { label: string; completed: boolean }[];
    } = $props();

    // Computed Progress
    let completedCount = $derived(steps.filter((s) => s.completed).length);
    let progressPercent = $derived(
        steps.length > 0 ? (completedCount / steps.length) * 100 : 0,
    );
    let isComplete = $derived(
        steps.length > 0 && completedCount === steps.length,
    );

    let expanded = $state(true);
</script>

<div
    class="bg-card rounded-2xl border border-border shadow-sm overflow-hidden mb-8 transition-all duration-500 {!isComplete
        ? 'ring-2 ring-primary/10'
        : ''}"
>
    <!-- Header -->
    <div
        class="bg-muted/80 p-4 border-b border-border flex justify-between items-center cursor-pointer hover:bg-muted transition-colors"
        role="button"
        tabindex="0"
        onclick={() => (expanded = !expanded)}
        onkeydown={(e) => {
            if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                expanded = !expanded;
            }
        }}
    >
        <div class="flex items-center gap-3">
            <div
                class="flex items-center justify-center w-8 h-8 rounded-full {isComplete
                    ? 'bg-success/10 text-success'
                    : 'bg-primary-soft text-primary-hover'}"
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
                    class="font-bold text-foreground text-sm uppercase tracking-wide"
                >
                    Blueprint: {title}
                </h3>
                {#if !expanded && !isComplete}
                    <p class="text-xs text-muted-foreground truncate max-w-md">
                        {description}
                    </p>
                {/if}
            </div>
        </div>

        <div class="flex items-center gap-4">
            {#if !isComplete}
                <div
                    class="hidden sm:flex items-center gap-1 text-xs font-medium text-muted-foreground bg-card px-2 py-1 rounded-md border border-border"
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
                    class="text-muted-foreground"><path d="m6 9 6 6 6-6" /></svg
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
                        class="font-serif text-2xl text-foreground font-medium leading-tight"
                    >
                        {description}
                    </h2>
                    <p class="text-muted-foreground text-sm leading-relaxed">
                        Completing this blueprint ensures your estate is
                        prepared. Follow the steps on the right to reach 100%.
                    </p>
                </div>

                <!-- Right: Steps -->
                <div class="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {#each steps as step, i}
                        <div
                            class="flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 {step.completed
                                ? 'bg-success/5 border-success/20'
                                : 'bg-card border-border hover:border-primary/30'}"
                        >
                            <div class="shrink-0">
                                {#if step.completed}
                                    <CheckCircle2
                                        class="text-success"
                                        size={20}
                                    />
                                {:else}
                                    <Circle class="text-muted-foreground" size={20} />
                                {/if}
                            </div>
                            <span
                                class="text-sm font-medium {step.completed
                                    ? 'text-muted-foreground line-through'
                                    : 'text-foreground'}"
                            >
                                {step.label}
                            </span>
                        </div>
                    {/each}
                </div>
            </div>
        </div>

        <!-- Progress Bar (Bottom) -->
        <div class="h-1 bg-muted w-full">
            <div
                class="h-full {isComplete
                    ? 'bg-success'
                    : 'bg-primary'} transition-all duration-1000 ease-out"
                style="width: {progressPercent}%"
            ></div>
        </div>
    {/if}
</div>
