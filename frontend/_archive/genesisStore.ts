import { writable } from 'svelte/store';

export type WizardStage = 'landing' | 'foundation' | 'structure' | 'interior';

interface GenesisState {
    stage: WizardStage;
    isGodMode: boolean; // If true, shows full navigation
    activeBlock: string | null;
}

function createGenesisStore() {
    const { subscribe, set, update } = writable<GenesisState>({
        stage: 'landing',
        isGodMode: false,
        activeBlock: null
    });

    return {
        subscribe,
        setGodMode: (isActive: boolean) => update(s => ({ ...s, isGodMode: isActive })),
        setActiveBlock: (blockId: string | null) => update(s => ({ ...s, activeBlock: blockId })),

        // Simple Intent Engine
        analyzeIntent: (input: string): { route: string | null, message: string } => {
            const lower = input.toLowerCase();

            // Asset Vault Logic
            if (lower.includes('money') || lower.includes('bank') || lower.includes('asset') || lower.includes('bills')) {
                return {
                    route: '/modules/financial-accounts',
                    message: "Let's secure your **Financial Foundation**. Identifying your accounts is the first step."
                };
            }

            // Family / Network Logic
            if (lower.includes('family') || lower.includes('kid') || lower.includes('wife') || lower.includes('husband') || lower.includes('contact')) {
                return {
                    route: '/modules/contacts',
                    message: "Let's build your **Support Network**. These are the people who will stand in the gap."
                };
            }

            // Digital Guardian Logic
            if (lower.includes('password') || lower.includes('crypto') || lower.includes('digital') || lower.includes('online')) {
                return {
                    route: '/modules/digital-guardian',
                    message: "Let's secure your **Digital Legacy**. Your online life is just as real as your physical one."
                };
            }

            // Legal Logic
            if (lower.includes('will') || lower.includes('legal') || lower.includes('trust') || lower.includes('lawyer')) {
                return {
                    route: '/modules/legal-documents',
                    message: "Let's place the **Legal Shield**. These documents give you authority when you can't speak."
                };
            }

            // Default / Fallback
            return {
                route: null,
                message: "I hear you. Let's start by establishing your **Primary Profile** so the system knows who to protect."
            };
        }
    };
}

export const genesisStore = createGenesisStore();
