import { phase1Tasks } from './tasks/phase1';
import { phase2Tasks } from './tasks/phase2';
import { phase3Tasks } from './tasks/phase3';
import { phase4Tasks } from './tasks/phase4';
import { phase5Tasks } from './tasks/phase5';

export const executorTasks = [
    ...phase1Tasks,
    ...phase2Tasks,
    ...phase3Tasks,
    ...phase4Tasks,
    ...phase5Tasks
];
