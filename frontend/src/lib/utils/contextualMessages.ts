/**
 * Contextual Messaging Utilities
 *
 * Provides role-aware and emotionally-appropriate language variants
 * for different user contexts (planning, executor, family member, etc.)
 */

import { contextStore } from '$lib/stores/contextStore.svelte';

export type MessageVariants = {
    planning: string;
    executor: string;
    family: string;
    advisor?: string;
};

/**
 * Get the appropriate message variant based on current user role
 */
export function getContextualMessage(variants: MessageVariants): string {
    const role = contextStore.role;

    // Return role-specific variant, fallback to planning
    return variants[role] || variants.planning;
}

/**
 * Possessive pronoun: "your" vs "their" vs "the"
 */
export function possessive(): string {
    switch (contextStore.role) {
        case 'planning':
            return 'your';
        case 'executor':
        case 'advisor':
            return contextStore.deceasedName ? `${contextStore.deceasedName}'s` : 'their';
        case 'family':
            return 'the';
        default:
            return 'your';
    }
}

/**
 * Subject pronoun: "you" vs "they" vs "the family"
 */
export function subject(): string {
    switch (contextStore.role) {
        case 'planning':
            return 'you';
        case 'executor':
        case 'advisor':
            return contextStore.deceasedName || 'they';
        case 'family':
            return 'the family';
        default:
            return 'you';
    }
}

/**
 * Object pronoun: "you" vs "them"
 */
export function object(): string {
    switch (contextStore.role) {
        case 'planning':
            return 'you';
        case 'executor':
        case 'advisor':
        case 'family':
            return 'them';
        default:
            return 'you';
    }
}

/**
 * Estate reference: "your estate" vs "[name]'s estate" vs "the estate"
 */
export function estate(): string {
    switch (contextStore.role) {
        case 'planning':
            return 'your estate';
        case 'executor':
        case 'advisor':
            return contextStore.deceasedName
                ? `${contextStore.deceasedName}'s estate`
                : 'their estate';
        case 'family':
            return 'the estate';
        default:
            return 'your estate';
    }
}

/**
 * Wishes reference: "your wishes" vs "their wishes" vs "recorded wishes"
 */
export function wishes(): string {
    switch (contextStore.role) {
        case 'planning':
            return 'your wishes';
        case 'executor':
        case 'advisor':
            return contextStore.deceasedName
                ? `${contextStore.deceasedName}'s wishes`
                : 'their wishes';
        case 'family':
            return 'the recorded wishes';
        default:
            return 'your wishes';
    }
}

/**
 * Contact reference: "your contacts" vs "their contacts" vs "family contacts"
 */
export function contacts(): string {
    switch (contextStore.role) {
        case 'planning':
            return 'your contacts';
        case 'executor':
        case 'advisor':
            return contextStore.deceasedName
                ? `${contextStore.deceasedName}'s contacts`
                : 'their contacts';
        case 'family':
            return 'family contacts';
        default:
            return 'your contacts';
    }
}

/**
 * Greeting message variants
 */
export function getGreeting(): string {
    const role = contextStore.role;
    const isGrieving = contextStore.isGrieving;

    if (isGrieving && (role === 'executor' || role === 'family')) {
        return getContextualMessage({
            planning: 'Welcome back',
            executor: 'We\'re here to help',
            family: 'Take your time'
        });
    }

    return getContextualMessage({
        planning: 'Welcome back',
        executor: 'Executor Dashboard',
        family: 'Family Portal',
        advisor: 'Advisor Portal'
    });
}

/**
 * Empty state messages - compassionate and context-aware
 */
export function getEmptyStateMessage(moduleType: string): string {
    const role = contextStore.role;

    const messages: Record<string, MessageVariants> = {
        contacts: {
            planning: 'Start building your trusted circle. Add the people who matter most.',
            executor: 'No contacts have been recorded yet. You may need to gather this information from other sources.',
            family: 'Contact information hasn\'t been added yet. This will be helpful when it\'s available.'
        },
        documents: {
            planning: 'Your important documents are safe here when you\'re ready to add them.',
            executor: 'No documents have been uploaded yet. Check for physical copies or other digital storage.',
            family: 'Documents will appear here as they\'re added to the estate.'
        },
        memories: {
            planning: 'Preserve the moments that matter. Add memories when the time feels right.',
            executor: 'No memories have been recorded. This section honors their life and legacy.',
            family: 'Memories and stories can be added here to honor their life.'
        }
    };

    const variants = messages[moduleType];
    if (!variants) {
        return 'Nothing here yet. Content will appear as it\'s added.';
    }

    return getContextualMessage(variants);
}

