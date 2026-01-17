import { createProfileStore } from './persistence';

export type ClosurePreference = 'memorialize' | 'delete' | 'transfer' | 'none';

export interface DigitalAccount {
    id: string;
    platform: string;
    username: string;
    preference: ClosurePreference;
    instructions: string;
    priority: 'low' | 'medium' | 'high';
    isClosed: boolean;
    closureDate?: string;
}

const DEFAULT_ACCOUNTS: Omit<DigitalAccount, 'id'>[] = [];

// Migration / Initialization Logic
const getInitialData = (): DigitalAccount[] => {
    // Helper to add IDs if creating fresh defaults
    const seedDefaults = () => DEFAULT_ACCOUNTS.map(a => ({
        ...a,
        id: typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `id-${Math.random().toString(36).slice(2, 11)}`
    }));

    if (typeof localStorage === 'undefined') return seedDefaults();

    // Check for new unified data
    const unified = localStorage.getItem('continuum_owner_digital_accounts');
    if (unified) return seedDefaults();

    // Fallback to legacy
    const legacy = localStorage.getItem('continuum_digital_accounts');
    if (legacy) {
        try {
            const parsed = JSON.parse(legacy);
            return Array.isArray(parsed) ? parsed : seedDefaults();
        } catch { /* ignore */ }
    }
    return seedDefaults();
};

function createReactiveDigitalAssetsStore() {
    const store = createProfileStore<DigitalAccount[]>('digital_accounts', getInitialData());
    const { subscribe, update } = store;

    return {
        subscribe,
        addAccount: (acc: Omit<DigitalAccount, 'id' | 'isClosed'>) => {
            update(accounts => [...accounts, { ...acc, id: crypto.randomUUID(), isClosed: false }]);
        },
        removeAccount: (id: string) => {
            update(accounts => accounts.filter(a => a.id !== id));
        },
        updateAccount: (id: string, data: Partial<DigitalAccount>) => {
            update(accounts => accounts.map(a => a.id === id ? { ...a, ...data } : a));
        },
        toggleClosure: (id: string) => {
            update(accounts => accounts.map(a => a.id === id ? {
                ...a,
                isClosed: !a.isClosed,
                closureDate: !a.isClosed ? new Date().toISOString() : undefined
            } : a));
        }
    };
}

export const digitalAssetsStore = createReactiveDigitalAssetsStore();
