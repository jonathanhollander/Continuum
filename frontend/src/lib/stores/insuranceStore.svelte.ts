import { registerSync } from '$lib/services/sync.svelte';

export interface InsurancePolicy {
    id: number | string;
    policyName: string;
    insuranceType: 'Life' | 'Health' | 'Auto' | 'Home' | 'Disability' | 'Other';
    insurer: string;
    policyNumber: string;
    premiumAmount: number;
    premiumFrequency: 'Monthly' | 'Quarterly' | 'Annually';
    beneficiaries: string;
    agentName: string;
    agentContact: string;
    claimsProcedure: string;
    policyDocuments: string;
    status: 'Active' | 'Inactive' | 'Pending';
    expirationDate?: string;
    notes: string;
}

const insuranceMapper = (item: any) => {
    if (!item) return item;
    return {
        ...item,
        // Remote -> Local
        policyName: item.policy_name ?? item.policyName ?? '',
        insuranceType: item.insurance_type ?? item.insuranceType ?? 'Other',
        policyNumber: item.policy_number ?? item.policyNumber ?? '',
        premiumAmount: item.premium_amount ?? item.premiumAmount ?? 0,
        premiumFrequency: item.premium_frequency ?? item.premiumFrequency ?? 'Monthly',
        agentName: item.agent_name ?? item.agentName ?? '',
        agentContact: item.agent_contact ?? item.agentContact ?? '',
        claimsProcedure: item.claims_procedure ?? item.claimsProcedure ?? '',
        policyDocuments: item.policy_documents ?? item.policyDocuments ?? '',
        expirationDate: item.expiration_date ?? item.expirationDate,
        // Local -> Remote
        policy_name: item.policyName ?? item.policy_name,
        insurance_type: item.insuranceType ?? item.insurance_type,
        policy_number: item.policyNumber ?? item.policy_number,
        premium_amount: item.premiumAmount ?? item.premium_amount,
        premium_frequency: item.premiumFrequency ?? item.premium_frequency,
        agent_name: item.agentName ?? item.agent_name,
        agent_contact: item.agentContact ?? item.agent_contact,
        claims_procedure: item.claimsProcedure ?? item.claims_procedure,
        policy_documents: item.policyDocuments ?? item.policy_documents,
        expiration_date: item.expirationDate ?? item.expiration_date
    };
};

export const insuranceSync = registerSync<InsurancePolicy>('insurance_policies', 'insurance_policies', insuranceMapper).setAffirmationContext('insurance');

export const insuranceStore = {
    get policies() { return insuranceSync.items; },
    get status() { return insuranceSync.status; },
    sync: () => insuranceSync.sync(),
    addPolicy: (policy: Omit<InsurancePolicy, 'id'>) => insuranceSync.create({ ...policy, id: crypto.randomUUID() }),
    updatePolicy: (id: number | string, updates: Partial<InsurancePolicy>) => insuranceSync.update(id, updates),
    deletePolicy: (id: number | string) => insuranceSync.delete(id),
    getPolicy: (id: number | string) => insuranceSync.items.find(p => p.id === id),
    getPoliciesByType: (type: InsurancePolicy['insuranceType']) =>
        insuranceSync.items.filter(p => p.insuranceType === type),
    getActivePolicies: () => insuranceSync.items.filter(p => p.status === 'Active'),
    getTotalPremiums: () => {
        let monthlyTotal = 0;
        let annualTotal = 0;

        insuranceSync.items.forEach(policy => {
            if (policy.status === 'Active') {
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

        return { monthly: monthlyTotal, annual: annualTotal };
    },
    // Store Compatibility
    subscribe: insuranceSync.subscribe.bind(insuranceSync)
};