/**
 * Action button labels - gentle and appropriate
 */
export function getActionLabel(action: string): string {
    const isGrieving = contextStore.isGrieving;

    const labels: Record<string, MessageVariants> = {
        add: {
            planning: 'Add when ready',
            executor: 'Add information',
            family: 'Contribute'
        },
        save: {
            planning: 'Save my thoughts',
            executor: 'Record information',
            family: 'Save changes'
        },
        delete: {
            planning: 'Remove this',
            executor: 'Remove entry',
            family: 'Remove this'
        },
        complete: {
            planning: 'Mark as complete',
            executor: 'Mark as resolved',
            family: 'Mark as done'
        }
    };

    const variants = labels[action];
    if (!variants) {
        return action;
    }

    const label = getContextualMessage(variants);

    // Add softer language for grieving users
    if (isGrieving && action === 'add') {
        return 'When you\'re ready';
    }

    return label;
}

/**
 * Module header descriptions
 */
export function getModuleDescription(moduleId: string): string {
    const descriptions: Record<string, MessageVariants> = {
        contacts: {
            planning: 'The people who matter most in your life and legacy',
            executor: 'Important contacts and relationships to notify or consult',
            family: 'Family and friends connected to the estate'
        },
        documents: {
            planning: 'Keep your vital documents secure and accessible',
            executor: 'Legal documents and important files for estate administration',
            family: 'Documents related to the estate and final arrangements'
        },
        medical: {
            planning: 'Your health information and care preferences',
            executor: 'Medical history and healthcare directives',
            family: 'Health information and medical preferences on file'
        },
        financial: {
            planning: 'Your financial accounts and assets overview',
            executor: 'Financial accounts and assets to be managed',
            family: 'Financial information for estate purposes'
        }
    };

    const variants = descriptions[moduleId];
    if (!variants) {
        return '';
    }

    return getContextualMessage(variants);
}

/**
 * Progress messages - encouraging and context-aware
 */
export function getProgressMessage(percentage: number): string {
    const role = contextStore.role;

    if (percentage === 0) {
        return getContextualMessage({
            planning: 'Your journey begins here. Take it one step at a time.',
            executor: 'Begin gathering information at your own pace.',
            family: 'Information will be added as it becomes available.'
        });
    }

    if (percentage < 40) {
        return getContextualMessage({
            planning: 'You\'re making meaningful progress. Every step matters.',
            executor: 'Progress is being made. Continue when you\'re able.',
            family: 'The estate profile is taking shape.'
        });
    }

    if (percentage < 80) {
        return getContextualMessage({
            planning: 'You\'re well on your way. Your effort is creating real peace of mind.',
            executor: 'Significant progress has been made. Continue as needed.',
            family: 'Most essential information has been recorded.'
        });
    }

    return getContextualMessage({
        planning: 'Your estate is well-organized. You\'ve done something truly meaningful.',
        executor: 'The estate documentation is nearly complete.',
        family: 'The estate information is comprehensive.'
    });
}

/**
 * Task completion messages - avoid pressure, acknowledge effort
 */
export function getTaskCompletionMessage(): string {
    return getContextualMessage({
        planning: 'Saved. You can continue this anytime.',
        executor: 'Information recorded. Take a break if you need one.',
        family: 'Updates saved.',
        advisor: 'Changes saved successfully.'
    });
}

/**
 * Navigation labels for executor mode
 */
export function getNavigationLabel(moduleId: string): string {
    if (!contextStore.isExecutor) {
        // Use default labels for non-executor modes
        return '';
    }

    const labels: Record<string, string> = {
        'documents': 'Essential Documents',
        'contacts': 'Who to Notify',
        'financial': 'Financial Matters',
        'property': 'Assets & Property',
        'insurance': 'Coverage Information',
        'medical': 'Health Records',
        'letters': 'Personal Messages',
        'memories': 'Life & Legacy',
        'time-capsule': 'For Later',
        'funeral': 'Arrangements'
    };

    return labels[moduleId] || '';
}

/**
 * Grief-aware encouragement messages
 */
export function getEncouragementMessage(): string {
    const messages = [
        "You're doing meaningful work. Take your time.",
        "Every step forward matters, no matter how small.",
        "This is difficult work. Be gentle with yourself.",
        "Progress isn't linear. Rest when you need to.",
        "You're handling this with grace. One day at a time."
    ];

    return messages[Math.floor(Math.random() * messages.length)];
}
