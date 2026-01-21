import { registerSync } from '../services/sync.svelte';

export interface InsurancePolicy {
    id?: number;
    user_id?: number;
    policy_name: string;
    insurance_type: 'Life' | 'Health' | 'Auto' | 'Home' | 'Disability' | 'Other';
    insurer: string;
    policy_number: string;
    premium_amount: number;
    premium_frequency: 'Monthly' | 'Quarterly' | 'Annually';
    beneficiaries: string;
    agent_name: string;
    agent_contact: string;
    claims_procedure: string;
    policy_documents: string;
    status: 'Active' | 'Inactive' | 'Pending';
    expiration_date?: string;
    notes: string;
}

// --- Mappers ---
const insuranceMapper = (local: any): InsurancePolicy => ({
    ...local,
    policy_name: local.policy_name ?? local.policyName ?? '',
    insurance_type: local.insurance_type ?? local.insuranceType ?? 'Other',
    policy_number: local.policy_number ?? local.policyNumber ?? '',
    premium_amount: local.premium_amount ?? local.premiumAmount ?? 0,
    premium_frequency: local.premium_frequency ?? local.premiumFrequency ?? 'Monthly',
    agent_name: local.agent_name ?? local.agentName ?? '',
    agent_contact: local.agent_contact ?? local.agentContact ?? '',
    claims_procedure: local.claims_procedure ?? local.claimsProcedure ?? '',
    policy_documents: local.policy_documents ?? local.policyDocuments ?? '',
    expiration_date: local.expiration_date ?? local.expirationDate,
    status: local.status ?? 'Active',
    notes: local.notes ?? ''
});

const manager = registerSync<InsurancePolicy>('insurance_policies', 'insurance_policies', insuranceMapper);

export const insuranceStore = {
    get policies() { return manager.items; },
    get status() { return manager.status; },
    sync: () => manager.sync(),
    addPolicy: (policy: Omit<InsurancePolicy, 'id'>) => manager.create(policy as InsurancePolicy),
    updatePolicy: (id: number, updates: Partial<InsurancePolicy>) => {
        const policy = manager.items.find(p => p.id === id);
        if (policy) {
            return manager.update({ ...policy, ...updates });
        }
    },
    deletePolicy: (id: number) => manager.delete(id),
    getPolicy: (id: number) => manager.items.find(p => p.id === id),
    getPoliciesByType: (type: InsurancePolicy['insurance_type']) =>
        manager.items.filter(p => p.insurance_type === type),
    getActivePolicies: () => manager.items.filter(p => p.status === 'Active'),
    getTotalPremiums: () => {
        let monthlyTotal = 0;
        let annualTotal = 0;

        manager.items.forEach(policy => {
            if (policy.status === 'Active') {
                if (policy.premium_frequency === 'Monthly') {
                    monthlyTotal += policy.premium_amount;
                    annualTotal += policy.premium_amount * 12;
                } else if (policy.premium_frequency === 'Quarterly') {
                    monthlyTotal += policy.premium_amount / 3;
                    annualTotal += policy.premium_amount * 4;
                } else if (policy.premium_frequency === 'Annually') {
                    monthlyTotal += policy.premium_amount / 12;
                    annualTotal += policy.premium_amount;
                }
            }
        });

        return { monthly: monthlyTotal, annual: annualTotal };
    }
};
