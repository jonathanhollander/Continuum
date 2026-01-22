<script lang="ts">
    import { RefreshCw } from "lucide-svelte";

    let {
        onrefresh,
        label = "Refresh",
        size = 16,
    } = $props<{
        onrefresh: () => void;
        label?: string;
        size?: number;
    }>();

    let isSpinning = $state(false);

    function handleClick() {
        isSpinning = true;
        onrefresh();
        setTimeout(() => {
            isSpinning = false;
        }, 500);
    }
</script>

<button
    onclick={handleClick}
    class="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-400 hover:text-[#4A7C74] transition-colors"
    title="Get a new question"
>
    <RefreshCw
        {size}
        class="transition-transform duration-500 {isSpinning
            ? 'rotate-180'
            : 'group-hover:rotate-45'}"
    />
    <span class="group-hover:underline decoration-stone-200 underline-offset-4"
        >{label}</span
    >
</button>
