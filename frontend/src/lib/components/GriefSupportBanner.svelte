<script lang="ts">
    import { LucideHeart, LucideArrowRight } from "lucide-svelte";

    interface Props {
        message?: string;
        compact?: boolean;
    }

    let {
        message = "Find practical and emotional support when you need it.",
        compact = false,
    }: Props = $props();
</script>

<aside aria-label="Optional grief support" class="rounded-2xl border border-border bg-card {compact ? 'px-4 py-3' : 'p-6'}">
    <div class="flex flex-wrap items-center {compact ? 'gap-3' : 'gap-4'}">
        <LucideHeart class="text-primary shrink-0 {compact ? 'w-4 h-4' : 'w-6 h-6'}" />
        <div class="flex-1 min-w-48">
            <h4 class="font-semibold text-foreground {compact ? 'text-sm' : 'text-base'}">Grief support</h4>
            <p class="text-muted-foreground text-sm {compact ? '' : 'mt-1'}">{message}</p>
        </div>
        <a href="/resources/grief-support" class="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary-deep dark:text-primary-hover underline underline-offset-4 hover:bg-muted">
            Open grief support <LucideArrowRight class="w-4 h-4" />
        </a>
    </div>
</aside>
