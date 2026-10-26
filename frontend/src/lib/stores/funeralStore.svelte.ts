import { registerSingletonSync } from "$lib/services/sync.svelte";

export type FuneralWishes = {
    disposition: string;
    venue: string;
    music: string[];
    flowers: string;
    mood: string;
    colors: string[];
    religiousTradition: string;
    ceremonyDetails: {
        type: string;
        officiant: string;
        rituals: string[];
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
    custom_attributes?: string; // JSON string of custom field values
};

export type FuneralData = {
    wishes: FuneralWishes;
    budget: FuneralBudgetItem[];
};

export const DEFAULT_FUNERAL_DATA: FuneralData = {
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

// Always returns objects/arrays: the server stores wishes/budget as JSON text, but accepts
// real objects on save, so nothing here re-stringifies.
const parseJson = (v: any, fallback: any) => {
    if (typeof v !== 'string') return v ?? fallback;
    try { return JSON.parse(v || JSON.stringify(fallback)); } catch { return fallback; }
};

const funeralMapper = (data: any) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return { wishes: {}, budget: [] };
    return {
        ...data,
        wishes: parseJson(data.wishes, {}),
        budget: parseJson(data.budget, [])
    };
};

export const funeralSync = registerSingletonSync<FuneralData>('funeral_data', 'funeral_data', funeralMapper, '/api/data').setAffirmationContext('funeral');

export const funeralStore = {
    get wishes() { return funeralSync.data?.wishes || DEFAULT_FUNERAL_DATA.wishes; },
    get budget() { return funeralSync.data?.budget || []; },
    get status() { return funeralSync.status; },

    // Svelte store-compatible update method
    update: (fn: (current: FuneralData) => FuneralData) => {
        const current = funeralSync.data || DEFAULT_FUNERAL_DATA;
        const updated = fn(current);
        return funeralSync.update(updated);
    },

    updateWishes: (updates: Partial<FuneralWishes>) => {
        const current = funeralSync.data || DEFAULT_FUNERAL_DATA;
        return funeralSync.update({
            ...current,
            wishes: { ...current.wishes, ...updates }
        });
    },

    addBudgetItem: (item: Omit<FuneralBudgetItem, 'id'>) => {
        const current = funeralSync.data || DEFAULT_FUNERAL_DATA;
        return funeralSync.update({
            ...current,
            budget: [...current.budget, { ...item, id: crypto.randomUUID() }]
        });
    },

    sync: () => funeralSync.sync(),

    subscribe: funeralSync.subscribe.bind(funeralSync)
};
