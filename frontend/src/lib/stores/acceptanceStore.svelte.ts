import { derived } from 'svelte/store';
import { triggerMagic } from './magicStore';
import { registerSync, registerProfileSlice } from "$lib/services/sync.svelte";

export interface AcceptanceTask {
    id: number | string;
    taskId: string; // The canonical ID from DEFAULT_TASKS
    page: string;
    role: 'owner' | 'executor' | 'family';
    check: string;
    status: 'Pending' | 'Complete';
    section: string;
    complexity: 'simple' | 'moderate' | 'complex';
    href?: string; // the page this task is done on (from DEFAULT_TASKS; never sent)
}

const DEFAULT_TASKS: AcceptanceTask[] = [
    { id: '1', taskId: '1', page: 'Preparation Hub', role: 'owner', check: 'Open the preparation pages and choose which records to work on next.', status: 'Pending', section: 'Top Level', complexity: 'simple', href: '/modules/preparation-hub' },
    { id: '2', taskId: '2', page: 'Executor Hub', role: 'owner', check: 'Review the executor guide and record people or documents the executor will need.', status: 'Pending', section: 'Top Level', complexity: 'simple', href: '/modules/executor-toolkit' },
    { id: '3', taskId: '3', page: 'Family Hub', role: 'owner', check: 'Review the family starting points for messages, memories and useful contacts.', status: 'Pending', section: 'Top Level', complexity: 'simple', href: '/modules/family-hub' },
    { id: '4', taskId: '4', page: 'Legal Documents', role: 'owner', check: 'Record each document, where its original is kept and how to find the current copy.', status: 'Pending', section: 'Top Level', complexity: 'simple', href: '/modules/legal-documents' },
    { id: '5', taskId: '5', page: 'Financial Accounts', role: 'owner', check: 'Record institutions, ownership, identifying details and the next person to contact.', status: 'Pending', section: 'Top Level', complexity: 'moderate', href: '/modules/financial-accounts' },
    { id: '6', taskId: '6', page: 'Property & Assets', role: 'owner', check: 'Record the property, ownership, document locations and a useful contact.', status: 'Pending', section: 'Top Level', complexity: 'moderate', href: '/modules/property' },
    { id: '7', taskId: '7', page: 'Insurance', role: 'owner', check: 'Record the insurer, policy details, beneficiary information and claim contact.', status: 'Pending', section: 'Top Level', complexity: 'moderate', href: '/modules/insurance' },
    { id: '8', taskId: '8', page: 'Subscriptions', role: 'owner', check: 'List services, billing dates, account references and cancellation or transfer notes.', status: 'Pending', section: 'Top Level', complexity: 'moderate', href: '/modules/subscriptions' },
    { id: '9', taskId: '9', page: 'Letters', role: 'owner', check: 'Write a letter in your own words, choose its recipient and review the saved text.', status: 'Pending', section: 'Top Level', complexity: 'moderate', href: '/modules/letters' },
    { id: '10', taskId: '10', page: 'Memories & Keepsakes', role: 'owner', check: 'Describe each keepsake, its story, location and intended recipient.', status: 'Pending', section: 'Top Level', complexity: 'simple', href: '/modules/heirlooms' },
    { id: '11', taskId: '11', page: 'Contacts', role: 'owner', check: 'Record names, relationships, contact details and what each person can help with.', status: 'Pending', section: 'Top Level', complexity: 'simple', href: '/modules/contacts' },
    { id: '12', taskId: '12', page: 'QR Codes', role: 'owner', check: 'Generate and scan each code, then check the signed-in page it opens.', status: 'Pending', section: 'Top Level', complexity: 'moderate', href: '/modules/qr-codes' },
    { id: '17', taskId: '17', page: 'Executor Checklist', role: 'owner', check: 'Review the executor tasks and note the practical next steps that apply.', status: 'Pending', section: 'Executor Hub', complexity: 'simple', href: '/modules/executor-toolkit' },
    { id: '18', taskId: '18', page: 'Bank & Account Access Notes', role: 'owner', check: 'Explain the accounts, where access instructions are kept and whom to contact.', status: 'Pending', section: 'Executor Hub', complexity: 'moderate', href: '/modules/financial-accounts' },
    { id: '19', taskId: '19', page: 'Funeral & Memorial Preferences', role: 'owner', check: 'Write your funeral or memorial wishes and record any arrangements already made.', status: 'Pending', section: 'Executor Hub', complexity: 'simple', href: '/modules/funeral' },
    { id: '20', taskId: '20', page: 'Messages for Family', role: 'owner', check: 'Write a personal message and choose the person you want to receive it.', status: 'Pending', section: 'Family Hub', complexity: 'simple', href: '/modules/letters' },
    { id: '21', taskId: '21', page: 'Keepsakes Index', role: 'owner', check: 'Record where keepsakes are kept, their meaning and who you intend them for.', status: 'Pending', section: 'Family Hub', complexity: 'simple', href: '/modules/heirlooms' },
    { id: '22', taskId: '22', page: 'Primary Bank Accounts', role: 'owner', check: 'Record the bank, account identifiers, ownership and useful contact details.', status: 'Pending', section: 'Financial Accounts', complexity: 'moderate', href: '/modules/financial-accounts' },
    { id: '23', taskId: '23', page: 'Credit Cards', role: 'owner', check: 'Record the issuer, last four digits, balance date and contact or closure notes.', status: 'Pending', section: 'Financial Accounts', complexity: 'moderate', href: '/modules/financial-accounts' },
    { id: '24', taskId: '24', page: 'Brokerage & Retirement', role: 'owner', check: 'Record brokerage and retirement details, document locations and beneficiary information to verify.', status: 'Pending', section: 'Financial Accounts', complexity: 'complex', href: '/modules/financial-accounts' },
    { id: '25', taskId: '25', page: 'Real Estate', role: 'owner', check: 'Record the property, ownership, mortgage details and where originals are kept.', status: 'Pending', section: 'Property & Assets', complexity: 'moderate', href: '/modules/property' },
    { id: '26', taskId: '26', page: 'Vehicles', role: 'owner', check: 'Record the vehicle, VIN, title location and insurance or contact details.', status: 'Pending', section: 'Property & Assets', complexity: 'moderate', href: '/modules/property' },
    { id: '27', taskId: '27', page: 'Digital Assets', role: 'owner', check: 'Document the access or recovery path and where the instructions are kept.', status: 'Pending', section: 'Property & Assets', complexity: 'complex', href: '/modules/digital-guardian' },
    { id: '28', taskId: '28', page: 'Life Insurance', role: 'owner', check: 'Record the policy, beneficiary information and insurer claim contact.', status: 'Pending', section: 'Insurance', complexity: 'moderate', href: '/modules/insurance' },
    { id: '29', taskId: '29', page: 'Homeowners/Renters', role: 'owner', check: 'Record the insured property, policy number, renewal date and insurer contact.', status: 'Pending', section: 'Insurance', complexity: 'simple', href: '/modules/insurance' },
    { id: '30', taskId: '30', page: 'Health Insurance', role: 'owner', check: 'Record the provider, policy details and contact information your family may need.', status: 'Pending', section: 'Insurance', complexity: 'simple', href: '/modules/insurance' },
    { id: '31', taskId: '31', page: 'Streaming Services', role: 'owner', check: 'List streaming services, billing details and cancellation notes.', status: 'Pending', section: 'Subscriptions', complexity: 'simple', href: '/modules/subscriptions' },
    { id: '32', taskId: '32', page: 'Utilities', role: 'owner', check: 'List utility providers, account references and transfer or closure notes.', status: 'Pending', section: 'Subscriptions', complexity: 'moderate', href: '/modules/subscriptions' },
    { id: '33', taskId: '33', page: 'Online Services', role: 'owner', check: 'Record online services, billing details and where access instructions are kept.', status: 'Pending', section: 'Subscriptions', complexity: 'moderate', href: '/modules/subscriptions' },
    { id: '34', taskId: '34', page: 'QR – Family Essentials shortcut', role: 'owner', check: 'Generate the Family Essentials code and check that it opens Dashboard after sign-in.', status: 'Pending', section: 'QR Codes', complexity: 'simple', href: '/modules/qr-codes' },
    { id: '35', taskId: '35', page: 'QR – Executor guide shortcut', role: 'owner', check: 'Generate the Executor Master code and check that it opens the executor guide after sign-in.', status: 'Pending', section: 'QR Codes', complexity: 'moderate', href: '/modules/qr-codes' },
    { id: '36', taskId: '36', page: 'Letter — Bank Notification', role: 'owner', check: 'Review a bank notification draft, fill its placeholders and verify the recipient before saving.', status: 'Pending', section: 'Letters', complexity: 'moderate', href: '/modules/letters' },
    { id: '37', taskId: '37', page: 'Letter — Credit Card Closure', role: 'owner', check: 'Review a credit card closure draft and verify the issuer and account reference.', status: 'Pending', section: 'Letters', complexity: 'moderate', href: '/modules/letters' },
    { id: '38', taskId: '38', page: 'Letter — Utility Transfer', role: 'owner', check: 'Review a utility transfer draft and fill the provider, account and requested change.', status: 'Pending', section: 'Letters', complexity: 'moderate', href: '/modules/letters' },
    { id: '39', taskId: '39', page: 'Letter — Insurance Claim', role: 'owner', check: 'Review an insurance claim letter draft and verify the policy and claim contact.', status: 'Pending', section: 'Letters', complexity: 'moderate', href: '/modules/letters' },
    { id: '40', taskId: '40', page: 'Letter — Employer HR Notice', role: 'owner', check: 'Review an employer notice draft and fill the HR contact and relevant details.', status: 'Pending', section: 'Letters', complexity: 'moderate', href: '/modules/letters' },
    { id: '41', taskId: '41', page: 'Letter — Subscription Cancellation', role: 'owner', check: 'Review a subscription cancellation draft and fill the service and account reference.', status: 'Pending', section: 'Letters', complexity: 'moderate', href: '/modules/letters' },
    { id: '42', taskId: '42', page: 'Letter — Social Media', role: 'owner', check: 'Review a social account notice draft and verify the service and requested action.', status: 'Pending', section: 'Letters', complexity: 'moderate', href: '/modules/letters' },
];

