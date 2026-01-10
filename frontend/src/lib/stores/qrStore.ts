import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

export type AccessPack = {
    id: string;
    name: string;
    description: string;
    type: 'Family' | 'Executor' | 'Public';
    modules: string[]; // List of module IDs this pack grants access to
    qrUrl: string;
    lastGenerated: string;
};

export type AssetLabel = {
    id: string;
    assetId: string;
    assetName: string;
    assetType: 'Heirloom' | 'Property' | 'Document' | 'Other';
    qrUrl: string;
    location?: string;
};

interface QRState {
    accessPacks: AccessPack[];
    assetLabels: AssetLabel[];
}

const initialState: QRState = {
    accessPacks: [
        {
            id: 'pack-family',
            name: 'Family Essentials Pack',
            description: 'Limited access to funeral wishes, immediate contacts, and heirloom stories.',
            type: 'Family',
            modules: ['funeral', 'contacts', 'heirlooms'],
            qrUrl: '',
            lastGenerated: ''
        },
        {
            id: 'pack-executor',
            name: 'Executor Master Pack',
            description: 'Full access to financial accounts, legal documents, and digital legacy.',
            type: 'Executor',
            modules: ['all'],
            qrUrl: '',
            lastGenerated: ''
        }
    ],
    assetLabels: []
};

const createQRStore = () => {
    const { subscribe, set, update } = writable<QRState>(initialState);

    if (browser) {
        const saved = localStorage.getItem('continuum_qr_store');
        if (saved) {
            try {
                set(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load QR store', e);
            }
        }
    }

    const save = (state: QRState) => {
        if (browser) {
            localStorage.setItem('continuum_qr_store', JSON.stringify(state));
        }
    };

    return {
        subscribe,
        generatePackQR: (packId: string) => {
            update(state => {
                const pack = state.accessPacks.find(p => p.id === packId);
                if (pack) {
                    const deepLink = `${window.location.origin}/access?key=${pack.id}&type=${pack.type}`;
                    pack.qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(deepLink)}`;
                    pack.lastGenerated = new Date().toISOString();
                }
                save(state);
                return state;
            });
        },
        generateAssetQR: (asset: Omit<AssetLabel, 'qrUrl'>) => {
            update(state => {
                const existing = state.assetLabels.find(l => l.assetId === asset.assetId);
                if (existing) return state;

                const deepLink = `${window.location.origin}/modules/${asset.assetType.toLowerCase() === 'heirlooms' ? 'heirlooms' : 'property'}?id=${asset.assetId}`;
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(deepLink)}`;

                const newLabel: AssetLabel = { ...asset, qrUrl };
                state.assetLabels = [newLabel, ...state.assetLabels];

                save(state);
                return state;
            });
        },
        removeAssetQR: (assetId: string) => {
            update(state => {
                state.assetLabels = state.assetLabels.filter(l => l.assetId !== assetId);
                save(state);
                return state;
            });
        }
    };
};

export const qrStore = createQRStore();
