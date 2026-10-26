import { registerSync } from "$lib/services/sync.svelte";
import { oneSpelling } from "$lib/utils/oneSpelling";
import { deleteMedia, type MediaFile } from "$lib/services/mediaService";
import { readCustom } from "$lib/utils/customFields";

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
    custom_attributes?: string; // JSON string of custom field values (and the care document under PET_MEDIA_KEY)
}

/**
 * The care document's media record, kept under this key in `custom_attributes`
 * (the pet has no document column), as medical directives do.
 */
export const PET_MEDIA_KEY = '_media';

export type PetMedia = Pick<MediaFile, 'id' | 'mime_type' | 'filename' | 'file_size'>;

/** The pet's care document, if one is stored. */
export function petMedia(pet: any): PetMedia | undefined {
    const media = readCustom(pet)[PET_MEDIA_KEY];
    return media && typeof media.id === 'number' ? media : undefined;
}

const petMapper = (item: any) => {
    if (!item) return item;
    // One spelling per field (camel; the wire snake-cases it), newest value kept
    // documents: an older device-only field the server never kept; never sent.
    const { documents, ...rest } = item;
    const out = oneSpelling(rest, {
        vetName: 'vet_name', vetPhone: 'vet_phone', foodInstructions: 'food_instructions',
        medicalNeeds: 'medical_needs', microchipNumber: 'microchip_number',
    });
    return {
        ...out,
        vetName: out.vetName ?? '',
        vetPhone: out.vetPhone ?? '',
        foodInstructions: out.foodInstructions ?? '',
        medicalNeeds: out.medicalNeeds ?? '',
        microchipNumber: out.microchipNumber ?? ''
    };
};

export const petSync = registerSync<PetEntry>('pets', 'pets', petMapper).setAffirmationContext('pets');

export const petStore = {
    get items() { return petSync.items; },
    get status() { return petSync.status; },
    addPet: (pet: Omit<PetEntry, 'id'>, onRetry?: () => Promise<unknown>) => petSync.create({ ...pet, id: crypto.randomUUID() }, false, false, onRetry),
    updatePet: (id: string | number, updates: Partial<PetEntry>) => petSync.update(id, updates),
    /** Remove the pet, then its care document (only once the pet is gone, Try Again included). */
    removePet: (id: string | number) => {
        const media = petMedia(petSync.items.find(p => String(p.id) === String(id)));
        return petSync.delete(id, media ? async () => {
            await deleteMedia(media.id).catch((e) => console.warn('[pets] file removal paused', media.id, e));
        } : undefined);
    },
    sync: () => petSync.sync(),
    // Store Compatibility
    subscribe: petSync.subscribe.bind(petSync)
};
