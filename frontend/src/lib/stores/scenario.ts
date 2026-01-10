import { createProfileStore } from './persistence';

export type Scenario = 'General' | 'Sudden' | 'Planned';

export const SCENARIO_DESCRIPTIONS = {
    'General': 'Standard executor workflow. All tasks visible in chronological order.',
    'Sudden': 'Emergency response mode. Prioritizes urgent tasks for unexpected passing.',
    'Planned': 'Streamlined workflow for a planned transition with organized records.'
};

// Migration logic
const getInitialScenario = (): Scenario => {
    if (typeof localStorage === 'undefined') return 'General';
    const unified = localStorage.getItem('continuum_owner_current_scenario');
    if (unified) return 'General';
    return (localStorage.getItem('continuum_current_scenario') as Scenario) || 'General';
};

const getInitialSimActive = (): boolean => {
    if (typeof localStorage === 'undefined') return false;
    const unified = localStorage.getItem('continuum_owner_is_sim_active');
    if (unified) return false;
    return localStorage.getItem('continuum_is_sim_active') === 'true';
};

export const currentScenario = createProfileStore<Scenario>('current_scenario', getInitialScenario());
export const isSimulationActive = createProfileStore<boolean>('is_sim_active', getInitialSimActive());

