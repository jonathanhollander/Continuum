/**
 * Affirmation Library for Progress Celebration
 *
 * These messages acknowledge the emotional courage behind end-of-life planning work.
 * They replace generic "Saved" messages with meaningful affirmations that connect
 * to the value being created for loved ones.
 *
 * Pattern: Each affirmation has a primary message (emotional/meaningful) and
 * secondary message (functional confirmation).
 */

export interface Affirmation {
    primary: string;
    secondary: string;
}

export const affirmations = {
    general: [
        { primary: "You're giving your loved ones a gift", secondary: "This information is safely saved" },
        { primary: "This took courage", secondary: "Your family will be grateful you did this" },
        { primary: "One more piece in place", secondary: "You're making this easier for the people you love" },
        { primary: "You're protecting the people you care about", secondary: "Changes saved successfully" },
        { primary: "This is an act of love", secondary: "Your work is preserved" },
    ],

    documents: [
        { primary: "This will save your family so much searching", secondary: "Document saved securely" },
        { primary: "You're preventing confusion when it matters most", secondary: "Document saved" },
        { primary: "One less thing they'll have to worry about", secondary: "Document added successfully" },
        { primary: "You're creating clarity in chaos", secondary: "Document uploaded" },
    ],

    wishes: [
        { primary: "You're giving your voice to a moment when you can't speak", secondary: "Wishes saved" },
        { primary: "This is one of the most loving things you can do", secondary: "Your wishes are recorded" },
        { primary: "You're honoring your values and protecting your dignity", secondary: "Wishes updated" },
        { primary: "Your family won't have to guess what you wanted", secondary: "Preferences saved" },
    ],

    contacts: [
        { primary: "You're creating a safety net", secondary: "Contact saved" },
        { primary: "Your family won't have to search for these numbers", secondary: "Contact information saved" },
        { primary: "You're connecting the people who'll need each other", secondary: "Contact added" },
        { primary: "This simple list will mean everything", secondary: "Contact details updated" },
    ],

    medical: [
        { primary: "This might save your life one day", secondary: "Medical information saved" },
        { primary: "You're giving crucial information to the people who'll need it", secondary: "Saved securely" },
        { primary: "Your healthcare wishes will be honored", secondary: "Medical directives updated" },
        { primary: "You're preventing impossible decisions", secondary: "Information saved" },
    ],

    pets: [
        { primary: "You're ensuring they'll be cared for", secondary: "Pet information saved" },
        { primary: "Your furry family will be taken care of", secondary: "Pet care details saved" },
        { primary: "One less worry about who they trust", secondary: "Guardian information updated" },
    ],

    insurance: [
        { primary: "You're protecting your family's financial security", secondary: "Policy saved" },
        { primary: "This could save them weeks of searching", secondary: "Insurance information saved" },
        { primary: "You're making the claims process so much easier", secondary: "Policy details updated" },
    ],

    funeral: [
        { primary: "You're removing guesswork from an emotional time", secondary: "Preferences saved" },
        { primary: "Your wishes will be honored", secondary: "Funeral plans updated" },
        { primary: "This will bring your family peace", secondary: "Information saved" },
    ],

    subscriptions: [
        { primary: "You might have just saved them hundreds of dollars", secondary: "Subscription saved" },
        { primary: "No more zombie bills draining the estate", secondary: "Service documented" },
        { primary: "They'll know exactly what to cancel", secondary: "Information updated" },
    ],

    heirlooms: [
        { primary: "You're preserving stories for generations", secondary: "Heirloom saved" },
        { primary: "These objects will carry your voice forward", secondary: "Story documented" },
        { primary: "You're transforming things into legacy", secondary: "Heirloom information saved" },
    ],

    timeline: [
        { primary: "You're capturing memories that matter", secondary: "Event saved" },
        { primary: "Your story deserves to be told", secondary: "Timeline updated" },
        { primary: "These moments will outlive us all", secondary: "Memory preserved" },
    ],

    letters: [
        { primary: "Your words will live on", secondary: "Letter saved" },
        { primary: "You're giving a gift they can keep forever", secondary: "Message preserved" },
        { primary: "This might be the most meaningful thing you write", secondary: "Letter drafted" },
    ],

    timeCapsule: [
        { primary: "You're creating a treasure for the future", secondary: "Message sealed" },
        { primary: "Your voice will reach them at the perfect moment", secondary: "Capsule saved" },
        { primary: "This is time travel through love", secondary: "Message preserved" },
    ],

    pulse: [
        { primary: "You're creating a safety system that watches over you", secondary: "Settings saved" },
        { primary: "Your family will know you're okay", secondary: "Pulse configured" },
        { primary: "This simple check-in might save your life", secondary: "Preferences updated" },
    ],

    journal: [
        { primary: "Your story will be remembered", secondary: "Reflection saved" },
        { primary: "You're giving your loved ones a window into your heart", secondary: "Memory preserved" },
        { primary: "These words are a treasure they'll return to again and again", secondary: "Entry saved" },
        { primary: "You're passing down wisdom that can't be Googled", secondary: "Reflection documented" },
        { primary: "This is how legacies are built - one memory at a time", secondary: "Story captured" },
    ],
} as const;

/**
 * Get a random affirmation for a specific module
 */
export function getRandomAffirmation(module: keyof typeof affirmations = 'general'): Affirmation {
    const moduleAffirmations = affirmations[module] || affirmations.general;
    const randomIndex = Math.floor(Math.random() * moduleAffirmations.length);
    return moduleAffirmations[randomIndex];
}

/**
 * Get all affirmations for a module (useful for cycling through them)
 */
export function getModuleAffirmations(module: keyof typeof affirmations): Affirmation[] {
    return affirmations[module] || affirmations.general;
}
