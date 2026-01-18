<script lang="ts">
    import ConciergePanel from "$lib/components/layout/ConciergePanel.svelte";
    import { onMount } from "svelte";
    import { conciergeEngine } from "$lib/stores/conciergeEngine";

    onMount(() => {
        // Ensure the concierge is "open" in this window's state
        conciergeEngine.open();

        // Signify to the main window that we are active
        const channel = new BroadcastChannel("continuum-concierge");
        channel.postMessage({ type: "POPUP_OPENED" });

        window.addEventListener("beforeunload", () => {
            channel.postMessage({ type: "POPUP_CLOSED" });
            channel.close();
        });

        return () => {
            channel.close();
        };
    });
</script>

<div class="h-screen w-screen bg-slate-950 overflow-hidden relative">
    <div
        class="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent opacity-50"
    ></div>

    <!-- Render the ConciergePanel in full-screen mode -->
    <ConciergePanel isPoppedOut={true} />
</div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        overflow: hidden;
    }
</style>
