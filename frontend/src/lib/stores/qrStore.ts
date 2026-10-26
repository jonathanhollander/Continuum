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

// Where a scanned code opens. A pack opens the page its holder starts from; a label opens its own record.
const PACK_PATHS: Record<string, string> = { 'pack-family': '/dashboard', 'pack-executor': '/executor' };

const qrImage = (link: string, size: number) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(link)}`;

export const assetDeepLink = (assetType: AssetLabel['assetType'], assetId: string | number) =>
    `${window.location.origin}/modules/${assetType === 'Heirloom' ? 'heirlooms' : 'property'}?id=${assetId}`;

export const assetQrImage = (assetType: AssetLabel['assetType'], assetId: string | number, size = 200) =>
    qrImage(assetDeepLink(assetType, assetId), size);

const packQrImage = (pack: AccessPack) =>
    qrImage(`${window.location.origin}${PACK_PATHS[pack.id] ?? '/dashboard'}`, 300);

// Codes saved before the links were corrected are rebuilt on load, so every saved code opens a real page.
const withCurrentLinks = (state: QRState): QRState => ({
    ...state,
    accessPacks: state.accessPacks.map((p) => (p.qrUrl ? { ...p, qrUrl: packQrImage(p) } : p)),
    assetLabels: state.assetLabels.map((l) => ({ ...l, qrUrl: assetQrImage(l.assetType, l.assetId) })),
});

const createQRStore = () => {
    const { subscribe, set, update } = writable<QRState>(initialState);

    if (browser) {
        const saved = localStorage.getItem('continuum_qr_store');
        if (saved) {
            try {
                set(withCurrentLinks(JSON.parse(saved)));
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
                    pack.qrUrl = packQrImage(pack);
                    pack.lastGenerated = new Date().toISOString();
                }
                save(state);
                return state;
            });
        },
        generateAssetQR: (asset: Omit<AssetLabel, 'qrUrl'>) => {
            update(state => {
                // An heirloom and a property can share an id number, so a label is matched on both.
                const existing = state.assetLabels.find(l => l.assetId === asset.assetId && l.assetType === asset.assetType);
                if (existing) return state;

                const qrUrl = assetQrImage(asset.assetType, asset.assetId);

                const newLabel: AssetLabel = { ...asset, qrUrl };
                state.assetLabels = [newLabel, ...state.assetLabels];

                save(state);
                return state;
            });
        },
        removeAssetQR: (assetId: string, assetType?: AssetLabel['assetType']) => {
            update(state => {
                state.assetLabels = state.assetLabels.filter(
                    l => !(l.assetId === assetId && (assetType === undefined || l.assetType === assetType)),
                );
                save(state);
                return state;
            });
        }
    };
};

export const qrStore = createQRStore();
