<script lang="ts">
    import { onMount } from "svelte";
    import { fly, fade } from "svelte/transition";
    import { cubicOut } from "svelte/easing";

    export let delay = 0;
    export let type: "fade" | "vault" | "blueprint" = "vault";

    let mounted = false;
    onMount(() => {
        mounted = true;
    });
</script>

{#if mounted}
    <!-- We use a wrapper div to apply the transition -->
    <div
        in:fly={{ y: 20, duration: 800, delay: delay * 1000, easing: cubicOut }}
        class={type === "blueprint"
            ? "overflow-hidden border-b border-transparent animate-blueprint"
            : ""}
    >
        <slot />
    </div>
{/if}

<style>
    /* 
       For "vault" (circular reveal), native CSS clip-path animation is best controlled via classes 
       or we stick to simple fly/fade to be safe for this "show me it working" phase.
       I'll use simple fly for now to guarantee no crashes.
    */
</style>
