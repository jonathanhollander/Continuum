import { registerSync } from "$lib/services/sync.svelte";
import { oneSpelling } from "$lib/utils/oneSpelling";

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
    documents?: string; // URL to uploaded document
    notes: string;
    custom_attributes?: string; // JSON string of custom field values
}

const petMapper = (item: any) => {
    if (!item) return item;
    // One spelling per field (camel; the wire snake-cases it), newest value kept
    const out = oneSpelling(item, {
        vetName: 'vet_name', vetPhone: 'vet_phone', foodInstructions: 'food_instructions',
        medicalNeeds: 'medical_needs', microchipNumber: 'microchip_number',
    });
    return {
        ...out,
        vetName: out.vetName ?? '',
        vetPhone: out.vetPhone ?? '',
        foodInstructions: out.foodInstructions ?? '',
        medicalNeeds: out.medicalNeeds ?? '',
        microchipNumber: out.microchipNumber ?? '',
        documents: out.documents ?? ''
    };
};

export const petSync = registerSync<PetEntry>('pets', 'pets', petMapper).setAffirmationContext('pets');

export const petStore = {
    get items() { return petSync.items; },
    get status() { return petSync.status; },
    addPet: (pet: Omit<PetEntry, 'id'>, onRetry?: () => Promise<unknown>) => petSync.create({ ...pet, id: crypto.randomUUID() }, false, false, onRetry),
    updatePet: (id: string | number, updates: Partial<PetEntry>) => petSync.update(id, updates),
    removePet: (id: string | number) => petSync.delete(id),
    sync: () => petSync.sync(),
    // Store Compatibility
    subscribe: petSync.subscribe.bind(petSync)
};
