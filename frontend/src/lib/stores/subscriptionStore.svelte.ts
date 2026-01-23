import { registerSync } from '$lib/services/sync.svelte';

export interface Subscription {
    id?: number;
    user_id?: number;
    name: string;
    cost?: number;
    frequency: string;
    cycle?: string;
    difficulty?: string;
    paymentMethod?: string;
    renewal_date?: string;
    auto_renew: boolean;
}

const mapper = (data: any): Subscription => ({
    ...data,
    id: typeof data.id === 'string' && data.id.length > 10 ? undefined : Number(data.id) || data.id,
    auto_renew: data.auto_renew ?? data.autoRenew ?? true,
    renewal_date: data.renewal_date ?? data.renewalDate,
    paymentMethod: data.paymentMethod ?? data.payment_method,
});

const manager = registerSync<Subscription>('subscriptions', 'subscriptions', mapper, '/api/data')
    .setAffirmationContext('subscriptions');

export const subscriptionStore = {
    subscribe: manager.subscribe.bind(manager),
    get items() { return manager.items; },
    create: (item: Omit<Subscription, 'id'>) => manager.create(item as Subscription),
    update: (id: number, updates: Partial<Subscription>) => manager.update(id, updates as Subscription),
    delete: (id: number) => manager.delete(id),
    sync: () => manager.sync()
};
