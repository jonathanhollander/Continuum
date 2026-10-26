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
        Easy: "bg-success/10 text-success",
        Medium: "bg-warning-soft text-warning",
        Hard: "bg-muted text-foreground",
    };
</script>

<div
    class="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
>
    <!-- Main Row -->
    <button
        type="button"
        class="w-full text-left p-4 pr-24 flex items-center justify-between cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
        aria-expanded={expanded}
        onclick={() => (expanded = !expanded)}
    >
        <div class="flex items-center gap-4">
            <!-- Icon placeholder or logo -->
            <div
                class="w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center text-primary-hover font-bold shrink-0"
            >
                {sub.name.charAt(0)}
            </div>

            <div>
                <h3 class="font-bold text-foreground flex items-center gap-2">
                    {sub.name}
                    {#if sub.auto_renew === false}
                        <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground">Closed</span>
                    {/if}
                </h3>
                <div class="flex items-center gap-2 text-xs text-muted-foreground">
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
                <div class="font-bold text-foreground">
                    {formatMoney(sub.cost)}
                </div>
                <div class="text-xs text-muted-foreground uppercase tracking-wide">
                    /{sub.cycle}
                </div>
            </div>

            {#if sub.difficulty}
                <span
                    class="px-2.5 py-1 rounded-full text-xs font-bold {difficultyColors[
                        sub.difficulty
                    ] || 'bg-muted text-muted-foreground'}"
                >
                    {sub.difficulty} to close
                </span>
            {/if}
        </div>
    </button>

    <!-- Cancellation Guide (Expanded) -->
    {#if expanded}
        <div
            class="border-t border-border bg-background/50 p-4"
            transition:slide
        >
            <div class="flex items-start gap-4">
                <div class="p-2 bg-muted text-muted-foreground rounded-lg shrink-0">
                    <CircleX class="w-5 h-5" />
                </div>
                <div class="flex-1 space-y-3">
                    {#if sub.cancellationInstructions}
                        <div>
                            <h4
                                class="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1"
                            >
                                Steps to close this subscription
                            </h4>
                            <p class="text-sm text-foreground leading-relaxed">
                                {sub.cancellationInstructions}
                            </p>
                        </div>
                    {/if}

                    {#if sub.loginUrl}
                        <a
                            href={sub.loginUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover hover:underline"
                        >
                            <ExternalLink class="w-4 h-4" />
                            Open the account page
                        </a>
                    {/if}

                    {#if sub.notes}
                        <div
                            class="text-xs text-muted-foreground italic bg-card p-2 rounded border border-border"
                        >
                            Note: {sub.notes}
                        </div>
                    {/if}

                    <div class="pt-4 border-t border-border flex gap-3">
                        <button
                            onclick={onGenerateLetter}
                            class="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                        >
                            <CreditCard size={14} />
                            Prepare a letter for me
                        </button>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>
