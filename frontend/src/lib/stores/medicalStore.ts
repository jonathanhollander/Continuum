import { createProfileStore, getLegacy } from './persistence';

export interface MedicalDirective {
    id: string;
    type: 'healthcare_proxy' | 'living_will' | 'dnr' | 'palliative_care' | 'other';
    title: string;
    locationOfOriginal: string;
    primaryContact: string; // E.g. Dr. or Proxy Name
    contactPhone: string;
    summary: string;
    organDonor: boolean;
    bloodType: string;
    allergies: string;
}

interface MedicalState {
    organDonor: boolean;
    bloodType: string;
    allergies: string;
    directives: MedicalDirective[];
}

const DEFAULT_MEDICAL: MedicalState = {
    organDonor: false,
    bloodType: '',
    allergies: '',
    directives: []
};

// Migration / Initialization Logic
const getInitialData = (): MedicalState => {
    // Check for new unified data for owner
    const unified = getLegacy('continuum_owner_medical_store');
    if (unified) return DEFAULT_MEDICAL;

    // Fallback to legacy
    const legacy = getLegacy('continuum_medical_store');
    if (legacy) {
        try {
            const parsed = JSON.parse(legacy);
            return {
                ...DEFAULT_MEDICAL,
                ...parsed
            };
        } catch (e) {
            console.error("Migration failed for medical store", e);
        }
    }
    return DEFAULT_MEDICAL;
};

function createReactiveMedicalStore() {
    const store = createProfileStore<MedicalState>('medical_store', getInitialData());
    const { subscribe, update } = store;

    return {
        subscribe,
        updateProfile: (data: { organDonor?: boolean, bloodType?: string, allergies?: string }) => {
            update(store => ({ ...store, ...data }));
        },
        addDirective: (dir: Omit<MedicalDirective, 'id'>) => {
            update(store => ({
                ...store,
                directives: [...store.directives, { ...dir, id: crypto.randomUUID() }]
            }));
        },
        updateDirective: (id: string, data: Partial<MedicalDirective>) => {
            update(store => ({
                ...store,
                directives: store.directives.map((d: MedicalDirective) => d.id === id ? { ...d, ...data } : d)
            }));
        },
        removeDirective: (id: string) => {
            update(store => ({
                ...store,
                directives: store.directives.filter((d: MedicalDirective) => d.id !== id)
            }));
        }
    };
}

export const medicalStore = createReactiveMedicalStore();
