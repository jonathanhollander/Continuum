<script lang="ts">
    import { toneStore } from "$lib/stores/toneStore.svelte";
    import { fade } from "svelte/transition";

    let { planning, grief, executor } = $props<{
        planning: string;
        grief?: string;
        executor?: string;
    }>();

    let activeText = $derived.by(() => {
        const mode = toneStore.mode;
        switch (mode) {
            case "grief":
                return grief || planning;
            case "executor":
                return executor || planning;
            default:
                return planning;
        }
    });
</script>

<span in:fade={{ duration: 300 }} class="tone-text-wrapper inline-block">
    {activeText}
</span>
