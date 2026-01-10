import { writable, derived } from 'svelte/store';
import { page } from '$app/stores';

export interface CompassBrief {
    title: string;
    mission: string;
    emotional_context: string;
    human_impact: string;
    key_deliverables: string[];
    pro_tips: string[];
    conversation_scripts?: { title: string; text: string }[];
}

const DEFAULT_BRIEF: CompassBrief = {
    title: "Estate Command Center",
    mission: "Coordinate your entire legacy from a single source of truth.",
    emotional_context: "Seeing everything in one place can be overwhelming. Take a breath. You don't have to solve it all today.",
    human_impact: "This system is your voice when you cannot speak. Every piece of data you enter is a gift of clarity to your future self and your family.",
    key_deliverables: [
        "Review the 'Pulse' for critical missing items.",
        "Use 'Quick Actions' to tackle one small task.",
        "Check the 'Concierge' feed for AI-driven suggestions."
    ],
    pro_tips: [
        "Start with the 'Identity' or 'Contacts' module—they are the easiest quick wins.",
        "Aim for 'Better than yesterday', not 'Perfect'."
    ]
};

const BRIEFS: Record<string, CompassBrief> = {
    '/modules/financial-accounts': {
        title: "Financial Accounts Ledger",
        mission: "Create a 100% visible map of your assets to prevent loss.",
        emotional_context: "It feels invasive to list everything out, but secrets are the enemy of a smooth transfer. Your executor needs a map, not a treasure hunt.",
        human_impact: "Billions of dollars are lost in unclaimed property every year simply because families didn't know the accounts existed. By listing them here, you ensure your life's work actually goes to the people you love.",
        key_deliverables: [
            "List all bank accounts (Checking, Savings).",
            "Add investment accounts (Brokerage, 401k, IRA).",
            "Include credit cards (so they can be closed).",
            "Verify a Beneficiary is listed for each."
        ],
        pro_tips: [
            "Don't worry about exact balances. They change daily. Focus on the *Institution* and *Account Number*.",
            "If an account has a 'Transfer on Death' (TOD) beneficiary, it skips probate entirely. That's a huge win."
        ]
    },
    '/modules/contacts': {
        title: "Family & Notification Network",
        mission: "Define exactly who needs to be called, and in what order.",
        emotional_context: "Thinking about people getting that phone call is heartbreaking. But providing a clear list saves them from the panic of 'Who do I call? What do I say?'",
        human_impact: "In a crisis, brains shut down. This list takes the thinking out of it. It protects your inner circle from having to play detective while they are grieving.",
        key_deliverables: [
            "Identify your 'Tier 1' (Immediate) contacts.",
            "Add contact details for your Executor and Attorney.",
            "List people who should just get a service notification (Tier 3)."
        ],
        pro_tips: [
            "Add notes like 'This is my college roommate' so your family knows *why* they are being called.",
            "Include your boss or HR contact—that is often overlooked."
        ],
        conversation_scripts: [
            {
                title: "Asking for Contact Info",
                text: "Hey, I'm organizing my emergency contact list to make things easier for my family. Can I get your current address and best phone number just in case?"
            }
        ]
    },
    '/modules/legal-documents': {
        title: "Legal Vault",
        mission: "Secure the core legal authority for your estate.",
        emotional_context: "These documents feel cold and formal, but they are actually the ultimate protection. They are the shield you place around your family.",
        human_impact: "Without a Will, the state decides who gets what. Without a Power of Attorney, your spouse might be frozen out of your bank account if you are in a coma. These docs keep your family in the driver's seat.",
        key_deliverables: [
            "Upload your signed Last Will & Testament.",
            "Upload a Power of Attorney (Financial).",
            "Upload a Healthcare Proxy.",
            "Tell your customized AI Concierge where the *physical* originals are."
        ],
        pro_tips: [
            "A PDF is great for quick reference, but the *original ink signature* is often required by courts. Make sure the location note is accurate.",
            "If you don't have these docs, use the 'Resources' tab to find a simplified template or a local attorney."
        ]
    },
    '/modules/digital-guardian': {
        title: "Digital Guardian",
        mission: "Ensure your digital life (photos, emails, crypto) doesn't vanish.",
        emotional_context: "Our digital lives are huge parts of who we are now. Losing access to 20 years of photos is a modern tragedy we can prevent.",
        human_impact: "Most terms of service say your account dies with you. giving your executor lawful access (like Apple Legacy Contact) is the only way to save those memories.",
        key_deliverables: [
            "Set up a Password Manager emergency access.",
            "Configure Apple/Google Inactive Account Manager.",
            "List critical device passcodes."
        ],
        pro_tips: [
            "Do NOT write your master password here in plain text. Use a 'Digital Vault' workflow or a physical piece of paper in a safe."
        ]
    },
    '/modules/medical-directives': {
        title: "Medical Directives",
        mission: "Speak for yourself when you cannot speaking.",
        emotional_context: "This is the hardest part. No one wants to think about life support. But your family *desperately* wants to know what you would want, so they don't have to guess.",
        human_impact: "The burden of deciding to end life support is traumatic. By writing down your wishes (Living Will), you lift that weight off your spouse or children's shoulders. You give them permission to let go.",
        key_deliverables: [
            "Upload your Living Will / Advance Directive.",
            "Add notes on your values (quality of life vs. longevity)."
        ],
        pro_tips: [
            "Keep a copy on your fridge - that is where EMS looks.",
            "Update this every decade or after a major diagnosis."
        ],
        conversation_scripts: [
            {
                title: "Asking someone to be your Proxy",
                text: "I'm updating my medical planning, and I trust you to make tough calls if I ever couldn't. Would you be willing to be listed as my healthcare proxy? I'll write down exactly what I want so you don't have to guess."
            }
        ]
    },
    '/modules/insurance': {
        title: "Insurance Portfolio",
        mission: "Provide immediate liquidity to your family.",
        emotional_context: "It feels like betting against yourself. But actually, it's the only asset that delivers cash *exactly* when it's needed most.",
        human_impact: "Probate can take 18 months. Insurance pays out in weeks. This money acts as a bridge, paying the mortgage and funeral costs while the courts are slow.",
        key_deliverables: [
            "List Life Insurance policies.",
            "List Home/Auto policies (so assets remain covered).",
            "Call the carrier to confirm the beneficiary is correct."
        ],
        pro_tips: [
            "Make sure your executor knows which company to call. A policy number is useless if we don't know the carrier."
        ]
    }
    // Add more routes as needed
};

function createCompassStore() {
    const { subscribe, set } = writable<CompassBrief>(DEFAULT_BRIEF);

    return {
        subscribe,
        updateContext: (path: string) => {
            // Find the closest matching route
            // e.g. /modules/financial-accounts/detail -> /modules/financial-accounts
            const matchedKey = Object.keys(BRIEFS).find(key => path.startsWith(key));
            const brief = matchedKey ? BRIEFS[matchedKey] : DEFAULT_BRIEF;
            set(brief);
        }
    };
}

export const compassStore = createCompassStore();

// Auto-update when page changes
// (This needs to be called in a component that runs on every page, like Layout or the CompassPanel itself)
