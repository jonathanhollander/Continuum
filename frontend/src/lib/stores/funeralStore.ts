import { createProfileStore, getLegacy } from './persistence';
import type { Writable } from 'svelte/store';

export type FuneralWishes = {
    disposition: string;
    venue: string;
    music: string[];
    flowers: string;
    mood: string;
    colors: string[];
    // New Fields for Wizard
    religiousTradition: string; // 'secular' | 'jewish' | ...
    ceremonyDetails: {
        type: string;
        officiant: string;
        rituals: string[]; // Checklist of specific rituals
    };
    legacy: {
        readings: string[];
        eulogists: string[];
        obituaryNotes: string;
        charity: string;
    };
};

export type FuneralBudgetItem = {
    id: string;
    name: string;
    cost: number;
    estimated: number;
};

export type FuneralData = {
    wishes: FuneralWishes;
    budget: FuneralBudgetItem[];
};

const DEFAULT_DATA: FuneralData = {
    wishes: {
        disposition: "",
        venue: "",
        music: [],
        flowers: "",
        mood: "",
        colors: [],
        religiousTradition: "secular",
        ceremonyDetails: {
            type: "",
            officiant: "",
            rituals: []
        },
        legacy: {
            readings: [],
            eulogists: [],
            obituaryNotes: "",
            charity: ""
        }
    },
    budget: []
};

// Migration / Initialization Logic
const getInitialData = (): FuneralData => {
    // Check if we have the new unified key for the default owner
    const unified = getLegacy('continuum_owner_funeral_data');
    if (unified) return DEFAULT_DATA; // createProfileStore will handle the actual load

    // If not, try to recover legacy data for the Owner profile
    const legacyWishes = getLegacy('continuum_funeral_wishes');
    const legacyBudget = getLegacy('continuum_funeral_budget');

    if (legacyWishes || legacyBudget) {
        try {
            const parsedWishes = legacyWishes ? JSON.parse(legacyWishes) : {};
            const parsedBudget = legacyBudget ? JSON.parse(legacyBudget) : [];

            // Merge with defaults to ensure new fields (tradition etc) exist
            const mergedWishes = {
                ...DEFAULT_DATA.wishes,
                ...parsedWishes,
                ceremonyDetails: {
                    ...DEFAULT_DATA.wishes.ceremonyDetails,
                    ...(parsedWishes.ceremonyDetails || {})
                },
                legacy: {
                    ...DEFAULT_DATA.wishes.legacy,
                    ...(parsedWishes.legacy || {})
                }
            };

            return {
                wishes: mergedWishes,
                budget: parsedBudget
            };
        } catch (e) {
            console.error("Migration failed", e);
        }
    }
    return DEFAULT_DATA;
};

// Use the new reactive store factory
// Key: 'funeral_data' -> continuum_[profile]_funeral_data
export const funeralStore = createProfileStore<FuneralData>('funeral_data', getInitialData());
