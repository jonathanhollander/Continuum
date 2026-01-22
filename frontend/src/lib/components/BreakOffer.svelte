<script lang="ts">
    import { overwhelmDetector } from "$lib/services/overwhelmDetection";
    import { fade, blur } from "svelte/transition";
    import { logger } from "$lib/utils/logger";

    export let signals: string[] = [];

    function dismiss() {
        logger.info("User dismissed break offer");
        overwhelmDetector.reset();
    }

    function takeBreak() {
        logger.info("User accepted break offer");
        // In a real app, this might redirect to a 'pause' screen or just close the app
        overwhelmDetector.reset();
        window.location.href = "/"; // Go to landing page for a breath
    }
</script>

<div
    class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
    transition:fade={{ duration: 300 }}
>
    <div
        class="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center"
        transition:blur={{ duration: 400, amount: 10 }}
    >
        <div
            class="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                ><path
                    d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8Z"
                /><path d="M12 6v6l4 2" /></svg
            >
        </div>

        <h2
            class="text-2xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100 italic"
        >
            Taking a moment for yourself?
        </h2>

        <p class="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
            {#if signals.includes("rapid_navigation")}
                We noticed you've been working through many pages quickly.
            {:else if signals.includes("long_session")}
                You've been planning for quite a while today.
            {:else}
                This work can be emotionally heavy.
            {/if}
            It's okay to take a break and come back later. Your progress is safe.
        </p>

        <div class="flex flex-col gap-3">
            <button
                on:click={takeBreak}
                class="w-full py-4 bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 rounded-2xl font-medium hover:opacity-90 transition-opacity"
            >
                I'll take a breath
            </button>
            <button
                on:click={dismiss}
                class="w-full py-4 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            >
                I'm okay to continue
            </button>
        </div>
    </div>
</div>
