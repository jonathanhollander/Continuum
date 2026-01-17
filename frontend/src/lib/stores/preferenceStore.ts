import { writable } from 'svelte/store';
import { activeAccountId } from './keyringStore';

interface Preferences {
    expertMode: boolean;
    onboardingComplete: boolean;
}

const DEFAULT_PREFS: Preferences = {
    expertMode: false,
    onboardingComplete: false
};

function createPreferenceStore() {
    const { subscribe, set, update } = writable<Preferences>(DEFAULT_PREFS);

    // Reactive key based on active account
    let currentKey = 'continuum_prefs_global';

    activeAccountId.subscribe(id => {
        if (id) {
            currentKey = `continuum_prefs_${id}`;
            const stored = localStorage.getItem(currentKey);
            if (stored) {
                try {
                    set(JSON.parse(stored));
                } catch (e) {
                    set(DEFAULT_PREFS);
                }
            } else {
                set(DEFAULT_PREFS);
            }
        }
    });

    return {
        subscribe,
        setExpertMode: (val: boolean) => update(s => {
            const newState = { ...s, expertMode: val };
            localStorage.setItem(currentKey, JSON.stringify(newState));
            return newState;
        }),
        setOnboardingComplete: (val: boolean) => update(s => {
            const newState = { ...s, onboardingComplete: val };
            localStorage.setItem(currentKey, JSON.stringify(newState));
            return newState;
        }),
        reset: () => {
            localStorage.removeItem(currentKey);
            set(DEFAULT_PREFS);
        }
    };
}

export const preferenceStore = createPreferenceStore();
