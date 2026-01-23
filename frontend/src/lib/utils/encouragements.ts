/**
 * Encouragement messages for various user milestones and actions.
 * These add a human touch to the experience by acknowledging effort.
 */

type EncouragementCategory =
    | 'firstContact'
    | 'firstDocument'
    | 'firstPulse'
    | 'completedSection'
    | 'milestone'
    | 'returning'
    | 'save'
    | 'delete';

const encouragements: Record<EncouragementCategory, string[]> = {
    firstContact: [
        "That's a wonderful first step. Having someone you trust makes all the difference.",
        "You've just made things easier for the people you care about.",
        "Your family will be grateful for this thoughtfulness.",
        "One person at a time. You're building something meaningful.",
    ],
    firstDocument: [
        "One document down. You're building real peace of mind.",
        "Your family will thank you for this someday.",
        "This is exactly the kind of thing that matters most.",
        "You're doing something most people put off forever. That takes courage.",
    ],
    firstPulse: [
        "You've just created a safety net for your loved ones.",
        "This simple check-in could make all the difference someday.",
        "Your family now has a way to know you're okay. That's powerful.",
        "You're giving your loved ones peace of mind. That's a gift.",
    ],
    completedSection: [
        "Another section complete. You're making real progress.",
        "Look at you go! This is really coming together.",
        "Every piece you add makes your family's future clearer.",
        "You should feel proud of what you've accomplished here.",
    ],
    milestone: [
        "You've done more than most people ever do. That takes courage.",
        "Your estate is really taking shape. Well done.",
        "This level of preparation is a true gift to your family.",
        "You're building something that will matter for generations.",
    ],
    returning: [
        "Welcome back. Ready to pick up where you left off?",
        "Good to see you again. Every visit counts.",
        "You're back! Let's continue building your legacy.",
        "Welcome back. Your progress is right where you left it.",
    ],
    save: [
        "Saved safely.",
        "Your changes are secure.",
        "All saved.",
        "Got it. Changes saved.",
        "Saved and protected.",
    ],
    delete: [
        "Removed. You can always add it back if you change your mind.",
        "Done. The information has been removed.",
        "Removed successfully.",
    ],
};

/**
 * Get a random encouragement message for a category
 */
export function getEncouragement(category: EncouragementCategory): string {
    const messages = encouragements[category];
    return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Get a time-based greeting
 */
export function getGreeting(name?: string): string {
    const hour = new Date().getHours();
    const greeting = hour < 12
        ? "Good morning"
        : hour < 17
            ? "Good afternoon"
            : "Good evening";

    return name ? `${greeting}, ${name}` : greeting;
}

/**
 * Get a progress-based message
 */
export function getProgressMessage(percentComplete: number): string {
    if (percentComplete === 0) {
        return "Ready to begin? Even one small step matters.";
    }
    if (percentComplete < 25) {
        return "You've started something important. Keep going when you're ready.";
    }
    if (percentComplete < 50) {
        return "You're making steady progress. Every bit counts.";
    }
    if (percentComplete < 75) {
        return "You're past the halfway point. The hard part is behind you.";
    }
    if (percentComplete < 100) {
        return "Almost there! You've done amazing work.";
    }
    return "Complete! Your loved ones will thank you for this.";
}

/**
 * Get an empty state message with encouragement
 */
export function getEmptyStateMessage(moduleType: string): { title: string; description: string } {
    const messages: Record<string, { title: string; description: string }> = {
        contacts: {
            title: "Your circle of trust starts here",
            description: "Who would you want to help your family if something happened? Adding even one person is a powerful first step.",
        },
        documents: {
            title: "Important papers, safely stored",
            description: "Wills, insurance policies, deeds—the things your family would need to find. Start with whatever's most important to you.",
        },
        financial: {
            title: "Your financial picture",
            description: "Bank accounts, investments, debts—giving your family a clear map makes everything easier for them later.",
        },
        medical: {
            title: "Your health information",
            description: "Doctors, medications, allergies—the basics that help people care for you when you need it most.",
        },
        letters: {
            title: "Words that will matter forever",
            description: "Messages to loved ones, wisdom to share, stories only you can tell. There's no rush—write when you're ready.",
        },
        heirlooms: {
            title: "Treasures with stories",
            description: "The things that matter most aren't always valuable—they're meaningful. Share the stories behind what you want to pass on.",
        },
        default: {
            title: "Nothing here yet",
            description: "This is where you'll keep track of important information. Add your first item when you're ready.",
        },
    };

    return messages[moduleType] || messages.default;
}

export default {
    getEncouragement,
    getGreeting,
    getProgressMessage,
    getEmptyStateMessage,
};
