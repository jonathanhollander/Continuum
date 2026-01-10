<script lang="ts">
    import { RefreshCw } from "lucide-svelte";

    export let onRefresh: () => void;
    export let label: string = "Refresh";
    export let size: number = 16;

    let isSpinning = false;

    function handleClick() {
        isSpinning = true;
        onRefresh();
        setTimeout(() => {
            isSpinning = false;
        }, 500);
    }
</script>

<button
    on:click={handleClick}
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
