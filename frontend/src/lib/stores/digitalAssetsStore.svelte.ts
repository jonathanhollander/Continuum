import { registerSync } from "$lib/services/sync.svelte";
import { oneSpelling } from "$lib/utils/oneSpelling";

export type ClosurePreference = 'memorialize' | 'delete' | 'transfer' | 'none';

export interface DigitalAccount {
    id: string;
    platform: string;
    name?: string;
    username: string;
    preference?: ClosurePreference;
    instructions?: string;
    priority?: 'low' | 'medium' | 'high';
    isClosed?: boolean;
    closureDate?: string | null;
    description?: string; // From page usage
    type?: string;        // From page usage
}

const digitalAssetMapper = (item: any) => {
    if (!item) return item;
    return {
        // One spelling per field (camel; the wire snake-cases it), newest value kept
        ...oneSpelling(item, { isClosed: 'is_closed', closureDate: 'closure_date' }),
        // Asset.name is required by the server; the digital UI only collects platform
        name: item.name || item.platform || item.description || 'Digital account'
    };
};

export const digitalAssetsSync = registerSync<DigitalAccount>('digital_assets', 'digital_assets', digitalAssetMapper).setAffirmationContext('general');

// Un-namespaced legacy keys ('digital_assets', 'continuum_digital_accounts') carry no account,
// so they are never adopted into whichever account happens to be signed in.

// Wrapper for compatibility
export const digitalAssetsStore = {
    get items() { return digitalAssetsSync.items; },
    // Resolves with the saved record (the server assigns its id); rejects when the save fails.
    addAccount: (acc: Omit<DigitalAccount, 'id'>) =>
        digitalAssetsSync.create({ ...acc, isClosed: false }),
    removeAccount: (id: string) => digitalAssetsSync.delete(id),
    updateAccount: (id: string, data: Partial<DigitalAccount>) => digitalAssetsSync.update(id, data),
    toggleClosure: (id: string) => {
        const item = digitalAssetsSync.items.find(i => i.id === id);
        if (item) {
            digitalAssetsSync.update(id, {
                isClosed: !item.isClosed,
                closureDate: !item.isClosed ? new Date().toISOString() : null // null clears it on the server
            });
        }
    },
    // Store Compatibility
    subscribe: digitalAssetsSync.subscribe.bind(digitalAssetsSync)
};
