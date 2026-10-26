import { registerSingletonSync } from "$lib/services/sync.svelte";

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
 * Wire contract (shared by every store on estate/profile): keys are sent snake_case, the server
 * keeps exactly what was posted (shallow merge), and SyncManager camelCases them on the way back.
 * A mapper must therefore read the camelCase that toCamel(toSnake(key)) produces: "last4SSN" goes
 * out as last4_ssn and returns as last4Ssn.
 * Only this profile's own keys are sent, so saving it never rewrites the tone, onboarding,
 * scenario, concierge or complexity keys other stores keep in the same record.
 */
const estateMapper = (data: any): EstateProfile => {
    const src = data && typeof data === 'object' ? data : {};
    const out: any = { ...DEFAULT_PROFILE };
    for (const k of Object.keys(DEFAULT_PROFILE)) {
        if (src[k] !== undefined) out[k] = src[k];
    }
    if (src.last4SSN === undefined && src.last4Ssn !== undefined) out.last4SSN = src.last4Ssn;
    return out;
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
