import { registerSingletonSync } from '../services/sync.svelte';

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

// --- Mapper ---

const estateMapper = (raw: any): EstateProfile => {
    // Handle both camelCase (local/legacy) and snake_case (backend)
    return {
        ownerName: raw.owner_name ?? raw.ownerName ?? '',
        dateOfDeath: raw.date_of_death ?? raw.dateOfDeath ?? '',
        executorName: raw.executor_name ?? raw.executorName ?? '',
        spouseName: raw.spouse_name ?? raw.spouseName ?? '',
        primaryBeneficiary: raw.primary_beneficiary ?? raw.primaryBeneficiary ?? '',
        last4SSN: raw.last4_ssn ?? raw.last4SSN ?? '',
        legalAddress: raw.legal_address ?? raw.legalAddress ?? '',
        legalCityState: raw.legal_city_state ?? raw.legalCityState ?? '',
        totalValue: raw.total_value ?? raw.totalValue ?? 0
    };
};

// --- Sync Manager ---

const estateManager = registerSingletonSync<EstateProfile>(
    'estate_profile',
    'estate/profile',
    estateMapper,
    '/api'
);

// --- Exports ---

// Reactive access via Runes & Store compatibility
export const estateProfile = {
    subscribe: (run: (value: EstateProfile) => void) => {
        return estateManager.subscribe((data) => run(data || DEFAULT_PROFILE));
    },
    get current() { return estateManager.data || DEFAULT_PROFILE; },
    get status() { return estateManager.status; },
    sync: () => estateManager.sync(),
    update: (updates: Partial<EstateProfile>) => {
        // Prepare for backend (convert to snake_case)
        const current = estateManager.data || DEFAULT_PROFILE;
        const merged = { ...current, ...updates };
        const payload = {
            owner_name: merged.ownerName,
            date_of_death: merged.dateOfDeath,
            executor_name: merged.executorName,
            spouse_name: merged.spouseName,
            primary_beneficiary: merged.primaryBeneficiary,
            last4_ssn: merged.last4SSN,
            legal_address: merged.legalAddress,
            legal_city_state: merged.legalCityState,
            total_value: merged.totalValue
        };
        // Passing both: 
        // 1. 'updates' for local reactive state (camelCase)
        // 2. 'payload' for API (snake_case)
        return estateManager.update(updates as any, payload);
    }
};

// Legacy Writable-like subscribe for compatibility if needed
// (Though we should move to .current where possible)
export const subscribeProfile = (run: (v: EstateProfile) => void) => {
    // Basic effect-like subscription
    const unsubscribe = $effect.root(() => {
        $effect(() => {
            run(estateProfile.current);
        });
    });
    return unsubscribe;
};
