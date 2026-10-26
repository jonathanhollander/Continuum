import { registerSync, registerSingletonSync } from "$lib/services/sync.svelte";
import { oneSpelling } from "$lib/utils/oneSpelling";

export interface MedicalDirective {
    id: number | string;
    type: 'healthcare_proxy' | 'living_will' | 'dnr' | 'palliative_care' | 'other';
    title: string;
    locationOfOriginal: string;
    primaryContact: string;
    contactPhone: string;
    summary: string;
    fileData?: string;
    custom_attributes?: string; // JSON string of custom field values
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
    // One spelling per field (camel; the wire snake-cases it), newest value kept
    const out = oneSpelling(item, {
        locationOfOriginal: 'location_of_original', primaryContact: 'primary_contact',
        contactPhone: 'contact_phone', fileData: 'file_data',
    });
    return {
        ...out,
        locationOfOriginal: out.locationOfOriginal ?? '',
        primaryContact: out.primaryContact ?? '',
        contactPhone: out.contactPhone ?? '',
        fileData: out.fileData ?? ''
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
    removeDirective: (id: string | number) => directiveSync.delete(id),

    // Store Compatibility
    subscribe: (run: any) => {
        // Simple composite subscribe
        const unsub1 = profileSync.subscribe(() => run(medicalStore));
        const unsub2 = directiveSync.subscribe(() => run(medicalStore));
        return () => { unsub1(); unsub2(); };
    }
};
