<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { X } from "lucide-svelte";
    import { fade, scale } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import { focusTrap } from "$lib/actions/focusTrap";

    let {
        title = "",
        description = "",
        open = $bindable(false),
        maxWidth = "max-w-md",
        onClose,
        children,
    } = $props<{
        title?: string;
        description?: string;
        open: boolean;
        maxWidth?: string;
        onClose?: () => void;
        children?: import("svelte").Snippet;
    }>();

    const uid = $props.id();
    const dispatch = createEventDispatcher();

    function close() {
        dispatch("close");
        onClose?.();
        open = false;
    }

    // Lock body scroll while open.
    $effect(() => {
        if (!open || typeof document === "undefined") return;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    });
</script>

{#if open}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 focus:outline-none"
        role="dialog"
        aria-modal="true"
        use:focusTrap={{ onEscape: close }}
        aria-labelledby={title ? `${uid}-title` : undefined}
        aria-describedby={description ? `${uid}-desc` : undefined}
    >
        <!-- Backdrop: a pointer shortcut only; keyboard users have Escape and the Close button. -->
        <div
            class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            transition:fade={{ duration: 200 }}
            onclick={close}
            role="presentation"
        ></div>

        <!-- Panel -->
        <div
            class="relative w-full {maxWidth} bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/5 overflow-hidden flex flex-col max-h-[90vh]"
            transition:scale={{ duration: 250, start: 0.95, easing: cubicOut }}
        >
            <!-- Header -->
            <div
                class="flex items-start justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10"
            >
                <div class="flex-1 pr-4">
                    {#if title}
                        <h2 id="{uid}-title" class="{description ? 'font-serif font-bold text-xl' : 'text-lg font-semibold'} text-slate-800">{title}</h2>
                    {/if}
                    {#if description}
                        <p id="{uid}-desc" class="text-slate-500 text-sm mt-2 leading-relaxed">{description}</p>
                    {/if}
                </div>
                <button
                    type="button"
                    class="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
                    onclick={close}
                    aria-label="Close"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>

            <!-- Content -->
            <div class="p-6 overflow-y-auto custom-scrollbar">
                {@render children?.()}
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
