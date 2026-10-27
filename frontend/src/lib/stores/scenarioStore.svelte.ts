import { registerProfileSlice } from "$lib/services/sync.svelte";

export type Scenario = 'General' | 'Sudden' | 'Planned';

export const SCENARIO_DESCRIPTIONS = {
    'General': 'Every step, in the order most families take them.',
    'Sudden': 'The first days come first, with the most time-sensitive steps at the top.',
    'Planned': 'The administrative and asset steps, for when much of the groundwork is already in place.'
};

interface ScenarioSettings {
    currentScenario: Scenario;
    isSimActive: boolean;
}

const manager = registerProfileSlice<ScenarioSettings>('scenario_settings', (data: Record<string, unknown>) => ({
    currentScenario: (data.currentScenario || 'General') as Scenario,
    isSimActive: data.isSimActive === true
}));

export const currentScenario = {
    subscribe: (fn: (value: Scenario) => void) => manager.subscribe(val => fn(val?.currentScenario || 'General')),
    set: (val: Scenario) => manager.update({ currentScenario: val })
};

export const isSimulationActive = {
    subscribe: (fn: (value: boolean) => void) => manager.subscribe(val => fn(val?.isSimActive || false)),
    set: (val: boolean) => manager.update({ isSimActive: val })
};

export const scenarioStore = {
    subscribe: manager.subscribe.bind(manager),
    get data() { return manager.data || { currentScenario: 'General', isSimActive: false }; },
    update: (updates: Partial<ScenarioSettings>) => manager.update(updates),
    sync: () => manager.sync()
};
