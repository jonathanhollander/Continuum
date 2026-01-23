import { registerSingletonSync } from '$lib/services/sync.svelte';

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

/**
 * Normalizes estate profile data.
 * SyncManager now handles snake_case <-> camelCase conversion automatically.
 */
const estateMapper = (data: any): EstateProfile => {
    if (!data) return data;
    return {
        ...DEFAULT_PROFILE,
        ...data,
    };
};

const estateManager = registerSingletonSync<EstateProfile>(
    'estate_profile',
    'estate/profile',
    estateMapper,
    '/api'
);

export const estateProfile = {
    get current() { return estateManager.data || DEFAULT_PROFILE; },
    get status() { return estateManager.status; },
    sync: () => estateManager.sync(),
    update: (updates: Partial<EstateProfile>) => estateManager.update(updates as EstateProfile),
    subscribe: (run: (value: EstateProfile) => void) => {
        return estateManager.subscribe((data) => run(data || DEFAULT_PROFILE));
    }
};
