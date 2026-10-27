import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import QRCode from 'qrcode';
import { getStored, setStored } from './persistence';
import { activeAccountId } from './keyringStore';

export type AccessPack = {
    id: string;
    name: string;
    description: string;
    type: 'Family' | 'Executor' | 'Public';
    modules: string[]; // Suggested topics; pack codes open an authenticated page.
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

const PACK_DESCRIPTIONS: Record<string, string> = {
    'pack-family': 'Opens Dashboard in the signed-in account.',
    'pack-executor': 'Opens the executor guide in the signed-in account.',
};

const initialState = (): QRState => ({
    accessPacks: [
        {
            id: 'pack-family',
            name: 'Family Essentials Pack',
            description: PACK_DESCRIPTIONS['pack-family'],
            type: 'Family',
            modules: ['funeral', 'contacts', 'heirlooms'],
            qrUrl: '',
            lastGenerated: ''
        },
        {
            id: 'pack-executor',
            name: 'Executor Master Pack',
            description: PACK_DESCRIPTIONS['pack-executor'],
            type: 'Executor',
            modules: ['all'],
            qrUrl: '',
            lastGenerated: ''
        }
    ],
    assetLabels: []
});

// Where a scanned code opens. A pack opens the page its holder starts from; a label opens its own record.
const PACK_PATHS: Record<string, string> = { 'pack-family': '/dashboard', 'pack-executor': '/executor' };

// The code is drawn here in the browser (an SVG data URL), so the link never leaves the device.
const qrImage = (link: string, size: number) => {
    const { size: n, data } = QRCode.create(link, { errorCorrectionLevel: 'M' }).modules;
    const quiet = 4;
    let path = '';
    for (let r = 0; r < n; r++)
        for (let c = 0; c < n; c++)
            if (data[r * n + c]) path += `M${c + quiet} ${r + quiet}h1v1h-1z`;
    const box = n + quiet * 2;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${box} ${box}" shape-rendering="crispEdges"><rect width="${box}" height="${box}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const assetDeepLink = (assetType: AssetLabel['assetType'], assetId: string | number) =>
    `${window.location.origin}/modules/${assetType === 'Heirloom' ? 'heirlooms' : 'property'}?id=${assetId}`;

export const assetQrImage = (assetType: AssetLabel['assetType'], assetId: string | number, size = 200) =>
    qrImage(assetDeepLink(assetType, assetId), size);

const packQrImage = (pack: AccessPack) =>
    qrImage(`${window.location.origin}${PACK_PATHS[pack.id] ?? '/dashboard'}`, 300);

// Codes are drawn on load and saved without their images, so every saved code opens a real page.
const withCurrentLinks = (state: QRState): QRState => ({
    ...state,
    accessPacks: state.accessPacks.map((p) => ({
        ...p,
        // Descriptions are current product copy, including for packs saved before this wording.
        description: PACK_DESCRIPTIONS[p.id] ?? p.description,
        qrUrl: p.qrUrl || p.lastGenerated ? packQrImage(p) : '',
    })),
    assetLabels: state.assetLabels.map((l) => ({ ...l, qrUrl: assetQrImage(l.assetType, l.assetId) })),
});

// Each account keeps its own codes (the getStored namespace); the old shared 'continuum_qr_store' key carries no account, so it is never read.
const STORE_KEY = 'qr_store';
const load = (): QRState => {
    const saved = getStored<QRState | null>(STORE_KEY, null);
    if (!saved || typeof saved !== 'object') return initialState();
    try {
        return withCurrentLinks(saved);
    } catch (e) {
        console.error('Failed to load QR store', e);
        return initialState();
    }
};

const createQRStore = () => {
    const { subscribe, set, update } = writable<QRState>(initialState());

    // Load for the signed-in account, and again whenever the account changes.
    if (browser) activeAccountId.subscribe(() => set(load()));

    const save = (state: QRState) => {
        if (browser) {
            setStored(STORE_KEY, {
                accessPacks: state.accessPacks.map((p) => ({ ...p, qrUrl: '' })),
                assetLabels: state.assetLabels.map((l) => ({ ...l, qrUrl: '' })),
            });
        }
    };

    return {
        subscribe,
        generatePackQR: (packId: string) => {
            update(state => {
                const next = {
                    ...state,
                    accessPacks: state.accessPacks.map(p =>
                        p.id === packId ? { ...p, qrUrl: packQrImage(p), lastGenerated: new Date().toISOString() } : p),
                };
                save(next);
                return next;
            });
        },
        generateAssetQR: (asset: Omit<AssetLabel, 'qrUrl'>) => {
            update(state => {
                // An heirloom and a property can share an id number, so a label is matched on both.
                const existing = state.assetLabels.find(l => l.assetId === asset.assetId && l.assetType === asset.assetType);
                if (existing) return state;

                const qrUrl = assetQrImage(asset.assetType, asset.assetId);

                const newLabel: AssetLabel = { ...asset, qrUrl };
                const next = { ...state, assetLabels: [newLabel, ...state.assetLabels] };

                save(next);
                return next;
            });
        },
        removeAssetQR: (assetId: string, assetType?: AssetLabel['assetType']) => {
            update(state => {
                const next = {
                    ...state,
                    assetLabels: state.assetLabels.filter(
                        l => !(l.assetId === assetId && (assetType === undefined || l.assetType === assetType)),
                    ),
                };
                save(next);
                return next;
            });
        }
    };
};

export const qrStore = createQRStore();
