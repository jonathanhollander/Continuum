import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface AutomationRule {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    type: 'notification' | 'task' | 'alert';
}

const defaultRules: AutomationRule[] = [
    {
        id: 'smart-reminders',
        name: 'Smart Deadline Reminders',
        description: 'Send alerts 3 days before task deadlines',
        enabled: true,
        type: 'notification'
    },
    {
        id: 'auto-followup',
        name: 'Auto-Task Creation',
        description: 'Create follow-up tasks when prerequisites complete',
        enabled: true,
        type: 'task'
    },
    {
        id: 'high-value-alert',
        name: 'High-Value Asset Monitor',
        description: 'Alert executor if account value exceeds $1M',
        enabled: true,
        type: 'alert'
    },
    {
        id: 'weekly-digest',
        name: 'Weekly Progress Digest',
        description: 'Email summary to family every Sunday morning',
        enabled: false,
        type: 'notification'
    }
];

// Initialize from localStorage if available
const initialRules = browser && localStorage.getItem('automationRules')
    ? JSON.parse(localStorage.getItem('automationRules')!)
    : defaultRules;

export const automationRules = writable<AutomationRule[]>(initialRules);

// Persist adjustments
if (browser) {
    automationRules.subscribe(value => {
        localStorage.setItem('automationRules', JSON.stringify(value));
    });
}
