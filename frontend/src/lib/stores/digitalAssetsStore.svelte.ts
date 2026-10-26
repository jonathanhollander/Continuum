import { registerSync } from "$lib/services/sync.svelte";

export type ClosurePreference = 'memorialize' | 'delete' | 'transfer' | 'none';

export interface DigitalAccount {
    id: string;
    platform: string;
    username: string;
    preference?: ClosurePreference;
    instructions?: string;
    priority?: 'low' | 'medium' | 'high';
    isClosed?: boolean;
    closureDate?: string;
    description?: string; // From page usage
    type?: string;        // From page usage
}

const digitalAssetMapper = (item: any) => {
    if (!item) return item;
    return {
        ...item,
        // Asset.name is required by the server; the digital UI only collects platform
        name: item.name || item.platform || item.description || 'Digital account',
        // Remote (snake) -> Local (camel)
        isClosed: item.is_closed ?? item.isClosed,
        closureDate: item.closure_date ?? item.closureDate,
        // Local (camel) -> Remote (snake)
        is_closed: item.isClosed ?? item.is_closed,
        closure_date: item.closureDate ?? item.closure_date
    };
};

export const digitalAssetsSync = registerSync<DigitalAccount>('digital_assets', 'digital_assets', digitalAssetMapper).setAffirmationContext('general');

// Un-namespaced legacy keys ('digital_assets', 'continuum_digital_accounts') carry no account,
// so they are never adopted into whichever account happens to be signed in.

// Wrapper for compatibility
export const digitalAssetsStore = {
    get items() { return digitalAssetsSync.items; },
    addAccount: (acc: Omit<DigitalAccount, 'id'>) => {
        digitalAssetsSync.create({
            ...acc,
            id: crypto.randomUUID(),
            isClosed: false
        });
    },
    removeAccount: (id: string) => digitalAssetsSync.delete(id),
    updateAccount: (id: string, data: Partial<DigitalAccount>) => digitalAssetsSync.update(id, data),
    toggleClosure: (id: string) => {
        const item = digitalAssetsSync.items.find(i => i.id === id);
        if (item) {
            digitalAssetsSync.update(id, {
                isClosed: !item.isClosed,
                closureDate: !item.isClosed ? new Date().toISOString() : undefined
            });
        }
    },
    // Store Compatibility
    subscribe: digitalAssetsSync.subscribe.bind(digitalAssetsSync)
};