export type EstateComplexity = 'simple' | 'moderate' | 'complex';

const mapper = (data: Record<string, unknown>): AcceptanceTask => ({
    ...data,
    id: typeof data.id === 'string' && data.id.length > 10 ? data.id : Number(data.id) || data.id,
} as AcceptanceTask);


const taskManager = registerSync<AcceptanceTask>('acceptance_tasks', 'acceptance_tasks', mapper, '/api/data');

// Complexity is now part of the global estate profile or a separate singleton
const complexityManager = registerProfileSlice<{ level: EstateComplexity; complexity?: EstateComplexity }>('estate_complexity', (data: Record<string, unknown>) => {
    // The profile key is "complexity"; "level" is the local name. Carry both so a save round-trips.
    const level = (data.complexity || data.level || 'moderate') as EstateComplexity;
    return { level, complexity: level };
});

/**
 * The task list: every default task, with the status saved for it. A saved row stores only a
 * task's progress (matched by taskId); the wording and page link always come from DEFAULT_TASKS,
 * and saved rows for tasks no longer listed are left out.
 */
function withSaved(saved: AcceptanceTask[]): AcceptanceTask[] {
    const byTask = new Map<string, AcceptanceTask>();
    for (const row of saved) if (!byTask.has(String(row.taskId))) byTask.set(String(row.taskId), row);
    return DEFAULT_TASKS.map(t => {
        const row = byTask.get(t.taskId);
        return row ? { ...t, status: row.status === 'Complete' ? 'Complete' : 'Pending' } : t;
    });
}

