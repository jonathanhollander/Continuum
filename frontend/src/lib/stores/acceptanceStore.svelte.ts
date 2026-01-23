import { derived } from 'svelte/store';
import { triggerMagic } from './magicStore';
import { registerSync, registerSingletonSync } from "$lib/services/sync.svelte.ts";

export interface AcceptanceTask {
    id: number | string;
    taskId: string; // The canonical ID from DEFAULT_TASKS
    page: string;
    role: 'owner' | 'executor' | 'family';
    check: string;
    status: 'Pending' | 'Complete';
    estTime: number;
    section: string;
    complexity: 'simple' | 'moderate' | 'complex';
}

const DEFAULT_TASKS: AcceptanceTask[] = [
    { id: '1', taskId: '1', page: 'Preparation Hub', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 20, section: 'Top Level', complexity: 'simple' },
    { id: '2', taskId: '2', page: 'Executor Hub', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 20, section: 'Top Level', complexity: 'simple' },
    { id: '3', taskId: '3', page: 'Family Hub', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 20, section: 'Top Level', complexity: 'simple' },
    { id: '4', taskId: '4', page: 'Legal Documents', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 25, section: 'Top Level', complexity: 'simple' },
    { id: '5', taskId: '5', page: 'Financial Accounts', role: 'owner', check: 'Add institution contacts, balances, and closure steps.', status: 'Pending', estTime: 30, section: 'Top Level', complexity: 'moderate' },
    { id: '6', taskId: '6', page: 'Property & Assets', role: 'owner', check: 'Add deed/mortgage info and point of contact.', status: 'Pending', estTime: 30, section: 'Top Level', complexity: 'moderate' },
    { id: '7', taskId: '7', page: 'Insurance', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 30, section: 'Top Level', complexity: 'moderate' },
    { id: '8', taskId: '8', page: 'Subscriptions', role: 'owner', check: 'List services, login methods, next billing dates.', status: 'Pending', estTime: 30, section: 'Top Level', complexity: 'moderate' },
    { id: '9', taskId: '9', page: 'Letters', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 45, section: 'Top Level', complexity: 'moderate' },
    { id: '10', taskId: '10', page: 'Memories & Keepsakes', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 20, section: 'Top Level', complexity: 'simple' },
    { id: '11', taskId: '11', page: 'Contacts', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 25, section: 'Top Level', complexity: 'simple' },
    { id: '12', taskId: '12', page: 'QR Codes', role: 'owner', check: 'Confirm each QR points to the intended page and permissions are correct.', status: 'Pending', estTime: 25, section: 'Top Level', complexity: 'moderate' },
    { id: '13', taskId: '13', page: 'Living Will – Sample Document', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 75, section: 'Legal Documents', complexity: 'complex' },
    { id: '14', taskId: '14', page: 'Power of Attorney – Sample', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 75, section: 'Legal Documents', complexity: 'complex' },
    { id: '15', taskId: '15', page: 'Advance Directive – Sample', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 75, section: 'Legal Documents', complexity: 'complex' },
    { id: '16', taskId: '16', page: 'Trust – Sample Outline', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 75, section: 'Legal Documents', complexity: 'complex' },
    { id: '17', taskId: '17', page: 'Executor Checklist', role: 'owner', check: 'Review first-48-hours tasks and note what’s done.', status: 'Pending', estTime: 25, section: 'Executor Hub', complexity: 'simple' },
    { id: '18', taskId: '18', page: 'Bank & Account Access Notes', role: 'owner', check: 'Add institution contacts, balances, and closure steps.', status: 'Pending', estTime: 30, section: 'Executor Hub', complexity: 'moderate' },
    { id: '19', taskId: '19', page: 'Funeral & Memorial Preferences', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 25, section: 'Executor Hub', complexity: 'simple' },
    { id: '20', taskId: '20', page: 'Messages for Family', role: 'owner', check: 'Write a short note in your own words and remove this prompt.', status: 'Pending', estTime: 25, section: 'Family Hub', complexity: 'simple' },
    { id: '21', taskId: '21', page: 'Keepsakes Index', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 20, section: 'Family Hub', complexity: 'simple' },
    { id: '22', taskId: '22', page: 'Primary Bank Accounts', role: 'owner', check: 'Add institution contacts, balances, and closure steps.', status: 'Pending', estTime: 30, section: 'Financial Accounts', complexity: 'moderate' },
    { id: '23', taskId: '23', page: 'Credit Cards', role: 'owner', check: 'List issuer contacts, last four digits, and closure instructions.', status: 'Pending', estTime: 30, section: 'Financial Accounts', complexity: 'moderate' },
    { id: '24', taskId: '24', page: 'Brokerage & Retirement', role: 'owner', check: 'Upload latest statements and confirm beneficiaries/transfers.', status: 'Pending', estTime: 25, section: 'Financial Accounts', complexity: 'complex' },
    { id: '25', taskId: '25', page: 'Real Estate', role: 'owner', check: 'Add deed/mortgage info and point of contact.', status: 'Pending', estTime: 25, section: 'Property & Assets', complexity: 'moderate' },
    { id: '26', taskId: '26', page: 'Vehicles', role: 'owner', check: 'Add VIN, title location, insurer details.', status: 'Pending', estTime: 25, section: 'Property & Assets', complexity: 'moderate' },
    { id: '27', taskId: '27', page: 'Digital Assets', role: 'owner', check: 'Document access paths and any recovery instructions.', status: 'Pending', estTime: 50, section: 'Property & Assets', complexity: 'complex' },
    { id: '28', taskId: '28', page: 'Life Insurance', role: 'owner', check: 'Upload policy, confirm beneficiary, note claim contact path.', status: 'Pending', estTime: 30, section: 'Insurance', complexity: 'moderate' },
    { id: '29', taskId: '29', page: 'Homeowners/Renters', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 25, section: 'Insurance', complexity: 'simple' },
    { id: '30', taskId: '30', page: 'Health Insurance', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 30, section: 'Insurance', complexity: 'simple' },
    { id: '31', taskId: '31', page: 'Streaming Services', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 25, section: 'Subscriptions', complexity: 'simple' },
    { id: '32', taskId: '32', page: 'Utilities', role: 'owner', check: 'List services, login methods, next billing dates.', status: 'Pending', estTime: 25, section: 'Subscriptions', complexity: 'moderate' },
    { id: '33', taskId: '33', page: 'Online Services', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 25, section: 'Subscriptions', complexity: 'moderate' },
    { id: '34', taskId: '34', page: 'QR – Family Essentials', role: 'owner', check: 'Confirm each QR points to the intended page and permissions are correct.', status: 'Pending', estTime: 10, section: 'QR Codes', complexity: 'simple' },
    { id: '35', taskId: '35', page: 'QR – Full Access for Executor', role: 'owner', check: 'Confirm each QR points to the intended page and permissions are correct.', status: 'Pending', estTime: 10, section: 'QR Codes', complexity: 'moderate' },
    { id: '36', taskId: '36', page: 'Letter — Bank Notification', role: 'owner', check: 'Add institution contacts, balances, and closure steps.', status: 'Pending', estTime: 45, section: 'Letters', complexity: 'moderate' },
    { id: '37', taskId: '37', page: 'Letter — Credit Card Closure', role: 'owner', check: 'List issuer contacts, last four digits, and closure instructions.', status: 'Pending', estTime: 45, section: 'Letters', complexity: 'moderate' },
    { id: '38', taskId: '38', page: 'Letter — Utility Transfer', role: 'owner', check: 'Add institution contacts, balances, and closure steps.', status: 'Pending', estTime: 45, section: 'Letters', complexity: 'moderate' },
    { id: '39', taskId: '39', page: 'Letter — Insurance Claim', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 45, section: 'Letters', complexity: 'moderate' },
    { id: '40', taskId: '40', page: 'Letter — Employer HR Notice', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 45, section: 'Letters', complexity: 'moderate' },
    { id: '41', taskId: '41', page: 'Letter — Subscription Cancellation', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 45, section: 'Letters', complexity: 'moderate' },
    { id: '42', taskId: '42', page: 'Letter — Social Media', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 45, section: 'Letters', complexity: 'moderate' },
    { id: '43', taskId: '43', page: 'DB Setup: Accounts', role: 'owner', check: 'Add institution contacts, balances, and closure steps.', status: 'Pending', estTime: 20, section: 'Database Setup', complexity: 'moderate' },
    { id: '44', taskId: '44', page: 'DB Setup: Property', role: 'owner', check: 'Add deed/mortgage info and point of contact.', status: 'Pending', estTime: 20, section: 'Database Setup', complexity: 'moderate' },
    { id: '45', taskId: '45', page: 'DB Setup: Insurance', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 20, section: 'Database Setup', complexity: 'moderate' },
    { id: '46', taskId: '46', page: 'DB Setup: Contacts', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 20, section: 'Database Setup', complexity: 'simple' },
    { id: '47', taskId: '47', page: 'DB Setup: Subscriptions', role: 'owner', check: 'List services, login methods, next billing dates.', status: 'Pending', estTime: 20, section: 'Database Setup', complexity: 'moderate' },
    { id: '48', taskId: '48', page: 'DB Setup: Keepsakes', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 20, section: 'Database Setup', complexity: 'simple' },
    { id: '49', taskId: '49', page: 'DB Setup: Letters Index', role: 'owner', check: 'Personalize details, attach relevant files, and remove helpers when finished.', status: 'Pending', estTime: 20, section: 'Database Setup', complexity: 'moderate' }
];

