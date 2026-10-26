import { registerSync, registerSingletonSync } from "$lib/services/sync.svelte";
import { deleteMedia, type MediaFile } from "$lib/services/mediaService";
import { readCustom } from "$lib/utils/customFields";
import { oneSpelling } from "$lib/utils/oneSpelling";

export interface MedicalDirective {
    id: number | string;
    type: 'healthcare_proxy' | 'living_will' | 'dnr' | 'palliative_care' | 'other';
    title: string;
    locationOfOriginal: string;
    primaryContact: string;
    contactPhone: string;
    summary: string;
    custom_attributes?: string; // JSON string of custom field values (and the attached file under DIRECTIVE_MEDIA_KEY)
}

/**
 * The attached file's media record, kept under this key in `custom_attributes`
 * (the directive has no file column), as the time capsule does.
 */
export const DIRECTIVE_MEDIA_KEY = '_media';

export type DirectiveMedia = Pick<MediaFile, 'id' | 'mime_type' | 'filename' | 'file_size'>;

/** The directive's attached file, if one is stored. */
export function directiveMedia(dir: any): DirectiveMedia | undefined {
    const media = readCustom(dir)[DIRECTIVE_MEDIA_KEY];
    return media && typeof media.id === 'number' ? media : undefined;
}

export interface MedicalProfile {
    organDonor: boolean;
    bloodType: string;
    allergies: string;
}

const profileMapper = (item: any) => {
    if (!item) return item;
    // One spelling per field (camel; the wire snake-cases it), newest value kept
    const out = oneSpelling(item, { organDonor: 'organ_donor', bloodType: 'blood_type' });
    return { ...out, organDonor: out.organDonor ?? false, bloodType: out.bloodType ?? '' };
};

const directiveMapper = (item: any) => {
    if (!item) return item;
    // fileData/file_data: an older device-only field the server never kept; never sent.
    const { fileData, file_data, ...rest } = item;
    // One spelling per field (camel; the wire snake-cases it), newest value kept
    const out = oneSpelling(rest, {
        locationOfOriginal: 'location_of_original', primaryContact: 'primary_contact',
        contactPhone: 'contact_phone',
    });
    return {
        ...out,
        locationOfOriginal: out.locationOfOriginal ?? '',
        primaryContact: out.primaryContact ?? '',
        contactPhone: out.contactPhone ?? ''
    };
};

export const profileSync = registerSingletonSync<MedicalProfile>('medical_profile', 'profile', profileMapper, '/api/medical').setAffirmationContext('medical');
export const directiveSync = registerSync<MedicalDirective>('medical_directives', 'directives', directiveMapper, '/api/medical').setAffirmationContext('medical');

export const medicalStore = {
    get profile() {
        return profileSync.data || { organDonor: false, bloodType: '', allergies: '' };
    },
    get directives() { return directiveSync.items; },
    get status() {
        return profileSync.status === 'error' || directiveSync.status === 'error' ? 'error' :
            (profileSync.status === 'syncing' || directiveSync.status === 'syncing' ? 'syncing' : 'synced');
    },

    sync: async () => {
        await Promise.all([profileSync.sync(), directiveSync.sync()]);
    },

    updateProfile: (data: Partial<MedicalProfile>) => profileSync.update(data as MedicalProfile),
    addDirective: (dir: Omit<MedicalDirective, 'id'>, onRetry?: () => Promise<unknown>) => directiveSync.create({ ...dir, id: crypto.randomUUID() }, false, false, onRetry),
    updateDirective: (id: string | number, updates: Partial<MedicalDirective>) => directiveSync.update(id, updates),
    /** Remove the directive, then its attached file (only once the directive is gone, Try Again included). */
    removeDirective: (id: string | number) => {
        const media = directiveMedia(directiveSync.items.find(d => String(d.id) === String(id)));
        return directiveSync.delete(id, media ? async () => {
            await deleteMedia(media.id).catch((e) => console.warn('[medical] file removal paused', media.id, e));
        } : undefined);
    },

    // Store Compatibility
    subscribe: (run: any) => {
        // Simple composite subscribe
        const unsub1 = profileSync.subscribe(() => run(medicalStore));
        const unsub2 = directiveSync.subscribe(() => run(medicalStore));
        return () => { unsub1(); unsub2(); };
    }
};
