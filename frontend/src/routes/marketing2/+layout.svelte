<script lang="ts">
    import { onNavigate } from "$app/navigation";
    import { fade } from "svelte/transition";
    import { cubicOut } from "svelte/easing";

    let { children } = $props();

    // Page transition with View Transitions API fallback
    onNavigate((navigation) => {
        // Check if View Transitions API is supported
        if (!document.startViewTransition) return;

        return new Promise((resolve) => {
            document.startViewTransition(async () => {
                resolve();
                await navigation.complete;
            });
        });
    });
</script>

<!-- Global styles for View Transitions -->
<svelte:head>
    <style>
        /* View Transition animations */
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes fade-out {
            from { opacity: 1; }
            to { opacity: 0; }
        }

        @keyframes slide-from-right {
            from { transform: translateX(30px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        @keyframes slide-to-left {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(-30px); opacity: 0; }
        }

        ::view-transition-old(root) {
            animation: 300ms cubic-bezier(0.4, 0, 0.2, 1) both fade-out,
                       300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-to-left;
        }

        ::view-transition-new(root) {
            animation: 300ms cubic-bezier(0.4, 0, 0.2, 1) both fade-in,
                       300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-from-right;
        }

        /* Reduce motion if preferred */
        @media (prefers-reduced-motion: reduce) {
            ::view-transition-old(root),
            ::view-transition-new(root) {
                animation: none;
            }
        }
    </style>
</svelte:head>

<div class="page-wrapper" in:fade={{ duration: 200, easing: cubicOut }}>
    {@render children()}
</div>

<style>
    .page-wrapper {
        min-height: 100vh;
    }
</style>
