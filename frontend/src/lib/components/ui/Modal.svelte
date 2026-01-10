<script lang="ts">
    import { createEventDispatcher, onMount, onDestroy } from "svelte";
    import { X } from "lucide-svelte";
    import { fade, scale } from "svelte/transition";
    import { cubicOut } from "svelte/easing";

    export let title: string = "";
    export let open: boolean = false;
    export let maxWidth: string = "max-w-md";

    const dispatch = createEventDispatcher();

    function close() {
        dispatch("close");
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            close();
        }
    }

    // Lock body scroll when open
    $: if (typeof document !== "undefined") {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
    >
        <!-- Backdrop -->
        <div
            class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            transition:fade={{ duration: 200 }}
            on:click={close}
        ></div>

        <!-- Panel -->
        <div
            class="relative w-full {maxWidth} bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/5 overflow-hidden flex flex-col max-h-[90vh]"
            transition:scale={{ duration: 250, start: 0.95, easing: cubicOut }}
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10"
            >
                <h2 class="text-lg font-semibold text-slate-800">{title}</h2>
                <button
                    class="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    on:click={close}
                    aria-label="Close"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>

            <!-- Content -->
            <div class="p-6 overflow-y-auto custom-scrollbar">
                <slot />
            </div>
        </div>
    </div>
{/if}

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: #e2e8f0;
        border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: #cbd5e1;
    }
</style>
