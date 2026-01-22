/**
 * Form tracking utilities for overwhelm detection.
 *
 * Helps detect when users start filling out forms but abandon them,
 * which can be a signal of overwhelm or confusion.
 */

import { overwhelmDetector } from '$lib/services/overwhelmDetection';
import { logger } from './logger';

interface FormState {
    id: string;
    hasInteracted: boolean;
    startedAt: number;
}

const activeForms = new Map<string, FormState>();

/**
 * Start tracking a form. Call this when a form is rendered.
 *
 * @param formId Unique identifier for the form
 */
export function trackFormStart(formId: string) {
    activeForms.set(formId, {
        id: formId,
        hasInteracted: false,
        startedAt: Date.now()
    });

    logger.debug('Form tracking started', { formId });
}

/**
 * Mark that the user has interacted with the form.
 * Call this on first input/change event.
 *
 * @param formId Unique identifier for the form
 */
export function trackFormInteraction(formId: string) {
    const form = activeForms.get(formId);
    if (form) {
        form.hasInteracted = true;
        logger.debug('Form interaction recorded', { formId });
    }
}

/**
 * Record successful form completion.
 * Call this when form is successfully submitted.
 *
 * @param formId Unique identifier for the form
 */
export function trackFormComplete(formId: string) {
    const form = activeForms.get(formId);
    if (form) {
        const duration = Date.now() - form.startedAt;
        logger.debug('Form completed', { formId, duration });
        activeForms.delete(formId);
    }
}

/**
 * Record form abandonment.
 * Call this when user navigates away from a form they started.
 *
 * @param formId Unique identifier for the form
 */
export function trackFormAbandon(formId: string) {
    const form = activeForms.get(formId);
    if (form && form.hasInteracted) {
        // Only count as abandonment if user actually started filling it out
        const duration = Date.now() - form.startedAt;
        logger.info('Form abandoned', { formId, duration });

        overwhelmDetector.recordFormAbandonment(formId);
        activeForms.delete(formId);
    } else if (form) {
        // User didn't interact, just clean up
        activeForms.delete(formId);
    }
}

/**
 * Get currently active forms (for debugging)
 */
export function getActiveForms(): string[] {
    return Array.from(activeForms.keys());
}

/**
 * Svelte action to automatically track form lifecycle.
 *
 * Usage in a Svelte component:
 * ```svelte
 * <form use:trackForm={{ id: 'funeral-wishes', onSubmit: handleSubmit }}>
 *   <!-- form fields -->
 * </form>
 * ```
 */
export function trackForm(
    node: HTMLFormElement,
    options: { id: string; onSubmit?: (e: Event) => void }
) {
    const { id, onSubmit } = options;

    trackFormStart(id);

    // Track first interaction
    const handleInteraction = () => {
        trackFormInteraction(id);
        // Only need to track first interaction
        node.removeEventListener('input', handleInteraction);
        node.removeEventListener('change', handleInteraction);
    };

    node.addEventListener('input', handleInteraction);
    node.addEventListener('change', handleInteraction);

    // Track submission
    const handleSubmit = (e: Event) => {
        trackFormComplete(id);
        if (onSubmit) {
            onSubmit(e);
        }
    };

    node.addEventListener('submit', handleSubmit);

    // Cleanup on destroy
    return {
        destroy() {
            // If form is destroyed without submission, count as abandonment
            trackFormAbandon(id);
            node.removeEventListener('input', handleInteraction);
            node.removeEventListener('change', handleInteraction);
            node.removeEventListener('submit', handleSubmit);
        }
    };
}
