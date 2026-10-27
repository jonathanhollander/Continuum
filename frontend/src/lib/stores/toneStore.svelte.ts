import { registerProfileSlice } from "$lib/services/sync.svelte";
import { browser } from '$app/environment';

export type AppTone = 'planning' | 'grief' | 'executor';

interface ToneState {
    mode: AppTone;
    intensity: number; // 0 to 1, could scale animations or color saturation
}

const manager = registerProfileSlice<ToneState>('app_tone', (data: Record<string, unknown>) => ({
    mode: (data.mode || data.toneMode || 'planning') as AppTone,
    intensity: (data.intensity !== undefined ? data.intensity : 0.5) as number
}));

if (browser) {
    manager.subscribe(value => {
        if (!value) return;
        document.body.classList.remove('tone-planning', 'tone-grief', 'tone-executor');
        document.body.classList.add(`tone-${value.mode}`);
    });
}

export const toneStore = {
    subscribe: manager.subscribe.bind(manager),
    get data() { return manager.data || { mode: 'planning', intensity: 0.5 }; },
    setMode: (mode: AppTone) => manager.update({ mode }),
    setIntensity: (intensity: number) => manager.update({ intensity }),
    toggleMode: () => {
        const currentMode = manager.data?.mode || 'planning';
        const nextMode: AppTone = currentMode === 'planning' ? 'grief' : 'planning';
        return manager.update({ mode: nextMode });
    },
    sync: () => manager.sync()
};
