/** Account-owned Cards/Table preferences, persisted one module at a time. */
import { browser } from '$app/environment';
import { API_BASE_URL } from '$lib/config';
import {
    captureSession, isCurrentSession, sessionToken, SessionChangedError, type SessionOwnership,
} from '$lib/services/sessionOwnership';

export type ViewMode = 'card' | 'table';
interface ViewPreferences { [module: string]: ViewMode; }
interface UserPreferencesState { view_preferences: ViewPreferences; }

let preferences = $state<ViewPreferences>({});
let isInitialized = $state(false);
let isLoading = $state(false);
let preferenceOwner: SessionOwnership | null = null;
let epoch = 0;
let editedModes: ViewPreferences = {};
let inFlight: { owner: SessionOwnership; epoch: number; run: Promise<void> } | null = null;
let writes: Promise<void> = Promise.resolve();

function reset(): void {
    epoch++;
    preferences = {};
    editedModes = {};
    preferenceOwner = null;
    inFlight = null;
    writes = Promise.resolve();
    isInitialized = false;
    isLoading = false;
}

function selectOwner(owner: SessionOwnership): void {
    if (preferenceOwner?.generation !== owner.generation) {
        reset();
        preferenceOwner = owner;
    }
}

function ownsPreferences(owner: SessionOwnership, version: number): boolean {
    return epoch === version && preferenceOwner?.generation === owner.generation && isCurrentSession(owner);
}

/** The shared fetch hook refreshes this session; the local epoch also guards abandoned loads. */
async function requestPreferences(owner: SessionOwnership, version: number, init: RequestInit = {}): Promise<Response> {
    if (!ownsPreferences(owner, version)) throw new SessionChangedError();
    const response = await fetch(`${API_BASE_URL}/api/auth/me/preferences`, {
        ...init,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken(owner)}` },
    });
    if (!ownsPreferences(owner, version)) throw new SessionChangedError();
    return response;
}

function init(): Promise<void> {
    const owner = captureSession();
    if (!browser || !owner.token || !owner.ready || !isCurrentSession(owner)) return Promise.resolve();
    selectOwner(owner);
    if (isInitialized) return Promise.resolve();
    if (inFlight?.owner.generation === owner.generation && inFlight.epoch === epoch) return inFlight.run;

    const version = epoch;
    isLoading = true;
    const entry = { owner, epoch: version, run: (async () => {
        try {
            const response = await requestPreferences(owner, version);
            if (!ownsPreferences(owner, version)) return;
            if (!response.ok) throw new Error(`Preference load returned ${response.status}`);
            const data: UserPreferencesState = await response.json();
            if (!ownsPreferences(owner, version)) return;
            // A choice made while the initial read was pending is newer than that read.
            preferences = { ...(data.view_preferences || {}), ...editedModes };
            isInitialized = true;
        } catch (error) {
            if (!ownsPreferences(owner, version)) return;
            console.warn('Could not load view preferences:', error);
            preferences = { ...editedModes };
            isInitialized = true;
        } finally {
            if (inFlight?.epoch === version && ownsPreferences(owner, version)) {
                inFlight = null;
                isLoading = false;
            }
        }
    })() };
    inFlight = entry;
    return entry.run;
}

function getViewMode(module: string): ViewMode {
    const mode = preferences[module]; // Read reactive state even before the first owner is ready.
    return preferenceOwner && isCurrentSession(preferenceOwner) ? mode || 'card' : 'card';
}

function setViewMode(module: string, mode: ViewMode): Promise<void> {
    const owner = captureSession();
    if (!browser || !owner.token || !owner.ready || !isCurrentSession(owner)) return Promise.resolve();
    selectOwner(owner);
    const version = epoch;
    editedModes[module] = mode;
    preferences[module] = mode;
    // Serialize this session's writes; a new session starts its own queue immediately.
    const run = writes.then(async () => {
        if (!ownsPreferences(owner, version)) return;
        try {
            const response = await requestPreferences(owner, version, {
                method: 'PATCH', body: JSON.stringify({ view_preferences: { [module]: mode } }),
            });
            if (!ownsPreferences(owner, version)) return;
            if (!response.ok) console.warn('Could not save view preference:', response.status);
        } catch (error) {
            if (ownsPreferences(owner, version)) console.warn('Could not save view preference:', error);
        }
    });
    writes = run;
    return run;
}

export const userPreferencesStore = {
    init, getViewMode, setViewMode, reset,
    get isInitialized() { return isInitialized && !!preferenceOwner && isCurrentSession(preferenceOwner); },
    get isLoading() { return isLoading && !!preferenceOwner && isCurrentSession(preferenceOwner); },
    get preferences() {
        const current = { ...preferences };
        return preferenceOwner && isCurrentSession(preferenceOwner) ? current : {};
    },
};