export type EstateComplexity = 'simple' | 'moderate' | 'complex';

const mapper = (data: any): AcceptanceTask => ({
    ...data,
    id: typeof data.id === 'string' && data.id.length > 10 ? data.id : Number(data.id) || data.id,
});


const taskManager = registerSync<AcceptanceTask>('acceptance_tasks', 'acceptance_tasks', mapper, '/api/data');

// Complexity is now part of the global estate profile or a separate singleton
const complexityManager = registerSingletonSync<{ level: EstateComplexity }>('estate_complexity', 'estate/profile', (data: any) => ({
    level: data.complexity || 'moderate'
}), '/api');

export const acceptanceTasks = {
    subscribe: taskManager.subscribe.bind(taskManager),
    get items() {
        if (taskManager.items.length === 0) return DEFAULT_TASKS;
        return taskManager.items;
    },
    sync: () => taskManager.sync()
};

export const estateComplexity = {
    subscribe: complexityManager.subscribe.bind(complexityManager),
    get level() { return complexityManager.data?.level || 'moderate'; },
    set: (level: EstateComplexity) => complexityManager.update({ level })
};

export const acceptanceStore = {
    toggleTask: (id: string | number) => {
        const task = taskManager.items.find(t => String(t.id) === String(id)) || DEFAULT_TASKS.find(t => String(t.id) === String(id));
        if (task) {
            const newStatus = task.status === 'Pending' ? 'Complete' : 'Pending';
            if (newStatus === 'Complete') triggerMagic('success');

            // If it's a default task not yet in backend, create it
            const existing = taskManager.items.find(t => String(t.id) === String(id));
            if (!existing) {
                const { id: _, ...dataToCreate } = task;
                return taskManager.create({ ...dataToCreate, status: newStatus });
            } else {
                return taskManager.update(id, { status: newStatus });
            }
        }
    },

    resetTasks: async () => {
        // Typically would delete all and re-fetch, but for now we just clear items in local
        // and let them be recreated on next interaction.
        for (const item of taskManager.items) {
            await taskManager.delete(item.id);
        }
    },

    setComplexity: (level: EstateComplexity) => {
        estateComplexity.set(level);
    }
};

// Derived store to filter tasks based on complexity
export const filteredTasks = derived(
    [taskManager, complexityManager],
    ([$tasks, $complexity]) => {
        const tasks = $tasks.length > 0 ? $tasks : DEFAULT_TASKS;
        const level = $complexity?.level || 'moderate';

        return tasks.filter(task => {
            if (level === 'simple') return task.complexity === 'simple';
            if (level === 'moderate') return task.complexity === 'simple' || task.complexity === 'moderate';
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
