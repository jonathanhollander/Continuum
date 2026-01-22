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

const estateMapper = (raw: any): any => {
    if (!raw) return raw;
    return {
        // Remote (snake) -> Local (camel)
        ownerName: raw.owner_name ?? raw.ownerName ?? '',
        dateOfDeath: raw.date_of_death ?? raw.dateOfDeath ?? '',
        executorName: raw.executor_name ?? raw.executorName ?? '',
        spouseName: raw.spouse_name ?? raw.spouseName ?? '',
        primaryBeneficiary: raw.primary_beneficiary ?? raw.primaryBeneficiary ?? '',
        last4SSN: raw.last4_ssn ?? raw.last4SSN ?? '',
        legalAddress: raw.legal_address ?? raw.legalAddress ?? '',
        legalCityState: raw.legal_city_state ?? raw.legalCityState ?? '',
        totalValue: raw.total_value ?? raw.totalValue ?? 0,
        // Local (camel) -> Remote (snake)
        ['owner_name']: raw.ownerName ?? raw.owner_name,
        ['date_of_death']: raw.dateOfDeath ?? raw.date_of_death,
        ['executor_name']: raw.executorName ?? raw.executor_name,
        ['spouse_name']: raw.spouseName ?? raw.spouse_name,
        ['primary_beneficiary']: raw.primaryBeneficiary ?? raw.primary_beneficiary,
        ['last4_ssn']: raw.last4SSN ?? raw.last4_ssn,
        ['legal_address']: raw.legalAddress ?? raw.legal_address,
        ['legal_city_state']: raw.legalCityState ?? raw.legal_city_state,
        ['total_value']: raw.totalValue ?? raw.total_value
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
