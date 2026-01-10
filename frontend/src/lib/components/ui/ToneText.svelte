<script lang="ts">
    import { toneStore } from "$lib/stores/toneStore";
    import { fade } from "svelte/transition";

    export let planning: string;
    export let grief: string | undefined = undefined;
    export let executor: string | undefined = undefined;

    $: activeText = getActiveText($toneStore.mode);

    function getActiveText(mode: string) {
        switch (mode) {
            case "grief":
                return grief || planning;
            case "executor":
                return executor || planning;
            default:
                return planning;
        }
    }
</script>

<span in:fade={{ duration: 300 }} class="tone-text-wrapper inline-block">
    {activeText}
</span>
