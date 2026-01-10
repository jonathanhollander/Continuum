import { createProfileStore } from './persistence';

export type EstateProfile = {
    ownerName: string;
    dateOfDeath: string;
    executorName: string;
    spouseName: string;
    primaryBeneficiary: string;
    last4SSN: string;
    legalAddress: string;
    legalCityState: string;
    totalValue: number;
};

const DEFAULT_PROFILE: EstateProfile = {
    ownerName: '',
    dateOfDeath: '',
    executorName: '',
    spouseName: '',
    primaryBeneficiary: '',
    last4SSN: '',
    legalAddress: '',
    legalCityState: '',
    totalValue: 0
};

// Migration / Initialization Logic
const getInitialData = (): EstateProfile => {
    if (typeof localStorage === 'undefined') return DEFAULT_PROFILE;

    // Check for new unified data
    const unified = localStorage.getItem('continuum_owner_estate_profile');
    if (unified) return DEFAULT_PROFILE;

    // Fallback to legacy
    const legacy = localStorage.getItem('continuum_estate_profile');
    if (legacy) {
        try {
            return JSON.parse(legacy);
        } catch { /* ignore */ }
    }
    return DEFAULT_PROFILE;
};

export const estateProfile = createProfileStore<EstateProfile>('estate_profile', getInitialData());
