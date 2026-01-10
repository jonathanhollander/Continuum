import { derived } from 'svelte/store';
import { triggerMagic } from './magicStore';
import { createProfileStore } from './persistence';

export interface AcceptanceTask {
    id: string;
    page: string;
    role: 'owner' | 'executor' | 'family';
    check: string;
    status: 'Pending' | 'Complete';
    estTime: number;
    section: string;
    complexity: 'simple' | 'moderate' | 'complex';
}

const DEFAULT_TASKS: AcceptanceTask[] = [
    { id: '1', page: 'Preparation Hub', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 20, section: 'Top Level', complexity: 'simple' },
    { id: '2', page: 'Executor Hub', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 20, section: 'Top Level', complexity: 'simple' },
    { id: '3', page: 'Family Hub', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 20, section: 'Top Level', complexity: 'simple' },
    { id: '4', page: 'Legal Documents', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 25, section: 'Top Level', complexity: 'simple' },
    { id: '5', page: 'Financial Accounts', role: 'owner', check: 'Add institution contacts, balances, and closure steps.', status: 'Pending', estTime: 30, section: 'Top Level', complexity: 'moderate' },
    { id: '6', page: 'Property & Assets', role: 'owner', check: 'Add deed/mortgage info and point of contact.', status: 'Pending', estTime: 30, section: 'Top Level', complexity: 'moderate' },
    { id: '7', page: 'Insurance', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 30, section: 'Top Level', complexity: 'moderate' },
    { id: '8', page: 'Subscriptions', role: 'owner', check: 'List services, login methods, next billing dates.', status: 'Pending', estTime: 30, section: 'Top Level', complexity: 'moderate' },
    { id: '9', page: 'Letters', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 45, section: 'Top Level', complexity: 'moderate' },
    { id: '10', page: 'Memories & Keepsakes', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 20, section: 'Top Level', complexity: 'simple' },
    { id: '11', page: 'Contacts', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 25, section: 'Top Level', complexity: 'simple' },
    { id: '12', page: 'QR Codes', role: 'owner', check: 'Confirm each QR points to the intended page and permissions are correct.', status: 'Pending', estTime: 25, section: 'Top Level', complexity: 'moderate' },
    { id: '13', page: 'Living Will – Sample Document', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 75, section: 'Legal Documents', complexity: 'complex' },
    { id: '14', page: 'Power of Attorney – Sample', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 75, section: 'Legal Documents', complexity: 'complex' },
    { id: '15', page: 'Advance Directive – Sample', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 75, section: 'Legal Documents', complexity: 'complex' },
    { id: '16', page: 'Trust – Sample Outline', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 75, section: 'Legal Documents', complexity: 'complex' },
    { id: '17', page: 'Executor Checklist', role: 'owner', check: 'Review first-48-hours tasks and note what’s done.', status: 'Pending', estTime: 25, section: 'Executor Hub', complexity: 'simple' },
    { id: '18', page: 'Bank & Account Access Notes', role: 'owner', check: 'Add institution contacts, balances, and closure steps.', status: 'Pending', estTime: 30, section: 'Executor Hub', complexity: 'moderate' },
    { id: '19', page: 'Funeral & Memorial Preferences', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 25, section: 'Executor Hub', complexity: 'simple' },
    { id: '20', page: 'Messages for Family', role: 'owner', check: 'Write a short note in your own words and remove this prompt.', status: 'Pending', estTime: 25, section: 'Family Hub', complexity: 'simple' },
    { id: '21', page: 'Keepsakes Index', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 20, section: 'Family Hub', complexity: 'simple' },
    { id: '22', page: 'Primary Bank Accounts', role: 'owner', check: 'Add institution contacts, balances, and closure steps.', status: 'Pending', estTime: 30, section: 'Financial Accounts', complexity: 'moderate' },
    { id: '23', page: 'Credit Cards', role: 'owner', check: 'List issuer contacts, last four digits, and closure instructions.', status: 'Pending', estTime: 30, section: 'Financial Accounts', complexity: 'moderate' },
    { id: '24', page: 'Brokerage & Retirement', role: 'owner', check: 'Upload latest statements and confirm beneficiaries/transfers.', status: 'Pending', estTime: 25, section: 'Financial Accounts', complexity: 'complex' },
    { id: '25', page: 'Real Estate', role: 'owner', check: 'Add deed/mortgage info and point of contact.', status: 'Pending', estTime: 25, section: 'Property & Assets', complexity: 'moderate' },
    { id: '26', page: 'Vehicles', role: 'owner', check: 'Add VIN, title location, insurer details.', status: 'Pending', estTime: 25, section: 'Property & Assets', complexity: 'moderate' },
    { id: '27', page: 'Digital Assets', role: 'owner', check: 'Document access paths and any recovery instructions.', status: 'Pending', estTime: 50, section: 'Property & Assets', complexity: 'complex' },
    { id: '28', page: 'Life Insurance', role: 'owner', check: 'Upload policy, confirm beneficiary, note claim contact path.', status: 'Pending', estTime: 30, section: 'Insurance', complexity: 'moderate' },
    { id: '29', page: 'Homeowners/Renters', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 25, section: 'Insurance', complexity: 'simple' },
    { id: '30', page: 'Health Insurance', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 30, section: 'Insurance', complexity: 'simple' },
    { id: '31', page: 'Streaming Services', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 25, section: 'Subscriptions', complexity: 'simple' },
    { id: '32', page: 'Utilities', role: 'owner', check: 'List services, login methods, next billing dates.', status: 'Pending', estTime: 25, section: 'Subscriptions', complexity: 'moderate' },
    { id: '33', page: 'Online Services', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 25, section: 'Subscriptions', complexity: 'moderate' },
    { id: '34', page: 'QR – Family Essentials', role: 'owner', check: 'Confirm each QR points to the intended page and permissions are correct.', status: 'Pending', estTime: 10, section: 'QR Codes', complexity: 'simple' },
    { id: '35', page: 'QR – Full Access for Executor', role: 'owner', check: 'Confirm each QR points to the intended page and permissions are correct.', status: 'Pending', estTime: 10, section: 'QR Codes', complexity: 'moderate' },
    { id: '36', page: 'Letter — Bank Notification', role: 'owner', check: 'Add institution contacts, balances, and closure steps.', status: 'Pending', estTime: 45, section: 'Letters', complexity: 'moderate' },
    { id: '37', page: 'Letter — Credit Card Closure', role: 'owner', check: 'List issuer contacts, last four digits, and closure instructions.', status: 'Pending', estTime: 45, section: 'Letters', complexity: 'moderate' },
    { id: '38', page: 'Letter — Utility Transfer', role: 'owner', check: 'Add institution contacts, balances, and closure steps.', status: 'Pending', estTime: 45, section: 'Letters', complexity: 'moderate' },
    { id: '39', page: 'Letter — Insurance Claim', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 45, section: 'Letters', complexity: 'moderate' },
    { id: '40', page: 'Letter — Employer HR Notice', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 45, section: 'Letters', complexity: 'moderate' },
    { id: '41', page: 'Letter — Subscription Cancellation', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 45, section: 'Letters', complexity: 'moderate' },
    { id: '42', page: 'Letter — Social Media', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 45, section: 'Letters', complexity: 'moderate' },
    { id: '43', page: 'DB Setup: Accounts', role: 'owner', check: 'Add institution contacts, balances, and closure steps.', status: 'Pending', estTime: 20, section: 'Database Setup', complexity: 'moderate' },
    { id: '44', page: 'DB Setup: Property', role: 'owner', check: 'Add deed/mortgage info and point of contact.', status: 'Pending', estTime: 20, section: 'Database Setup', complexity: 'moderate' },
    { id: '45', page: 'DB Setup: Insurance', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 20, section: 'Database Setup', complexity: 'moderate' },
    { id: '46', page: 'DB Setup: Contacts', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 20, section: 'Database Setup', complexity: 'simple' },
    { id: '47', page: 'DB Setup: Subscriptions', role: 'owner', check: 'List services, login methods, next billing dates.', status: 'Pending', estTime: 20, section: 'Database Setup', complexity: 'moderate' },
    { id: '48', page: 'DB Setup: Keepsakes', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 20, section: 'Database Setup', complexity: 'simple' },
    { id: '49', page: 'DB Setup: Letters Index', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 20, section: 'Database Setup', complexity: 'moderate' }
];

