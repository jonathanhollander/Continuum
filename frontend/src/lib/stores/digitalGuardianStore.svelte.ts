import { registerSingletonSync } from "$lib/services/sync.svelte";

// One row per account: the setup checklist and the fire drill as {step: boolean} maps.
// The server keeps each map as JSON text (/api/data/digital_guardian, like funeral_data).
export type GuardianChecks = Record<string, boolean>;
export type DigitalGuardianData = { setupStatus?: GuardianChecks; fireDrill?: GuardianChecks };

const toMap = (v: any): GuardianChecks | undefined => {
    if (typeof v === 'string') { try { v = JSON.parse(v); } catch { return undefined; } }
    return v && typeof v === 'object' && !Array.isArray(v) ? v : undefined;
};

// Keeps only the two maps, so "nothing saved yet" stays {} (no row is uploaded for an untouched page).
const guardianMapper = (data: Record<string, unknown>): DigitalGuardianData => {
    const out: DigitalGuardianData = {};
    if (!data || typeof data !== 'object' || Array.isArray(data)) return out;
    const status = toMap(data.setupStatus);
    const drill = toMap(data.fireDrill);
    if (status) out.setupStatus = status;
    if (drill) out.fireDrill = drill;
    return out;
};

export const digitalGuardianSync = registerSingletonSync<DigitalGuardianData>('digital_guardian', 'digital_guardian', guardianMapper, '/api/data');
