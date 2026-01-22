<script lang="ts">
    /**
     * ContextualMessage Component
     *
     * Displays context-aware messages that adapt based on user role and emotional state.
     * Use this component instead of hardcoded text for user-facing content.
     */

    import { getContextualMessage, type MessageVariants } from '$lib/utils/contextualMessages';

    interface Props {
        variants: {
            planning: string;
            executor: string;
            family: string;
            advisor?: string;
        };
        class?: string;
    }

    let { variants, class: className = '' }: Props = $props();

    // Get the appropriate message for current context
    let message = $derived(getContextualMessage(variants));
</script>

<span class={className}>
    {message}
</span>