export type EstateComplexity = 'simple' | 'moderate' | 'complex';

// Migration Logic
const getInitialTasks = (): AcceptanceTask[] => {
    if (typeof localStorage === 'undefined') return DEFAULT_TASKS;
    const unified = localStorage.getItem('continuum_owner_acceptance_tasks');
    if (unified) return DEFAULT_TASKS;
    const legacy = localStorage.getItem('continuum_acceptance_tasks');
    if (legacy) {
        try {
            return JSON.parse(legacy);
        } catch (e) {
            console.error('Failed to parse acceptance tasks', e);
        }
    }
    return DEFAULT_TASKS;
};

const getInitialComplexity = (): EstateComplexity => {
    if (typeof localStorage === 'undefined') return 'moderate';
    const unified = localStorage.getItem('continuum_owner_estate_complexity');
    if (unified) return 'moderate';
    return (localStorage.getItem('continuum_estate_complexity') as EstateComplexity) || 'moderate';
};

export const acceptanceTasks = createProfileStore<AcceptanceTask[]>('acceptance_tasks', getInitialTasks());
export const estateComplexity = createProfileStore<EstateComplexity>('estate_complexity', getInitialComplexity());

export const acceptanceStore = {
    toggleTask: (id: string) => {
        acceptanceTasks.update(tasks => tasks.map(t => {
            if (t.id === id) {
                const newStatus = t.status === 'Pending' ? 'Complete' : 'Pending';
                if (newStatus === 'Complete') triggerMagic('success');
                return { ...t, status: newStatus };
            }
            return t;
        }));
    },

    resetTasks: () => {
        acceptanceTasks.set(DEFAULT_TASKS);
    },

    setComplexity: (level: EstateComplexity) => {
        estateComplexity.set(level);
    }
};

// Derived store to filter tasks based on complexity
export const filteredTasks = derived(
    [acceptanceTasks, estateComplexity],
    ([$tasks, $complexity]) => {
        return $tasks.filter(task => {
            if ($complexity === 'simple') return task.complexity === 'simple';
            if ($complexity === 'moderate') return task.complexity === 'simple' || task.complexity === 'moderate';
            return true; // complex shows all
        });
    }
);

// Derived store for overall progress
export const acceptanceProgress = derived(filteredTasks, ($filteredTasks) => {
    if ($filteredTasks.length === 0) return 0;
    const completed = $filteredTasks.filter(t => t.status === 'Complete').length;
    return Math.round((completed / $filteredTasks.length) * 100);
});

// Calculate total estimated time remaining
export const timeRemaining = derived(filteredTasks, ($filteredTasks) => {
    return $filteredTasks
        .filter(t => t.status === 'Pending')
        .reduce((acc, t) => acc + t.estTime, 0);
});
