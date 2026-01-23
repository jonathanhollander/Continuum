import { registerSync } from "$lib/services/sync.svelte.ts";

export interface AutomationRule {
    id: number | string;
    name: string;
    description: string;
    enabled: boolean;
    type: 'notification' | 'task' | 'alert';
}

const mapper = (data: any): AutomationRule => ({
    ...data,
    id: typeof data.id === 'string' && data.id.length > 10 ? data.id : Number(data.id) || data.id,
});

const manager = registerSync<AutomationRule>('automation_rules', 'automation_rules', mapper, '/api/data')
    .setAffirmationContext('general');

export const automationRules = {
    subscribe: manager.subscribe.bind(manager),
    get items() { return manager.items; },
    addRule: (rule: Omit<AutomationRule, 'id'>) => manager.create(rule as AutomationRule),
    removeRule: (id: number | string) => manager.delete(id),
    toggleRule: (id: number | string) => {
        const rule = manager.items.find(r => r.id === id);
        if (rule) return manager.update(id, { ...rule, enabled: !rule.enabled });
    },
    sync: () => manager.sync()
};
