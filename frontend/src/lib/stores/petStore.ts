import { registerSync } from '../services/sync.svelte';

export interface PetEntry {
    id?: number;
    user_id?: number;
    name: string;
    type: 'dog' | 'cat' | 'bird' | 'other';
    breed: string;
    guardian: string;
    vet_name: string;
    vet_phone: string;
    food_instructions: string;
    medical_needs: string;
    microchip_number?: string;
    notes: string;
}

// --- Mappers ---
const petMapper = (local: any): PetEntry => ({
    ...local,
    id: typeof local.id === 'string' && !isNaN(Number(local.id)) ? Number(local.id) : (typeof local.id === 'number' ? local.id : undefined),
    vet_name: local.vet_name ?? local.vetName ?? '',
    vet_phone: local.vet_phone ?? local.vetPhone ?? '',
    food_instructions: local.food_instructions ?? local.foodInstructions ?? '',
    medical_needs: local.medical_needs ?? local.medicalNeeds ?? ''
});

const manager = registerSync<PetEntry>('pets', 'pets', petMapper, '/api');

export const petStore = {
    get pets() { return manager.items; },
    get status() { return manager.status; },
    sync: () => manager.sync(),
    addPet: (pet: Omit<PetEntry, 'id'>) => manager.create(pet as PetEntry),
    updatePet: (id: number | string, updates: Partial<PetEntry>) => {
        const numericId = typeof id === 'string' ? Number(id) : id;
        const pet = manager.items.find(p => p.id === numericId);
        if (pet) {
            return manager.update({ ...pet, ...updates });
        }
    },
    removePet: (id: number | string) => {
        const numericId = typeof id === 'string' ? Number(id) : id;
        return manager.delete(numericId);
    }
};
