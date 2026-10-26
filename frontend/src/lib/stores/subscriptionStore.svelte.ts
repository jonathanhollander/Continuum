import { registerSync } from "$lib/services/sync.svelte";
import { oneSpelling } from "$lib/utils/oneSpelling";
import { subscriptionCycle } from "$lib/utils/subscriptionCadence";

export interface Subscription {
    id: number;
    user_id?: number;
    name: string;
    cost?: number;
    frequency: string;
    cycle?: string;
    difficulty?: string;
    paymentMethod?: string;
    renewal_date?: string;
    auto_renew: boolean;
    custom_attributes?: string; // JSON string of custom field values
}

// One spelling per field (the page's; paymentMethod is a camel column), newest value kept.
const mapper = (data: Record<string, unknown>): Subscription => {
    const out = oneSpelling(data, { auto_renew: 'autoRenew', renewal_date: 'renewalDate', paymentMethod: 'payment_method' });
    return {
        ...out,
        id: typeof out.id === 'string' && out.id.length > 10 ? undefined : Number(out.id) || out.id,
        auto_renew: out.auto_renew ?? true,
        cycle: subscriptionCycle(out.cycle, out.frequency),
    } as Subscription;
};

// The one owner of 'subscriptions' (the subscriptions page uses it too).
export const subscriptionsSync = registerSync<Subscription>('subscriptions', 'subscriptions', mapper, '/api/data')
    .setAffirmationContext('subscriptions');
const manager = subscriptionsSync;

export const subscriptionStore = {
    subscribe: manager.subscribe.bind(manager),
    get items() { return manager.items; },
    get status() { return manager.status; },
    create: (item: Omit<Subscription, 'id'>) => manager.create(item as Subscription),
    update: (id: number, updates: Partial<Subscription>) => manager.update(id, updates as Subscription),
    delete: (id: number) => manager.delete(id),
    sync: () => manager.sync()
};
