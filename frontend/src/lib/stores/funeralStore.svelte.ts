import { registerSingletonSync } from "$lib/services/sync.svelte.ts";

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

const funeralMapper = (data: any) => {
    if (!data) return data;

    const isRemote = typeof data.wishes === 'string';

    if (isRemote) {
        return {
            ...data,
            wishes: JSON.parse(data.wishes || '{}'),
            budget: JSON.parse(data.budget || '[]')
        };
    } else {
        return {
            ...data,
            wishes: JSON.stringify(data.wishes || {}),
            budget: JSON.stringify(data.budget || [])
        };
    }
};

export const funeralSync = registerSingletonSync<FuneralData>('funeral_data', 'funeral_data', funeralMapper, '/api/data').setAffirmationContext('funeral');

export const funeralStore = {
    get wishes() { return funeralSync.data?.wishes || DEFAULT_FUNERAL_DATA.wishes; },
    get budget() { return funeralSync.data?.budget || []; },
    get status() { return funeralSync.status; },

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
