import { get } from 'svelte/store';
import { createProfileStore } from './persistence';

export interface InsurancePolicy {
    id: string;
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

// Migration Logic
const getInitialData = (): InsurancePolicy[] => {
    if (typeof localStorage === 'undefined') return [];

    const unified = localStorage.getItem('continuum_owner_insurance_policies');
    if (unified) return [];

    const legacy = localStorage.getItem('continuum_insurance_policies');
    if (legacy) {
        try {
            return JSON.parse(legacy);
        } catch (e) {
            console.error('Failed to parse insurance policies from localStorage', e);
        }
    }
    return [];
};

function createReactiveInsuranceStore() {
    const store = createProfileStore<InsurancePolicy[]>('insurance_policies', getInitialData());
    const { subscribe, set, update } = store;

    return {
        subscribe,
        addPolicy: (policy: Omit<InsurancePolicy, 'id'>) => {
            const newPolicy: InsurancePolicy = {
                ...policy,
                id: crypto.randomUUID(),
            };
            update(policies => [...policies, newPolicy]);
            return newPolicy;
        },
        updatePolicy: (id: string, updates: Partial<InsurancePolicy>) => {
            update(policies => policies.map(p => p.id === id ? { ...p, ...updates } : p));
        },
        deletePolicy: (id: string) => {
            update(policies => policies.filter(p => p.id !== id));
        },
        getPolicy: (id: string): InsurancePolicy | undefined => {
            return get({ subscribe }).find(p => p.id === id);
        },
        getPoliciesByType: (type: InsurancePolicy['insuranceType']): InsurancePolicy[] => {
            return get({ subscribe }).filter(p => p.insuranceType === type);
        },
        getActivePolicies: (): InsurancePolicy[] => {
            return get({ subscribe }).filter(p => p.status === 'Active');
        },
        getTotalPremiums: (): { monthly: number; annual: number } => {
            const policies = get({ subscribe });
            let monthlyTotal = 0;
            let annualTotal = 0;

            policies.forEach(policy => {
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
        clear: () => {
            set([]);
        }
    };
}

export const insuranceStore = createReactiveInsuranceStore();
