import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type AppTone = 'planning' | 'grief' | 'executor';

interface ToneState {
    mode: AppTone;
    intensity: number; // 0 to 1, could scale animations or color saturation
}

import { createProfileStore } from './persistence';

// ... imports

// const STORAGE_KEY = 'continuum_app_tone'; // Replaced by namespaced key
const STORE_KEY = 'app_tone'; // persistence handles prefix

const DEFAULT_STATE: ToneState = {
    mode: 'planning',
    intensity: 0.5
};

function createToneStore() {
    // use createProfileStore for automatic account/profile syncing
    const store = createProfileStore<ToneState>(STORE_KEY, DEFAULT_STATE);
    const { subscribe, update } = store;

    if (browser) {
        subscribe(value => {
            // Side Effect: Apply class to body for global CSS targeting
            // We don't need to manually save to localStorage, createProfileStore does it.
            document.body.classList.remove('tone-planning', 'tone-grief', 'tone-executor');
            document.body.classList.add(`tone-${value.mode}`);
        });
    }

    return {
        subscribe,
        setMode: (mode: AppTone) => update(s => ({ ...s, mode })),
        setIntensity: (intensity: number) => update(s => ({ ...s, intensity })),
        toggleMode: () => update(s => {
            const nextMode: AppTone = s.mode === 'planning' ? 'grief' : 'planning';
            return { ...s, mode: nextMode };
        })
    };
}

export const toneStore = createToneStore();
