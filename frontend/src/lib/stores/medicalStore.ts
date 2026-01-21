import { registerSync, registerSingletonSync } from '../services/sync.svelte';

export interface MedicalDirective {
    id?: number;
    user_id?: number;
    type: 'healthcare_proxy' | 'living_will' | 'dnr' | 'palliative_care' | 'other';
    title: string;
    location_of_original: string;
    primary_contact: string;
    contact_phone: string;
    summary: string;
}

export interface MedicalProfile {
    user_id?: number;
    organ_donor: boolean;
    blood_type: string;
    allergies: string;
}

// --- Mappers ---
const profileMapper = (local: any): MedicalProfile => ({
    ...local,
    organ_donor: local.organ_donor ?? local.organDonor ?? false,
    blood_type: local.blood_type ?? local.bloodType ?? '',
    allergies: local.allergies ?? local.allergies ?? ''
});

const directiveMapper = (local: any): MedicalDirective => ({
    ...local,
    location_of_original: local.location_of_original ?? local.locationOfOriginal ?? '',
    primary_contact: local.primary_contact ?? local.primaryContact ?? '',
    contact_phone: local.contact_phone ?? local.contactPhone ?? ''
});

const profileManager = registerSingletonSync<MedicalProfile>('medical_profile', 'medical_profiles', profileMapper);
const directiveManager = registerSync<MedicalDirective>('medical_directives', 'medical_directives', directiveMapper);

export const medicalStore = {
    get profile() {
        return profileManager.data || { organ_donor: false, blood_type: '', allergies: '' };
    },
    get directives() { return directiveManager.items; },
    get status() { return profileManager.status === 'error' || directiveManager.status === 'error' ? 'error' : 'synced'; },

    sync: async () => {
        await Promise.all([profileManager.sync(), directiveManager.sync()]);
    },

    updateProfile: async (data: Partial<MedicalProfile>) => {
        const current = profileManager.data || { organ_donor: false, blood_type: '', allergies: '' };
        const merged = { ...current, ...data };
        return profileManager.update(merged as MedicalProfile);
    },

    addDirective: (dir: Omit<MedicalDirective, 'id'>) => directiveManager.create(dir as MedicalDirective),
    updateDirective: (id: number, updates: Partial<MedicalDirective>) => {
        const dir = directiveManager.items.find(d => d.id === id);
        if (dir) {
            return directiveManager.update({ ...dir, ...updates });
        }
    },
    removeDirective: (id: number) => directiveManager.delete(id)
};
