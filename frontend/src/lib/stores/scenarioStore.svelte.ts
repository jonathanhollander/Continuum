import { registerSingletonSync } from '$lib/services/sync.svelte';

export type Scenario = 'General' | 'Sudden' | 'Planned';

export const SCENARIO_DESCRIPTIONS = {
    'General': 'Standard executor workflow. All tasks visible in chronological order.',
    'Sudden': 'Emergency response mode. Prioritizes urgent tasks for unexpected passing.',
    'Planned': 'Streamlined workflow for a planned transition with organized records.'
};

interface ScenarioSettings {
    currentScenario: Scenario;
    isSimActive: boolean;
}

const manager = registerSingletonSync<ScenarioSettings>('scenario_settings', 'estate/profile', (data: any) => ({
    currentScenario: data.currentScenario || 'General',
    isSimActive: data.isSimActive === true
}), '/api');

export const currentScenario = {
    subscribe: (fn: any) => manager.subscribe(val => fn(val?.currentScenario || 'General')),
    set: (val: Scenario) => manager.update({ currentScenario: val })
};

export const isSimulationActive = {
    subscribe: (fn: any) => manager.subscribe(val => fn(val?.isSimActive || false)),
    set: (val: boolean) => manager.update({ isSimActive: val })
};

export const scenarioStore = {
    subscribe: manager.subscribe.bind(manager),
    get data() { return manager.data || { currentScenario: 'General', isSimActive: false }; },
    update: (updates: Partial<ScenarioSettings>) => manager.update(updates),
    sync: () => manager.sync()
};
