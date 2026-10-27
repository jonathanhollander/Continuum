<script lang="ts">
    import { RefreshCw } from "lucide-svelte";

    let {
        onrefresh,
        onRefresh,
        label = "Refresh",
        size = 16,
    } = $props<{
        onrefresh?: () => void;
        onRefresh?: () => void;
        label?: string;
        size?: number;
    }>();

    let isSpinning = $state(false);

    function handleClick() {
        isSpinning = true;
        (onrefresh ?? onRefresh)?.();
        setTimeout(() => {
            isSpinning = false;
        }, 500);
    }
</script>

<button
    onclick={handleClick}
    class="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
    title="Get a new question"
>
    <RefreshCw
        {size}
        class="transition-transform duration-500 {isSpinning
            ? 'rotate-180'
            : 'group-hover:rotate-45'}"
    />
    <span class="group-hover:underline decoration-border underline-offset-4"
        >{label}</span
    >
</button>
