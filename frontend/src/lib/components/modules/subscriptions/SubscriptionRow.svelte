<script lang="ts">
    import {
        CreditCard,
        Calendar,
        CircleAlert,
        ExternalLink,
        CircleX,
    } from "lucide-svelte";
    import { slide } from "svelte/transition";
    import { dateWords } from "$lib/utils/dateWords";
    import { formatMoney } from "$lib/utils/money";

    let {
        sub,
        onGenerateLetter,
    }: { sub: Record<string, any>; onGenerateLetter: () => void } = $props();

    let expanded = $state(false);

    // The renewal day, only when one is written down (an empty value once read as 12/31/1969).
    let nextDate = $derived.by(() => {
        const raw = String(sub.nextBilling || sub.renewal_date || sub.renewalDate || "").trim();
        if (!raw) return "";
        const shown = dateWords(raw); // ISO dates in words, without a time zone shift
        if (shown !== raw) return shown;
        const d = new Date(raw);
        return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString();
    });

    // Difficulty colors
    const difficultyColors: Record<string, string> = {
        Easy: "bg-emerald-100 text-emerald-700",
        Medium: "bg-amber-100 text-amber-700",
        Hard: "bg-red-100 text-red-700",
    };
</script>

<div
    class="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
>
    <!-- Main Row -->
    <button
        type="button"
        class="w-full text-left p-4 flex items-center justify-between cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
        aria-expanded={expanded}
        onclick={() => (expanded = !expanded)}
    >
        <div class="flex items-center gap-4">
            <!-- Icon placeholder or logo -->
            <div
                class="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold shrink-0"
            >
                {sub.name.charAt(0)}
            </div>

            <div>
                <h3 class="font-bold text-slate-800">{sub.name}</h3>
                <div class="flex items-center gap-2 text-xs text-slate-500">
                    {#if sub.paymentMethod}
                        <CreditCard class="w-3 h-3" />
                        <span>{sub.paymentMethod}</span>
                    {/if}
                    {#if nextDate}
                        {#if sub.paymentMethod}<span>•</span>{/if}
                        <Calendar class="w-3 h-3" />
                        <span>Next: {nextDate}</span>
                    {/if}
                </div>
            </div>
        </div>

        <div class="flex items-center gap-6">
            <div class="text-right hidden sm:block">
                <div class="font-bold text-slate-800">
                    {formatMoney(sub.cost)}
                </div>
                <div class="text-xs text-slate-500 uppercase tracking-wide">
                    /{sub.cycle}
                </div>
            </div>

            {#if sub.difficulty}
                <span
                    class="px-2.5 py-1 rounded-full text-xs font-bold {difficultyColors[
                        sub.difficulty
                    ] || 'bg-slate-100 text-slate-600'}"
                >
                    {sub.difficulty} Cancel
                </span>
            {/if}
        </div>
    </button>

    <!-- Cancellation Guide (Expanded) -->
    {#if expanded}
        <div
            class="border-t border-slate-100 bg-slate-50/50 p-4"
            transition:slide
        >
            <div class="flex items-start gap-4">
                <div class="p-2 bg-red-50 text-red-600 rounded-lg shrink-0">
                    <CircleX class="w-5 h-5" />
                </div>
                <div class="flex-1 space-y-3">
                    <div>
                        <h4
                            class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1"
                        >
                            Cancellation Protocol
                        </h4>
                        <p class="text-sm text-slate-700 leading-relaxed">
                            {sub.cancellationInstructions}
                        </p>
                    </div>

                    {#if sub.loginUrl}
                        <a
                            href={sub.loginUrl}
                            target="_blank"
                            class="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                        >
                            <ExternalLink class="w-4 h-4" />
                            Go to Account Management
                        </a>
                    {/if}

                    {#if sub.notes}
                        <div
                            class="text-xs text-slate-500 italic bg-white p-2 rounded border border-slate-100"
                        >
                            Note: {sub.notes}
                        </div>
                    {/if}

                    <div class="pt-4 border-t border-slate-100 flex gap-3">
                        <button
                            onclick={onGenerateLetter}
                            class="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                        >
                            <CreditCard size={14} />
                            Generate Formal Letter
                        </button>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>
