import { registerSync } from "$lib/services/sync.svelte";
import { oneSpelling } from "$lib/utils/oneSpelling";

export interface InsurancePolicy {
    id: number | string;
    policyName: string;
    insuranceType: 'Life' | 'Health' | 'Auto' | 'Home' | 'Disability' | 'Other';
    insurer: string;
    policyNumber: string;
    premiumAmount: number | null;
    premiumFrequency: 'Monthly' | 'Quarterly' | 'Annually';
    beneficiaries: string;
    agentName: string;
    agentContact: string;
    claimsProcedure: string;
    policyDocuments: string;
    status: 'Active' | 'Inactive' | 'Pending';
    expirationDate?: string | null;
    notes: string;
    custom_attributes?: string;
}

// The server keeps expiration_date as a datetime ("2027-03-10T00:00:00"); the form's date input reads "2027-03-10".
const toDateInput = (v: unknown) => (typeof v === 'string' ? v.slice(0, 10) : '');

// Rows saved through the API can arrive lowercase ("monthly", "life", "active"); the page's totals,
// filters and counts compare the page spelling, so read each value as the page's option when it matches.
const pageSpelling = <T extends string>(v: unknown, options: readonly T[], aliases: Record<string, T> = {}) => {
    const key = String(v ?? '').trim().toLowerCase();
    return options.find(o => o.toLowerCase() === key) ?? aliases[key] ?? v;
};
const FREQUENCIES = ['Monthly', 'Quarterly', 'Annually'] as const;
const TYPES = ['Life', 'Health', 'Auto', 'Home', 'Disability', 'Other'] as const;
const STATUSES = ['Active', 'Inactive', 'Pending'] as const;

const insuranceMapper = (item: any) => {
    if (!item) return item;
    // One spelling per field (camel; the wire snake-cases it), newest value kept
    const out = oneSpelling(item, {
        policyName: 'policy_name', insuranceType: 'insurance_type', policyNumber: 'policy_number',
        premiumAmount: 'premium_amount', premiumFrequency: 'premium_frequency', agentName: 'agent_name',
        agentContact: 'agent_contact', claimsProcedure: 'claims_procedure', policyDocuments: 'policy_documents',
        expirationDate: 'expiration_date',
    });
    return {
        ...out,
        policyName: out.policyName ?? '',
        insurer: out.insurer ?? '',
        insuranceType: pageSpelling(out.insuranceType ?? 'Other', TYPES),
        policyNumber: out.policyNumber ?? '',
        // Blank amounts stay unknown; an explicitly recorded zero stays zero.
        premiumAmount: out.premiumAmount == null || String(out.premiumAmount).trim() === ''
            ? null : Number(out.premiumAmount),
        premiumFrequency: pageSpelling(out.premiumFrequency ?? 'Monthly', FREQUENCIES, { annual: 'Annually', yearly: 'Annually' }),
        agentName: out.agentName ?? '',
        agentContact: out.agentContact ?? '',
        claimsProcedure: out.claimsProcedure ?? '',
        policyDocuments: out.policyDocuments ?? '',
        // An empty date goes over the wire as null (the column is a nullable datetime).
        expirationDate: toDateInput(out.expirationDate) || null,
        notes: out.notes ?? '',
        ...(out.status != null && { status: pageSpelling(out.status, STATUSES) }),
    };
};

export const insuranceSync = registerSync<InsurancePolicy>('insurance_policies', 'insurance_policies', insuranceMapper).setAffirmationContext('insurance');

export const insuranceStore = {
    get policies() { return insuranceSync.items; },
    get status() { return insuranceSync.status; },
    sync: () => insuranceSync.sync(),
    addPolicy: (policy: Omit<InsurancePolicy, 'id'>, onRetry?: () => Promise<unknown>) => insuranceSync.create({ ...policy, id: crypto.randomUUID() }, false, false, onRetry),
    updatePolicy: (id: number | string, updates: Partial<InsurancePolicy>) => insuranceSync.update(id, updates),
    deletePolicy: (id: number | string) => insuranceSync.delete(id),
    getPolicy: (id: number | string) => insuranceSync.items.find(p => p.id === id),
    getPoliciesByType: (type: InsurancePolicy['insuranceType']) =>
        insuranceSync.items.filter(p => p.insuranceType === type),
    getActivePolicies: () => insuranceSync.items.filter(p => p.status === 'Active'),
    getTotalPremiums: () => {
        let monthlyTotal = 0;
        let annualTotal = 0;
        let eligible = 0;
        let recorded = 0;

        insuranceSync.items.forEach(policy => {
            if (policy.status === 'Active') {
                eligible++;
                if (policy.premiumAmount == null || !Number.isFinite(policy.premiumAmount)) return;
                recorded++;
                if (policy.premiumFrequency === 'Monthly') {
                    monthlyTotal += policy.premiumAmount;
                    annualTotal += policy.premiumAmount * 12;
                } else if (policy.premiumFrequency === 'Quarterly') {
                    monthlyTotal += policy.premiumAmount / 3;
                    annualTotal += policy.premiumAmount * 4;
                } else if (policy.premiumFrequency === 'Annually') {
                    monthlyTotal += policy.premiumAmount / 12;
                    annualTotal += policy.premiumAmount;
                }
            }
        });

        const unknown = eligible > 0 && recorded === 0;
        return { monthly: unknown ? null : monthlyTotal, annual: unknown ? null : annualTotal, recorded, eligible };
    },
    // Store Compatibility
    subscribe: insuranceSync.subscribe.bind(insuranceSync)
};
