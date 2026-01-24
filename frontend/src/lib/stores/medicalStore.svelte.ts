import { registerSync, registerSingletonSync } from "$lib/services/sync.svelte";

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
    return {
        ...item,
        // Remote -> Local
        organDonor: item.organ_donor ?? item.organDonor ?? false,
        bloodType: item.blood_type ?? item.bloodType ?? '',
        // Local -> Remote
        organ_donor: item.organDonor ?? item.organ_donor,
        blood_type: item.bloodType ?? item.blood_type
    };
};

const directiveMapper = (item: any) => {
    if (!item) return item;
    return {
        ...item,
        // Remote -> Local
        locationOfOriginal: item.location_of_original ?? item.locationOfOriginal ?? '',
        primaryContact: item.primary_contact ?? item.primaryContact ?? '',
        contactPhone: item.contact_phone ?? item.contactPhone ?? '',
        fileData: item.file_data ?? item.fileData ?? '',
        // Local -> Remote
        location_of_original: item.locationOfOriginal ?? item.location_of_original,
        primary_contact: item.primaryContact ?? item.primary_contact,
        contact_phone: item.contactPhone ?? item.contact_phone,
        file_data: item.fileData ?? item.file_data
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
    addDirective: (dir: Omit<MedicalDirective, 'id'>) => directiveSync.create({ ...dir, id: crypto.randomUUID() }),
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
