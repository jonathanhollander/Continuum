import { registerSync } from '$lib/services/sync.svelte';

export interface PetEntry {
    id: string | number;
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

const petMapper = (item: any) => {
    if (!item) return item;
    return {
        ...item,
        // Remote -> Local
        vetName: item.vet_name ?? item.vetName ?? '',
        vetPhone: item.vet_phone ?? item.vetPhone ?? '',
        foodInstructions: item.food_instructions ?? item.foodInstructions ?? '',
        medicalNeeds: item.medical_needs ?? item.medicalNeeds ?? '',
        microchipNumber: item.microchip_number ?? item.microchipNumber ?? '',
        // Local -> Remote
        ['vet_name']: item.vetName ?? item.vet_name,
        ['vet_phone']: item.vetPhone ?? item.vet_phone,
        ['food_instructions']: item.foodInstructions ?? item.food_instructions,
        ['medical_needs']: item.medicalNeeds ?? item.medical_needs,
        ['microchip_number']: item.microchipNumber ?? item.microchip_number
    };
};

export const petSync = registerSync<PetEntry>('pets', 'pets', petMapper).setAffirmationContext('pets');

export const petStore = {
    get items() { return petSync.items; },
    get status() { return petSync.status; },
    addPet: (pet: Omit<PetEntry, 'id'>) => petSync.create({ ...pet, id: crypto.randomUUID() }),
    updatePet: (id: string | number, updates: Partial<PetEntry>) => petSync.update(id, updates),
    removePet: (id: string | number) => petSync.delete(id),
    sync: () => petSync.sync(),
    // Store Compatibility
    subscribe: petSync.subscribe.bind(petSync)
};
