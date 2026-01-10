import { createProfileStore } from './persistence';
import { get } from 'svelte/store';

export interface PetEntry {
    id: string;
    name: string;
    type: 'dog' | 'cat' | 'bird' | 'other';
    breed: string;
    guardian: string;
    vetName: string;
    vetPhone: string;
    foodInstructions: string;
    medicalNeeds: string;
    microchipNumber?: string;
    notes: string;
}

const DEFAULT_PETS: PetEntry[] = [];
// Legacy key was 'continuum_pet_store'
// New key will be 'pet_store' -> 'continuum_[pid]_pet_store'

const getInitialData = (): PetEntry[] => {
    if (typeof localStorage === 'undefined') return DEFAULT_PETS;

    // Check for new unified data for owner
    const unified = localStorage.getItem('continuum_owner_pet_store');
    if (unified) return DEFAULT_PETS;

    // Fallback to lawgacy
    const legacy = localStorage.getItem('continuum_pet_store');
    if (legacy) {
        try {
            const parsed = JSON.parse(legacy);
            return Array.isArray(parsed) ? parsed : DEFAULT_PETS;
        } catch (e) {
            console.error("Migration failed for pets", e);
        }
    }
    return DEFAULT_PETS;
};

function createReactivePetStore() {
    const store = createProfileStore<PetEntry[]>('pet_store', getInitialData());
    const { subscribe, update } = store;

    return {
        subscribe,
        addPet: (pet: Omit<PetEntry, 'id'>) => {
            update(pets => [...pets, { ...pet, id: crypto.randomUUID() }]);
        },
        updatePet: (id: string, data: Partial<PetEntry>) => {
            update(pets => pets.map(p => p.id === id ? { ...p, ...data } : p));
        },
        removePet: (id: string) => {
            update(pets => pets.filter(p => p.id !== id));
        }
    };
}

export const petStore = createReactivePetStore();
