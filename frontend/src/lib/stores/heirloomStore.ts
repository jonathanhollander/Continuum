import { createProfileStore, getLegacy } from './persistence';

export type Heirloom = {
    id: string;
    name: string;
    recipient: string;
    story: string;
    image: string;
    value?: string;
};

const DEFAULT_HEIRLOOMS: Heirloom[] = [];

// Migration / Initialization Logic
const getInitialData = (): Heirloom[] => {
    // Check for new unified data for owner
    const unified = getLegacy('continuum_owner_heirlooms');
    if (unified) return DEFAULT_HEIRLOOMS; // createProfileStore loads it

    // Fallback to legacy
    const legacy = getLegacy('continuum_heirlooms');
    if (legacy) {
        try {
            const parsed = JSON.parse(legacy);
            return Array.isArray(parsed) ? parsed : DEFAULT_HEIRLOOMS;
        } catch (e) {
            console.error("Migration failed for heirlooms", e);
        }
    }
    return DEFAULT_HEIRLOOMS;
};

// Use reactive profile store
export const heirloomStore = createProfileStore<Heirloom[]>('heirlooms', getInitialData());
