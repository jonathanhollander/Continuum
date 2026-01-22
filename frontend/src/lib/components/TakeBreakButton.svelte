<script lang="ts">
    /**
     * Manual "Take a Break" button for users who need explicit control.
     * Can be placed in emotionally heavy pages or the main header.
     */
    import { overwhelmDetector } from "$lib/services/overwhelmDetection";
    import { Pause } from "lucide-svelte";

    interface Props {
        variant?: "primary" | "subtle" | "icon-only";
    }

    let { variant = "subtle" }: Props = $props();

    function handleClick() {
        overwhelmDetector.requestBreak();
    }
</script>

{#if variant === "icon-only"}
    <button
        onclick={handleClick}
        class="p-2 text-zinc-500 hover:text-teal-600 dark:text-zinc-400 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
        title="Take a mindful break"
        aria-label="Take a mindful break"
    >
        <Pause class="w-5 h-5" />
    </button>
{:else if variant === "primary"}
    <button
        onclick={handleClick}
        class="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium"
    >
        <Pause class="w-4 h-4" />
        Take a break
    </button>
{:else}
    <!-- subtle variant (default) -->
    <button
        onclick={handleClick}
        class="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
    >
        <Pause class="w-4 h-4" />
        <span class="hidden sm:inline">Take a break</span>
    </button>
{/if}
