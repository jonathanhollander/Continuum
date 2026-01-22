<script lang="ts">
    import { affirmations, type Affirmation } from '$lib/data/affirmations';
    import { fade } from 'svelte/transition';

    interface Props {
        module?: keyof typeof affirmations;
        show?: boolean;
    }

    let { module = 'general', show = $bindable(false) }: Props = $props();

    let currentAffirmation = $state<Affirmation>(affirmations[module][0]);

    // Pick a random affirmation when component shows
    $effect(() => {
        if (show) {
            const moduleAffirmations = affirmations[module];
            const randomIndex = Math.floor(Math.random() * moduleAffirmations.length);
            currentAffirmation = moduleAffirmations[randomIndex];

            // Auto-dismiss after 4 seconds
            const timeout = setTimeout(() => {
                show = false;
            }, 4000);

            return () => clearTimeout(timeout);
        }
    });
</script>

{#if show}
    <div
        class="affirmation"
        transition:fade={{ duration: 300 }}
        role="status"
        aria-live="polite"
    >
        <p class="primary">{currentAffirmation.primary}</p>
        <p class="secondary">{currentAffirmation.secondary}</p>
    </div>
{/if}

<style>
    .affirmation {
        background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
        border: 1px solid #86efac;
        padding: 1rem 1.25rem;
        border-radius: 12px;
        margin: 1rem 0;
        box-shadow: 0 2px 8px rgba(34, 197, 94, 0.1);
        animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .primary {
        font-weight: 600;
        font-size: 1rem;
        color: #166534;
        margin: 0 0 0.25rem 0;
        line-height: 1.4;
    }

    .secondary {
        font-size: 0.875rem;
        color: #15803d;
        margin: 0;
        line-height: 1.4;
        opacity: 0.9;
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
        .affirmation {
            background: linear-gradient(135deg, #064e3b 0%, #047857 100%);
            border-color: #10b981;
        }

        .primary {
            color: #d1fae5;
        }

        .secondary {
            color: #a7f3d0;
        }
    }
</style>