export const acceptanceTasks = {
    subscribe: (run: (value: AcceptanceTask[]) => void) => taskManager.subscribe((items) => run(withSaved(items))),
    get items() { return withSaved(taskManager.items); },
    sync: () => taskManager.sync()
};

export const estateComplexity = {
    subscribe: complexityManager.subscribe.bind(complexityManager),
    get level() { return complexityManager.data?.level || 'moderate'; },
    set: (level: EstateComplexity) => complexityManager.update({ level, complexity: level })
};

// Tasks whose first save is on its way: a second tap waits for it rather than adding a second row.
const creating = new Set<string>();

export const acceptanceStore = {
    /** Flip one task (by taskId) between Pending and Complete, saving its progress. */
    toggleTask: (taskId: string) => {
        const task = DEFAULT_TASKS.find(t => t.taskId === String(taskId));
        if (!task || creating.has(task.taskId)) return;
        const saved = taskManager.items.find(t => String(t.taskId) === task.taskId);
        const newStatus = (saved?.status ?? task.status) === 'Complete' ? 'Pending' : 'Complete';
        if (newStatus === 'Complete') triggerMagic('success');

        if (saved) return taskManager.update(saved.id, { status: newStatus });
        // First progress for this task: save a row for it
        const { id: _, href: __, ...dataToCreate } = task;
        creating.add(task.taskId);
        return taskManager.create({ ...dataToCreate, status: newStatus } as AcceptanceTask)
            .finally(() => creating.delete(task.taskId));
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
        const tasks = withSaved($tasks);
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
